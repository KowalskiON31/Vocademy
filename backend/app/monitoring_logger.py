"""
Monitoring Logger - sendet Logs an das zentrale Monitoring Dashboard
API: POST http://localhost:4000/api/logs
"""

import urllib.request
import json
import time
import threading

MONITORING_URL = "http://localhost:4000/api/logs"
MONITORING_TOKEN = "LaraAlice2309!"
APP_NAME = "Vocademy"


def log(log_type: str, message: str, user: str = None, meta: dict = None):
    """Fire-and-forget Log an das Monitoring Dashboard senden."""
    payload = {
        "app": APP_NAME,
        "type": log_type,
        "message": message,
        "user": user,
        "meta": meta or {},
        "timestamp": int(time.time() * 1000),
    }

    def send():
        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                MONITORING_URL,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {MONITORING_TOKEN}",
                },
                method="POST",
            )
            urllib.request.urlopen(req, timeout=3)
        except Exception as e:
            print(f"[MonitoringLogger] Fehler: {e}")

    threading.Thread(target=send, daemon=True).start()


def info(message: str, user: str = None, meta: dict = None):
    log("info", message, user, meta)

def warn(message: str, user: str = None, meta: dict = None):
    log("warn", message, user, meta)

def error(message: str, user: str = None, meta: dict = None):
    log("error", message, user, meta)

def auth(message: str, user: str = None, meta: dict = None):
    log("auth", message, user, meta)
