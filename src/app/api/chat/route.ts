import { auth, currentUser } from '@clerk/nextjs/server'
import { getGroq, THERAPIST_SYSTEM_PROMPT, detectCrisis, CRISIS_RESPONSE } from '@/lib/groq'
import {
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ensureAppUser } from '@/lib/server-user'
import { buildAssistantCustomizationPrompt } from '@/lib/ai-config'

function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'chat.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return new Response('Invalid request origin', { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('chat:message', req, userId),
    limit: 25,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'chat.blocked',
      userId,
      route,
    })
    return new Response('Too many messages. Please wait a minute.', {
      status: 429,
      headers: {
        'Retry-After': String(rateLimit.retryAfterSeconds),
      },
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { messages, sessionId, assistantConfig } = body as {
    messages: Array<{ role: string; content: string }>
    sessionId?: string
    assistantConfig?: unknown
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Invalid messages', { status: 400 })
  }

  const lastMessage = messages[messages.length - 1]?.content ?? ''
  if (typeof lastMessage !== 'string' || lastMessage.length === 0) {
    return new Response('Invalid messages', { status: 400 })
  }

  if (lastMessage.length > 2000) {
    return new Response('Message too long', { status: 400 })
  }

  const trimmedMessages = messages.slice(-20)
  const supabaseAdmin = getSupabaseAdmin()

  let appUserId: string | null = null
  try {
    const clerk = await currentUser()
    const appUser = await ensureAppUser({
      clerkId: userId,
      email: clerk?.emailAddresses?.[0]?.emailAddress,
    })
    appUserId = appUser.id
  } catch (error: any) {
    await logEvent({
      level: 'error',
      category: 'chat',
      action: 'app_user_resolution_failed',
      userId,
      route,
      metadata: { message: error?.message ?? 'unknown_error' },
    })
  }

  let validSessionId: string | null = null
  if (appUserId && isValidSessionId(sessionId)) {
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (sessionError) {
      await logEvent({
        level: 'error',
        category: 'chat',
        action: 'session_lookup_failed',
        userId,
        route,
        metadata: { message: sessionError.message, code: sessionError.code },
      })
    } else if (!existingSession) {
      const title = lastMessage.trim().slice(0, 80) || 'Conversation'
      const { error: createError } = await supabaseAdmin.from('chat_sessions').insert({
        id: sessionId,
        user_id: appUserId,
        title,
      })

      if (createError) {
        await logEvent({
          level: 'error',
          category: 'chat',
          action: 'session_create_failed',
          userId,
          route,
          metadata: { message: createError.message, code: createError.code },
        })
      } else {
        validSessionId = sessionId
      }
    } else if (existingSession.user_id === appUserId) {
      validSessionId = sessionId
    } else {
      await logEvent({
        level: 'warn',
        category: 'chat',
        action: 'session_forbidden',
        userId,
        route,
        metadata: { sessionId },
      })
      return new Response('Invalid chat session', { status: 403 })
    }
  }

  if (detectCrisis(lastMessage)) {
    if (validSessionId) {
      const { error } = await supabaseAdmin.from('messages').insert([
        { session_id: validSessionId, role: 'user', content: lastMessage },
        { session_id: validSessionId, role: 'assistant', content: CRISIS_RESPONSE },
      ])
      if (error) {
        await logEvent({
          level: 'error',
          category: 'chat',
          action: 'crisis_persist_failed',
          userId,
          route,
          metadata: { message: error.message, code: error.code },
        })
      }
    }

    return new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(CRISIS_RESPONSE))
          controller.close()
        },
      }),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  if (validSessionId) {
    const { error } = await supabaseAdmin.from('messages').insert({
      session_id: validSessionId,
      role: 'user',
      content: lastMessage,
    })
    if (error) {
      await logEvent({
        level: 'error',
        category: 'chat',
        action: 'user_message_persist_failed',
        userId,
        route,
        metadata: { message: error.message, code: error.code },
      })
    }
  }

  let stream
  try {
    const groq = getGroq()
    const customSystemPrompt = buildAssistantCustomizationPrompt(assistantConfig)
    stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${THERAPIST_SYSTEM_PROMPT}\n\n${customSystemPrompt}` },
        ...trimmedMessages.map((message) => ({
          role: message.role as 'user' | 'assistant',
          content: message.content,
        })),
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.85,
    })
  } catch (error: any) {
    await logEvent({
      level: 'error',
      category: 'chat',
      action: 'provider_unavailable',
      userId,
      route,
      metadata: { message: error?.message ?? 'unknown_error' },
    })
    return new Response('AI service unavailable', { status: 503 })
  }

  let fullResponse = ''
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (error: any) {
        await logEvent({
          level: 'error',
          category: 'chat',
          action: 'stream_failed',
          userId,
          route,
          metadata: { message: error?.message ?? 'unknown_error' },
        })
      } finally {
        controller.close()
        if (validSessionId && fullResponse) {
          const { error } = await supabaseAdmin.from('messages').insert({
            session_id: validSessionId,
            role: 'assistant',
            content: fullResponse,
          })
          if (error) {
            await logEvent({
              level: 'error',
              category: 'chat',
              action: 'assistant_message_persist_failed',
              userId,
              route,
              metadata: { message: error.message, code: error.code },
            })
          }
        }
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
