import axios from 'axios'

type GroqChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function groqChat(opts: { model: string; messages: GroqChatMessage[]; temperature?: number }): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY missing')
  }

  const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
  const url = `${baseUrl}/chat/completions`

  const res = await axios.post(
    url,
    {
      model: opts.model,
      messages: opts.messages,
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.7,
      response_format: { type: 'json_object' },
    },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30_000,
    },
  )

  const content = res.data?.choices?.[0]?.message?.content
  if (!content) throw new Error('No content returned from Groq')
  return String(content)
}

