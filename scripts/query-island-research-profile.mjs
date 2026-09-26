import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const islandSlug = process.env.ISLAND_SLUG || 'andros'
const outputPath = `/private/tmp/baha-buddy-island-research-profile-${islandSlug}.json`

const layerOrder = [
  'baseline',
  'quality',
  'signature-place-catalog',
  'signature-place-location-evidence',
  'signature-place-canonical-candidates',
  'signature-place-source-adjudication',
  'signature-place-traveler-readiness',
  'signature-place-identity-readiness',
  'signature-place-matched-readiness',
  'signature-place-content-readiness',
  'evidence-media',
  'source-freshness-owner-cadence',
  'source-replacement-evidence',
  'official-experience-theme-baseline',
  'official-culture-nature-baseline',
  'official-food-baseline',
  'operator-reconciliation',
  'catalog-adjudication',
  'coordinate-closure',
  'operation-evidence',
  'medical-access',
  'emergency-readiness',
  'seasonality-weather',
  'access-transport',
  'scheduled-air-operator-coverage',
  'scheduled-marine-operator-coverage',
  'licensed-arrival-ground-transfer',
  'air-transport-accessibility',
  'local-authority-routing',
  'police-response-facility-coverage',
  'marine-search-rescue-facility-coverage',
  'airport-fire-ems-facility-coverage',
  'hurricane-shelter-facility-coverage',
  'shelter-inspection-governance-and-activation',
]

function auditLayer(id) {
  for (const layer of layerOrder.slice(1)) {
    if (id.includes(`-${layer}-`)) return layer
  }
  return 'baseline'
}

function normalized(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function refs(value, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) refs(item, results)
  } else if (value && typeof value === 'object') {
    if (typeof value._ref === 'string') results.push(value._ref)
    for (const item of Object.values(value)) refs(item, results)
  }
  return results
}

const destination = await client.fetch(
  `*[_type == "destination" && islandId == $islandSlug][0]{_id, name, islandId, slug, active, channels}`,
  {islandSlug},
  {perspective: 'raw'},
)

if (!destination) throw new Error(`No destination found for island slug: ${islandSlug}`)

const destinationRef = destination._id.replace(/^drafts\./, '')
const documents = await client.fetch(`{
  "candidates": *[_type == "canonicalPlaceCandidate" && _id match "drafts.*" && destination._ref == $destinationRef] | order(title asc),
  "places": *[_type == "placeEditorial" && _id match "drafts.*" && destination._ref == $destinationRef && defined(catalogReviewStatus)] | order(title asc),
  "imageCandidates": *[_type == "imageCandidate" && _id match "drafts.*" && destination._ref == $destinationRef] | order(title asc),
  "facts": *[_type == "islandFact" && _id match "drafts.*" && destination._ref == $destinationRef] | order(topic asc, title asc),
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && destination._ref == $destinationRef] | order(topic asc, title asc),
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.*" && destination._ref == $destinationRef] | order(_updatedAt desc)
}`, {destinationRef}, {perspective: 'raw'})

const sourceIds = unique(refs(documents).filter((id) => id.startsWith('research-source-')))
const sources = sourceIds.length
  ? await client.fetch(
      `*[_type == "researchSource" && _id in $sourceIds] | order(publisher asc, title asc)`,
      {sourceIds},
      {perspective: 'raw'},
    )
  : []

const rawGapRows = documents.audits.flatMap((audit) => (audit.gaps || []).map((gap) => ({
  auditId: audit._id,
  auditTitle: audit.title,
  auditedAt: audit.auditedAt,
  updatedAt: audit._updatedAt,
  layer: auditLayer(audit._id),
  layerRank: layerOrder.indexOf(auditLayer(audit._id)),
  topic: gap.topic,
  priority: gap.priority,
  title: gap.title,
  action: gap.action,
  status: gap.status || 'open',
})))

const latestByExactTitle = new Map()
for (const row of rawGapRows) {
  const key = [row.topic, normalized(row.title)].join('|')
  const current = latestByExactTitle.get(key)
  if (!current || row.layerRank > current.layerRank ||
      (row.layerRank === current.layerRank && row.updatedAt > current.updatedAt)) {
    latestByExactTitle.set(key, row)
  }
}

