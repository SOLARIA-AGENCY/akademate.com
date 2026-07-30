# ADR 0008: Akademate Next runtime isolation

Status: Accepted

Akademate Next is not deployed into the CEP runtime. Its Compose project,
images, Postgres database/user/volume, Redis volume, media volume, secrets,
ports, network and object-storage bucket use dedicated `akademate-next` or
`akademate_next` namespaces.

The checked-in example binds only to localhost and uses an internal Docker
network. It has no external proxy network and cannot contain CEP domains,
container identities, host addresses, volumes or deployment paths. The
isolation verifier is a mandatory Codex Loop/CI gate.

The `campus` service consumes the Next tenant API and does not connect directly
to Postgres. Runtime deployment, DNS and public routing remain pending until a
separate staging environment and synthetic tenant pass security, integration,
visual and rollback gates.
