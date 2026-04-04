const LEGACY_ADMIN_USER_IDS = ['user_3Bk4ej2PiqeNmdL7Y9obghgEAXt']

function parseIdList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getAdminUserIds(): string[] {
  const envIds = parseIdList(process.env.ADMIN_USER_IDS)
  if (envIds.length > 0) return envIds

  const singleId = process.env.ADMIN_USER_ID?.trim()
  if (singleId) return [singleId]

  // Backward-compatible fallback so existing local setups continue to work.
  return LEGACY_ADMIN_USER_IDS
}

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false
  return getAdminUserIds().includes(userId)
}
