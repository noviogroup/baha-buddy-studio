#!/usr/bin/env node

import {createHash} from 'node:crypto'
import fs from 'node:fs'

const jobsPath = '/private/tmp/baha-buddy-tourism-board-claude-extraction-jobs.json'
const outputPath = '/private/tmp/baha-buddy-tourism-board-island-fact-drafts.ndjson'
const model = 'claude-sonnet-4-6'
const promptVersion = 'tourism-board-fact-extraction-v1'
const maxOutputTokens = 12000
const applyApi = process.argv.includes('--apply-api')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1])) : Infinity
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = concurrencyArg ? Math.max(1, Number(concurrencyArg.split('=')[1])) : 3
const checkedAt = '2026-08-15'

const destinationIds = {
  'acklins-crooked-island': 'dest-acklins-crooked-island', inagua: 'dest-inagua',
  mayaguana: 'dest-mayaguana', bimini: 'dest-bimini',
  'eleuthera-harbour-island': 'dest-eleuthera', 'grand-bahama': 'dest-grand-bahama',
  'long-island': 'dest-long-island', 'nassau-paradise-island': 'dest-nassau',
  'ragged-island': 'dest-ragged-island', 'rum-cay': 'dest-rum-cay',
  'berry-islands': 'dest-berry-islands', andros: 'dest-andros',
  'cat-island': 'dest-cat-island', 'san-salvador': 'dest-san-salvador',
  abacos: 'dest-abacos', 'the-exumas': 'dest-exuma',
}
const topics = new Set(['overview', 'access', 'stays', 'food', 'experiences', 'nature', 'culture', 'seasonality', 'safety', 'accessibility'])
const fitTags = new Set(['foodie', 'history', 'shopping', 'nightlife', 'sea_water', 'boating', 'fishing', 'diving', 'eco_nature', 'birding', 'culture', 'romance', 'family', 'adventure', 'seclusion', 'luxury'])

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function reviewDate(volatility) {
  if (volatility === 'operational') return '2026-11-13'
  if (volatility === 'seasonal') return '2027-02-15'
  return '2028-08-15'
}

function extractJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error('Claude response did not contain a JSON array')
  return JSON.parse(cleaned.slice(start, end + 1))
}

async function extract(job) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      // Fact sheets regularly yield more than 5,000 output tokens. A truncated
      // JSON array cannot be reviewed or imported safely, so leave enough room
      // for the complete structured response and reject any truncated result.
      max_tokens: maxOutputTokens,
      temperature: 0,
      system: `You extract narrow, review-only tourism facts for Baha Buddy. Return only one complete JSON array with at most 30 high-value facts. Never approve content. Never invent or correct from memory. Preserve conflicts as separate facts sharing the same conflictGroup. Exclude live prices, current availability, weather, schedules, closures, guarantees, promotional calls to action, quiz mechanics, and advisor-sales language. Each item must contain islandSlug, title, topic, claim, travelerGuidance, travelerFitTags, volatility, confidence, sourceExcerpt, and conflictGroup. Topics: ${Array.from(topics).join(', ')}. Traveler-fit tags: ${Array.from(fitTags).join(', ')}. Volatility: stable, seasonal, operational. Confidence reflects this source alone. sourceExcerpt must be a short exact excerpt of at most 50 words.`,
      messages: [{
        role: 'user',
        content: `Source: ${job.sourceTitle}\nAllowed canonical island slugs: ${job.destinationSlugs.join(', ') || 'none; return []'}\n\n${job.text}`,
      }],
    }),
  })
  if (!response.ok) throw new Error(`Anthropic request failed: ${response.status} ${(await response.text()).slice(0, 500)}`)
  const body = await response.json()
  if (body.stop_reason === 'max_tokens') {
    throw new Error(`Claude response was truncated at ${maxOutputTokens} tokens for ${job.sourceTitle}`)
  }
  return extractJson(body.content?.filter((block) => block.type === 'text').map((block) => block.text).join('\n') ?? '')
}

if (!fs.existsSync(jobsPath)) throw new Error(`Missing ${jobsPath}; run npm run research:tourism-board:build first`)
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8')).slice(0, limit)
if (!applyApi) {
  console.log(JSON.stringify({
    mode: 'dry-run', jobs: jobs.length, model, promptVersion,
    note: 'Use --apply-api to call Claude and create review-only NDJSON drafts. No Sanity mutation occurs.',
    outputPath,
  }, null, 2))
  process.exit(0)
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required for --apply-api')

async function extractJob(job, jobIndex) {
  const documents = []
  const extracted = await extract(job)
  for (const [factIndex, raw] of extracted.entries()) {
    const islandSlug = String(raw.islandSlug ?? '')
    const claim = String(raw.claim ?? '').replace(/\s+/g, ' ').trim()
    const topic = String(raw.topic ?? '')
    const volatility = ['stable', 'seasonal', 'operational'].includes(raw.volatility) ? raw.volatility : 'operational'
    if (!job.destinationSlugs.includes(islandSlug) || !destinationIds[islandSlug]) continue
    if (!topics.has(topic) || claim.length < 20 || claim.length > 1800) continue
    const id = `tourism-fact-${sha256(`${job.sourceId}|${islandSlug}|${topic}|${claim}`).slice(0, 24)}`
    documents.push({
      _id: id,
      _type: 'islandFact',
      title: String(raw.title ?? `${islandSlug} ${topic}`).slice(0, 140),
      destination: {_type: 'reference', _ref: destinationIds[islandSlug]},
      topic,
      claim,
      travelerGuidance: String(raw.travelerGuidance ?? '').slice(0, 1200) || undefined,
      travelerFitTags: Array.isArray(raw.travelerFitTags) ? raw.travelerFitTags.filter((tag) => fitTags.has(tag)) : [],
      sources: [{_key: `source-${job.sourceId}`, _type: 'reference', _ref: job.sourceId}],
      checkedAt,
      nextReviewAt: reviewDate(volatility),
      volatility,
      confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'medium',
      verificationStatus: 'editorial_review',
      channels: [],
      conflictGroup: String(raw.conflictGroup ?? '').slice(0, 120) || undefined,
      sourceExcerpt: String(raw.sourceExcerpt ?? '').slice(0, 700) || undefined,
      extractionModel: model,
      extractionPromptVersion: promptVersion,
      editorNotes: `Claude extraction job ${jobIndex + 1}, fact ${factIndex + 1}. Compare the claim and excerpt against the registered source. Approval and delivery channels require human review.`,
    })
  }
  console.error(`Extracted ${jobIndex + 1}/${jobs.length}: ${job.sourceTitle}`)
  return documents
}

const jobDocuments = new Array(jobs.length)
let nextJobIndex = 0
async function worker() {
  while (nextJobIndex < jobs.length) {
    const jobIndex = nextJobIndex
    nextJobIndex += 1
    jobDocuments[jobIndex] = await extractJob(jobs[jobIndex], jobIndex)
  }
}
await Promise.all(Array.from({length: Math.min(concurrency, jobs.length)}, () => worker()))

const documents = jobDocuments.flat()
const unique = Array.from(new Map(documents.map((doc) => [doc._id, doc])).values())
fs.writeFileSync(outputPath, `${unique.map((doc) => JSON.stringify(doc)).join('\n')}\n`)
console.log(JSON.stringify({mode: 'extracted', jobs: jobs.length, drafts: unique.length, outputPath}, null, 2))
