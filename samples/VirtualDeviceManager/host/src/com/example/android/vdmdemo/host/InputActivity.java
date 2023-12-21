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

package com.example.android.vdmdemo.host;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.example.android.vdmdemo.common.DpadFragment;
import com.example.android.vdmdemo.common.NavTouchpadFragment;
import com.example.android.vdmdemo.common.RemoteEventProto.InputDeviceType;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import dagger.hilt.android.AndroidEntryPoint;

import javax.inject.Inject;

/** VDM Host Input activity allowing the host device to become an input device for the client. */
@AndroidEntryPoint(AppCompatActivity.class)
public class InputActivity extends Hilt_InputActivity {

    private static final String TAG = "VdmInputActivity";

    @Inject InputController mInputController;
    @Inject PreferenceController mPreferenceController;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_input);
        Toolbar toolbar = requireViewById(R.id.main_tool_bar);
        setSupportActionBar(toolbar);
        toolbar.setNavigationOnClickListener(v -> finish());
        setTitle(getTitle() + " " + getString(R.string.input));

        Fragment navigationFragment = new NavigationFragment();
        Fragment keyboardFragment = new Fragment();

        BottomNavigationView bottomNavigationView = requireViewById(R.id.bottom_nav);
        bottomNavigationView.setOnItemSelectedListener(item -> {
            Fragment fragment;
            switch (item.getItemId()) {
                case R.id.navigation -> fragment = navigationFragment;
                case R.id.keyboard -> {
                    fragment = keyboardFragment;
                    getSystemService(InputMethodManager.class)
                            .showSoftInput(getWindow().getDecorView(), 0);
                }
                default -> {
                    return false;
                }
            }
            getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.input_fragment_container_view, fragment)
                    .commit();
            return true;
        });
        bottomNavigationView.setSelectedItemId(R.id.navigation);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if ((event.getFlags() & KeyEvent.FLAG_SOFT_KEYBOARD) == 0) {
            return super.dispatchKeyEvent(event);
        }
        if (event.getAction() == KeyEvent.ACTION_UP
                && (event.getFlags() & KeyEvent.FLAG_CANCELED) == KeyEvent.FLAG_CANCELED) {
            // Sending key events to another display makes that display top focused, so the key
            // events sent to the activity here get dropped if not terminal.
            // DisplayManager.VIRTUAL_DISPLAY_FLAG_STEAL_TOP_FOCUS_DISABLED would solve this but it
            // has other limitations.
            mInputController.sendEventToFocusedDisplay(
                    InputDeviceType.DEVICE_TYPE_KEYBOARD,
                    new KeyEvent(
                            event.getDownTime(),
                            event.getEventTime(),
                            KeyEvent.ACTION_DOWN,
                            event.getKeyCode(),
                            /* repeat= */ 0));
        }
        mInputController.sendEventToFocusedDisplay(InputDeviceType.DEVICE_TYPE_KEYBOARD, event);
        return true;
    }


    @AndroidEntryPoint(Fragment.class)
    public static final class NavigationFragment extends Hilt_InputActivity_NavigationFragment {

        @Inject InputController mInputController;

        public NavigationFragment() {
            super(R.layout.fragment_input_navigation);
        }

        @Override
        public void onViewCreated(View view, Bundle savedInstanceState) {
            DpadFragment dpadFragment =
                    (DpadFragment) getChildFragmentManager().findFragmentById(
                            R.id.dpad_fragment_container);
            dpadFragment.setInputEventListener((event) ->
                    mInputController.sendEventToFocusedDisplay(
                            InputDeviceType.DEVICE_TYPE_DPAD, event));
            NavTouchpadFragment navTouchpadFragment =
                    (NavTouchpadFragment) getChildFragmentManager().findFragmentById(
                            R.id.nav_touchpad_fragment_container);
            navTouchpadFragment.setInputEventListener((event) ->
                    mInputController.sendEventToFocusedDisplay(
                            InputDeviceType.DEVICE_TYPE_NAVIGATION_TOUCHPAD, event));
        }
    }
}
