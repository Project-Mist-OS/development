/*
 * Copyright (C) 2023 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.android.vdmdemo.demos;

import android.Manifest;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Demo activity for showcasing Virtual Devices with permission requests.
 *
 * <p>You may want to run: {@code adb shell pm reset-permissions com.example.android.vdmdemo.demos}
 * to clear granted permissions (by adb install or after granting manually).
 */
public final class PermissionsDemoActivity extends AppCompatActivity {

  private static final int REQUEST_CODE_PERMISSIONS = 1001;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    setContentView(R.layout.permissions_demo_activity);

    findViewById(R.id.button_permissions).setOnClickListener(v -> requestPermissions());
  }

  private void requestPermissions() {
    String[] permissions = {
      Manifest.permission.READ_CONTACTS,
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.BLUETOOTH_CONNECT,
      Manifest.permission.READ_CALENDAR,
      Manifest.permission.READ_SMS,
      Manifest.permission.READ_EXTERNAL_STORAGE,
      Manifest.permission.READ_MEDIA_AUDIO,
      Manifest.permission.READ_MEDIA_IMAGES,
      Manifest.permission.RECORD_AUDIO,
      Manifest.permission.CAMERA,
      Manifest.permission.BODY_SENSORS,
      Manifest.permission.POST_NOTIFICATIONS
    };

    requestPermissions(permissions, REQUEST_CODE_PERMISSIONS);
  }
}
