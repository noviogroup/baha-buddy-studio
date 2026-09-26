import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_RBDF_PUBLIC_SAR === '1'
const outputPath = '/private/tmp/baha-buddy-rbdf-public-sar-alignment-plan.json'
const sourceId = 'research-source-rbdf-public-sar-contact-2026'
const sourceUrl = 'https://rbdf.gov.bs/contact-us/'
const sourceRefKey = 'source-rbdf-public-sar-2026'
const resolvedGapKey = 'gap-national-rbdf-public-sar-vhf-route-recorded'

const response = await fetch(sourceUrl, {headers: {'user-agent': 'Baha Buddy Content Operations source verifier'}})
if (!response.ok) throw new Error(`RBDF source returned ${response.status}`)
const html = await response.text()
const sourceSignals = {
  searchAndRescueNumber: /(?:242[\s-]*)?362[\s-]*3816/.test(html),
  vhfChannel16: /Channel\s*16\s*VHF|VHF\s*Channel\s*16/i.test(html),
  policeEmergency: /919\s*\/\s*911|911\s*\/\s*919/.test(html),
}
if (Object.values(sourceSignals).some((value) => !value)) throw new Error(`Official source signals changed: ${JSON.stringify(sourceSignals)}`)

const [destinations, existingSource, facts, audits] = await Promise.all([
  client.fetch(`*[_type == "destination" && !(_id match "drafts.*") && defined(islandId)] | order(islandId asc){_id, islandId, name}`),
  client.fetch(`*[_id == $id][0]{_id, _rev, _type, title, url, publisher, sourceClass, authorityLevel, destinations[]{_key, _ref}, topics, checkedAt, nextReviewAt, status, notes, reviewPlan}`, {id: sourceId}),
  client.fetch(`*[_type == "islandFact" && _id match "drafts.island-fact-deep-research-dated-marine-search-rescue-coordination-and-facility-baseline-*"] | order(destination->islandId asc){_id, _rev, title, claim, travelerGuidance, checkedAt, nextReviewAt, confidence, verificationStatus, channels, sources[]{_key, _ref}, editorNotes, "island": destination->islandId}`),
  client.fetch(`*[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-*-marine-search-rescue-facility-coverage-*"] | order(destination->islandId asc){_id, _rev, title, status, sources[]{_key, _ref}, gaps, methodologyNotes, "island": destination->islandId}`),
])

if (destinations.length !== 16 || new Set(destinations.map((item) => item.islandId)).size !== 16) throw new Error(`Expected 16 canonical destinations, found ${destinations.length}`)
if (facts.length !== 16 || audits.length !== 16) throw new Error(`Expected 16 marine facts and audits, found ${facts.length}/${audits.length}`)
if (facts.some((fact) => !fact._id.startsWith('drafts.') || (fact.channels || []).length > 0)) throw new Error('Every target fact must remain a channel-free draft')
if (audits.some((audit) => !audit._id.startsWith('drafts.') || !['researching', 'editorial_review', 'baseline'].includes(audit.status))) throw new Error('Every target audit must remain a non-published research document')

const reviewScope = 'Recheck the current official RBDF public contact page for the published Search & Rescue telephone route, Harbour Control VHF route, police-emergency route, wording, and update signals. Do not extend a national contact into island-level coverage, continuous-watch, asset, response-time, accessibility, medical-handoff, or evacuation claims.'
const nextAction = 'By 2026-09-04, re-open the official page and confirm all published public routes. Record any change immediately; separately obtain responsible-authority evidence for island/cay coverage, outage fallback, caller location, responding asset, launch readiness, weather limits, response time, accessible communication, and medical handoff.'

