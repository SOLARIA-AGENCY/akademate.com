# CEP multi-entity staging shadow entrypoint

This is a connection guide, not evidence that staging has been executed.

The runner is implemented in
`packages/tenant/src/multi-entity-staging-shadow-entrypoint.ts`. It accepts only
three injected, read-only adapters:

1. `readUnifiedSnapshot`: a bounded operational snapshot already filtered by
   the target tenant.
2. `readOwnershipSnapshot`: the reviewed topology and current persisted owner
   fields used by the ownership classifier.
3. `readRestoredBackupEvidence`: a previously sealed artifact from an external
   staging restore and verification process. The runner never reads or restores
   the backup itself.

## Staging connection procedure

1. Pin the reviewed source SHA and calculate its `sha256:` source digest.
2. Calculate the target tenant digest outside the runner; do not pass the raw
   tenant identifier to logs or output handlers.
3. Implement the three adapters next to the staging bootstrap code. Payload
   reads must preserve current access (`overrideAccess: false`), use bounded and
   stable pagination, and select only fields needed by the existing snapshot
   contracts.
4. Compute every `snapshotDigest` with
   `digestMultiEntityStagingShadowSnapshot(value)` after the full snapshot is
   assembled.
5. Provide the externally produced restored-backup evidence artifact. This is
   contract validation only; it is not permission to restore or proof that the
   restore occurred unless the external reports are authentic and reviewed.
6. Enable exactly these process variables in an explicitly reviewed staging
   process:

   ```text
   AKADEMATE_CEP_STAGING_SHADOW_ENTRYPOINT_ENABLED=true
   AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT=staging
   ```

7. Invoke `runMultiEntityStagingShadowEntrypoint` once with the expected source
   and tenant digests. Persist `serializedRecord` only through a separately
   reviewed evidence-custody mechanism; the runner intentionally exposes no
   write callback.
8. Re-run with the same bound inputs and confirm byte-identical
   `serializedRecord`. A different record requires review of the input binding,
   not automatic promotion.

## Safety boundary

- Production, missing/invalid environments, disabled flags, absent or extra
  adapters, oversized snapshots, inconsistent digests, and malformed evidence
  fail closed. Collection limits are capped at 100,000 records and may be
  lowered through the existing snapshot contracts.
- The output contains redacted aggregate metrics and content-addressed digests,
  never snapshot rows, tenant/entity/campus IDs, review references or errors.
- No endpoint, cron, queue job, deployment, migration, ACL mutation, membership
  mutation, permission change, backup read or backup restore is registered here.
- `eligible_for_manual_review` is not staging readiness, deployment authority,
  restored-backup proof, or permission to activate multi-entity enforcement.
