# Umami CEP Formación

Umami is isolated on the CEP OVH host. It uses its own PostgreSQL container
and volume and does not connect to the academic database.

## Public hostname

`https://cepformacion-umami.akademate.com`

Create an A record for this hostname pointing to the CEP OVH server and keep
the existing Cloudflare proxy policy. The CEP Traefik instance must have the
`websecure` entrypoint and the `letsencrypt` resolver configured before
starting this project.

## First installation on OVH

```bash
mkdir -p /opt/cep/umami
cp .env.example /opt/cep/umami/.env
chmod 600 /opt/cep/umami/.env
docker compose --env-file /opt/cep/umami/.env up -d
docker compose --env-file /opt/cep/umami/.env ps
```

Open the hostname, create the CEP website in Umami, and set the resulting
website ID as `CEP_UMAMI_WEBSITE_ID` in the tenant application's environment.
The public CEP layout then loads Umami only for CEP hosts.

## Backup

Back up the `umami_db` volume together with the CEP infrastructure backups.
Do not share or merge it with the academic PostgreSQL backup.