const sourceDocument = {
  _id: sourceId,
  _type: 'researchSource',
  title: 'RBDF public Search & Rescue and VHF contact page — 2026',
  url: sourceUrl,
  publisher: 'Royal Bahamas Defence Force',
  sourceClass: 'government',
  authorityLevel: 'primary',
  destinations: destinations.map((destination) => ({_type: 'reference', _key: `destination-${destination.islandId}`, _ref: destination._id})),
  topics: ['safety', 'access'],
  checkedAt: '2026-08-05',
  nextReviewAt: '2026-09-04',
  status: 'active',
  notes: 'Current official RBDF page explicitly publishes Search & Rescue at (242) 362-3816, Harbour Control on VHF Channel 16, and Police Emergency at 919/911. This is a national public routing baseline only. It does not prove island/cay telephone or radio coverage, continuous watch during outages, caller-location capability, a responding asset, crew/fuel/launch readiness, range, weather limits, response time, accessible communication, dock/clinic handoff, medical transport, or evacuation.',
  reviewPlan: {
    _type: 'researchSourceReviewPlan',
    plannedAt: '2026-08-05',
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: 'scheduled',
    freshnessStatus: 'current',
    cadenceBand: '30_day',
    cadenceDays: 30,
    sourceRelationship: 'responsible_or_owning_publisher',
    verificationMethod: 'webpage_review',
    changeTriggers: ['publisher_url_or_scope_change', 'safety_emergency_or_activation_change', 'public_contact_or_channel_change', 'communications_outage_or_coverage_change'],
    reviewScope,
    nextAction,
  },
}

function coreSource(source) {
  if (!source) return null
  return {
    _id: source._id,
    _type: source._type,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceClass: source.sourceClass,
    authorityLevel: source.authorityLevel,
    destinations: (source.destinations || []).map(({_key, _ref}) => ({_type: 'reference', _key, _ref})),
    topics: source.topics,
    checkedAt: source.checkedAt,
    nextReviewAt: source.nextReviewAt,
    status: source.status,
    notes: source.notes,
    reviewPlan: source.reviewPlan,
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
  }
  return value
}

const factGuidanceOld = 'A national coordination role, training record, directory entry, facility name, vessel visit, or past operation is not proof of a current public distress contact, radio or mobile connectivity, continuous watch, staffing, assigned vessel or aircraft, launch readiness, range, response time, accessible communication, medical transport, or successful evacuation.'
const factGuidanceNew = 'The current RBDF public contact page supplies a national Search & Rescue telephone route and Harbour Control VHF Channel 16. Those published routes, plus a coordination role, training record, directory entry, facility name, vessel visit, or past operation, are not proof that a call or transmission will connect from the exact island/cay, that a continuous watch persists through an outage, or that staff, an assigned vessel or aircraft, launch readiness, range, response time, accessible communication, medical transport, or successful evacuation are available.'
const factClaimAddition = ' The current official RBDF contact page also publishes Search & Rescue at (242) 362-3816 and Harbour Control on VHF Channel 16, establishing a national public routing baseline without proving island-level coverage or response.'
const factNoteAddition = ' The current public SAR/VHF route was verified on 2026-08-05; island-level communications and operational capability remain open.'

const factPlans = facts.map((fact) => {
  const hasSource = (fact.sources || []).some((source) => source._ref === sourceId)
  const hasClaim = fact.claim.includes('362-3816') && /VHF Channel 16/i.test(fact.claim)
  if (!hasClaim && !fact.travelerGuidance.includes(factGuidanceOld)) throw new Error(`Unexpected fact guidance shape: ${fact._id}`)
  return {
    ...fact,
    nextSources: hasSource ? fact.sources : [...(fact.sources || []), {_type: 'reference', _key: sourceRefKey, _ref: sourceId}],
    nextClaim: hasClaim ? fact.claim : `${fact.claim}${factClaimAddition}`,
    nextTravelerGuidance: fact.travelerGuidance.includes(factGuidanceNew) ? fact.travelerGuidance : fact.travelerGuidance.replace(factGuidanceOld, factGuidanceNew),
    nextEditorNotes: fact.editorNotes.includes('public SAR/VHF route was verified') ? fact.editorNotes : `${fact.editorNotes}${factNoteAddition}`,
    needsUpdate: !hasSource || !hasClaim || !fact.travelerGuidance.includes(factGuidanceNew) || !fact.editorNotes.includes('public SAR/VHF route was verified') || fact.checkedAt !== '2026-08-05' || fact.nextReviewAt !== '2026-09-04',
  }
})

const resolvedGap = {
  _type: 'researchGap',
  _key: resolvedGapKey,
  topic: 'safety',
  priority: 'p1',
  title: 'National public RBDF SAR and VHF routes identified',
  action: 'Retain the official Search & Rescue telephone route, Harbour Control VHF Channel 16, and police-emergency handoff as a short-cadence national baseline. Keep island/cay connectivity, watch continuity, caller location, asset, launch readiness, weather, response time, accessibility, medical handoff, and fallback unresolved.',
  status: 'resolved',
}
const auditNoteAddition = ' The official public RBDF SAR telephone and Harbour Control VHF routes were added on 2026-08-05 as a national baseline; the existing P0 remains because exact island/cay communications and operational handoff are not proven.'

