#!/usr/bin/env bash
# Public CEP status page in Uptime Kuma (no OVH/C-BIAS names on the page).
set -euo pipefail
cd /opt/cbias
set -a
# shellcheck disable=SC1091
. ./.env
set +a
: "${KUMA_USER:?}"
: "${KUMA_PASSWORD:?}"

docker run --rm --network cbias_cbias_internal \
  -e KUMA_INTERNAL=http://cbias-uptime:3001 \
  -e KUMA_USER="$KUMA_USER" \
  -e KUMA_PASSWORD="$KUMA_PASSWORD" \
  python:3.12-slim bash -c 'pip install -q python-socketio[client]==5.11.4 websocket-client && python - <<'"'"'PY'"'"'
import os, time, socketio

base = os.environ["KUMA_INTERNAL"]
user = os.environ["KUMA_USER"]
password = os.environ["KUMA_PASSWORD"]
sio = socketio.Client(reconnection=False, logger=False)
state = {}

def wait(key, timeout=25):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if key in state:
            return state[key]
        time.sleep(0.15)
    raise SystemExit(f"timeout waiting for {key}")

existing = {}

def remember_monitors(payload):
    monitors = payload if isinstance(payload, list) else (payload or {}).get("monitors") or []
    if isinstance(payload, dict) and not monitors:
        monitors = [v for v in payload.values() if isinstance(v, dict) and v.get("id")]
    for m in monitors:
        if isinstance(m, dict) and m.get("name") and m.get("id"):
            existing[m["name"]] = m["id"]

def emit(event, payload):
    key = f"r-{event}-{time.time()}"
    def cb(data):
        state[key] = data or {}
    sio.emit(event, payload, callback=cb)
    return wait(key)

@sio.event
def connect():
    state["connected"] = True

@sio.on("monitorList")
def on_monitors(data):
    remember_monitors(data)
    state["monitors"] = True

sio.connect(base, wait_timeout=20, transports=["websocket", "polling"])
time.sleep(0.4)
sio.emit("login", {"username": user, "password": password}, callback=lambda d: state.__setitem__("login", d or {}))
login = wait("login")
if not login.get("ok"):
    raise SystemExit(f"login failed: {login}")
wait("monitors")

wanted = [
    ("Sitio web", {"type": "http", "url": "https://cepformacion.com/"}),
    ("Sitio web operativo", {"type": "http", "url": "https://cepformacion.akademate.com/"}),
    ("Área de gestión", {"type": "http", "url": "https://cepformacion-app.akademate.com/auth/login"}),
    ("Campus virtual", {"type": "http", "url": "https://cepformacion-campus.akademate.com/"}),
    ("API", {"type": "http", "url": "https://cepformacion-app.akademate.com/api/health"}),
    ("Salud pública", {"type": "http", "url": "https://cepformacion.com/health"}),
]

ids = {}
for name, extra in wanted:
    if name in existing:
        ids[name] = existing[name]
        print("reuse", name, ids[name])
        continue
    body = {
        "type": extra["type"],
        "name": name,
        "url": extra["url"],
        "interval": 60,
        "retryInterval": 60,
        "resendInterval": 0,
        "maxretries": 2,
        "timeout": 48,
        "upsideDown": False,
        "notificationIDList": {},
        "expiryNotification": True,
        "ignoreTls": False,
        "maxredirects": 10,
        "accepted_statuscodes": ["200-299"],
        "active": True,
        "method": "GET",
        "conditions": [],
        "kafkaProducerBrokers": [],
        "kafkaProducerSaslOptions": {},
        "rabbitmqNodes": [],
    }
    res = emit("add", body)
    print("add", name, res.get("ok"), res.get("monitorID"), res.get("msg"))
    if not res.get("ok"):
        raise SystemExit(f"add monitor failed: {name} {res}")
    ids[name] = res["monitorID"]

added = emit("addStatusPage", ("Estado de CEP Formacion", "estado"))
print("addStatusPage", added)
if not added.get("ok") and "already" not in str(added.get("msg", "")).lower() and "exist" not in str(added.get("msg", "")).lower():
    # slug taken is fine; continue to save
    if added.get("msg") not in ("Slug already exists",):
        print("addStatusPage note", added)

config = {
    "slug": "estado",
    "title": "Estado de CEP Formación",
    "description": "Disponibilidad del sitio web, el área de gestión, el campus y la API. Si hay un corte, lo verás aquí.",
    "theme": "auto",
    "published": True,
    "searchEngineIndex": True,
    "showTags": False,
    "password": None,
    "footerText": "CEP Formación",
    "customCSS": "",
    "showPoweredBy": False,
    "showCertificateExpiry": False,
    "autoRefreshInterval": 60,
    "googleAnalyticsId": None,
    "analyticsId": None,
    "analyticsScriptUrl": None,
    "analyticsType": None,
    "showOnlyLastHeartbeat": False,
    "rssTitle": None,
    "icon": "/icon.svg",
    "logo": "",
    "domainNameList": ["cepformacion-estado.akademate.com"],
}
groups = [
    {
        "name": "Sitio web",
        "monitorList": [
            {"id": ids["Sitio web"], "sendUrl": 0},
            {"id": ids["Sitio web operativo"], "sendUrl": 0},
        ],
    },
    {
        "name": "Campus y área de gestión",
        "monitorList": [
            {"id": ids["Área de gestión"], "sendUrl": 0},
            {"id": ids["Campus virtual"], "sendUrl": 0},
        ],
    },
    {
        "name": "API",
        "monitorList": [
            {"id": ids["API"], "sendUrl": 0},
            {"id": ids["Salud pública"], "sendUrl": 0},
        ],
    },
]
saved = emit("saveStatusPage", ("estado", config, "", groups))
print("saveStatusPage", {k: saved.get(k) for k in ("ok", "msg")})
if not saved.get("ok"):
    raise SystemExit(f"saveStatusPage failed: {saved}")
sio.disconnect()
print("KUMA_PUBLIC_STATUS_OK")
PY'

docker exec cbias-uptime python3 -c '
import sqlite3
c=sqlite3.connect("/app/data/kuma.db")
c.execute("update status_page set published=1, search_engine_index=1 where slug=\"estado\"")
c.execute("update status_page set search_engine_index=0, description=\"Operacion interna (no publicar)\" where slug=\"cep-formacion\"")
c.commit()
for r in c.execute("select id,slug,title,published,search_engine_index,description from status_page"):
    print(r)
'

echo "KUMA_PUBLIC_STATUS_DONE"
