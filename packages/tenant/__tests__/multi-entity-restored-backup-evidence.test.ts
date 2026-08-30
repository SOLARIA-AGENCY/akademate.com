import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityRestoredBackupEvidenceArtifact,
  createMultiEntityRestoredBackupEvidenceArtifact,
  serializeMultiEntityRestoredBackupEvidenceArtifact,
  type MultiEntityRestoredBackupEvidenceInput,
} from '../src/multi-entity-restored-backup-evidence'

const campaignReviewReference = 'review://campaign/cep-multi-entity/backup-restore-v1'
const readinessReviewReference = 'review://staging/readiness/backup-restore-v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const backupManifestDigest = `sha256:${'c'.repeat(64)}`
const restoreExecutionReportDigest = `sha256:${'d'.repeat(64)}`
const verificationReportDigest = `sha256:${'e'.repeat(64)}`
const payloadDigest = `sha256:${'f'.repeat(64)}`

function input(): MultiEntityRestoredBackupEvidenceInput {
  return {
    restoreEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    backupManifestDigest,
    restoreExecutionReportDigest,
    verificationReportDigest,
    backupPayloadDigest: payloadDigest,
    restoredPayloadDigest: payloadDigest,
  }
}

describe('multi-entity restored backup evidence', () => {
  it('seals external restore evidence without granting operational authority', () => {
    const artifact = createMultiEntityRestoredBackupEvidenceArtifact(input())

    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_restored_backup_evidence',
      gate: 'restored_backup_verified',
      mode: 'content_addressed_external_restore_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadBackup: false,
      canRestore: false,
      canWrite: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      backupPayloadDigest: payloadDigest,
      restoredPayloadDigest: payloadDigest,
      metrics: {
        externalRestoreReports: 1,
        externalVerificationReports: 1,
        payloadDigestMatches: true,
        contractBackupReads: 0,
        contractDatabaseReads: 0,
        contractDatabaseWrites: 0,
        migrationsApplied: 0,
        runtimeActivations: 0,
        permissionChanges: 0,
      },
    })
    expect(() => assertMultiEntityRestoredBackupEvidenceArtifact(artifact)).not.toThrow()
    expect(Object.isFrozen(artifact)).toBe(true)
    expect(Object.isFrozen(artifact.metrics)).toBe(true)
  })

  it('is deterministic and content-addressed', () => {
    const first = createMultiEntityRestoredBackupEvidenceArtifact(input())
    const second = createMultiEntityRestoredBackupEvidenceArtifact({ ...input() })

    expect(second).toEqual(first)
    expect(second.evidenceReference).toBe(
      `evidence://sha256/${second.artifactDigest.slice('sha256:'.length)}`
    )
    expect(serializeMultiEntityRestoredBackupEvidenceArtifact(input())).toBe(JSON.stringify(first))
  })

  it.each([
    ['production target', { restoreEnvironment: 'production' }],
    ['payload mismatch', { restoredPayloadDigest: `sha256:${'0'.repeat(64)}` }],
    ['invalid restore report digest', { restoreExecutionReportDigest: 'sha256:not-a-digest' }],
    ['reused report digest', { verificationReportDigest: restoreExecutionReportDigest }],
    ['same campaign and readiness review', { readinessReviewReference: campaignReviewReference }],
    ['same source and target', { targetTenantDigest: sourceDigest }],
    ['extra input key', { unexpected: true }],
  ])('fails closed for %s', (_label, change) => {
    expect(() =>
      createMultiEntityRestoredBackupEvidenceArtifact({ ...input(), ...change } as never)
    ).toThrow('MULTI_ENTITY_RESTORED_BACKUP_EVIDENCE_INVALID')
  })

  it.each([
    ['artifact digest', { artifactDigest: `sha256:${'1'.repeat(64)}` }],
    ['payload digest', { restoredPayloadDigest: `sha256:${'2'.repeat(64)}` }],
    ['metrics', { metrics: { externalRestoreReports: 2 } }],
    ['extra key', { unexpected: true }],
    ['backup read capability', { canReadBackup: true }],
    ['restore capability', { canRestore: true }],
    ['write capability', { canWrite: true }],
    ['automatic binding capability', { canBindAutomatically: true }],
    ['verification capability', { canMarkVerified: true }],
    ['deployment capability', { canDeploy: true }],
    ['migration capability', { canMigrate: true }],
    ['activation capability', { canActivate: true }],
    ['permission capability', { canChangePermissions: true }],
  ])('rejects forged %s', (_label, change) => {
    const artifact = createMultiEntityRestoredBackupEvidenceArtifact(input())
    expect(() =>
      assertMultiEntityRestoredBackupEvidenceArtifact({ ...artifact, ...change })
    ).toThrow('MULTI_ENTITY_RESTORED_BACKUP_EVIDENCE_INVALID')
  })

  it('serializes no raw review references, identifiers or timestamps', () => {
    const serialized = serializeMultiEntityRestoredBackupEvidenceArtifact(input())

    expect(serialized).not.toContain('review://')
    expect(serialized).not.toContain(campaignReviewReference)
    expect(serialized).not.toContain(readinessReviewReference)
    expect(serialized).not.toContain('tenantId')
    expect(serialized).not.toContain('generatedAt')
  })

  it('exports no restore, binding, verification or operational executor', async () => {
    const module = await import('../src/multi-entity-restored-backup-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /run|execute|apply|markVerified|bind|deploy|migrate|activate|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
