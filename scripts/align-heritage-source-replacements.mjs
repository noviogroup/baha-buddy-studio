import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_HERITAGE_SOURCE_REPLACEMENTS === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const outputPath = '/private/tmp/baha-buddy-heritage-source-replacement-alignment-plan.json'

const bmotContactId = 'research-source-bmot-general-contact-2026'
const unavailableSourceIds = [
  'research-source-ammc-public-site-no-program-detail',
  'research-source-operator-rum-cay-heritage-unavailable',
]
const freshnessAuditIds = [
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-rum-cay',
]
const replacementAuditIds = [
  'drafts.island-research-audit-2026-08-05-source-replacement-evidence-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-source-replacement-evidence-rum-cay',
]

const replacementConfig = {
  'research-source-ammc-public-site-no-program-detail': {
    destination: 'nassau-paradise-island',
    gapTitle: 'Replace unavailable source: AMMC Bahamas public website — no current site-program detail',
    sourceIds: [
      'research-source-bmot-queens-staircase',
      'research-source-bmot-queens-staircase-natural-wonder',
      'research-source-bmot-fort-fincastle',
      'research-source-opm-queens-staircase-rededication-2024',
      'research-source-laws-antiquities-monuments-museum-act-2017-revision',
      bmotContactId,
    ],
    boundary: "Current official tourism listings replace the dead AMMC page for Queen's Staircase and Fort Fincastle identity, public listing, public contact, and the Fort's displayed tour lead; the 2024 OPM record replaces it for dated Queen's Staircase project provenance; the Act supplies only general legal context. No replacement source proves the current site operator, site-confirmed hours or closures, entrance, condition, safety, accessibility, coordinate acceptance, photography rules, or reusable-media rights.",
    notes: "The AMMC URL remains unavailable and is preserved as provenance. A bounded replacement set now records current national-tourism pages for Queen's Staircase and Fort Fincastle, the 2024 OPM rededication record, the general antiquities law, and the Ministry of Tourism's public routing contact. Present site management and all traveler-operation gates remain unresolved.",
    nextAction: `By ${nextOperationalReviewAt}, recheck the unavailable URL and every recorded replacement. Separately obtain a site-responsible confirmation of the current operator, hours or closures, entrance, condition, safety, accessibility, photography, and media rules; do not reopen the completed source-replacement task unless the replacement set changes or fails.`,
  },
  'research-source-operator-rum-cay-heritage-unavailable': {
    destination: 'rum-cay',
    gapTitle: 'Replace unavailable source: Rum Cay heritage outbound site — unavailable',
    sourceIds: [
      'research-source-bmot-hartford-cave',
      'research-source-bmot-rum-cay-district-council-contact',
      'research-source-laws-antiquities-monuments-museum-act-2017-revision',
      bmotContactId,
    ],
    boundary: 'The current official Hartford Cave listing and separately corroborated Rum Cay District Council contact replace the dead outbound domain for bounded site identity, protected-site context, and an accountable verification route; the Act supplies only general legal context. No replacement source proves the responsible cave authority, current visitor operation, permission, guide requirement, entrance disclosure, condition, hazards, emergency plan, accessibility, petroglyph rules, photography, or reusable-media rights.',
    notes: "The outbound Rum Cay heritage domain remains unavailable and is preserved as provenance. A bounded replacement set now records the current official Hartford Cave listing, the corroborated Rum Cay District Council contact, the general antiquities law, and the Ministry of Tourism's public routing contact. Responsible authority and every traveler-operation gate remain unresolved.",
    nextAction: `By ${nextOperationalReviewAt}, recheck the unavailable domain and every recorded replacement. Separately obtain a responsible-authority confirmation of custodianship, permission, guide requirements, closures, condition, safety, accessibility, protection, disclosure, photography, and media rules; do not reopen the completed source-replacement task unless the replacement set changes or fails.`,
  },
}

