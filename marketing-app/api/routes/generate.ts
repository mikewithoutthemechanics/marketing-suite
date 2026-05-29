import { Router } from 'express'
import type { GenerateRequest } from '../../shared/types.js'
import { getBrandKit } from '../lib/db.js'
import { generateMarketingCopy } from '../services/generate.js'

const router = Router()

router.post('/', async (req, res) => {
  const body = (req.body || {}) as Partial<GenerateRequest>
  if (!body.channel || !body.goal) {
    res.status(400).json({ success: false, error: 'channel and goal required' })
    return
  }

  const input: GenerateRequest = {
    channel: body.channel,
    product: body.product || '',
    audience: body.audience || '',
    offer: body.offer,
    goal: body.goal,
    brandVoice: body.brandVoice,
    language: body.language,
    guardrails: body.guardrails,
    knobs: body.knobs,
  }

  const brandKit = await getBrandKit()
  const out = await generateMarketingCopy(input, brandKit)
  res.json({ success: true, data: out })
})

export default router
