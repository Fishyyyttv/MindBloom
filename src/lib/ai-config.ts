export const AI_CONFIG_STORAGE_KEY = 'mindbloom_ai_config'

export type CompanionTone = 'gentle' | 'balanced' | 'direct' | 'motivational'
export type ResponseStyle = 'brief' | 'balanced' | 'deep'

export interface AICompanionConfig {
  name: string
  tone: CompanionTone
  responseStyle: ResponseStyle
  focus: string
  customInstructions: string
}

export const DEFAULT_AI_CONFIG: AICompanionConfig = {
  name: 'Bloom',
  tone: 'balanced',
  responseStyle: 'balanced',
  focus: '',
  customInstructions: '',
}

const MAX_NAME_LENGTH = 40
const MAX_TEXT_LENGTH = 400

function clampText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function isTone(value: unknown): value is CompanionTone {
  return value === 'gentle' || value === 'balanced' || value === 'direct' || value === 'motivational'
}

function isResponseStyle(value: unknown): value is ResponseStyle {
  return value === 'brief' || value === 'balanced' || value === 'deep'
}

export function normalizeAIConfig(input: unknown): AICompanionConfig {
  if (!input || typeof input !== 'object') return DEFAULT_AI_CONFIG
  const value = input as Partial<AICompanionConfig>

  const name = clampText(value.name, MAX_NAME_LENGTH) || DEFAULT_AI_CONFIG.name
  const tone = isTone(value.tone) ? value.tone : DEFAULT_AI_CONFIG.tone
  const responseStyle = isResponseStyle(value.responseStyle) ? value.responseStyle : DEFAULT_AI_CONFIG.responseStyle
  const focus = clampText(value.focus, MAX_TEXT_LENGTH)
  const customInstructions = clampText(value.customInstructions, MAX_TEXT_LENGTH)

  return {
    name,
    tone,
    responseStyle,
    focus,
    customInstructions,
  }
}

function toneDirective(tone: CompanionTone): string {
  switch (tone) {
    case 'gentle':
      return 'Use extra-soft, reassuring language and slower pacing.'
    case 'direct':
      return 'Be concise, practical, and straightforward while staying warm.'
    case 'motivational':
      return 'Use encouraging language and action-oriented momentum.'
    default:
      return 'Keep a balanced mix of empathy and practical support.'
  }
}

function responseLengthDirective(style: ResponseStyle): string {
  switch (style) {
    case 'brief':
      return 'Keep answers short unless the user asks for more detail.'
    case 'deep':
      return 'Provide deeper, more thorough responses when useful.'
    default:
      return 'Default to moderate response length.'
  }
}

export function buildAssistantCustomizationPrompt(configInput: unknown): string {
  const config = normalizeAIConfig(configInput)
  const lines = [
    `Preferred assistant name: ${config.name}.`,
    toneDirective(config.tone),
    responseLengthDirective(config.responseStyle),
  ]

  if (config.focus) {
    lines.push(`User priority focus: ${config.focus}.`)
  }
  if (config.customInstructions) {
    lines.push(`Additional user instructions: ${config.customInstructions}.`)
  }

  return lines.join('\n')
}