const officialChecks = [
  {
    id: 'bmotContact',
    url: 'https://www.bahamas.com/contact',
    tests: [/302[\s-]*2000/, /tourism@bahamas\.com/i, /Ministry of Tourism/i],
  },
  {
    id: 'queensStaircase',
    url: 'https://www.bahamas.com/natural-wonders/queens-staircase',
    tests: [/Queen(?:'|’|&apos;)?s Staircase/i, /356[\s-]*9085/],
  },
  {
    id: 'fortFincastle',
    url: 'https://www.bahamas.com/natural-wonders/fort-fincastle',
    tests: [/Fort Fincastle/i, /guided tours/i, /8:00\s*a\.m\./i, /4:00\s*p\.m\./i],
  },
  {
    id: 'hartfordCave',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/hartford-cave',
    tests: [/Hartford Cave/i, /331[\s-]*2854/, /rumcaycouncil@outlook\.com/i],
  },
  {
    id: 'rumCayCouncil',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/rum-cay-salt-pond',
    tests: [/Rum Cay District Council/i, /331[\s-]*2854/, /rumcaycouncil@outlook\.com/i],
  },
  {
    id: 'opmRededication',
    url: 'https://opm.gov.bs/prime-minister-davis-queens-staircase-rededication/',
    tests: [/Queen(?:'|’|&#8217;)?s Staircase/i, /Antiquities[\s,]+Monuments and Museums Corporation|AMMC/i, /April 23, 2024/i],
  },
]

const sourceSignals = {}
for (const check of officialChecks) {
  const response = await fetch(check.url, {headers: {'user-agent': 'Baha Buddy Content Operations source verifier'}})
  if (!response.ok) throw new Error(`${check.id} returned ${response.status}`)
  const html = await response.text()
  sourceSignals[check.id] = check.tests.map((test) => test.test(html))
  if (sourceSignals[check.id].some((value) => !value)) {
    throw new Error(`${check.id} source signals changed: ${JSON.stringify(sourceSignals[check.id])}`)
  }
}

const live = await client.fetch(`{
  "destinations": *[_type == "destination" && islandId in ["nassau-paradise-island", "rum-cay"] && !(_id match "drafts.*")] | order(islandId asc){_id, islandId, name},
  "existingContact": *[_id == $bmotContactId][0]{...},
  "unavailableSources": *[_id in $unavailableSourceIds] | order(_id asc){...},
  "replacementSources": *[_id in $replacementSourceIds] | order(_id asc){_id, status, authorityLevel, reviewPlan},
  "freshnessAudits": *[_id in $freshnessAuditIds] | order(_id asc){...},
  "replacementAudits": *[_id in $replacementAuditIds] | order(_id asc){...}
}`, {
  bmotContactId,
  unavailableSourceIds,
  replacementSourceIds: [...new Set(Object.values(replacementConfig).flatMap((item) => item.sourceIds).filter((id) => id !== bmotContactId))],
  freshnessAuditIds,
  replacementAuditIds,
})

if (live.destinations.length !== 2 || new Set(live.destinations.map((item) => item.islandId)).size !== 2) throw new Error(`Expected two canonical destinations, found ${live.destinations.length}`)
if (live.unavailableSources.length !== 2) throw new Error(`Expected two unavailable sources, found ${live.unavailableSources.length}`)
if (live.freshnessAudits.length !== 2 || live.replacementAudits.length !== 2) throw new Error('Expected two freshness and two replacement audit drafts')
if (live.unavailableSources.some((source) => source.status !== 'unavailable')) throw new Error('Historical source status must remain unavailable')
if ([...live.freshnessAudits, ...live.replacementAudits].some((audit) => !audit._id.startsWith('drafts.'))) throw new Error('Every target audit must remain a draft')
if (live.replacementSources.some((source) => source.status !== 'active' || !['primary', 'corroborating'].includes(source.authorityLevel))) throw new Error('Every recorded replacement must remain active and authoritative or corroborating')

const destinationBySlug = new Map(live.destinations.map((item) => [item.islandId, item]))
const bmotContactDocument = {
  _id: bmotContactId,
  _type: 'researchSource',
  title: 'Bahamas Ministry of Tourism public contact route — 2026',
  url: 'https://www.bahamas.com/contact',
  publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
  sourceClass: 'national_tourism',
  authorityLevel: 'primary',
  destinations: [...destinationBySlug.values()].map((destination) => ({_type: 'reference', _key: `destination-${destination.islandId}`, _ref: destination._id})),
  topics: ['overview', 'access', 'culture'],
  checkedAt,
  nextReviewAt: nextOperationalReviewAt,
  status: 'active',
  notes: 'Current official Ministry contact page publishes the general Nassau routing telephone 1 (242) 302-2000 and tourism@bahamas.com. Use it only to route a site-responsibility evidence request when a dedicated accountable public office is not published. It is not an emergency route and does not itself confirm an attraction operator, opening condition, permission, accessibility, safety, or media rights.',
  reviewPlan: {
    _type: 'researchSourceReviewPlan',
    plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: 'scheduled',
    freshnessStatus: 'current',
    cadenceBand: '30_day',
    cadenceDays: 30,
    sourceRelationship: 'official_context_publisher',
    verificationMethod: 'webpage_and_responsible_contact',
    changeTriggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'public_contact_or_channel_change'],
    reviewScope: 'Recheck the official Ministry contact page and preserve the general-inquiry boundary. Do not label this route as the operator, custodian, emergency contact, or site access authority.',
    nextAction: `By ${nextOperationalReviewAt}, confirm the public Ministry telephone and email and whether a dedicated AMMC, Fort Fincastle, Queen's Staircase, Hartford Cave, or Rum Cay authority route has been published.`,
  },
}

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function mergeReferences(existing, sourceIds, prefix) {
  const references = [...(existing || [])]
  const present = new Set(references.map((item) => item._ref))
  for (const sourceId of sourceIds) {
    if (present.has(sourceId)) continue
    references.push(reference(sourceId, `${prefix}-${sourceId}`.slice(0, 96)))
    present.add(sourceId)
  }
  return references
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter((key) => !['_rev', '_createdAt', '_updatedAt'].includes(key)).sort().map((key) => [key, stableValue(value[key])]))
  return value
}

function differs(left, right) {
  return JSON.stringify(stableValue(left)) !== JSON.stringify(stableValue(right))
}

const existingContactCore = live.existingContact ? {...live.existingContact} : null
const contactNeedsUpsert = differs(existingContactCore, bmotContactDocument)

const sourcePlans = live.unavailableSources.map((source) => {
  const config = replacementConfig[source._id]
  const next = {
    ...source,
    notes: config.notes,
    replacementSources: config.sourceIds.map((id) => reference(id, `replacement-${id}`.slice(0, 96))),
    replacementBoundary: config.boundary,
    reviewPlan: {
      ...source.reviewPlan,
      workflowStatus: 'replacement_recorded',
      nextAction: config.nextAction,
    },
  }
  return {current: source, next, needsUpdate: differs(source, next)}
})

const freshnessAuditPlans = live.freshnessAudits.map((audit) => {
  const config = Object.values(replacementConfig).find((item) => item.destination === audit.destination?._ref || audit._id.endsWith(item.destination))
    || Object.values(replacementConfig).find((item) => audit._id.endsWith(item.destination))
  if (!config) throw new Error(`No replacement config for ${audit._id}`)
  const targetGap = (audit.gaps || []).find((gap) => gap.title === config.gapTitle)
  if (!targetGap) throw new Error(`Missing freshness gap in ${audit._id}: ${config.gapTitle}`)
  const nextGaps = audit.gaps.map((gap) => gap.title === config.gapTitle ? {
    ...gap,
    status: 'resolved',
    action: `A bounded replacement set is recorded on the unavailable source and points to current official records. Preserve the dead URL as provenance; keep the separate operator, access, safety, accessibility, coordinate, protection, and media-rights gaps open.`,
  } : gap)
  const nextSources = mergeReferences(audit.sources, [...config.sourceIds, bmotContactId], 'replacement-source')
  const addition = ' The unavailable heritage URL now has a formally recorded bounded replacement set; this resolves source replacement only and does not resolve site responsibility or traveler operation.'
  const nextMethodologyNotes = audit.methodologyNotes.includes('formally recorded bounded replacement set') ? audit.methodologyNotes : `${audit.methodologyNotes}${addition}`
  return {current: audit, nextGaps, nextSources, nextMethodologyNotes, needsUpdate: targetGap.status !== 'resolved' || differs(audit.sources, nextSources) || audit.methodologyNotes !== nextMethodologyNotes}
})

const replacementAuditPlans = live.replacementAudits.map((audit) => {
  const config = Object.values(replacementConfig).find((item) => audit._id.endsWith(item.destination))
  if (!config) throw new Error(`No replacement config for ${audit._id}`)
  const key = `gap-${config.destination}-source-replacement-formally-recorded`.replace(/[^a-z0-9-]+/g, '-').slice(0, 96)
  const resolvedGap = {
    _type: 'researchGap',
    _key: key,
    topic: 'culture',
    priority: 'p1',
    title: config.destination === 'rum-cay' ? 'Unavailable Rum Cay heritage source replacement formally recorded' : 'Unavailable AMMC source replacement formally recorded',
    action: 'Current official replacement records and their claim boundaries are linked on the unavailable source. Preserve the historical URL and continue the separate responsible-authority and traveler-operation work.',
    status: 'resolved',
  }
  const nextGaps = (audit.gaps || []).some((gap) => gap._key === key) ? audit.gaps : [...(audit.gaps || []), resolvedGap]
  const nextSources = mergeReferences(audit.sources, [...config.sourceIds, bmotContactId], 'replacement-source')
  const addition = ' The unavailable source now records a bounded replacement set; the responsible-authority and traveler-operation P0s remain active.'
  const nextMethodologyNotes = audit.methodologyNotes.includes('now records a bounded replacement set') ? audit.methodologyNotes : `${audit.methodologyNotes}${addition}`
  return {current: audit, nextGaps, nextSources, nextMethodologyNotes, needsUpdate: differs(audit.gaps, nextGaps) || differs(audit.sources, nextSources) || audit.methodologyNotes !== nextMethodologyNotes}
})

const allReplacementRefs = sourcePlans.flatMap((plan) => plan.next.replacementSources.map((item) => item._ref))
const liveReplacementIds = new Set([...live.replacementSources.map((item) => item._id), bmotContactId])
const allP0GapsStayOpen = replacementAuditPlans.every((plan) => plan.nextGaps.filter((gap) => gap.priority === 'p0').every((gap) => ['open', 'researching'].includes(gap.status)))

const plan = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  mode: apply ? 'apply' : 'dry_run',
  sourceSignals,
  counts: {
    contactNeedsUpsert: Number(contactNeedsUpsert),
    unavailableSourcesNeedingUpdate: sourcePlans.filter((item) => item.needsUpdate).length,
    freshnessAuditsNeedingUpdate: freshnessAuditPlans.filter((item) => item.needsUpdate).length,
    replacementAuditsNeedingUpdate: replacementAuditPlans.filter((item) => item.needsUpdate).length,
    replacementReferences: allReplacementRefs.length,
    openCustodianOperationP0: replacementAuditPlans.flatMap((item) => item.nextGaps).filter((gap) => gap.priority === 'p0' && [
      "Queen's Staircase current responsible operator and visitor operation",
      'Fort Fincastle responsible operator and live tour confirmation',
      'Hartford Cave responsible heritage authority and current visitor operation',
    ].includes(gap.title)).length,
  },
  guardrails: {
    allOfficialSignalsPresent: Object.values(sourceSignals).every((values) => values.every(Boolean)),
    twoHistoricalSourcesRemainUnavailable: sourcePlans.length === 2 && sourcePlans.every((item) => item.next.status === 'unavailable'),
    bothReplacementSetsComplete: allReplacementRefs.length === 10 && allReplacementRefs.every((id) => liveReplacementIds.has(id)),
    replacementWorkflowRecordedNotRequired: sourcePlans.every((item) => item.next.reviewPlan?.workflowStatus === 'replacement_recorded' && item.next.reviewPlan?.freshnessStatus === 'unavailable_or_rejected'),
    replacementBoundariesPresent: sourcePlans.every((item) => item.next.replacementBoundary?.length > 300),
    onlyExactFreshnessReplacementGapsResolved: freshnessAuditPlans.every((item) => item.nextGaps.filter((gap) => gap.status === 'resolved' && gap.priority === 'p0').every((gap) => gap.title.startsWith('Replace unavailable source:'))),
    allCustodianAndOperationP0RemainOpen: allP0GapsStayOpen,
    allAuditTargetsRemainDrafts: [...freshnessAuditPlans, ...replacementAuditPlans].every((item) => item.current._id.startsWith('drafts.')),
    generalContactNotMislabeledEmergencyOrOperator: /general/i.test(bmotContactDocument.notes) && /not an emergency route/i.test(bmotContactDocument.notes) && /does not itself confirm an attraction operator/i.test(bmotContactDocument.notes),
  },
  changes: {
    contactSource: contactNeedsUpsert ? bmotContactDocument : null,
    unavailableSourceIds: sourcePlans.filter((item) => item.needsUpdate).map((item) => item.next._id),
    freshnessAuditIds: freshnessAuditPlans.filter((item) => item.needsUpdate).map((item) => item.current._id),
    replacementAuditIds: replacementAuditPlans.filter((item) => item.needsUpdate).map((item) => item.current._id),
  },
  boundary: 'This alignment records bounded replacements for two unavailable heritage URLs and updates only internal source metadata plus research-audit drafts. It does not revive the dead URLs, approve a place, resolve a custodian or site-operation claim, publish content, contact an authority, add delivery channels, accept coordinates, clear media, or mutate Supabase.',
}

if (Object.values(plan.guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(plan.guardrails)}`)
fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)

if (apply && (contactNeedsUpsert || sourcePlans.some((item) => item.needsUpdate) || freshnessAuditPlans.some((item) => item.needsUpdate) || replacementAuditPlans.some((item) => item.needsUpdate))) {
  let transaction = client.transaction()
  if (contactNeedsUpsert) transaction = transaction.createOrReplace(bmotContactDocument)
  for (const item of sourcePlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.current._id, (patch) => patch.ifRevisionId(item.current._rev).set({
      notes: item.next.notes,
      replacementSources: item.next.replacementSources,
      replacementBoundary: item.next.replacementBoundary,
      reviewPlan: item.next.reviewPlan,
    }))
  }
  for (const item of freshnessAuditPlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.current._id, (patch) => patch.ifRevisionId(item.current._rev).set({
      gaps: item.nextGaps,
      sources: item.nextSources,
      methodologyNotes: item.nextMethodologyNotes,
    }))
  }
  for (const item of replacementAuditPlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.current._id, (patch) => patch.ifRevisionId(item.current._rev).set({
      gaps: item.nextGaps,
      sources: item.nextSources,
      methodologyNotes: item.nextMethodologyNotes,
    }))
  }
  const result = await transaction.commit({visibility: 'sync'})
  plan.commit = {transactionId: result.transactionId, documentIds: result.results?.map((item) => item.id) || []}
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
}

console.log(JSON.stringify(plan, null, 2))
