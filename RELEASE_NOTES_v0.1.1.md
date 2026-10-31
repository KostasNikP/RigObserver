# RigObserver v0.1.1 — Release Notes

**Windows desktop maintenance and usability update**

This release builds on v0.1.0, focusing on dashboard customization, hardware monitoring, notifications, and stability.

## What's new

- Refreshed, denser dark dashboard with more consistent headings, controls, widgets, chart frames, and sidebar navigation.
- **Recommended** preset for a balanced six-section overview, with confirmation before applying.
- **Smart** and **Free** dashboard layouts, including movable, resizable cards and saved positions.
- Improved sensor mini-widget layouts, customization, resizing, and hover details.
- **Hardware Monitor:** cleaner Overview and All Sensors views, per-device detail expansion, and group expand/collapse actions. Existing sensor selection and card arrangement remain available.
- **System Alerts:** immediately visible alert count in the top header, detailed popover, and notices when new warnings appear.
- **Windows Notifications:** native Windows toast alerts when new thresholds are triggered. Includes an enable/disable toggle and a Test Notification button in Alert Settings.
- Refined CPU, RAM, and Disk threshold controls.

## Fixes and stability

- Mouse-wheel scrolling continues through widgets and parent cards instead of getting trapped.
- Better handling of widget/card overflow and sizing after applying the Recommended preset.
- Fewer unnecessary DOM updates during continuous hardware sensor polling.
- Reduced repeated re-rendering of unchanged alerts.
- Sensor and metrics requests now have timeouts to recover from stalled responses.
- Confirmed that saved view preferences survive desktop application restarts in development testing.

## Installation and updating

1. Download `RigObserver_Setup_v0.1.1.exe` from the **v0.1.1 GitHub Release**, once published.
2. Close the existing RigObserver application.
3. Run the installer and follow its steps.

The installer retains the existing application identity and legacy data location to preserve user settings and history. Windows notification display depends on Windows notification settings and Do Not Disturb.

**Requirements:** Windows x64 and Microsoft Edge WebView2 Runtime. The installer includes the bundled Python application and sensor bridge.

**Note:** This file prepares the release announcement. Do not publish the release or update the README's download link until the new installer has been built and tested.
