import 'server-only'

const envCache = new Map<string, string>()

function readRawEnv(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getRequiredEnv(name: string): string {
  const cached = envCache.get(name)
  if (cached) return cached

  const value = readRawEnv(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  envCache.set(name, value)
  return value
}

export function getOptionalEnv(name: string): string | undefined {
  return readRawEnv(name)
}
