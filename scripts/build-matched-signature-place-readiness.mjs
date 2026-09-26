#!/usr/bin/env node

/**
 * Build the review-only Sanity tranche for all 27 official signature places
 * already matched to Supabase. Import is a separate explicit command.
 */

import fs from 'node:fs'

const readinessPath = process.argv[2] || '/private/tmp/baha-buddy-matched-signature-place-traveler-readiness.json'
const signatureSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-research-sanity-seed.ndjson'
const locationSeedPath = process.argv[4] || '/private/tmp/baha-buddy-signature-place-location-research-sanity-seed.ndjson'
const baselineSeedPath = process.argv[5] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const outputBase = process.argv[6] || '/private/tmp/baha-buddy-matched-signature-place-traveler-readiness-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'

for (const inputPath of [readinessPath, signatureSeedPath, locationSeedPath, baselineSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function destinationId(slug) {
  if (slug === 'nassau-paradise-island') return 'dest-nassau'
  if (slug === 'the-exumas') return 'dest-exuma'
  if (slug === 'eleuthera-harbour-island') return 'dest-eleuthera'
  return `dest-${slug}`
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function mergeReferences(existing, sourceIds, prefix) {
  const refs = [...(existing || [])]
  const present = new Set(refs.map((item) => item._ref))
  for (const sourceId of sourceIds || []) {
    if (!present.has(sourceId)) {
      refs.push(reference(sourceId, `${prefix}-${keyPart(sourceId)}`.slice(0, 96)))
      present.add(sourceId)
    }
  }
  return refs
}

function gap(slug, topic, priority, title, action, status) {
  return {
    _type: 'researchGap',
    _key: `gap-${keyPart(slug)}-${keyPart(topic)}-${keyPart(title)}`.slice(0, 96),
    topic,
    priority,
    title,
    action: action.slice(0, 600),
    status,
  }
}

const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'))
if (readiness.rows?.length !== 27) throw new Error(`Expected 27 readiness rows, found ${readiness.rows?.length || 0}`)

const signatureDocs = readNdjson(signatureSeedPath)
const locationDocs = readNdjson(locationSeedPath)
const baselineDocs = readNdjson(baselineSeedPath)
const mergedPlaceById = new Map(signatureDocs.filter((doc) => doc._type === 'placeEditorial').map((doc) => [doc._id, doc]))
for (const doc of locationDocs.filter((item) => item._type === 'placeEditorial')) mergedPlaceById.set(doc._id, doc)

const catalogAuditBySlug = new Map(
  signatureDocs
    .filter((doc) => doc._type === 'islandResearchAudit' && doc._id.includes('-signature-place-catalog-'))
    .map((doc) => [doc._id.split('-signature-place-catalog-')[1], doc]),
)
const existingSourceById = new Map(
  [...baselineDocs, ...signatureDocs, ...locationDocs]
    .filter((doc) => doc._type === 'researchSource')
    .map((doc) => [doc._id, doc]),
)

const sourceDocs = [
  {
    _id: 'research-source-bmot-man-o-war-cay', _type: 'researchSource',
    title: 'Man-O-War Cay — community and ferry context',
    url: 'https://www.bahamas.com/natural-wonders/man-o-war-cay',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-abacos', 'destination-abacos')], topics: ['overview', 'access', 'culture'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying the Man-O-War Cay community and ferry access from Marsh Harbour. It does not identify the responsible ferry, docks, schedule, fare, disruption plan, local mobility, accessibility, or emergency arrangements. The community-wide identity must not be reduced to the related beach pin.',
  },
  {
    _id: 'research-source-bmot-tahiti-beach', _type: 'researchSource',
    title: 'Tahiti Beach — approach and tide context',
    url: 'https://www.bahamas.com/natural-wonders/tahiti-beach',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-abacos', 'destination-abacos')], topics: ['nature', 'access', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page placing Tahiti Beach at the southern tip of Elbow Cay and saying it is accessible only on foot, by bicycle, or by boat, with low-tide sandbar context. It does not establish a public entrance, landing, route condition, tides, swimming safety, accessibility, or emergency readiness.',
  },
  {
    _id: 'research-source-bmot-andros-barrier-reef', _type: 'researchSource',
    title: 'Andros Barrier Reef — identity and activity context',
    url: 'https://www.bahamas.com/natural-wonders/andros-barrier-reef',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-andros', 'destination-andros')], topics: ['nature', 'experiences', 'access', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official identity page describing the reef west of Andros and promoting diving and snorkeling. It does not identify a responsible site manager, licensed operator, exact site, conditions, certification, supervision, equipment, emergency capability, or accessibility. The page contact label appears internally inconsistent and is not treated as a responsible reef operator.',
  },
  {
    _id: 'research-source-bmot-bimini-road', _type: 'researchSource',
    title: 'Bimini Road — boat-only dive-site context',
    url: 'https://www.bahamas.com/natural-wonders/bimini-road',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')], topics: ['nature', 'experiences', 'access', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying Bimini Road west of North Bimini and saying the dive site is accessible only by boat. It does not establish a responsible vessel or dive operator, exact site or mooring, conditions, certification, equipment, emergency readiness, accessibility, or a canonical point.',
  },
  {
    _id: 'research-source-bmot-pink-sands-beach', _type: 'researchSource',
    title: 'Pink Sands Beach — Harbour Island identity context',
    url: 'https://www.bahamas.com/islands/eleuthera-harbour-island/pink-sands-beach',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-eleuthera', 'destination-eleuthera-harbour-island')], topics: ['nature', 'access', 'safety'],
    checkedAt, nextReviewAt: nextQuarterlyReviewAt, status: 'active',
    notes: 'Current official destination page identifying Pink Sands Beach on Harbour Island. It does not define the beach segment or public entrance, swimming conditions, facilities, emergency response, responsible site operator, accessibility, or a point-level location.',
  },
  {
    _id: 'research-source-bmot-gold-rock-beach', _type: 'researchSource',
    title: 'Gold Rock Beach — Lucayan National Park context',
    url: 'https://www.bahamas.com/natural-wonders/gold-rock-beach/1000',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-grand-bahama', 'destination-grand-bahama')], topics: ['nature', 'access', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying Gold Rock Beach inside Lucayan National Park, about 25 miles from Freeport, with low-tide shoreline context and limited amenities. Use the Bahamas National Trust as managing authority for current operation, rules, hours, and access; neither source establishes live swimming conditions or feature-level accessibility.',
  },
  {
    _id: 'research-source-operator-compass-cay-marina', _type: 'researchSource',
    title: 'Compass Cay Marina — current marina and landing context',
    url: 'https://compasscaymarina.com/marina/',
    publisher: 'Compass Cay Marina', sourceClass: 'operator', authorityLevel: 'primary',
    destinations: [reference('dest-exuma', 'destination-the-exumas')], topics: ['access', 'experiences', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current responsible-operator page publishing marina contact and vessel, day-boat, and per-person landing-fee context while promoting interaction with resident nurse sharks. Prices and terms are live operational information. The page does not establish safe wildlife interaction, transport from another island, accessibility, emergency readiness, or support the Supabase Rum Cay assignment.',
  },
  {
    _id: 'research-source-bmot-big-major-cay-pig-beach', _type: 'researchSource',
    title: 'Big Major Cay / Pig Beach — access and animal-interaction context',
    url: 'https://www.bahamas.com/experiences/official-home-swimming-pigs',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-exuma', 'destination-the-exumas')], topics: ['nature', 'experiences', 'access', 'safety'],
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying Big Major Cay as Pig Beach, saying it is accessible only by boat, and describing community-developed animal-interaction and feeding measures. It does not select a licensed vessel, guarantee safe interaction, publish feature-level accessibility, or make the Pig Beach pin a whole-cay coordinate.',
  },
]

const conflictingSourceIds = sourceDocs.filter((source) => {
  const existing = existingSourceById.get(source._id)
  return existing && existing.url !== source.url
}).map((source) => source._id)
if (conflictingSourceIds.length) throw new Error(`Source IDs collide with different existing URLs: ${conflictingSourceIds.join(', ')}`)

const allSourceIds = new Set([...existingSourceById.keys(), ...sourceDocs.map((source) => source._id)])
for (const row of readiness.rows) {
  const missing = row.sourceIds.filter((sourceId) => !allSourceIds.has(sourceId))
  if (missing.length) throw new Error(`Missing source IDs for ${row.placeDraftId}: ${missing.join(', ')}`)
}

const placeDocs = readiness.rows.map((row) => {
  const base = mergedPlaceById.get(row.placeDraftId)
  if (!base) throw new Error(`Missing place draft: ${row.placeDraftId}`)
  return {
    ...base,
    active: false,
    channels: [],
    evidenceSources: mergeReferences(base.evidenceSources, row.sourceIds, 'readiness-evidence'),
    catalogTravelerReadinessReview: {
      _type: 'placeTravelerReadinessReview',
      checkedAt: row.checkedAt,
      nextReviewAt: row.nextReviewAt,
      overallStatus: row.overallStatus,
      responsibleSourceStatus: row.responsibleSourceStatus,
      operationStatus: row.operationStatus,
      accessStatus: row.accessStatus,
      safetyStatus: row.safetyStatus,
      accessibilityStatus: row.accessibilityStatus,
      copyStatus: row.copyStatus,
      mediaStatus: row.mediaStatus,
      deliveryDecision: row.deliveryDecision,
      sources: row.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
      notes: `${row.evidence} ${row.unresolved}`,
    },
    source: {
      ...base.source,
      notes: `${base.source?.notes || ''} Matched-place traveler-readiness review added ${checkedAt}; the Supabase match does not approve operation, access, safety, accessibility, copy, media, coordinates, or delivery.`.trim().slice(0, 500),
    },
    reviewedAt: checkedAt,
  }
})

function topicFor(row) {
  if (row.accessibilityStatus === 'partial') return 'accessibility'
  if (row.operationStatus === 'current_responsible_closure' || row.safetyStatus === 'specific_hazard_context') return 'safety'
  if (row.accessStatus !== 'unresolved' && row.accessStatus !== 'source_conflict') return 'access'
  return row.officialTitle.includes('Beach') || row.officialTitle.includes('Blue Hole') || row.officialTitle.includes('Reef') || row.officialTitle.includes('Park') ? 'nature' : 'overview'
}

const factDocs = readiness.rows.map((row) => ({
  _id: `drafts.island-fact-matched-signature-readiness-${keyPart(row.officialTitle)}-${row.islandSlug}`,
  _type: 'islandFact',
  title: `${row.officialTitle}: matched-place readiness boundary`.slice(0, 140),
  destination: reference(destinationId(row.islandSlug), `destination-${row.islandSlug}`),
  topic: topicFor(row),
  claim: row.evidence,
  travelerGuidance: row.unresolved,
  sources: row.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
  checkedAt,
  nextReviewAt: nextOperationalReviewAt,
  volatility: 'operational',
  confidence: ['current_managing_authority', 'current_responsible_operator'].includes(row.responsibleSourceStatus) ? 'high' : 'medium',
  verificationStatus: 'source_verified',
  editorNotes: 'This is a draft evidence boundary, not approved traveler copy. The matched Supabase record remains inactive in Sanity, coordinates are not accepted, and delivery channels are intentionally empty.',
  channels: [],
}))

const rowsByIsland = new Map()
for (const row of readiness.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const base = catalogAuditBySlug.get(slug)
  if (!base) throw new Error(`Missing signature catalog audit for ${slug}`)
  const sourceIds = unique(rows.flatMap((row) => row.sourceIds))
  const gaps = rows.flatMap((row) => [
    gap(slug, 'places', 'p1', `Matched signature-place source profile completed: ${row.officialTitle}`, row.evidence, 'resolved'),
    gap(slug, 'places', 'p0', `Matched signature-place traveler delivery remains blocked: ${row.officialTitle}`, row.unresolved, 'researching'),
  ])
  return {
    _id: `drafts.island-research-audit-${checkedAt}-signature-place-matched-readiness-${slug}`,
    _type: 'islandResearchAudit',
    title: `${rows[0].islandSlug === 'grand-bahama' ? 'Freeport — Grand Bahama Island' : base.title.split(' official')[0]} matched signature-place readiness — ${checkedAt}`.slice(0, 160),
    destination: reference(destinationId(slug), `destination-${slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: `All ${rows.length} official signature ${rows.length === 1 ? 'identity already matched' : 'identities already matched'} to Supabase for this island were evaluated independently across responsible-source ownership, current operation or closure, access, safety, accessibility, copy, media rights, location confidence, and delivery. A database match, map pin, official listing, operating page, hours, or access fact cannot approve another gate by implication. Blue Holes closure, wilderness and marine constraints, community and area models, a wrong-island assignment, name differences, point conflicts, related-site-only pins, and accessibility limits are preserved. Every overlay remains a draft with active=false and no channels; no Supabase row, coordinate decision, media right, or traveler publication was changed.`,
  }
})

if (placeDocs.length !== 27) throw new Error(`Expected 27 place drafts, found ${placeDocs.length}`)
if (auditDocs.length !== 15) throw new Error(`Expected 15 island audits, found ${auditDocs.length}`)
if (placeDocs.some((doc) => !doc._id.startsWith('drafts.') || doc.active !== false || (doc.channels || []).length)) throw new Error('Place drafts must remain draft-only, inactive, and channel-free')
if (placeDocs.some((doc) => doc.catalogLocationReview?.reviewDecision === 'accepted')) throw new Error('Build must not accept a coordinate candidate')
if (placeDocs.some((doc) => doc.catalogTravelerReadinessReview.deliveryDecision !== 'blocked')) throw new Error('Every delivery decision must remain blocked')
if (placeDocs.some((doc) => doc.catalogTravelerReadinessReview.accessibilityStatus === 'published')) throw new Error('Build must not publish accessibility')
if (placeDocs.some((doc) => doc.catalogTravelerReadinessReview.mediaStatus === 'rights_cleared')) throw new Error('Build must not clear media rights')
if (factDocs.some((doc) => !doc._id.startsWith('drafts.') || (doc.channels || []).length)) throw new Error('Facts must remain draft-only and channel-free')
if (auditDocs.some((doc) => !doc._id.startsWith('drafts.'))) throw new Error('Audits must remain drafts')

const documents = [...sourceDocs, ...factDocs, ...auditDocs, ...placeDocs]
const ids = new Set()
for (const document of documents) {
  if (ids.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  ids.add(document._id)
}

const seedPath = `${outputBase}-sanity-seed.ndjson`
const manifestPath = `${outputBase}-manifest.json`
fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, places: placeDocs.length, total: documents.length},
  sourceProvenance: {conflictingExistingSourceIds: conflictingSourceIds},
  guardrails: {
    allPlacesAreDraftsInactiveAndChannelFree: placeDocs.every((doc) => doc._id.startsWith('drafts.') && doc.active === false && doc.channels.length === 0),
    everyTravelerDeliveryDecisionIsBlocked: placeDocs.every((doc) => doc.catalogTravelerReadinessReview.deliveryDecision === 'blocked'),
    noAcceptedCoordinateDecisions: placeDocs.every((doc) => doc.catalogLocationReview?.reviewDecision !== 'accepted'),
    noAccessibilityClaimedPublished: placeDocs.every((doc) => doc.catalogTravelerReadinessReview.accessibilityStatus !== 'published'),
    noMediaRightsClaimedCleared: placeDocs.every((doc) => doc.catalogTravelerReadinessReview.mediaStatus !== 'rights_cleared'),
    allFactsAreDraftsAndChannelFree: factDocs.every((doc) => doc._id.startsWith('drafts.') && doc.channels.length === 0),
    allAuditsAreDrafts: auditDocs.every((doc) => doc._id.startsWith('drafts.')),
  },
}, null, 2)}\n`)

console.log(JSON.stringify({
  output: seedPath,
  manifest: manifestPath,
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, places: placeDocs.length, total: documents.length},
  sourceProvenance: {conflicts: conflictingSourceIds},
}, null, 2))
