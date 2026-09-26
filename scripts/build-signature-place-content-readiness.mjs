#!/usr/bin/env node

/**
 * Build the review-only Sanity tranche for the detailed accessibility, copy,
 * and media-rights review of all 64 official signature-place identities.
 * Import is a separate explicit command.
 */

import fs from 'node:fs'

const auditPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-content-readiness.json'
const pointCandidateSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const identityCandidateSeedPath = process.argv[4] || '/private/tmp/baha-buddy-signature-place-identity-readiness-research-sanity-seed.ndjson'
const matchedPlaceSeedPath = process.argv[5] || '/private/tmp/baha-buddy-matched-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const baselineSeedPath = process.argv[6] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const outputBase = process.argv[7] || '/private/tmp/baha-buddy-signature-place-content-readiness-research'
const checkedAt = '2026-08-05'
const nextReviewAt = '2026-09-04'

for (const inputPath of [auditPath, pointCandidateSeedPath, identityCandidateSeedPath, matchedPlaceSeedPath, baselineSeedPath]) {
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

const destinationNames = {
  'acklins-crooked-island': 'Acklins & Crooked Island',
  abacos: 'The Abacos',
  andros: 'Andros',
  'berry-islands': 'The Berry Islands',
  bimini: 'Bimini',
  'cat-island': 'Cat Island',
  'eleuthera-harbour-island': 'Eleuthera & Harbour Island',
  'the-exumas': 'The Exumas',
  'grand-bahama': 'Freeport — Grand Bahama Island',
  inagua: 'Inagua',
  'long-island': 'Long Island',
  mayaguana: 'Mayaguana',
  'nassau-paradise-island': 'Nassau & Paradise Island',
  'ragged-island': 'Ragged Island',
  'rum-cay': 'Rum Cay',
  'san-salvador': 'San Salvador',
}

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
if (audit.rows?.length !== 64) throw new Error(`Expected 64 content-readiness rows, found ${audit.rows?.length || 0}`)

const pointCandidateDocs = readNdjson(pointCandidateSeedPath)
const identityCandidateDocs = readNdjson(identityCandidateSeedPath)
const matchedPlaceDocs = readNdjson(matchedPlaceSeedPath)
const baselineDocs = readNdjson(baselineSeedPath)
const allInputDocs = [...baselineDocs, ...pointCandidateDocs, ...identityCandidateDocs, ...matchedPlaceDocs]

const reviewedDocumentById = new Map()
for (const document of [...pointCandidateDocs, ...identityCandidateDocs, ...matchedPlaceDocs]) {
  if (['canonicalPlaceCandidate', 'placeEditorial'].includes(document._type)) reviewedDocumentById.set(document._id, document)
}
if (reviewedDocumentById.size !== 64) throw new Error(`Expected 64 input review documents, found ${reviewedDocumentById.size}`)

const destinationRefs = unique(audit.rows.map((row) => row.destinationId)).sort()
const allDestinationReferences = destinationRefs.map((id, index) => reference(id, `destination-${index + 1}`))
const bntDestinationRefs = unique(audit.rows
  .filter((row) => row.mediaPolicySourceIds.includes('research-source-bnt-content-rights-terms'))
  .map((row) => row.destinationId))
  .sort()
  .map((id, index) => reference(id, `destination-${index + 1}`))

const sourceDocs = [
  {
    _id: 'research-source-bmot-brand-center-media-boundary',
    _type: 'researchSource',
    title: 'BMOTIA Pressroom Brand Center — controlled media-library boundary',
    url: 'https://www.bahamas.com/pressroom?page=3',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: allDestinationReferences,
    topics: ['overview'],
    checkedAt,
    nextReviewAt,
    status: 'active',
    notes: 'The official pressroom describes a Brand Center with images, logos, and brand guidance for destination promotion. This establishes a controlled asset-library route, not blanket permission to copy imagery from ordinary Bahamas.com pages. For every selected asset, record its exact library source, license or use terms, credit, permitted channels, geographic or time limits, and approval before attachment.',
  },
  {
    _id: 'research-source-bnt-content-rights-terms',
    _type: 'researchSource',
    title: 'Bahamas National Trust website content-rights terms',
    url: 'https://bnt.bs/terms-and-conditions/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: bntDestinationRefs,
    topics: ['overview'],
    checkedAt,
    nextReviewAt,
    status: 'active',
    notes: 'The current BNT terms identify website text, graphics, photos, and images as protected content and require prior express authorization for reproduction. BNT page imagery therefore remains display-only evidence unless the exact asset has separate documented permission or a qualifying license. This source records the reuse boundary; it does not grant rights.',
  },
  {
    _id: 'research-source-bnt-film-photography-permit',
    _type: 'researchSource',
    title: 'Bahamas National Trust park filming and photography permit boundary',
    url: 'https://bnt.bs/wp-content/uploads/2021/12/BNT-Quick-Guide-th-ECLSP.pdf',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: bntDestinationRefs,
    topics: ['access', 'safety'],
    checkedAt,
    nextReviewAt,
    status: 'active',
    notes: 'The current BNT park guide says commercial, nonprofit, and promotional filming or still photography in a national park requires a permit, while personal visitor capture is treated separately. This is a capture-permission rule for protected areas, not a license to reuse BNT website images or another creator’s work. Record the exact permit and asset rights independently.',
  },
  {
    _id: 'research-source-nagb-visitor-photography-policy',
    _type: 'researchSource',
    title: 'National Art Gallery of The Bahamas visitor photography policy',
    url: 'https://nagb.org.bs/visit/visitor-guidelines/',
    publisher: 'National Art Gallery of The Bahamas',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau')],
    topics: ['overview', 'accessibility'],
    checkedAt,
    nextReviewAt,
    status: 'active',
    notes: 'The gallery permits limited personal, non-commercial visitor photography and requires advance approval for professional sessions. That visitor policy does not license NAGB website imagery, collection images, or third-party artworks for Baha Buddy use. An exact rights holder, permission or license, usage scope, credit, and artwork restrictions must be recorded before any asset is attached.',
  },
]

const existingSourceById = new Map(allInputDocs.filter((document) => document._type === 'researchSource').map((document) => [document._id, document]))
const conflictingSourceIds = sourceDocs.filter((source) => {
  const existing = existingSourceById.get(source._id)
  return existing && existing.url !== source.url
}).map((source) => source._id)
if (conflictingSourceIds.length) throw new Error(`Source IDs collide with different existing URLs: ${conflictingSourceIds.join(', ')}`)

const allSourceIds = new Set([...existingSourceById.keys(), ...sourceDocs.map((source) => source._id)])
const externalExistingSourceIds = unique(audit.rows.flatMap((row) => row.accessibilitySourceIds)).filter((sourceId) => !allSourceIds.has(sourceId)).sort()
for (const row of audit.rows) {
  const missingPolicySources = row.mediaPolicySourceIds.filter((sourceId) => !allSourceIds.has(sourceId))
  if (missingPolicySources.length) throw new Error(`Missing media-policy source IDs for ${row.documentId}: ${missingPolicySources.join(', ')}`)
}

function contentReview(row) {
  return {
    _type: 'placeContentReadinessReview',
    checkedAt: row.checkedAt,
    nextReviewAt: row.nextReviewAt,
    overallStatus: row.overallStatus,
    accessibilityEvidenceStatus: row.accessibilityEvidenceStatus,
    accessibilitySources: row.accessibilitySourceIds.map((sourceId, index) => reference(sourceId, `accessibility-source-${index + 1}`)),
    accessibilityBoundary: row.accessibilityBoundary,
    copyFoundationStatus: row.copyFoundationStatus,
    copyComponents: row.copyComponents.map((item, index) => ({_type: 'placeCopyComponentReview', _key: `component-${index + 1}-${item.component}`, ...item})),
    mediaEvidenceStatus: row.mediaEvidenceStatus,
    mediaRightsStatus: row.mediaRightsStatus,
    mediaPolicySources: row.mediaPolicySourceIds.map((sourceId, index) => reference(sourceId, `media-policy-source-${index + 1}`)),
    altTextStatus: row.altTextStatus,
    publicCopyDecision: row.publicCopyDecision,
    notes: row.notes,
  }
}

const candidateDocs = []
const placeDocs = []
for (const row of audit.rows) {
  const base = reviewedDocumentById.get(row.documentId)
  if (!base) throw new Error(`Missing input review document: ${row.documentId}`)
  if (base._type !== row.documentType) throw new Error(`Document-type mismatch: ${row.documentId}`)
  if (base._type === 'canonicalPlaceCandidate') {
    candidateDocs.push({
      ...base,
      canonicalCreationStatus: 'researching',
      contentReadinessReview: contentReview(row),
      reviewedAt: checkedAt,
    })
  } else {
    placeDocs.push({
      ...base,
      active: false,
      channels: [],
      catalogContentReadinessReview: contentReview(row),
      reviewedAt: checkedAt,
    })
  }
}

const factDocs = audit.rows.map((row) => {
  const evidenceSourceIds = unique([...row.accessibilitySourceIds, ...row.mediaPolicySourceIds])
  const accessibilityFinding = row.accessibilityEvidenceStatus === 'partial_responsible_evidence'
    ? 'limited responsible accessibility evidence exists but is incomplete'
    : row.accessibilityEvidenceStatus === 'access_context_not_accessibility'
      ? 'the reviewed access or terrain context is not feature-level accessibility evidence'
      : 'feature-level accessibility evidence was not found in the reviewed sources'
  return {
    _id: `drafts.island-fact-signature-place-content-readiness-${keyPart(row.title)}-${row.islandSlug}`,
    _type: 'islandFact',
    title: `${row.title}: accessibility, copy and media boundary`.slice(0, 140),
    destination: reference(row.destinationId, `destination-${row.islandSlug}`),
    topic: 'accessibility',
    claim: `For ${row.title}, ${accessibilityFinding}. The copy foundation is ${row.copyFoundationStatus.replaceAll('_', ' ')}, and the media review is ${row.mediaEvidenceStatus.replaceAll('_', ' ')} with ${row.mediaRightsStatus.replaceAll('_', ' ')}. These are internal evidence boundaries: access mode, terrain, safety context, source-page imagery, or source silence cannot be promoted into an accessibility claim, media license, or traveler recommendation.`,
    travelerGuidance: 'Do not deliver this place from this fact. Confirm responsible feature-level accessibility details, complete the source-backed copy components, select an exact rights-cleared asset, document its license and credit, review its alt text, and record a separate editorial publication decision.',
    sources: evidenceSourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    checkedAt,
    nextReviewAt,
    volatility: 'operational',
    confidence: row.accessibilityEvidenceStatus === 'partial_responsible_evidence' ? 'high' : 'medium',
    verificationStatus: 'source_verified',
    editorNotes: 'Draft evidence boundary only. No traveler copy, media asset, coordinate, Supabase record, activation, channel, or accessibility publication has been approved.',
    channels: [],
  }
})

function auditPreference(document) {
  if (document._id.includes('-signature-place-matched-readiness-')) return 5
  if (document._id.includes('-signature-place-identity-readiness-')) return 4
  if (document._id.includes('-signature-place-traveler-readiness-')) return 4
  if (document._id.includes('-signature-place-catalog-')) return 3
  if (document._id.includes('-quality-')) return 2
  return 1
}

const baseAuditByDestination = new Map()
for (const document of allInputDocs.filter((item) => item._type === 'islandResearchAudit' && item.destination?._ref && item.coverage?.length === 10)) {
  const current = baseAuditByDestination.get(document.destination._ref)
  if (!current || auditPreference(document) > auditPreference(current)) baseAuditByDestination.set(document.destination._ref, document)
}

const rowsByIsland = new Map()
for (const row of audit.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([slug, rows]) => {
  const destinationId = rows[0].destinationId
  const base = baseAuditByDestination.get(destinationId)
  if (!base) throw new Error(`Missing base audit for ${slug}`)
  const reviewedSourceIds = unique(rows.flatMap((row) => [...row.accessibilitySourceIds, ...row.mediaPolicySourceIds]))
  const gaps = rows.flatMap((row) => {
    const accessibilityComponent = row.copyComponents.find((item) => item.component === 'accessibility')
    const mediaComponent = row.copyComponents.find((item) => item.component === 'media')
    const travelerCopyComponent = row.copyComponents.find((item) => item.component === 'traveler_copy')
    return [
      gap(slug, 'overview', 'p1', `Content evidence profile completed: ${row.title}`, 'The accessibility, copy-component, media-rights, alt-text, and publication boundaries are now recorded as a draft review object.', 'resolved'),
      gap(slug, 'accessibility', 'p0', `Complete feature-level accessibility evidence: ${row.title}`, accessibilityComponent.nextAction, 'researching'),
      gap(slug, 'overview', 'p0', `Document rights-cleared media and alt text: ${row.title}`, mediaComponent.nextAction, 'researching'),
      gap(slug, 'overview', 'p0', `Complete traveler-safe copy review: ${row.title}`, travelerCopyComponent.nextAction, 'researching'),
    ]
  })
  return {
    _id: `drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${slug}`,
    _type: 'islandResearchAudit',
    title: `${destinationNames[slug]} signature-place content readiness — ${checkedAt}`.slice(0, 160),
    destination: reference(destinationId, `destination-${slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: reviewedSourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: `All ${rows.length} official signature-place ${rows.length === 1 ? 'identity' : 'identities'} for ${destinationNames[slug]} were reviewed across feature-level accessibility evidence, seven copy components, media provenance and reuse rights, alt-text readiness, and final delivery. Access, terrain, boardwalk, stair, trail, vessel, hazard, operation, visitor-photography, and source-page display evidence remain distinct from accessibility and media licensing. Missing accessibility evidence is not proof of inaccessibility. Every fact and audit remains a draft, every candidate remains researching, every matched overlay remains inactive and channel-free, and every public-copy decision remains blocked. No source image was copied; no Supabase row, coordinate, license, accessibility statement, or consumer channel was approved.`,
  }
})

if (sourceDocs.length !== 4 || factDocs.length !== 64 || auditDocs.length !== 16 || candidateDocs.length !== 37 || placeDocs.length !== 27) {
  throw new Error(`Unexpected tranche counts: ${JSON.stringify({sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, places: placeDocs.length})}`)
}
if (candidateDocs.some((document) => !document._id.startsWith('drafts.') || document.canonicalCreationStatus !== 'researching')) throw new Error('Candidates must remain researching drafts')
if (candidateDocs.some((document) => document.locationReview?.reviewDecision === 'accepted')) throw new Error('Build must not accept a candidate coordinate')
if (candidateDocs.some((document) => document.contentReadinessReview?.publicCopyDecision !== 'blocked')) throw new Error('Candidate public copy must remain blocked')
if (placeDocs.some((document) => !document._id.startsWith('drafts.') || document.active !== false || (document.channels || []).length)) throw new Error('Matched overlays must remain inactive, draft-only, and channel-free')
if (placeDocs.some((document) => document.catalogLocationReview?.reviewDecision === 'accepted')) throw new Error('Build must not accept an overlay coordinate')
if (placeDocs.some((document) => document.catalogContentReadinessReview?.publicCopyDecision !== 'blocked')) throw new Error('Overlay public copy must remain blocked')
if ([...candidateDocs, ...placeDocs].some((document) => {
  const review = document.contentReadinessReview || document.catalogContentReadinessReview
  return ['documented_license', 'direct_permission_recorded'].includes(review.mediaRightsStatus) || review.mediaEvidenceStatus === 'rights_cleared' || review.altTextStatus !== 'no_approved_image'
})) throw new Error('Build must not clear media rights or alt text')
if (factDocs.some((document) => !document._id.startsWith('drafts.') || (document.channels || []).length)) throw new Error('Facts must remain draft-only and channel-free')
if (auditDocs.some((document) => !document._id.startsWith('drafts.'))) throw new Error('Audits must remain drafts')

const documents = [...sourceDocs, ...factDocs, ...auditDocs, ...candidateDocs, ...placeDocs]
const ids = new Set()
for (const document of documents) {
  if (ids.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  ids.add(document._id)
}

const seedPath = `${outputBase}-sanity-seed.ndjson`
const manifestPath = `${outputBase}-manifest.json`
const counts = {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, places: placeDocs.length, total: documents.length}
const guardrails = {
  allCandidatesRemainResearchingDrafts: candidateDocs.every((document) => document._id.startsWith('drafts.') && document.canonicalCreationStatus === 'researching'),
  allMatchedPlacesRemainInactiveDraftsAndChannelFree: placeDocs.every((document) => document._id.startsWith('drafts.') && document.active === false && document.channels.length === 0),
  everyPublicCopyDecisionIsBlocked: [...candidateDocs, ...placeDocs].every((document) => (document.contentReadinessReview || document.catalogContentReadinessReview).publicCopyDecision === 'blocked'),
  noAcceptedCoordinateDecisions: [...candidateDocs, ...placeDocs].every((document) => (document.locationReview || document.catalogLocationReview)?.reviewDecision !== 'accepted'),
  noMediaRightsClaimedCleared: [...candidateDocs, ...placeDocs].every((document) => !['documented_license', 'direct_permission_recorded'].includes((document.contentReadinessReview || document.catalogContentReadinessReview).mediaRightsStatus)),
  noApprovedImagesOrAltText: [...candidateDocs, ...placeDocs].every((document) => (document.contentReadinessReview || document.catalogContentReadinessReview).altTextStatus === 'no_approved_image'),
  allFactsAreDraftsAndChannelFree: factDocs.every((document) => document._id.startsWith('drafts.') && document.channels.length === 0),
  allAuditsAreDrafts: auditDocs.every((document) => document._id.startsWith('drafts.')),
}

fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts,
  sourceProvenance: {conflictingExistingSourceIds: conflictingSourceIds, referencesExpectedFromExistingProduction: externalExistingSourceIds},
  guardrails,
}, null, 2)}\n`)

console.log(JSON.stringify({output: seedPath, manifest: manifestPath, counts, sourceProvenance: {conflicts: conflictingSourceIds, referencesExpectedFromExistingProduction: externalExistingSourceIds.length}, guardrails}, null, 2))
