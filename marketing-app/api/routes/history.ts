import { Router } from 'express'
import type { GenerateRequest, GenerateResponse } from '../../shared/types.js'
import { getGeneration, listGenerations, saveGeneration } from '../lib/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam as number)) : 50
  const items = listGenerations(limit)
  res.json({ success: true, data: items })
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  const item = getGeneration(id)
  if (!item) {
    res.status(404).json({ success: false, error: 'not found' })
    return
  }
  res.json({ success: true, data: item })
})

router.post('/', async (req, res) => {
  const body = (req.body || {}) as { input?: GenerateRequest; output?: GenerateResponse }
  if (!body.input || !body.output) {
    res.status(400).json({ success: false, error: 'input and output required' })
    return
  }
  const saved = saveGeneration(body.input, body.output)
  res.json({ success: true, data: saved })
})

export default router

