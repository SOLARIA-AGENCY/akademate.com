#!/bin/sh
# Refuses to start a third tenant container. OVH already runs cep-tenant and
# cep-tenant-staging. A third image would press the 24 GB box that is serving leads.
set -eu
if [ "${CEP_REHEARSAL_CONFIRM:-}" != "1" ]; then
  echo "refused: set CEP_REHEARSAL_CONFIRM=1 only inside a comparison window" >&2
  exit 2
fi
echo "refused: cep-tenant and cep-tenant-staging are already up. Do not start another tenant image." >&2
exit 3
