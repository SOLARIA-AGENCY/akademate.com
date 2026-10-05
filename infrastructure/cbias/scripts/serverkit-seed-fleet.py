#!/usr/bin/env python3
"""Inventory-only ServerKit seed for CEP OVH. Does not write nginx or run onboarding."""
from datetime import datetime, timezone

import sqlite3

DB = "/app/instance/serverkit.db"
SID = "6294dd92-8c58-47a3-bc0f-978b2162d75c"
NOW = datetime.now(timezone.utc).replace(tzinfo=None).isoformat(sep=" ", timespec="microseconds")

APPS = [
    ("Sitio web", 3009, "cepformacion-app.akademate.com", "akademate-tenant"),
    ("Campus virtual", 3000, "cepformacion-campus.akademate.com", "akademate-campus"),
    ("Staging", 3009, "cepformacion-staging.akademate.com", "akademate-tenant-staging"),
    ("GlitchTip", 8000, "cepformacion-glitchtip.akademate.com", "glitchtip"),
    ("Sentry", 9000, "cepformacion-sentry.akademate.com", "sentry"),
    ("Estado publico", 80, "cepformacion-estado.akademate.com", "uptime-kuma"),
]

COMPONENTS = [
    ("Sitio web", "Sitio web", "https://cepformacion-app.akademate.com/", 1),
    ("Area de gestion", "Sitio web", "https://cepformacion-app.akademate.com/auth/login", 2),
    ("Campus virtual", "Campus", "https://cepformacion-campus.akademate.com/", 3),
    ("API", "API", "https://cepformacion-app.akademate.com/api/health", 4),
    ("Staging", "Sitio web", "https://cepformacion-staging.akademate.com/", 5),
    ("Estado publico", "Estado", "https://cepformacion-estado.akademate.com/status/estado", 6),
]


def main() -> None:
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    user_id = c.execute("select id from users order by id limit 1").fetchone()["id"]
    ws = c.execute("select id from workspaces order by id limit 1").fetchone()
    workspace_id = ws["id"] if ws else None

    c.execute(
        """
        update servers set
          name=?,
          description=?,
          hostname=?,
          ip_address=?,
          onboarding_state='ready',
          status='online',
          updated_at=?
        where id=?
        """,
        (
            "CEP FORMACION OVH",
            "CEP FORMACION en OVH. Staging y produccion en el mismo host. Agente online.",
            "cep-ovh",
            "37.59.119.219",
            NOW,
            SID,
        ),
    )

    for name, port, domain, image in APPS:
        row = c.execute(
            "select id from applications where name=? and server_id=?", (name, SID)
        ).fetchone()
        if row:
            app_id = row["id"]
            c.execute(
                "update applications set status='running', port=?, docker_image=?, updated_at=? where id=?",
                (port, image, NOW, app_id),
            )
        else:
            c.execute(
                """
                insert into applications (
                  name, app_type, status, port, docker_image, source, version,
                  user_id, server_id, workspace_id, created_at, updated_at
                ) values (?, 'docker', 'running', ?, ?, 'external', 1, ?, ?, ?, ?, ?)
                """,
                (name, port, image, user_id, SID, workspace_id, NOW, NOW),
            )
            app_id = c.execute("select last_insert_rowid()").fetchone()[0]
        existing = c.execute(
            "select id from domains where name=?", (domain,)
        ).fetchone()
        if not existing:
            c.execute(
                """
                insert into domains (
                  name, is_primary, ssl_enabled, ssl_auto_renew, application_id, created_at, updated_at
                ) values (?, 1, 1, 0, ?, ?, ?)
                """,
                (domain, app_id, NOW, NOW),
            )

    if not c.execute("select id from status_pages where slug='cep-formacion'").fetchone():
        c.execute(
            """
            insert into status_pages (
              name, slug, description, primary_color, is_public, show_uptime, show_history, created_at, updated_at
            ) values (?, 'cep-formacion', ?, '#c45c26', 0, 1, 1, ?, ?)
            """,
            (
                "CEP Formacion",
                "Disponibilidad del sitio web, campus, API y staging.",
                NOW,
                NOW,
            ),
        )
    page_id = c.execute("select id from status_pages where slug='cep-formacion'").fetchone()["id"]
    for name, group, target, order in COMPONENTS:
        if c.execute(
            "select id from status_components where page_id=? and name=?", (page_id, name)
        ).fetchone():
            continue
        c.execute(
            """
            insert into status_components (
              page_id, name, description, "group", sort_order, check_type, check_target,
              check_interval, check_timeout, status, created_at
            ) values (?, ?, '', ?, ?, 'http', ?, 60, 10, 'operational', ?)
            """,
            (page_id, name, group, order, target, NOW),
        )

    if not c.execute(
        "select id from domain_registrations where domain='akademate.com'"
    ).fetchone():
        c.execute(
            """
            insert into domain_registrations (domain, registrar, auto_renew, source, checked_at)
            values ('akademate.com', 'Cloudflare', 1, 'manual', ?)
            """,
            (NOW,),
        )

    c.commit()
    servers = list(c.execute("select name, hostname, ip_address, status, onboarding_state from servers"))
    domains = list(c.execute("select name from domains order by name"))
    apps = list(c.execute("select name, port, status from applications order by name"))
    print("servers", [tuple(r) for r in servers])
    print("apps", [tuple(r) for r in apps])
    print("domains", [r[0] for r in domains])
    print("status_components", c.execute("select count(*) from status_components").fetchone()[0])
    print("SEED_OK")


if __name__ == "__main__":
    main()
