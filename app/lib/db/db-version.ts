/** Eleeveon Schools permanent-identity database metadata. */
export const APP_DB_NAME = "EleeveonDB" as const;

export const APP_DB_VERSION = 2 as const;
export const APP_DB_PREVIOUS_VERSION = 1 as const;

export const APP_DB_MIGRATION_NAME =
  "v2-website-template-settings" as const;

export const RECOVERY_DB_NAME = "EleeveonRecoveryDB" as const;
export const RECOVERY_DB_VERSION = 1 as const;
export const RECOVERY_BACKUP_STORE = "backups" as const;

export const DATABASE_BOOTSTRAP_CHANNEL =
  "eleeveon-database-bootstrap" as const;