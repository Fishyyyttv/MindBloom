const LEGACY_ADMIN_USER_IDS = ['user_3Bk4ej2PiqeNmdL7Y9obghgEAXt']
const LEGACY_ADMIN_EMAILS = ['fishyfishyflops@gmail.com']

function parseIdList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function parseEmailList(value: string | undefined): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => normalizeEmail(item))
        .filter(Boolean)
    )
  )
}

export function getAdminUserIds(): string[] {
  const envIds = parseIdList(process.env.ADMIN_USER_IDS)
  if (envIds.length > 0) return envIds

  const singleId = process.env.ADMIN_USER_ID?.trim()
  if (singleId) return [singleId]

  // Backward-compatible fallback so existing local setups continue to work.
  return LEGACY_ADMIN_USER_IDS
}

export function getAdminEmails(): string[] {
  const envEmails = parseEmailList(process.env.ADMIN_USER_EMAILS)
  if (envEmails.length > 0) return envEmails

  const legacyEnvEmails = parseEmailList(process.env.ADMIN_EMAILS)
  if (legacyEnvEmails.length > 0) return legacyEnvEmails

  return LEGACY_ADMIN_EMAILS
}

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false
  return getAdminUserIds().includes(userId)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(normalizeEmail(email))
}
