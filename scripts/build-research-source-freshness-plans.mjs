#!/usr/bin/env node

/**
 * Add review ownership and cadence plans to the complete Sanity source
 * registry and build one draft source-freshness audit per canonical island.
 * Import is a separate explicit command.
 */

import fs from 'node:fs'

const profilePath = process.argv[2] || '/private/tmp/baha-buddy-research-source-freshness-profile.json'
const baselineSeedPath = process.argv[3] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const outputBase = process.argv[4] || '/private/tmp/baha-buddy-research-source-freshness-plans'
const plannedAt = '2026-08-05'

for (const inputPath of [profilePath, baselineSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function gap(slug, topic, priority, title, action, status) {
  return {
    _type: 'researchGap',
    _key: `gap-${keyPart(slug)}-${keyPart(topic)}-${keyPart(title)}`.slice(0, 96),
    topic,
    priority,
    title: title.slice(0, 180),
    action: action.slice(0, 600),
    status,
  }
}

function verificationMethod(source) {
  const value = `${source._id} ${source.url}`.toLowerCase()
  if (value.includes('.pdf')) return 'document_review'
  if (value.includes('arcgis') || value.includes('dataset') || value.includes('map') || value.includes('feature')) return 'dataset_review'
  if (['operator', 'transport_operator'].includes(source.sourceClass) && source.freshnessStatus !== 'current') return 'webpage_and_responsible_contact'
  return 'webpage_review'
}

function workflowStatus(source) {
  if (source.replacementRecorded) return 'replacement_recorded'
  if (source.freshnessStatus === 'unavailable_or_rejected') return 'replacement_required'
  if (source.freshnessStatus === 'overdue') return 'overdue'
  if (['needs_recheck', 'due_today', 'review_date_missing'].includes(source.freshnessStatus)) return 'attention_required'
  return 'scheduled'
}

function changeTriggers(source) {
  const triggers = ['publisher_url_or_scope_change']
  if (['operator', 'transport_operator'].includes(source.sourceClass)) triggers.push('operation_schedule_or_contact_change')
  if ((source.topics || []).includes('access')) triggers.push('access_route_or_restriction_change')
  if ((source.topics || []).includes('safety')) triggers.push('safety_emergency_or_activation_change')
  if ((source.topics || []).includes('seasonality')) triggers.push('seasonal_policy_or_climate_guidance_change')
  if (source._id.includes('rights') || source._id.includes('photography') || source._id.includes('brand-center')) triggers.push('media_rights_or_terms_change')
  if (source.status !== 'active') triggers.push('source_restored_replaced_or_superseded')
  return unique(triggers)
}

function reviewScope(source) {
  const base = {
    responsible_or_owning_publisher: 'Recheck this publisher for claims within its own authority or operation. Confirm the exact facility, service, rule, closure, access condition, or asset policy; do not extend the source beyond that scope.',
    official_context_publisher: 'Recheck official identity and destination context. Do not treat national-tourism copy as proof of live operation, responsible access, feature-level accessibility, safety, schedules, prices, or media reuse rights.',
    corroborating_source: 'Use this source only to corroborate a claim already supported by a responsible or primary source. Record conflicts and prefer the accountable publisher for current operation.',
    discovery_lead_only: 'Use this source only as a research lead. Do not use it alone for traveler delivery, canonical coordinates, current operation, safety, accessibility, or rights clearance.',
    primary_source_scope_requires_review: 'Confirm the publisher and exact authority represented by this source before relying on it for a traveler-facing claim.',
  }[source.sourceRelationship]
  return `${base} Recheck the current URL, publication date or update signal, and whether a newer source supersedes it.`
}

function nextAction(source) {
  if (source.replacementRecorded) {
    return `By ${source.nextReviewAt}, retry the exact unavailable URL and recheck every recorded replacement source. Preserve the historical source status and its replacement boundary; reopen replacement work only if the replacement set changes, fails, or no longer covers the bounded claim.`
  }
  if (source.freshnessStatus === 'unavailable_or_rejected') {
    return `By ${source.nextReviewAt}, retry the exact URL and locate a current responsible replacement. Preserve the unavailable or rejected status and block dependent claims until the replacement's identity, scope, date, and authority are recorded.`
  }
  if (source.freshnessStatus === 'needs_recheck') {
    return `By ${source.nextReviewAt}, re-open the exact source and compare publisher, scope, dates, contacts, routes, restrictions, operational details, and superseding publications. Keep the needs-recheck flag until the documented conflict or age concern is resolved.`
  }
  return `By ${source.nextReviewAt}, re-open the exact source, compare its publisher, URL, scope, dates, and material claims, record any changes or superseding source, and keep claim-level approval separate from source freshness.`
}

function sourceDocument(source) {
  return {
    _id: source._id,
    _type: 'researchSource',
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceClass: source.sourceClass,
    authorityLevel: source.authorityLevel,
    destinations: (source.destinations || []).map((destination, index) => reference(destination._ref, destination._key || `destination-${index + 1}`)),
    topics: source.topics,
    checkedAt: source.checkedAt,
    nextReviewAt: source.nextReviewAt,
    status: source.status,
    notes: source.notes,
    replacementSources: source.replacementSources,
    replacementBoundary: source.replacementBoundary,
    reviewPlan: {
      _type: 'researchSourceReviewPlan',
      plannedAt,
      reviewOwner: 'Baha Buddy Content Operations',
      workflowStatus: workflowStatus(source),
      freshnessStatus: source.freshnessStatus,
      cadenceBand: source.cadenceBand,
      cadenceDays: source.cadenceDays,
      sourceRelationship: source.sourceRelationship,
      verificationMethod: verificationMethod(source),
      changeTriggers: changeTriggers(source),
      reviewScope: reviewScope(source),
      nextAction: nextAction(source),
    },
  }
}

function coreSource(document) {
  return {
    _id: document._id,
    _type: document._type,
    title: document.title,
    url: document.url,
    publisher: document.publisher,
    sourceClass: document.sourceClass,
    authorityLevel: document.authorityLevel,
    destinations: document.destinations,
    topics: document.topics,
    checkedAt: document.checkedAt,
    nextReviewAt: document.nextReviewAt,
    status: document.status,
    notes: document.notes,
    replacementSources: document.replacementSources,
    replacementBoundary: document.replacementBoundary,
  }
}

function topicFor(source) {
  for (const topic of ['safety', 'accessibility', 'access', 'seasonality', 'stays', 'food', 'experiences', 'nature', 'culture', 'overview']) {
    if ((source.topics || []).includes(topic)) return topic
  }
  return 'overview'
}

const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
const baselineDocs = readNdjson(baselineSeedPath)
if (profile.sources?.length !== 206 || profile.islands?.length !== 16) throw new Error(`Unexpected profile scope: ${JSON.stringify(profile.counts)}`)

const sourceDocs = profile.sources.map(sourceDocument)
const inputCoreById = new Map(profile.sources.map((source) => [source._id, JSON.stringify(coreSource(sourceDocument(source)))]))
const changedCoreIds = sourceDocs.filter((document) => inputCoreById.get(document._id) !== JSON.stringify(coreSource(document))).map((document) => document._id)
if (changedCoreIds.length) throw new Error(`Core source metadata changed while adding plans: ${changedCoreIds.join(', ')}`)

const baseAuditByDestination = new Map()
for (const document of baselineDocs.filter((item) => item._type === 'islandResearchAudit' && item.destination?._ref && item.coverage?.length === 10)) {
  if (!baseAuditByDestination.has(document.destination._ref)) baseAuditByDestination.set(document.destination._ref, document)
}

const sourceById = new Map(sourceDocs.map((document) => [document._id, document]))
const auditDocs = profile.islands.map((island) => {
  const profiledSources = island.sourceIdsRequiringAttention.map((item) => profile.sources.find((source) => source._id === item._id))
  if (profiledSources.some((source) => !source)) throw new Error(`Missing attention source for ${island.slug}`)
  const allIslandSources = profile.sources.filter((source) => source.destinationSlugs.includes(island.slug))
  const destinationId = allIslandSources[0]?.destinations.find((destination) => destination.slug === island.slug)?._ref
  const base = baseAuditByDestination.get(destinationId)
  if (!destinationId || !base) throw new Error(`Missing destination or base audit for ${island.slug}`)
  const gaps = [
    gap(
      island.slug,
      'overview',
      'p1',
      `Source ownership and cadence profiled: ${island.sourceCount} records`,
      `${island.responsibleOrOwningPublisher} responsible or owning publishers, ${island.officialContextPublisher} official-context publishers, and ${island.corroboratingOrDiscovery} corroborating or discovery sources are now assigned an internal owner and dated cadence.`,
      'resolved',
    ),
    ...profiledSources.map((source) => gap(
      island.slug,
      topicFor(source),
      source.freshnessStatus === 'unavailable_or_rejected' ? 'p0' : 'p1',
      source.freshnessStatus === 'unavailable_or_rejected' ? `Replace unavailable source: ${source.title}` : `Recheck flagged source: ${source.title}`,
      nextAction(source),
      'researching',
    )),
  ]
  return {
    _id: `drafts.island-research-audit-${plannedAt}-source-freshness-owner-cadence-${island.slug}`,
    _type: 'islandResearchAudit',
    title: `${island.name} source freshness and ownership — ${plannedAt}`.slice(0, 160),
    destination: reference(destinationId, `destination-${island.slug}`),
    auditedAt: plannedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: allIslandSources.map((source, index) => reference(source._id, `source-${index + 1}`)),
    methodologyNotes: `This audit profiles ${island.sourceCount} routed sources for ${island.name} without changing their URL, publisher, authority, status, checked date, or next-review date. It records one internal owner, preserves each existing cadence (${island.current} current, ${island.dueOrOverdue} flagged for recheck, ${island.unavailableOrRejected} unavailable or rejected), and distinguishes responsible or owning publishers from official context, corroboration, and discovery leads. Freshness does not approve a claim: operation, schedules, access, safety, accessibility, coordinates, and media rights still require scope-specific evidence and editorial review. Three national sources still lack destination routing and two registry sources are not referenced; those remain global queue items rather than being assigned to an island without evidence.`,
  }
})

if (sourceDocs.length !== 206 || auditDocs.length !== 16) throw new Error(`Unexpected build counts: ${sourceDocs.length} sources, ${auditDocs.length} audits`)
if (sourceDocs.some((document) => document._id.startsWith('drafts.'))) throw new Error('Source registry plans must update canonical source documents, not create drafts')
if (sourceDocs.some((document) => !document.reviewPlan || document.reviewPlan.reviewOwner !== 'Baha Buddy Content Operations')) throw new Error('Every source needs one internal review owner')
if (sourceDocs.some((document) => document.checkedAt !== profile.sources.find((source) => source._id === document._id).checkedAt || document.nextReviewAt !== profile.sources.find((source) => source._id === document._id).nextReviewAt || document.status !== profile.sources.find((source) => source._id === document._id).status)) throw new Error('Build must preserve source status and dates')
if (auditDocs.some((document) => !document._id.startsWith('drafts.'))) throw new Error('Source-freshness audits must remain drafts')
if (sourceDocs.some((document) => !sourceById.has(document._id))) throw new Error('Unexpected source document')

const documents = [...sourceDocs, ...auditDocs]
const ids = new Set()
for (const document of documents) {
  if (ids.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  ids.add(document._id)
}

const seedPath = `${outputBase}-sanity-seed.ndjson`
const manifestPath = `${outputBase}-manifest.json`
const counts = {
  sources: sourceDocs.length,
  audits: auditDocs.length,
  total: documents.length,
  scheduled: sourceDocs.filter((document) => document.reviewPlan.workflowStatus === 'scheduled').length,
  attentionRequired: sourceDocs.filter((document) => document.reviewPlan.workflowStatus === 'attention_required').length,
  replacementRequired: sourceDocs.filter((document) => document.reviewPlan.workflowStatus === 'replacement_required').length,
  replacementRecorded: sourceDocs.filter((document) => document.reviewPlan.workflowStatus === 'replacement_recorded').length,
  overdue: sourceDocs.filter((document) => document.reviewPlan.workflowStatus === 'overdue').length,
  sourcesWithoutDestinationRouting: profile.counts.sourcesWithNoDestination,
  sourcesWithoutReferences: profile.counts.sourcesWithNoReferences,
}
const guardrails = {
  everySourceHasOwnerAndCadence: sourceDocs.every((document) => document.reviewPlan.reviewOwner && document.reviewPlan.cadenceDays > 0),
  coreSourceMetadataPreserved: changedCoreIds.length === 0,
  sourceStatusesAndDatesPreserved: sourceDocs.every((document) => {
    const source = profile.sources.find((item) => item._id === document._id)
    return document.checkedAt === source.checkedAt && document.nextReviewAt === source.nextReviewAt && document.status === source.status
  }),
  needsRecheckAndUnavailableStatesPreserved: counts.attentionRequired === 20 && counts.replacementRequired === 1 && counts.replacementRecorded === 2,
  globalRoutingGapsPreserved: counts.sourcesWithoutDestinationRouting === 3 && counts.sourcesWithoutReferences === 2,
  allAuditsAreDrafts: auditDocs.every((document) => document._id.startsWith('drafts.')),
}

fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({generatedAt: new Date().toISOString(), counts, guardrails}, null, 2)}\n`)
console.log(JSON.stringify({output: seedPath, manifest: manifestPath, counts, guardrails}, null, 2))
