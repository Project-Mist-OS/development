// Copyright (C) 2023 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use std::{
    collections::BTreeMap,
    env,
    path::Path,
    process::{Command, Output},
    str::from_utf8,
    sync::mpsc::channel,
};

use anyhow::{anyhow, Context, Result};
use threadpool::ThreadPool;

use crate::{Crate, NameAndVersion, NameAndVersionMap, NamedAndVersioned};

pub fn generate_android_bps<'a, T: Iterator<Item = &'a Crate>>(
    crates: T,
) -> Result<BTreeMap<NameAndVersion, (Output, Output)>> {
    let pool = ThreadPool::new(std::cmp::max(num_cpus::get(), 32));
    let (tx, rx) = channel();

    let mut num_crates = 0;
    for krate in crates {
        num_crates += 1;
        let tx = tx.clone();
        let crate_name = krate.name().to_string();
        let crate_version = krate.version().clone();
        let repo_root = krate.root().to_path_buf();
        let android_bp_path = krate.android_bp();
        let test_path = krate.staging_path();
        pool.execute(move || {
            println!("Generating Android.bp for {} {}", crate_name, crate_version);
            tx.send((
                crate_name,
                crate_version,
                generate_android_bp(&repo_root, &android_bp_path, &test_path),
            ))
            .expect("Failed to send");
        });
    }
    let mut results = BTreeMap::new();
    for (crate_name, crate_version, result) in rx.iter().take(num_crates) {
        results.insert_or_error(NameAndVersion::new(crate_name, crate_version), result?)?;
    }
    Ok(results)
}

pub(crate) fn generate_android_bp(
    repo_root: &impl AsRef<Path>,
    android_bp_path: &impl AsRef<Path>,
    staging_path: &impl AsRef<Path>,
) -> Result<(Output, Output)> {
    let generate_android_bp_output = run_cargo_embargo(repo_root, staging_path)?;
    if !generate_android_bp_output.status.success() {
        println!(
            "cargo_embargo failed for {}\nstdout:\n{}\nstderr:\n{}",
            android_bp_path.as_ref().display(),
            from_utf8(&generate_android_bp_output.stdout)?,
            from_utf8(&generate_android_bp_output.stderr)?
        );
    }
    let diff_output =
        diff(&android_bp_path.as_ref(), &staging_path.as_ref().join("Android.bp"), repo_root)
            .context("Failed to diff Android.bp".to_string())?;
    Ok((generate_android_bp_output, diff_output))
}

fn run_cargo_embargo(
    repo_root: &impl AsRef<Path>,
    staging_path: &impl AsRef<Path>,
) -> Result<Output> {
    // Make sure we can find bpfmt.
    let host_bin = repo_root.as_ref().join("out/host/linux-x86/bin");
    let new_path = match env::var_os("PATH") {
        Some(p) => {
            let mut paths = vec![host_bin];
            paths.extend(env::split_paths(&p));
            env::join_paths(paths)?
        }
        None => host_bin.as_os_str().into(),
    };

    let staging_path_absolute = repo_root.as_ref().join(staging_path);
    let mut cmd = Command::new(repo_root.as_ref().join("out/host/linux-x86/bin/cargo_embargo"));
    cmd.args(["generate", "cargo_embargo.json"])
        .env("PATH", new_path)
        .env("ANDROID_BUILD_TOP", repo_root.as_ref())
        .current_dir(&staging_path_absolute)
        .output()
        .context(format!("Failed to execute {:?}", cmd.get_program()))
}

fn diff(a: &impl AsRef<Path>, b: &impl AsRef<Path>, root: &impl AsRef<Path>) -> Result<Output> {
    Ok(Command::new("diff")
        .args([
            "-u",
            "-w",
            "-B",
            "-I",
            "// has rustc warnings",
            "-I",
            "This file is generated by",
            "-I",
            "cargo_pkg_version:",
        ])
        .arg(a.as_ref())
        .arg(b.as_ref())
        .current_dir(root)
        .output()?)
}

pub fn build_cargo_embargo(repo_root: &impl AsRef<Path>) -> Result<()> {
    let output = Command::new("/usr/bin/bash")
        .args(["-c", "source build/envsetup.sh && lunch aosp_cf_x86_64_phone-trunk_staging-userdebug && m cargo_embargo bpfmt"])
        .current_dir(repo_root)
        .output()
        .context("Failed to build cargo embargo and bpfmt")?;
    if !output.status.success() {
        return Err(anyhow!(
            "Failed to build cargo embargo and bpfmt.\nstdout:\n{}\nstderr:\n{}",
            from_utf8(&output.stdout)?,
            from_utf8(&output.stderr)?
        ));
    }
    Ok(())
}
