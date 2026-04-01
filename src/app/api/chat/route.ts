import { auth } from '@clerk/nextjs/server'
import { groq, THERAPIST_SYSTEM_PROMPT, detectCrisis, CRISIS_RESPONSE } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

// Remove edge runtime — Map doesn't persist across edge instances anyway
// Rate limiting works properly in Node.js runtime
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(userId)
  if (!limit || now > limit.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + 60_000 })
    return false
  }
  if (limit.count >= 20) return true
  limit.count++
  return false
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (isRateLimited(userId)) {
    return new Response('Too many messages. Please wait a minute.', { status: 429 })
  }

  const { messages, sessionId } = await req.json()

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Invalid messages', { status: 400 })
  }

  const lastMessage = messages[messages.length - 1]?.content ?? ''

  // Max message length
  if (lastMessage.length > 2000) {
    return new Response('Message too long', { status: 400 })
  }

  // Limit conversation history to last 20 messages to prevent token abuse
  const trimmedMessages = messages.slice(-20)

  // Crisis detection — respond immediately, no AI needed
  if (detectCrisis(lastMessage)) {
    if (sessionId) {
      await supabaseAdmin.from('messages').insert([
        { session_id: sessionId, role: 'user', content: lastMessage },
        { session_id: sessionId, role: 'assistant', content: CRISIS_RESPONSE },
      ])
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

  // Save user message
  if (sessionId) {
    await supabaseAdmin.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: lastMessage,
    })
  }

  // Stream from Groq
  let stream
  try {
    stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: THERAPIST_SYSTEM_PROMPT },
        ...trimmedMessages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.85,
    })
  } catch (err) {
    console.error('Groq error:', err)
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
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        controller.close()
        if (sessionId && fullResponse) {
          await supabaseAdmin.from('messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          })
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