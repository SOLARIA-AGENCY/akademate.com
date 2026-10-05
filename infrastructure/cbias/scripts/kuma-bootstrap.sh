#!/usr/bin/env bash
# Bootstrap Uptime Kuma sqlite admin + CEP/C-BIAS monitors.
# Runs a one-shot python-socketio client on cbias_cbias_internal.
set -euo pipefail
cd /opt/cbias
set -a
# shellcheck disable=SC1091
. ./.env
set +a
: "${KUMA_USER:?}"
: "${KUMA_PASSWORD:?}"

docker compose -f /opt/cbias/docker-compose.yml up -d uptime-kuma
for i in $(seq 1 30); do
  page=$(curl -sS -m 3 http://127.0.0.1:3001/api/entry-page 2>/dev/null || curl -sS -m 3 "http://${TS_BIND:-100.113.169.104}:3001/api/entry-page" || true)
  echo "kuma entry-page: $page"
  echo "$page" | grep -q 'setup-database' || break
  sleep 2
done

docker run --rm --network cbias_cbias_internal \
  -e KUMA_INTERNAL=http://cbias-uptime:3001 \
  -e KUMA_USER="$KUMA_USER" \
  -e KUMA_PASSWORD="$KUMA_PASSWORD" \
  -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}" \
  -e TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}" \
  python:3.12-slim bash -c 'pip install -q python-socketio[client]==5.11.4 websocket-client && python - <<'"'"'PY'"'"'
import os, json, time, socketio

base = os.environ["KUMA_INTERNAL"]
user = os.environ["KUMA_USER"]
password = os.environ["KUMA_PASSWORD"]
tg_token = os.environ.get("TELEGRAM_BOT_TOKEN") or ""
tg_chat = os.environ.get("TELEGRAM_CHAT_ID") or ""

sio = socketio.Client(reconnection=False, logger=False)
state = {"connected": False, "setup": None, "login": None, "added": []}

def wait(key, timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if state.get(key) is not None:
            return state[key]
        time.sleep(0.2)
    raise SystemExit(f"timeout waiting for {key}")

@sio.event
def connect():
    state["connected"] = True

def setup_cb(data):
    state["setup"] = data or {}

def login_cb(data):
    state["login"] = data or {}

def add_cb(name):
    def _cb(data):
        state["added"].append((name, data))
    return _cb

sio.connect(base, wait_timeout=20, transports=["websocket", "polling"])
time.sleep(0.5)
sio.emit("needSetup", callback=lambda d: state.__setitem__("need", d))
time.sleep(0.5)
need = state.get("need", True)
if need:
    sio.emit("setup", (user, password), callback=setup_cb)
    setup = wait("setup")
    print("setup", setup)
    if not setup.get("ok") and "initialized" not in str(setup.get("msg", "")).lower():
        raise SystemExit(f"setup failed: {setup}")
sio.emit("login", {"username": user, "password": password}, callback=login_cb)
login = wait("login")
print("login", {k: login.get(k) for k in ("ok", "msg", "tokenRequired")})
if not login.get("ok"):
    raise SystemExit(f"login failed: {login}")

notification_ids = {}
if tg_token and tg_chat:
    def notif_cb(data):
        state["notif"] = data or {}
    sio.emit("addNotification", {
        "name": "telegram-cbias",
        "active": True,
        "isDefault": True,
        "type": "telegram",
        "telegramBotToken": tg_token,
        "telegramChatID": tg_chat,
    }, True, callback=notif_cb)
    time.sleep(2)
    print("notification", state.get("notif"))
    if state.get("notif", {}).get("ok") and state["notif"].get("id"):
        notification_ids[str(state["notif"]["id"])] = True

def monitor(name, mtype, **extra):
    body = {
        "type": mtype,
        "name": name,
        "interval": 60,
        "retryInterval": 60,
        "resendInterval": 0,
        "maxretries": 2,
        "timeout": 48,
        "upsideDown": False,
        "notificationIDList": notification_ids,
        "expiryNotification": True,
        "ignoreTls": False,
        "maxredirects": 10,
        "accepted_statuscodes": ["200-299"],
        "dns_resolve_type": "A",
        "dns_resolve_server": "1.1.1.1",
        "kafkaProducerBrokers": [],
        "kafkaProducerSaslOptions": {},
        "conditions": [],
        "rabbitmqNodes": [],
        "active": True,
        "method": "GET",
    }
    body.update(extra)
    sio.emit("add", body, callback=add_cb(name))

monitor("CEP production HTTPS", "http", url="https://cepformacion-app.akademate.com", expiryNotification=True)
monitor("CEP staging HTTPS", "http", url="https://cepformacion-staging.akademate.com", expiryNotification=True)
monitor("CEP Sentry HTTPS", "http", url="https://cepformacion-sentry.akademate.com", expiryNotification=True)
monitor("CEP GlitchTip HTTP origin", "http", url="http://37.59.119.219", headers="{\"Host\":\"cepformacion-glitchtip.akademate.com\"}")
monitor("CEP production DNS", "dns", hostname="cepformacion-app.akademate.com", dns_resolve_type="A", dns_resolve_server="1.1.1.1")
monitor("CEP OVH origin HTTP", "http", url="http://37.59.119.219")
monitor("C-BIAS Grafana health", "http", url="http://cbias-grafana:3000/api/health")
monitor("C-BIAS Prometheus", "http", url="http://cbias-prometheus:9090/-/healthy")
monitor("CEP Cloudflare apex", "http", url="https://cepformacion.com", expiryNotification=True)
monitor("CEP Cloudflare health", "http", url="https://cepformacion.com/health", expiryNotification=True)
monitor("CEP Cloudflare preview", "http", url="https://cepformacion.com/preview", expiryNotification=True)
monitor("validate closed-port (expect DOWN)", "http", url="http://127.0.0.1:1", active=True, maxretries=1, interval=20)

deadline = time.time() + 30
while time.time() < deadline and len(state["added"]) < 12:
    time.sleep(0.4)
print("added")
for name, data in state["added"]:
    print(name, data.get("ok"), data.get("monitorID"), data.get("msg"))
sio.disconnect()
print("KUMA_BOOTSTRAP_OK")
PY'

echo "KUMA_BOOTSTRAP_DONE"
