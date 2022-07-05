/*
 * Copyright (C) 2022 The Android Open Source Project
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

// Note:
// Chrome driver must match the system's Chrome browser version.
// Use this command to update to the specified Chrome driver version:
// node node_modules/.bin/webdriver-manager update -- versions.chrome=103.0.5060.53

exports.config = {
  specs: ["dist/e2e.spec/e2e/*.spec.js"],

  directConnect: true,
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ["--headless", "--disable-gpu", "--window-size=1280x1024"]
    }
  },
  chromeDriver: "./node_modules/webdriver-manager/selenium/chromedriver_103.0.5060.53",

  // allow specifying the file protocol within browser.get(...)
  onPrepare: function() {
    browser.ignoreSynchronization = true;
    browser.waitForAngular();
    browser.sleep(500);
    browser.resetUrl = "file:///";
  }
};
