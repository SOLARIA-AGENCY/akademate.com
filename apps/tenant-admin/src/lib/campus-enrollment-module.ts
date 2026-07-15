type CampusEnrollmentModuleEnvironment = {
  nodeEnv?: string
  campusEnvironment?: string
}

/**
 * Campus Enrollments remains isolated until the Campus module is ready for
 * production. Registering a Payload collection also adds locked-document
 * relations, so this must be decided before Payload builds its schema.
 */
export function isCampusEnrollmentModuleEnabled({
  nodeEnv,
  campusEnvironment,
}: CampusEnrollmentModuleEnvironment) {
  return nodeEnv !== 'production' && campusEnvironment === 'staging'
}