const openGaps = [...latestByExactTitle.values()]
  .filter((row) => !['resolved', 'not_applicable'].includes(row.status))
  .sort((left, right) => left.priority.localeCompare(right.priority) || left.topic.localeCompare(right.topic) || left.title.localeCompare(right.title))
const p0Gaps = openGaps.filter((row) => row.priority === 'p0')

const result = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  boundary: 'Read-only raw-perspective profile. No Sanity or Supabase write, publication, coordinate decision, media action, or delivery approval.',
  destination,
  counts: {
    candidates: documents.candidates.length,
    matchedPlaceOverlays: documents.places.length,
    imageCandidateDrafts: documents.imageCandidates.length,
    imageCandidatesWithManagedAsset: documents.imageCandidates.filter((document) => document.reviewImage?.asset?._ref).length,
    imageCandidatesReadyForEditorialReview: documents.imageCandidates.filter((document) => document.reviewStatus === 'ready_for_editorial_review').length,
    imageCandidatesNeedingRightsReview: documents.imageCandidates.filter((document) => ['source_display_only_not_cleared', 'controlled_library_asset_license_required', 'permission_required'].includes(document.rightsStatus)).length,
    factDrafts: documents.facts.length,
    publishedFacts: documents.publishedFacts.length,
    auditDrafts: documents.audits.length,
    referencedSources: sources.length,
    rawGapEntries: rawGapRows.length,
    exactTitleRollupEntries: latestByExactTitle.size,
    openGaps: openGaps.length,
    p0Gaps: p0Gaps.length,
    factsWithChannels: documents.facts.filter((fact) => (fact.channels || []).length > 0).length,
    activePlaceOverlays: documents.places.filter((place) => place.active === true).length,
    placeOverlaysWithChannels: documents.places.filter((place) => (place.channels || []).length > 0).length,
  },
  signaturePlaces: {
    candidates: documents.candidates,
    matchedPlaceOverlays: documents.places,
  },
  imageCandidates: documents.imageCandidates,
  sources,
  facts: documents.facts,
  publishedFacts: documents.publishedFacts,
  audits: documents.audits,
  openGaps,
  p0Gaps,
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)

console.log(JSON.stringify({
  generatedAt: result.generatedAt,
  output: outputPath,
  boundary: result.boundary,
  destination,
  counts: result.counts,
  signaturePlaces: {
    candidates: documents.candidates.map((document) => ({
      _id: document._id,
      title: document.title,
      canonicalCreationStatus: document.canonicalCreationStatus,
      sourceAdjudicationStatus: document.sourceAdjudicationStatus,
      locationReview: document.locationReview,
      travelerReadinessReview: document.travelerReadinessReview,
      contentReadinessReview: document.contentReadinessReview,
    })),
    matchedPlaceOverlays: documents.places.map((document) => ({
      _id: document._id,
      title: document.title,
      officialSourceName: document.officialSourceName,
      catalogReviewStatus: document.catalogReviewStatus,
      active: document.active,
      channels: document.channels,
      website: document.website,
      openingHours: document.openingHours,
      phone: document.phone,
      catalogLocationReview: document.catalogLocationReview,
      catalogTravelerReadinessReview: document.catalogTravelerReadinessReview,
      catalogContentReadinessReview: document.catalogContentReadinessReview,
    })),
  },
  imageCandidates: documents.imageCandidates.map((document) => ({
    _id: document._id,
    title: document.title,
    subjectLabel: document.subjectLabel,
    identityStatus: document.identityStatus,
    rightsStatus: document.rightsStatus,
    reviewStatus: document.reviewStatus,
    approvalStatus: document.approvalStatus,
    managedAsset: document.reviewImage?.asset?._ref,
    externalUrl: document.reviewImage?.externalUrl,
    requiredCredit: document.requiredCredit,
    altTextDraft: document.altTextDraft,
    altTextStatus: document.altTextStatus,
    nextReviewAt: document.nextReviewAt,
  })),
  sources: sources.map((source) => ({
    _id: source._id,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceClass: source.sourceClass,
    authorityLevel: source.authorityLevel,
    checkedAt: source.checkedAt,
    nextReviewAt: source.nextReviewAt,
    status: source.status,
    reviewPlan: source.reviewPlan,
  })),
  p0Gaps,
}, null, 2))
