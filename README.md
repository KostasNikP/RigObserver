# RigObserver

**Real-time PC performance and hardware monitoring for Windows.**

RigObserver is a Windows desktop application for tracking system performance, hardware sensors, network activity, and system health in one customizable dashboard. Built with Python, FastAPI, C#/.NET, LibreHardwareMonitor, JavaScript, and WebView2.

[**Download RigObserver v0.1.1 for Windows**](https://github.com/KostasNikP/RigObserver/releases/download/v0.1.1/RigObserver_Setup_v0.1.1.exe) · [**Latest release**](https://github.com/KostasNikP/RigObserver/releases/latest) · [**Changelog**](RELEASE_NOTES_v0.1.1.md)

> **Latest release: v0.1.1** — Windows Notifications & Dashboard Improvements. Published October 31, 2026.

## Live demo

![RigObserver desktop application demo](demo.gif)

## What's new in v0.1.1

- **Refined dashboard:** more consistent dark UI, controls, navigation, chart cards, and widget styling.
- **Flexible layouts:** Smart and Free arrangement for overview cards; Auto and Free positioning for individual sensor widgets.
- **Recommended preset:** quickly configure a balanced hardware overview, with confirmation before replacing a customized arrangement.
- **Hardware Monitor:** switch between Overview and All Sensors, expand device details, and customize visible sensors.
- **System Alerts:** active alert counter in the top bar, detailed popover, and unobtrusive in-app alerts.
- **Native Windows notifications:** receive a desktop notification for newly triggered warnings; enable/disable notifications or send a test from Alert Settings.
- **Stability improvements:** smoother scrolling, more reliable live refresh, fewer redundant UI updates, and persistent display preferences.

For the full changelog, see [v0.1.1 release notes](RELEASE_NOTES_v0.1.1.md).

## Screenshots

Screenshots are from the application and may show an earlier UI iteration.

### Performance Overview

Monitor CPU, GPU, RAM, storage, network, and motherboard data in configurable cards with graphs, gauges, compact values, or individual widgets.

![RigObserver Performance Overview](screenshots/overview.png)

### Hardware Monitor

Automatically discover supported hardware, inspect individual sensor readings, and choose which device details to display.

![RigObserver Hardware Monitor](screenshots/hardware-monitor.png)

### Live Monitoring

View live CPU, memory, and network activity alongside historical system measurements.

![RigObserver Live Monitoring](screenshots/live-monitoring.png)

## Features

| Area | Capabilities |
| --- | --- |
| **Performance dashboard** | CPU, GPU, RAM, storage, network, and motherboard overview |
| **Visualization** | Gauges, live graphs, compact readouts, and per-sensor mini-widgets |
| **Customization** | Drag, resize, reorder, hide, and restore cards/widgets; settings persist across restarts |
| **Layout controls** | Smart and Free card layouts, Auto and Free widget layouts, Recommended preset |
| **Hardware sensors** | Temperatures, utilization, clocks, fans, voltages, power, and other readings when supported |
| **Alerts** | Configurable CPU, RAM, and disk thresholds with persistence across three consecutive readings |
| **Windows notifications** | Native notifications for new alerts, on/off setting, and test action |
| **History** | Local SQLite storage and charts for system metrics |
| **Hardware access** | Optional administrator-approved helper for additional sensor data |

Sensor availability depends on device hardware, drivers, permissions, and what LibreHardwareMonitor exposes.

## Download and installation

1. Download [**RigObserver_Setup_v0.1.1.exe**](https://github.com/KostasNikP/RigObserver/releases/download/v0.1.1/RigObserver_Setup_v0.1.1.exe) from the [official v0.1.1 release](https://github.com/KostasNikP/RigObserver/releases/tag/v0.1.1).
2. Close any running RigObserver instance, run the installer, and follow the setup wizard.
3. Launch **RigObserver** from the Start menu or its optional desktop shortcut.

**Requirements:** Windows x64 and Microsoft Edge WebView2 Runtime. The packaged application includes its Python backend and self-contained .NET sensor bridge; you do not need to install the Python or .NET SDK to use it.

**Upgrading:** RigObserver keeps the existing application identity and stores user data under the legacy `%LOCALAPPDATA%\PulseWatch\data` directory for compatibility. Existing dashboards and history are preserved when upgrading from the earlier release.

**Windows notifications:** You can use **Alert Settings → Test notification** to check whether notifications are enabled. Windows notification permissions and Do Not Disturb may affect visibility. In-app alert messages remain available independently.

> The Windows installer is not code-signed. Depending on your Windows security settings, an unrecognized publisher warning may appear.

## Technology stack

| Layer | Technology |
| --- | --- |
| Desktop shell | Python, pywebview, Microsoft Edge WebView2 |
| Local API and monitoring | FastAPI, psutil, SQLite |
| Hardware sensors | C# / .NET 10, LibreHardwareMonitor |
| Dashboard | HTML, CSS, JavaScript, Chart.js |
| Windows notifications | Python, winotify |
| Packaging | PyInstaller, Inno Setup |

## Run from source

### Prerequisites

- Windows with Python 3, `venv`, and `pip` (developed with Python 3.14)
- .NET 10 SDK to build the sensor bridge
- Internet connection for dependency installation and the Chart.js CDN

Clone the repository:

```powershell
git clone https://github.com/KostasNikP/RigObserver.git
cd RigObserver
```

Run `setup_rigobserver.bat` to create the Python virtual environment, install dependencies, and compile the sensor bridge. Then start the desktop application:

```powershell
.\.venv\Scripts\python.exe -m app.desktop
```

For the browser dashboard, use `start_rigobserver.bat`, or run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.api:app --host 127.0.0.1 --port 8000
```

Open [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard). The browser-only mode does not launch the elevated hardware helper and does not display native Windows toast notifications.

### Build the Windows installer

The repository includes `build_release.bat`. On Windows, with the .NET 10 SDK and Inno Setup installed:

```powershell
.\build_release.bat
```

The script installs build requirements, publishes the self-contained sensor bridge, runs PyInstaller, and compiles `RigObserver.iss`. For v0.1.1 the output is:

```text
installer\RigObserver_Setup_v0.1.1.exe
```

## Local API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/metrics` | Live system, network metrics, and alerts |
| GET | `/api/hardware` | Hardware inventory |
| GET | `/api/sensors` | Hardware sensor snapshots |
| GET | `/api/history` | Historical system metrics |
| GET | `/api/alerts` | Active system alerts |
| GET / PUT | `/api/alert-settings` | Alert threshold configuration |
| GET | `/docs` | Interactive FastAPI documentation |

The local backend binds to `127.0.0.1`. It is intended for local use and has no public-facing authentication. Do not expose it to the internet.

## Project structure

```text
app/
  api.py                      Local FastAPI service
  collector.py                System monitoring and history
  desktop.py                  Windows desktop startup
  windows_notifications.py    Native toast notification bridge
  admin_sensor_helper.py      Optional elevated sensor collection
  static/                     Dashboard HTML, CSS, and JavaScript
sensor_bridge/                .NET / LibreHardwareMonitor bridge
assets/                       Application icon
RigObserver.spec               PyInstaller build configuration
RigObserver.iss                Inno Setup installer configuration
build_release.bat              Windows release builder
setup_rigobserver.bat          Development environment setup
RELEASE_NOTES_v0.1.1.md        Version 0.1.1 changelog
```

## Notes and limitations

- Some sensor values may be unavailable or inaccurate depending on the machine.
- Hardware monitoring with administrator permission is optional.
- Network speed graphs show measured transfer rates, not maximum internet speed.
- Chart.js is currently loaded from a CDN, so internet connectivity may be needed for charts.
- System thresholds are meant for monitoring and notification, not automatic hardware control.

## Author

**Konstantinos Nikolakopoulos**  
Computer Science & Telecommunications Graduate  
[GitHub — KostasNikP](https://github.com/KostasNikP)