const auditPlans = audits.map((audit) => {
  const hasSource = (audit.sources || []).some((source) => source._ref === sourceId)
  const hasResolvedGap = (audit.gaps || []).some((gap) => gap._key === resolvedGapKey)
  return {
    ...audit,
    nextSources: hasSource ? audit.sources : [...(audit.sources || []), {_type: 'reference', _key: sourceRefKey, _ref: sourceId}],
    nextGaps: hasResolvedGap ? audit.gaps : [...(audit.gaps || []), resolvedGap],
    nextMethodologyNotes: audit.methodologyNotes.includes('public RBDF SAR telephone') ? audit.methodologyNotes : `${audit.methodologyNotes}${auditNoteAddition}`,
    needsUpdate: !hasSource || !hasResolvedGap || !audit.methodologyNotes.includes('public RBDF SAR telephone'),
  }
})

const sourceNeedsUpsert = JSON.stringify(stableValue(coreSource(existingSource))) !== JSON.stringify(stableValue(sourceDocument))
const plan = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  mode: apply ? 'apply' : 'dry_run',
  sourceSignals,
  counts: {
    destinations: destinations.length,
    facts: facts.length,
    audits: audits.length,
    sourceNeedsUpsert: Number(sourceNeedsUpsert),
    factsNeedingUpdate: factPlans.filter((item) => item.needsUpdate).length,
    auditsNeedingUpdate: auditPlans.filter((item) => item.needsUpdate).length,
  },
  guardrails: {
    allSixteenDestinations: destinations.length === 16,
    allTargetsAreDrafts: facts.every((fact) => fact._id.startsWith('drafts.')) && audits.every((audit) => audit._id.startsWith('drafts.')),
    factsRemainChannelFree: facts.every((fact) => (fact.channels || []).length === 0),
    officialPageContainsAllPublicRoutes: Object.values(sourceSignals).every(Boolean),
    sourceHasInternalOwnerAndThirtyDayCadence: sourceDocument.reviewPlan.reviewOwner === 'Baha Buddy Content Operations' && sourceDocument.reviewPlan.cadenceDays === 30,
    noP0MarkedResolved: auditPlans.every((audit) => audit.nextGaps.some((gap) => gap.title === 'Current marine distress route and communications remain unverified' && gap.priority === 'p0' && ['open', 'researching'].includes(gap.status))),
  },
  changes: {
    source: sourceNeedsUpsert ? sourceDocument : null,
    existingSource: sourceNeedsUpsert ? coreSource(existingSource) : null,
    factIds: factPlans.filter((item) => item.needsUpdate).map((item) => item._id),
    auditIds: auditPlans.filter((item) => item.needsUpdate).map((item) => item._id),
  },
  boundary: 'This bounded alignment adds one live/internal official source and updates only existing channel-free fact drafts and research-audit drafts. It does not approve, publish, deliver, contact an authority, or mutate Supabase.',
}

if (Object.values(plan.guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(plan.guardrails)}`)
fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)

if (apply && (sourceNeedsUpsert || factPlans.some((item) => item.needsUpdate) || auditPlans.some((item) => item.needsUpdate))) {
  let transaction = client.transaction()
  if (sourceNeedsUpsert) transaction = transaction.createOrReplace(sourceDocument)
  for (const fact of factPlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.patch(fact._id, (patch) => patch.ifRevisionId(fact._rev).set({
      sources: fact.nextSources,
      claim: fact.nextClaim,
      travelerGuidance: fact.nextTravelerGuidance,
      checkedAt: '2026-08-05',
      nextReviewAt: '2026-09-04',
      editorNotes: fact.nextEditorNotes,
    }))
  }
  for (const audit of auditPlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.patch(audit._id, (patch) => patch.ifRevisionId(audit._rev).set({
      sources: audit.nextSources,
      gaps: audit.nextGaps,
      methodologyNotes: audit.nextMethodologyNotes,
    }))
  }
  const result = await transaction.commit({visibility: 'sync'})
  plan.commit = {transactionId: result.transactionId, documentIds: result.results?.map((item) => item.id) || []}
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
}

console.log(JSON.stringify(plan, null, 2))
