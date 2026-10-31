"""Windows toast integration for the RigObserver pywebview desktop window.

The browser dashboard calls only these two small bridge methods; monitoring
and system alerts continue working if Windows notifications are unavailable.
"""
from __future__ import annotations

import logging
import sys
import threading
import time

from app.paths import BUNDLE_DIR

LOGGER = logging.getLogger(__name__)
APP_NAME = "RigObserver"
ICON_PATH = BUNDLE_DIR / "app" / "static" / "rigobserver-icon.png"


class DesktopNotificationBridge:
    """Small thread-safe API exposed to the RigObserver desktop webview."""

    def __init__(self) -> None:
        self._last_sent = 0.0
        self._lock = threading.Lock()

    @staticmethod
    def _send(title: str, message: str) -> dict:
        if sys.platform != "win32":
            return {"ok": False, "error": "Windows notifications require Windows."}
        try:
            from winotify import Notification

            options = {
                "app_id": APP_NAME,
                "title": title,
                "msg": message,
            }
            if ICON_PATH.is_file():
                options["icon"] = str(ICON_PATH.resolve())
            Notification(**options).show()
            return {"ok": True}
        except ImportError:
            return {
                "ok": False,
                "error": "Windows notification support is not installed. Run pip install -r requirements.txt.",
            }
        except Exception:
            LOGGER.exception("RigObserver Windows toast could not be displayed")
            return {
                "ok": False,
                "error": "Windows blocked the notification or the notification service is unavailable.",
            }

    def notify_alert(self, message: str, level: str = "warning") -> dict:
        """Send one notification per newly activated alert batch.

        The JavaScript side deduplicates by alert identity; this independent
        short cooldown also bounds accidental repeated bridge calls.
        """
        if not isinstance(message, str):
            return {"ok": False, "error": "Invalid alert message."}
        message = " ".join(message.split())[:200]
        if not message:
            return {"ok": False, "error": "Empty alert message."}
        title = ("RigObserver - Critical Alert"
                 if level == "critical" else "RigObserver - System Alert")
        with self._lock:
            now = time.monotonic()
            if now - self._last_sent < 3:
                return {"ok": False, "error": "Rate limited."}
            result = self._send(title, message)
            if result["ok"]:
                self._last_sent = now
            return result

    def test_notification(self) -> dict:
        """Explicit settings test; does not change live alert state."""
        with self._lock:
            return self._send(
                "RigObserver - Test Notification",
                "Windows notifications are connected to RigObserver.",
            )
