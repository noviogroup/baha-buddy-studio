#!/usr/bin/env node

/**
 * Build a review-only primary-source adjudication tranche for eight high-risk
 * missing signature-place candidates. Local artifacts only; import is separate.
 */

import fs from 'node:fs'

const adjudicationPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-source-adjudication.json'
const absentSeedPath = process.argv[3] || '/private/tmp/baha-buddy-absent-signature-place-research-sanity-seed.ndjson'
const baselineSeedPath = process.argv[4] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const outputBase = process.argv[5] || '/private/tmp/baha-buddy-signature-place-source-adjudication-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'
const mapSourceId = 'research-source-bmot-public-map-dataset'

for (const inputPath of [adjudicationPath, absentSeedPath, baselineSeedPath]) {
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

function rowKey(row) {
  return `${row.islandSlug}::${row.officialName}`
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function mergeReferences(existing, sourceIds, prefix) {
  const refs = [...(existing || [])]
  const present = new Set(refs.map((item) => item._ref))
  for (const sourceId of sourceIds) {
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
    action,
    status,
  }
}

const adjudication = JSON.parse(fs.readFileSync(adjudicationPath, 'utf8'))
if (adjudication.rows?.length !== 8) throw new Error(`Expected 8 adjudication rows, found ${adjudication.rows?.length || 0}`)
const absentDocs = readNdjson(absentSeedPath)
const baselineDocs = readNdjson(baselineSeedPath)
const baselineSourceById = new Map(baselineDocs.filter((doc) => doc._type === 'researchSource').map((doc) => [doc._id, doc]))
const absentSourceById = new Map(absentDocs.filter((doc) => doc._type === 'researchSource').map((doc) => [doc._id, doc]))
const candidateById = new Map(absentDocs.filter((doc) => doc._type === 'canonicalPlaceCandidate').map((doc) => [doc._id, doc]))
const candidateAuditBySlug = new Map(
  absentDocs
    .filter((doc) => doc._type === 'islandResearchAudit')
    .map((doc) => [doc._id.split('-signature-place-canonical-candidates-')[1], doc]),
)

const baselineQueenSource = baselineSourceById.get('research-source-bmot-queens-staircase')
const naturalQueenSource = absentSourceById.get('research-source-bmot-queens-staircase-natural-wonder')
if (!baselineQueenSource || !naturalQueenSource) throw new Error('Missing Queen’s Staircase source records required for provenance-safe restoration')

const sourceDocs = [
  {
    ...baselineQueenSource,
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    topics: ['culture', 'experiences', 'access'],
    notes: 'Official attraction page rechecked after a source-ID collision was detected. It provides the Elizabeth Avenue South address, visitor contact, construction history, and route relationship to Fort Fincastle. The original canonical URL is restored; current access and point selection remain unresolved.',
  },
  naturalQueenSource,
  {
    _id: 'research-source-bmot-fountain-of-youth-bimini',
    _type: 'researchSource',
    title: 'The Fountain of Youth — Bimini',
    url: 'https://www.bahamas.com/natural-wonders/fountain-of-youth',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')],
    topics: ['nature', 'culture', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page saying the locally named limestone well is near the road leading to the airport. That relative context ranks one official map point more strongly but is not an exact coordinate, access route, water-safety claim, or operation guarantee.',
  },
  {
    _id: 'research-source-bmot-fort-fincastle',
    _type: 'researchSource',
    title: 'Fort Fincastle',
    url: 'https://www.bahamas.com/natural-wonders/fort-fincastle',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page placing the fort atop Bennet’s Hill and listing daily guided tours from 8:00 a.m. to 4:00 p.m. with donations appreciated. This operational text requires frequent recheck and does not resolve the two conflicting map points, accessibility, closures, or entrance.',
  },
  {
    _id: 'research-source-operator-dolphin-house-museum',
    _type: 'researchSource',
    title: 'Dolphin House Museum — owner and institution site',
    url: 'https://www.historyofbimini.com/',
    publisher: 'Dolphin House Museum / Sir Ashley B. Saunders',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')],
    topics: ['culture', 'experiences'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current owner/operator site identifying Sir Ashley Saunders as founder and CEO of Dolphin House Museum and documenting the museum through owner-narrated media. It does not publish an exact point, address, current hours, admission, reservations, or accessibility.',
  },
  {
    _id: 'research-source-operator-dolphin-house-contact',
    _type: 'researchSource',
    title: 'Dolphin House Museum — responsible contact page',
    url: 'https://www.historyofbimini.com/contact',
    publisher: 'Dolphin House Museum / Sir Ashley B. Saunders',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')],
    topics: ['access', 'experiences'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current responsible contact page publishing a Bahamas telephone number and media contact. Contact availability is not evidence of walk-in operation, current tour hours, admission, entrance, address, or accessibility.',
  },
  {
    _id: 'research-source-bmot-acklins-lucayan-indian-sites',
    _type: 'researchSource',
    title: 'Lucayan Indian Sites — Acklins component evidence',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/lucayan-indian-sites',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-acklins-crooked-island', 'destination-acklins-crooked-island')],
    topics: ['culture', 'overview', 'access'],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    status: 'active',
    notes: 'Official page identifying a major Lucayan settlement at Pompey Bay Beach south of Spring Point and ten archaeological sites on Samana Cay. The page displays an inconsistent Freeport/Grand Bahama destination label and malformed address, so identity context is retained while destination metadata is explicitly rejected.',
  },
  {
    _id: 'research-source-bmot-st-peter-st-paul-catholic-church',
    _type: 'researchSource',
    title: 'St. Peter & St. Paul’s Catholic Church — Clarence Town',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/st-peters-st-pauls-catholic-church',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-long-island', 'destination-long-island')],
    topics: ['culture', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Official church identity page with Queens Highway, Clarence Town context and a phone/contact listing. Historical chronology in the page is internally inconsistent, and tower-climbing language is not current safety or access authorization. The map point represents only this Catholic component, not both Twin Churches.',
  },
]

const sourceIdsByPlace = new Map([
  ['bimini::Fountain of Youth', ['research-source-bmot-fountain-of-youth-bimini', mapSourceId]],
  ["nassau-paradise-island::Queen's Staircase", ['research-source-bmot-queens-staircase', 'research-source-bmot-queens-staircase-natural-wonder', mapSourceId]],
  ['nassau-paradise-island::Fort Fincastle', ['research-source-bmot-fort-fincastle', mapSourceId]],
  ['acklins-crooked-island::Ancient Lucayan Sites', ['research-source-bmot-acklins-lucayan-indian-sites', mapSourceId]],
  ['long-island::Twin Churches', ['research-source-bmot-long-island', 'research-source-bmot-st-peter-st-paul-catholic-church', mapSourceId]],
  ['bimini::Dolphin House Museum', ['research-source-bmot-bimini-dolphin-house-profile', 'research-source-operator-dolphin-house-museum', 'research-source-operator-dolphin-house-contact']],
  ["cat-island::Sir Sidney Poitier's Boyhood Home", ['research-source-bmot-cat-island']],
  ['ragged-island::Pigeon Cay', ['research-source-bmot-ragged-island']],
])

const adjudicationStatusByPlace = new Map([
  ['bimini::Fountain of Youth', 'contextual_point_preference_conflict_open'],
  ["nassau-paradise-island::Queen's Staircase", 'historic_complex_conflict_open'],
  ['nassau-paradise-island::Fort Fincastle', 'contextual_point_preference_conflict_open'],
  ['acklins-crooked-island::Ancient Lucayan Sites', 'component_evidence_partial'],
  ['long-island::Twin Churches', 'component_evidence_partial'],
  ['bimini::Dolphin House Museum', 'responsible_operator_no_point'],
  ["cat-island::Sir Sidney Poitier's Boyhood Home", 'relative_identity_no_point'],
  ['ragged-island::Pigeon Cay', 'relative_identity_no_point'],
])

function componentCandidate(record, relationship, confidence, notes) {
  return {
    _type: 'placeLocationCandidate',
    _key: `candidate-map-${record.mapRecordId}`,
    label: `${record.name} — official tourism ${record.mapRecordType === 'tourism_business' ? 'business record' : 'map pin'}`,
    relationship,
    location: {_type: 'geopoint', lat: record.latitude, lng: record.longitude},
    source: reference(mapSourceId, `source-map-${record.mapRecordId}`),
    sourceRecordType: record.mapRecordType,
    sourceRecordId: String(record.mapRecordId),
    sourceName: record.name,
    sourceUpdatedAt: record.sourceUpdatedAt || undefined,
    sourceUrl: record.sourceUrl,
    confidence,
    notes,
  }
}

function updateCandidates(row, candidates) {
  const records = new Map((row.candidates || []).map((record) => [String(record.mapRecordId), record]))
  if (row.officialName === 'Ancient Lucayan Sites') {
    const record = row.candidates[0]
    return [componentCandidate(record, 'related_site', 'medium', 'Samana Cay is an official component-area marker only. It does not locate any of the ten archaeological sites and must not become a canonical point for the distributed identity.')]
  }
  if (row.officialName === 'Twin Churches') {
    const record = row.candidates[0]
    return [componentCandidate(record, 'related_site', 'medium', "This point locates St. Peter & St. Paul's Catholic Church only. St. Paul's Anglican Church remains unlocated in responsible source evidence, so the point cannot represent the plural Twin Churches identity.")]
  }
  return (candidates || []).map((candidate) => {
    const record = records.get(String(candidate.sourceRecordId))
    if (!record) return candidate
    let confidence = candidate.confidence
    let note = row.inference
    if (row.officialName === 'Fountain of Youth') {
      confidence = String(record.mapRecordId) === '4401' ? 'medium' : 'low'
      note = String(record.mapRecordId) === '4401'
        ? `The official page says the well is near the airport road, and this point is ${record.distanceToOfficialAirportMetres} metres from the official South Bimini Airport pin. It is contextually preferred for review but not accepted.`
        : `This undated point is ${record.distanceToOfficialAirportMetres} metres from the official South Bimini Airport pin and conflicts with the source's near-airport context. Retain as low-confidence conflict evidence.`
    } else if (row.officialName === 'Fort Fincastle') {
      confidence = String(record.mapRecordId) === '11378' ? 'medium' : 'low'
      note = String(record.mapRecordId) === '11378'
        ? `This map pin is ${record.distanceToQueenMapPinMetres} metres from the Queen's Staircase map pin, consistent with the official historic-complex relationship. It is preferred for further review but not accepted.`
        : `This business point is ${record.distanceToQueenMapPinMetres} metres from the Queen's Staircase map pin and is a strong spatial outlier despite its newer source-reported update. Retain as low-confidence conflict evidence.`
    } else if (row.officialName === "Queen's Staircase") {
      confidence = 'low'
      note = `This point is ${record.distanceToFortMapPinMetres} metres from the Fort Fincastle map pin. The staircase is a linear feature within the historic complex, so proximity does not identify a canonical entrance or feature point.`
    }
    return {...candidate, confidence, notes: note}
  })
}

const candidateDocs = adjudication.rows.map((row) => {
  const id = `drafts.canonical-place-candidate-${row.islandSlug}-${keyPart(row.officialName)}`
  const base = candidateById.get(id)
  if (!base) throw new Error(`Missing candidate base: ${id}`)
  const sourceIds = sourceIdsByPlace.get(rowKey(row))
  if (!sourceIds) throw new Error(`Missing source mapping for ${rowKey(row)}`)
  const locationReview = {
    ...base.locationReview,
    checkedAt,
    candidates: updateCandidates(row, base.locationReview?.candidates),
    evidenceSources: mergeReferences(base.locationReview?.evidenceSources, sourceIds, 'adjudication-location-source'),
    operationEvidenceStatus: row.officialName === 'Dolphin House Museum'
      ? 'current_responsible_operator'
      : ['Fort Fincastle', "Queen's Staircase", 'Twin Churches'].includes(row.officialName)
        ? 'current_official_listing_only'
        : base.locationReview.operationEvidenceStatus,
    accessEvidenceStatus: ['Fountain of Youth', 'Fort Fincastle', "Queen's Staircase", 'Twin Churches', 'Dolphin House Museum'].includes(row.officialName)
      ? 'partial_official_context'
      : base.locationReview.accessEvidenceStatus,
    notes: `${row.inference} ${base.locationReview.notes}`.slice(0, 2200),
  }
  return {
    ...base,
    identityEvidence: mergeReferences(base.identityEvidence, sourceIds.filter((sourceId) => sourceId !== mapSourceId), 'adjudication-identity-source'),
    locationReview,
    sourceAdjudicationStatus: adjudicationStatusByPlace.get(rowKey(row)),
    sourceAdjudicationNotes: `${row.sourceContext.assertion} ${row.inference} The inference ranks evidence only; no coordinate or canonical creation decision was accepted.`,
    adjudicatedAt: checkedAt,
    reviewedAt: checkedAt,
    reviewNotes: `${base.reviewNotes} Primary-source adjudication added ${checkedAt}; the candidate remains researching and requires the unresolved checks recorded above.`.slice(0, 2200),
  }
})

const factSpecs = [
  {
    slug: 'bimini', key: 'fountain-of-youth-near-airport-conflict', title: 'Fountain of Youth: near-airport evidence and point conflict', topic: 'access',
    claim: 'The national tourism authority says Bimini’s locally named Fountain of Youth well is near the road leading to the airport. Of two same-name official tourism points, the business-record point is about 551 metres from the official South Bimini Airport pin, while the undated map pin is about 4,564 metres away.',
    travelerGuidance: 'The nearer point is a preferred research candidate, not an approved coordinate. Confirm the exact well, road approach, land access, water condition, and traveler suitability with a responsible local source before using it.',
    sourceIds: ['research-source-bmot-fountain-of-youth-bimini', mapSourceId], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Distance comparison is an explicit inference from two official datasets; the source conflict remains open.',
  },
  {
    slug: 'nassau-paradise-island', key: 'queens-staircase-linear-complex-boundary', title: "Queen's Staircase: linear historic-complex boundary", topic: 'culture',
    claim: "The national tourism authority places Queen's Staircase on Elizabeth Avenue South and within the Fort Fincastle historic relationship. Its two same-name tourism points are about 290 metres apart and may represent different parts of the staircase or complex.",
    travelerGuidance: 'Do not select either point as a canonical entrance without responsible site-level confirmation. Recheck current access, hours, conditions, stairs, alternative accessible routes, and transport before a visit.',
    sourceIds: ['research-source-bmot-queens-staircase', 'research-source-bmot-queens-staircase-natural-wonder', mapSourceId], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The original address-bearing source ID was restored after a provenance collision; neither coordinate was accepted.',
  },
  {
    slug: 'nassau-paradise-island', key: 'fort-fincastle-map-pin-preference', title: 'Fort Fincastle: source conflict and map-pin preference', topic: 'access',
    claim: "The official Fort Fincastle page places the fort atop Bennet’s Hill and currently lists guided tours. Of two same-name official points, the map pin is about 102 metres from the Queen's Staircase map pin, while the business-record point is about 778 metres away from that staircase pin.",
    travelerGuidance: 'The Fort map pin is preferred for further review but remains unapproved. Recheck the responsible site entrance, tours, closures, fees or donations, accessibility, and conditions before traveler delivery.',
    sourceIds: ['research-source-bmot-fort-fincastle', 'research-source-bmot-queens-staircase', mapSourceId], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Spatial consistency ranks evidence; it does not prove the canonical fort coordinate or visitor entrance.',
  },
  {
    slug: 'acklins-crooked-island', key: 'ancient-lucayan-sites-distributed-components', title: 'Ancient Lucayan Sites: distributed component boundary', topic: 'culture',
    claim: 'The national tourism authority identifies a major Lucayan settlement at Pompey Bay Beach south of Spring Point and ten archaeological sites on Samana Cay. Its public map provides a Samana Cay area marker, not points for the archaeological sites.',
    travelerGuidance: 'Treat these as protected, distributed cultural sites rather than one attraction. Confirm heritage authority, exact site identity, permission, guide, conservation restrictions, access, and whether public location disclosure is appropriate.',
    sourceIds: ['research-source-bmot-acklins-lucayan-indian-sites', mapSourceId], volatility: 'stable', confidence: 'medium', nextReviewAt: nextQuarterlyReviewAt,
    editorNotes: 'The source page’s displayed Freeport/Grand Bahama label and malformed address are rejected as metadata anomalies.',
  },
  {
    slug: 'long-island', key: 'twin-churches-two-component-identity', title: 'Twin Churches: two-component identity boundary', topic: 'culture',
    claim: "The national tourism authority identifies the Clarence Town Twin Churches as St. Paul's Church and St. Peter & St. Paul's Church. The official map supplies a point only for St. Peter & St. Paul's Catholic Church.",
    travelerGuidance: "Do not use the Catholic church point for both churches. Confirm St. Paul's Anglican Church identity and point, current services or visitor arrangements, tower access, structural safety, accessibility, and photography expectations with responsible church sources.",
    sourceIds: ['research-source-bmot-long-island', 'research-source-bmot-st-peter-st-paul-catholic-church', mapSourceId], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The dedicated church page contains chronology inconsistencies; only the narrow component identity, location context, and contact lead are retained.',
  },
  {
    slug: 'bimini', key: 'dolphin-house-responsible-operator-no-point', title: 'Dolphin House Museum: responsible operator without point', topic: 'culture',
    claim: 'The current Dolphin House Museum site identifies Sir Ashley Saunders as founder and CEO and publishes a Bahamas contact number, while the national tourism authority places the museum generally in Alice Town.',
    travelerGuidance: 'Confirm the exact entrance, address, current hours, admission, reservations, payment, accessibility, and tour arrangements with the responsible contact before visiting. No canonical coordinate is approved.',
    sourceIds: ['research-source-bmot-bimini-dolphin-house-profile', 'research-source-operator-dolphin-house-museum', 'research-source-operator-dolphin-house-contact'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Operator identity is now current; point and visitor-operation details remain incomplete.',
  },
  {
    slug: 'cat-island', key: 'poitier-boyhood-relative-identity', title: "Sir Sidney Poitier's boyhood: relative identity boundary", topic: 'culture',
    claim: "The national tourism authority says Sir Sidney Poitier grew up on Cat Island just outside Arthur's Town, but it does not identify a preserved house, public attraction, entrance, or exact point.",
    travelerGuidance: 'Treat this as biographical and relative-location context. Do not route travelers to a presumed private home or publish a point until a responsible heritage source establishes the specific site, public status, permission, and visitor conditions.',
    sourceIds: ['research-source-bmot-cat-island'], volatility: 'stable', confidence: 'high', nextReviewAt: nextQuarterlyReviewAt,
    editorNotes: 'The official highlight title is broader than the evidence; no surviving public house is established.',
  },
  {
    slug: 'ragged-island', key: 'pigeon-cay-relative-location', title: 'Pigeon Cay: official relative-location boundary', topic: 'nature',
    claim: 'The national tourism authority identifies Pigeon Cay as visible off Ragged Island near Gun Point and notes a memorial cross for Bishop Henry Norris Churton, but it supplies no exact cay, landing, or memorial point.',
    travelerGuidance: 'The relative description is not a route or access plan. Confirm the cay identity, responsible vessel, landing permission, ownership or conservation rules, conditions, accessibility, and emergency readiness before recommending travel.',
    sourceIds: ['research-source-bmot-ragged-island'], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'No coordinate is inferred from the prose or image.',
  },
]

const factDocs = factSpecs.map((fact) => ({
  _id: `drafts.island-fact-signature-adjudication-${keyPart(fact.key)}-${fact.slug}`,
  _type: 'islandFact',
  title: fact.title,
  destination: reference(destinationId(fact.slug), `destination-${fact.slug}`),
  topic: fact.topic,
  claim: fact.claim,
  travelerGuidance: fact.travelerGuidance,
  sources: fact.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
  checkedAt,
  nextReviewAt: fact.nextReviewAt,
  volatility: fact.volatility,
  confidence: fact.confidence,
  verificationStatus: 'source_verified',
  editorNotes: `${fact.editorNotes} Delivery channels intentionally left empty pending editorial approval.`,
  channels: [],
}))

const remainingActionByPlace = new Map([
  ['bimini::Fountain of Youth', 'Obtain responsible site-level confirmation of the actual well and entrance; keep both tourism points pending meanwhile.'],
  ["nassau-paradise-island::Queen's Staircase", 'Confirm the intended staircase entrance or feature geometry with the responsible historic-site authority and document accessible alternatives.'],
  ['nassau-paradise-island::Fort Fincastle', 'Confirm the actual fort entrance with the responsible site authority and recheck the current tour listing before accepting the preferred map pin.'],
  ['acklins-crooked-island::Ancient Lucayan Sites', 'Identify protected component sites and disclosure/access rules with the responsible heritage authority; do not expose archaeological coordinates by default.'],
  ['long-island::Twin Churches', "Obtain a responsible exact identity and point for St. Paul's Anglican Church and current visitor/access evidence for both churches."],
  ['bimini::Dolphin House Museum', 'Confirm the exact entrance, address, current hours, admission, reservations, payment, and accessibility with the responsible contact.'],
  ["cat-island::Sir Sidney Poitier's Boyhood Home", 'Establish whether a specific surviving public heritage site exists and whether locating it is appropriate; otherwise retain only biographical context.'],
  ['ragged-island::Pigeon Cay', 'Confirm the correct cay and memorial identity, responsible access, landing, permission, conditions, and emergency plan without geocoding the prose.'],
])

const rowsByIsland = new Map()
for (const row of adjudication.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const base = candidateAuditBySlug.get(slug)
  if (!base) throw new Error(`Missing candidate audit base for ${slug}`)
  const sourceIds = unique(rows.flatMap((row) => sourceIdsByPlace.get(rowKey(row)) || []))
  const gaps = rows.flatMap((row) => [
    gap(slug, 'places', 'p1', `Primary-source adjudication completed: ${row.officialName}`, `${row.sourceContext.assertion} Evidence remains review-only.`, 'resolved'),
    gap(slug, 'places', 'p0', `Source-adjudicated canonical decision still pending: ${row.officialName}`, remainingActionByPlace.get(rowKey(row)), 'researching'),
  ])
  return {
    _id: `drafts.island-research-audit-2026-08-05-signature-place-source-adjudication-${slug}`,
    _type: 'islandResearchAudit',
    title: `${rows[0].islandName || base.title.split(' missing')[0]} signature-place source adjudication — ${checkedAt}`,
    destination: base.destination,
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: 'Primary national-tourism and responsible-operator pages were reconciled with exact official tourism-map record IDs. Haversine distances rank point evidence transparently but never approve it. Linear historic features, archaeological clusters, plural church identities, relative biography, and cay context remain distinct. Candidate and fact documents are drafts; no Supabase write, coordinate acceptance, activation, channel assignment, operation guarantee, access authorization, or safety conclusion was made.',
  }
})

const conflictingSourceIds = sourceDocs.filter((source) => {
  const baseline = baselineSourceById.get(source._id)
  return baseline && baseline.url !== source.url
}).map((source) => source._id)
if (conflictingSourceIds.length) throw new Error(`Source IDs collide with different baseline URLs: ${conflictingSourceIds.join(', ')}`)

const documents = [...sourceDocs, ...factDocs, ...auditDocs, ...candidateDocs]
const ids = new Set()
for (const document of documents) {
  if (ids.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  ids.add(document._id)
}

fs.writeFileSync(`${outputBase}-sanity-seed.ndjson`, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(`${outputBase}-manifest.json`, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, total: documents.length},
  sourceProvenance: {
    restoredBaselineSourceId: baselineQueenSource._id,
    restoredBaselineUrl: baselineQueenSource.url,
    distinctNaturalWonderSourceId: naturalQueenSource._id,
    distinctNaturalWonderUrl: naturalQueenSource.url,
    conflictingBaselineSourceIds: conflictingSourceIds,
  },
  guardrails: {
    allCandidatesAreDrafts: candidateDocs.every((doc) => doc._id.startsWith('drafts.')),
    allCandidatesRemainResearching: candidateDocs.every((doc) => doc.canonicalCreationStatus === 'researching'),
    allFactsAreDraftsAndChannelFree: factDocs.every((doc) => doc._id.startsWith('drafts.') && doc.channels.length === 0),
    noAcceptedCoordinateDecisions: candidateDocs.every((doc) => doc.locationReview.reviewDecision !== 'accepted'),
    candidateDocsHaveNoActivationOrChannels: candidateDocs.every((doc) => doc.active == null && doc.channels == null),
  },
}, null, 2)}\n`)

console.log(JSON.stringify({
  output: `${outputBase}-sanity-seed.ndjson`,
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, total: documents.length},
  sourceProvenance: {restored: baselineQueenSource._id, distinctNatural: naturalQueenSource._id, conflicts: conflictingSourceIds},
}, null, 2))
