import { Router } from 'express'
import type { BrandKit } from '../../shared/types.js'
import { getBrandKit, upsertBrandKit } from '../lib/db.js'

const router = Router()

router.get('/', async (_req, res) => {
  const kit = getBrandKit()
  res.json({ success: true, data: kit })
})

router.put('/', async (req, res) => {
  const body = (req.body || {}) as Partial<BrandKit>
  if (!body.product || !body.audience) {
    res.status(400).json({ success: false, error: 'product and audience required' })
    return
  }

  const saved = upsertBrandKit({
    product: body.product,
    audience: body.audience,
    brandVoice: body.brandVoice,
    doNotSay: body.doNotSay,
    claimSafeMode: body.claimSafeMode,
  })
  res.json({ success: true, data: saved })
})

export default router

