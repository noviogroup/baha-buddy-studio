#!/usr/bin/env node

import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-30'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})

const jobsPath = '/private/tmp/baha-buddy-tourism-board-claude-extraction-jobs.json'
const apply = process.env.APPLY_SOURCE_EXACT_TOURISM_FACTS === '1'
const auditVersion = 'tourism-source-exact-v1'
const today = '2026-08-30'
const approvedChannels = ['web', 'mobile', 'buddy']

if (!fs.existsSync(jobsPath)) {
  throw new Error(`Missing ${jobsPath}; run npm run research:tourism-board:build first`)
}

const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'))
const sourceTextsById = new Map()
for (const job of jobs) {
  const texts = sourceTextsById.get(job.sourceId) ?? []
  texts.push(job.text)
  sourceTextsById.set(job.sourceId, texts)
}

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
  'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their',
  'there', 'these', 'this', 'to', 'was', 'were', 'which', 'with', 'visitors',
  'travelers', 'island', 'islands', 'bahamas',
])
const highRiskTokens = new Set([
  'best', 'deepest', 'first', 'guaranteed', 'largest', 'only', 'safest',
  'world', "world's",
])

function tokensWithOffsets(value) {
  const tokens = []
  const pattern = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu
  for (const match of value.matchAll(pattern)) {
    tokens.push({
      value: match[0].normalize('NFKC').replaceAll('’', "'").toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return tokens
}

function exactRawSpan(sourceText, requestedExcerpt) {
  const sourceTokens = tokensWithOffsets(sourceText)
  const excerptTokens = tokensWithOffsets(requestedExcerpt)
  if (excerptTokens.length < 6 || excerptTokens.length > 50) return null

  for (let start = 0; start <= sourceTokens.length - excerptTokens.length; start += 1) {
    let matches = true
    for (let offset = 0; offset < excerptTokens.length; offset += 1) {
      if (sourceTokens[start + offset].value !== excerptTokens[offset].value) {
        matches = false
        break
      }
    }
    if (!matches) continue
    const first = sourceTokens[start]
    const last = sourceTokens[start + excerptTokens.length - 1]
    return sourceText.slice(first.start, last.end).replace(/\s+/g, ' ').trim()
  }
  return null
}

function numericTokens(value) {
  return tokensWithOffsets(value)
    .map((token) => token.value)
    .filter((token) => /\d/.test(token))
}

function contentTokens(value) {
  return tokensWithOffsets(value)
    .map((token) => token.value)
    .filter((token) => token.length > 2 && !stopWords.has(token))
}

function claimSupport(claim, excerpt) {
  const claimTokens = contentTokens(claim)
  const excerptTokens = new Set(contentTokens(excerpt))
  if (claimTokens.length === 0) return 0
  const supported = claimTokens.filter((token) => excerptTokens.has(token)).length
  return supported / claimTokens.length
}

function sameStringArray(left, right) {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? [])
}

function review(document) {
  const sourceId = document.sources?.[0]?._ref
  const sourceTexts = sourceTextsById.get(sourceId)
  if (!sourceTexts?.length) return {eligible: false, reason: 'source_text_missing'}
  if (document.conflictGroup) return {eligible: false, reason: 'unresolved_conflict'}
  if (document.topic === 'stays') {
    return {eligible: false, reason: 'canonical_place_not_reconciled'}
  }
  if (!['high', 'medium'].includes(document.confidence)) {
    return {eligible: false, reason: 'low_confidence'}
  }
  if (!['stable', 'seasonal', 'operational'].includes(document.volatility)) {
    return {eligible: false, reason: 'unsupported_volatility'}
  }
  if (!document.nextReviewAt || document.nextReviewAt < today) {
    return {eligible: false, reason: 'expired'}
  }
  if (!document.sourceExcerpt) return {eligible: false, reason: 'excerpt_missing'}

  const sourceExcerpt = sourceTexts
    .map((sourceText) => exactRawSpan(sourceText, document.sourceExcerpt))
    .find(Boolean)
  if (!sourceExcerpt) return {eligible: false, reason: 'excerpt_not_contiguous'}

  const excerptNumbers = new Set(numericTokens(sourceExcerpt))
  const unsupportedNumbers = numericTokens(document.claim).filter(
    (number) => !excerptNumbers.has(number),
  )
  if (unsupportedNumbers.length > 0) {
    return {
      eligible: false,
      reason: 'claim_number_not_in_excerpt',
      unsupportedNumbers: [...new Set(unsupportedNumbers)],
    }
  }


  const excerptTokenSet = new Set(contentTokens(sourceExcerpt))
  const unsupportedRiskTokens = contentTokens(document.claim)
    .filter((token) => highRiskTokens.has(token) && !excerptTokenSet.has(token))
  if (unsupportedRiskTokens.length > 0) {
    return {
      eligible: false,
      reason: 'high_risk_claim_not_in_excerpt',
      unsupportedRiskTokens: [...new Set(unsupportedRiskTokens)],
    }
  }

  const supportRatio = claimSupport(document.claim, sourceExcerpt)
  if (supportRatio < 0.5) {
    return {eligible: false, reason: 'claim_lexical_support_too_low', supportRatio}
  }

  return {eligible: true, sourceExcerpt, supportRatio}
}

const documents = await client.fetch(`*[
  _type == "islandFact" &&
  extractionPromptVersion == "tourism-board-fact-extraction-v1" &&
  !(_id in path("drafts.**"))
]{
  _id, title, topic, claim, travelerGuidance, travelerFitTags,
  sources, checkedAt, nextReviewAt, volatility, confidence,
  verificationStatus, channels, conflictGroup, sourceExcerpt,
  editorNotes, "destinationId": destination._ref
}`)

const reviewed = documents.map((document) => ({document, result: review(document)}))
const eligible = reviewed.filter(({result}) => result.eligible)
const held = reviewed.filter(({result}) => !result.eligible)
const reasons = held.reduce((counts, {result}) => {
  counts[result.reason] = (counts[result.reason] ?? 0) + 1
  return counts
}, {})
const byDestination = eligible.reduce((counts, {document}) => {
  counts[document.destinationId] = (counts[document.destinationId] ?? 0) + 1
  return counts
}, {})
const byTopic = eligible.reduce((counts, {document}) => {
  counts[document.topic] = (counts[document.topic] ?? 0) + 1
  return counts
}, {})

const report = {
  mode: apply ? 'apply' : 'dry_run',
  auditVersion,
  reviewed: documents.length,
  eligible: eligible.length,
  held: held.length,
  reasons,
  byDestination,
  byTopic,
}

if (!apply) {
  console.log(JSON.stringify(report, null, 2))
  console.log('\nDry run only. Set APPLY_SOURCE_EXACT_TOURISM_FACTS=1 to approve the deterministic subset.')
  process.exit(0)
}

let changed = 0
for (let index = 0; index < eligible.length; index += 50) {
  const transaction = client.transaction()
  let batchChanges = 0
  for (const {document, result} of eligible.slice(index, index + 50)) {
    const editorNotes = [
      `Approved by deterministic ${auditVersion} audit on ${today}.`,
      'The stored excerpt is a contiguous raw span from the registered official source.',
      'Conflicting, expired, low-confidence, non-contiguous, and numerically unsupported drafts remain private.',
    ].join(' ')
    const alreadyCurrent =
      document.verificationStatus === 'approved' &&
      sameStringArray(document.channels, approvedChannels) &&
      document.sourceExcerpt === result.sourceExcerpt &&
      !document.travelerGuidance &&
      document.editorNotes === editorNotes
    if (alreadyCurrent) continue
    transaction.patch(document._id, (patch) =>
      patch
        .set({
          verificationStatus: 'approved',
          channels: approvedChannels,
          sourceExcerpt: result.sourceExcerpt,
          editorNotes,
        })
        .unset(['travelerGuidance']),
    )
    batchChanges += 1
  }
  if (batchChanges > 0) {
    await transaction.commit()
    changed += batchChanges
  }
}

console.log(JSON.stringify({...report, changed}, null, 2))
