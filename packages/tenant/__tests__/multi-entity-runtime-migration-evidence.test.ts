import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityBackfillDryRunEvidenceArtifact,
  assertMultiEntityExpandOnlyMigrationReviewEvidenceArtifact,
  assertMultiEntityMigrationDryRunEvidenceArtifact,
  assertMultiEntityNode22RuntimeEvidenceArtifact,
  createMultiEntityBackfillDryRunEvidenceArtifact,
  createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact,
  createMultiEntityMigrationDryRunEvidenceArtifact,
  createMultiEntityNode22RuntimeEvidenceArtifact,
} from '../src/multi-entity-runtime-migration-evidence'

const digest = (character: string) => `sha256:${character.repeat(64)}`
const common = {
  environment: 'staging' as const,
  sourceSha: '89de407a610834b0c52af1976138e69723ba0239',
  sourceDigest: digest('a'),
  targetTenantDigest: digest('b'),
  campaignReviewReference: 'review://campaign/cep/staging-v1',
  readinessReviewReference: 'review://readiness/cep/staging-v1',
  commandDigest: digest('c'),
  tool: 'akademate-reviewer',
  toolVersion: '1.2.3',
  exitStatus: 0 as const,
  startedAtUtc: '2026-07-26T08:00:00.000Z',
  finishedAtUtc: '2026-07-26T08:01:00.000Z',
  executionReportDigest: digest('d'),
  verificationReportDigest: digest('e'),
}

describe('multi-entity runtime and migration evidence', () => {
  it('seals four source-bound staging contracts while registering zero staging executions', () => {
    const artifacts = fixtures()

    assertMultiEntityNode22RuntimeEvidenceArtifact(artifacts.node)
    assertMultiEntityExpandOnlyMigrationReviewEvidenceArtifact(artifacts.expand)
    assertMultiEntityMigrationDryRunEvidenceArtifact(artifacts.migration)
    assertMultiEntityBackfillDryRunEvidenceArtifact(artifacts.backfill)

    for (const artifact of Object.values(artifacts)) {
      expect(artifact).toMatchObject({
        environment: 'staging',
        verdict: 'eligible_for_manual_staging_binding',
        canExecute: false,
        canWrite: false,
        canApply: false,
        canBindAutomatically: false,
        canMarkVerified: false,
        canDeploy: false,
        canMigrate: false,
        canActivate: false,
        canChangePermissions: false,
        sourceSha: common.sourceSha,
        sourceDigest: common.sourceDigest,
        metrics: {
          sourceRegisteredStagingExecutionBindings: 0,
          contractDatabaseReads: 0,
          contractDatabaseWrites: 0,
          migrationsApplied: 0,
          backfillsApplied: 0,
          runtimeActivations: 0,
          permissionChanges: 0,
        },
      })
      expect(artifact.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(artifact.evidenceReference).toBe(
        `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}`
      )
      expect(Object.isFrozen(artifact)).toBe(true)
      expect(Object.isFrozen(artifact.metrics)).toBe(true)
    }
  })

  it.each([
    ['production environment', { environment: 'production' }],
    ['failed command', { exitStatus: 1 }],
    ['unordered timestamps', { finishedAtUtc: common.startedAtUtc }],
    ['raw identifier', { tenantId: 'tenant-private' }],
    ['credential-shaped extra field', { password: 'secret' }],
  ])('rejects %s', (_label, change) => {
    expect(() =>
      createMultiEntityMigrationDryRunEvidenceArtifact({
        ...migrationInput(),
        ...change,
      } as never)
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
  })

  it('rejects Node outside major 22 and forged source or artifact fields', () => {
    expect(() => createMultiEntityNode22RuntimeEvidenceArtifact(null as never)).toThrow(
      'MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID'
    )
    expect(() =>
      createMultiEntityNode22RuntimeEvidenceArtifact({
        ...nodeInput(),
        toolVersion: 'v20.19.0',
      })
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')

    const artifact = fixtures().node
    expect(() =>
      assertMultiEntityNode22RuntimeEvidenceArtifact({ ...artifact, canDeploy: true })
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
    expect(() =>
      assertMultiEntityNode22RuntimeEvidenceArtifact({
        ...artifact,
        sourceSha: 'f'.repeat(40),
      })
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
  })

  it('rejects destructive review, missing backup custody and dry-run snapshot mutation', () => {
    expect(() =>
      createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact({
        ...expandInput(),
        destructiveOperationsDetected: 1,
      } as never)
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
    expect(() =>
      createMultiEntityMigrationDryRunEvidenceArtifact({
        ...migrationInput(),
        backupManifestDigest: undefined,
      } as never)
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
    expect(() =>
      createMultiEntityBackfillDryRunEvidenceArtifact({
        ...backfillInput(),
        postRunSnapshotDigest: digest('f'),
      })
    ).toThrow('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
  })

  it('is deterministic and stores digests rather than commands or review references', () => {
    const first = createMultiEntityMigrationDryRunEvidenceArtifact(migrationInput())
    const second = createMultiEntityMigrationDryRunEvidenceArtifact(migrationInput())
    const serialized = JSON.stringify(first)

    expect(second).toEqual(first)
    expect(serialized).not.toContain('review://')
    expect(serialized).not.toContain('pnpm')
    expect(serialized).not.toContain('tenant-private')
    expect(serialized).not.toContain('password')
  })
})

function nodeInput() {
  return {
    ...common,
    gateReviewReference: 'review://runtime/node22/staging-v1',
    tool: 'node' as const,
    toolVersion: 'v22.17.0',
  }
}

function expandInput() {
  return {
    ...common,
    gateReviewReference: 'review://migration/expand-only/staging-v1',
    migrationPlanDigest: digest('f'),
    schemaBeforeDigest: digest('1'),
    schemaAfterDigest: digest('2'),
    expandOperationsReviewed: 7,
    destructiveOperationsDetected: 0 as const,
  }
}

function migrationInput() {
  return {
    ...common,
    gateReviewReference: 'review://migration/dry-run/staging-v1',
    backupManifestDigest: digest('9'),
    migrationPlanDigest: digest('f'),
    schemaBeforeDigest: digest('1'),
    schemaAfterDigest: digest('2'),
  }
}

function backfillInput() {
  return {
    ...common,
    gateReviewReference: 'review://backfill/dry-run/staging-v1',
    backupManifestDigest: digest('9'),
    inputSnapshotDigest: digest('8'),
    backfillPlanDigest: digest('7'),
    postRunSnapshotDigest: digest('8'),
  }
}

function fixtures() {
  return {
    node: createMultiEntityNode22RuntimeEvidenceArtifact(nodeInput()),
    expand: createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact(expandInput()),
    migration: createMultiEntityMigrationDryRunEvidenceArtifact(migrationInput()),
    backfill: createMultiEntityBackfillDryRunEvidenceArtifact(backfillInput()),
  }
}
