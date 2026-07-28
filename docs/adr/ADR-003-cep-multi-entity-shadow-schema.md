# ADR-003: CEP multi-entity shadow schema

- Status: Accepted for non-production shadow evaluation only
- Date: 2026-07-28

## Context

CEP currently uses the tenant as its primary security boundary and has two physical campuses: Norte and Santa Cruz. CEP also operates through multiple legal entities. A legal entity is an accounting/employment identity, not a location, so representing ACATEM, APROEM, or any main operating company as additional campuses would corrupt both concepts and future authorization rules.

Courses and teachers are shared masters. Operational ownership, management, funding, employment, and finance need narrower scopes without changing current users or permissions during evaluation.

## Decision

Add six Payload shadow collections behind `CEP_MULTI_ENTITY_SHADOW_SCHEMA_ENABLED=true` and the explicit non-production label `CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT=development|local|staging|test`:

1. `legal-entities-shadow`: generic, data-driven legal entities. No CEP company names are hard-coded.
2. `campus-entity-bindings-shadow`: one record per existing physical campus, many legal entities per campus, and exactly one required primary legal entity included in that set.
3. `operational-scopes-shadow`: operational boundaries owned by a legal entity, with optional physical-campus coverage.
4. `staff-employments-shadow`: employment against a legal entity while referencing the shared `staff` master; allocations across operational scopes must be positive and total 100%.
5. `course-run-scopes-shadow`: nullable owner, manager, and funder scope bindings for existing `course-runs`; the shared course catalog remains unchanged.
6. `finance-connections-shadow`: one read-only, non-secret connection descriptor bound to one legal entity.

Every shadow collection is hidden in Payload Admin and denies read/create/update/delete to every Payload user, including superadmins. No current collection access rule, user permission, campus record, course, teacher, or course run is changed.

The gate is default-off. A missing or unrecognised environment label is treated as production and registers no shadow collections. The explicit `production` label is forbidden even when the feature flag is true. Enabling the gate registers schema metadata only; it does not authorize access, migrate data, or prove tenant/entity isolation.

## Consequences

- Norte and Santa Cruz remain the physical-campus model.
- Legal entities can evolve from data rather than source-code constants.
- Campus/entity many-to-many membership does not lose the single-primary invariant.
- Existing course and teacher masters remain shared.
- Finance cannot be modeled as a write-capable integration in this phase, and no credential is stored in the schema.
- Before any activation, a later ADR and migration must define tenant-consistency checks across every relationship, compound uniqueness, controlled service access, audit evidence, rollback, and staging validation. This ADR does not approve production deployment or permission activation.
