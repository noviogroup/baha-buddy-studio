import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const documents = await client.fetch(`{
  "candidates": *[_type == "canonicalPlaceCandidate" && _id match "drafts.*" && defined(travelerReadinessReview)] | order(islandName asc, title asc){
    _id,
    title,
    islandName,
    "destinationSlug": destination->islandId,
    "destinationName": destination->name,
    featureType,
    canonicalCreationStatus,
    reviewedAt,
    "identitySourceCount": count(identityEvidence),
    travelerReadinessReview{
      checkedAt,
      nextReviewAt,
      accessibilityStatus,
      copyStatus,
      mediaStatus,
      deliveryDecision,
      "sourceCount": count(sources)
    }
  },
  "places": *[_type == "placeEditorial" && _id match "drafts.*" && defined(catalogTravelerReadinessReview)] | order(islandName asc, title asc){
    _id,
    title,
    islandName,
    "destinationSlug": destination->islandId,
    "destinationName": destination->name,
    category,
    catalogReviewStatus,
    reviewedAt,
    "hasShortDescription": defined(shortDescription) && length(shortDescription) > 0,
    "hasDescription": defined(description) && count(description) > 0,
    "hasPrimaryImage": defined(primaryImage.asset) || defined(primaryImage.externalUrl),
    "primaryImageHasAlt": defined(primaryImage.alt) && length(primaryImage.alt) > 0,
    "primaryImageHasCredit": defined(primaryImage.credit) && length(primaryImage.credit) > 0,
    "primaryImageHasSourceUrl": defined(primaryImage.sourceUrl),
    "galleryCount": count(gallery),
    "galleryWithAlt": count(gallery[defined(alt) && length(alt) > 0]),
    "galleryWithCredit": count(gallery[defined(credit) && length(credit) > 0]),
    "hasAccessibilityNotes": defined(accessibilityNotes) && length(accessibilityNotes) > 0,
    "hasWebsite": defined(website),
    "hasPhone": defined(phone) && length(phone) > 0,
    "hasOpeningHours": defined(openingHours) && length(openingHours) > 0,
    "buddyTipCount": count(buddyTips),
    "hasVisitorTips": defined(visitorTips) && count(visitorTips) > 0,
    active,
    "channelCount": count(channels),
    catalogTravelerReadinessReview{
      checkedAt,
      nextReviewAt,
      accessibilityStatus,
      copyStatus,
      mediaStatus,
      deliveryDecision,
      "sourceCount": count(sources)
    }
  }
}`)

const rows = [
  ...documents.candidates.map((document) => ({...document, recordType: 'missing_candidate', readiness: document.travelerReadinessReview})),
  ...documents.places.map((document) => ({...document, recordType: 'matched_overlay', readiness: document.catalogTravelerReadinessReview})),
]

function countBy(field) {
  return Object.fromEntries(
    [...new Set(rows.map((row) => row.readiness?.[field] || 'missing'))]
      .sort()
      .map((value) => [value, rows.filter((row) => (row.readiness?.[field] || 'missing') === value).length]),
  )
}

function countTrue(field) {
  return documents.places.filter((document) => document[field] === true).length
}

const normalizedTitles = new Map()
for (const row of rows) {
  const key = row.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const values = normalizedTitles.get(key) || []
  values.push({title: row.title, islandName: row.islandName, recordType: row.recordType, id: row._id})
  normalizedTitles.set(key, values)
}

const islandGroups = new Map()
for (const row of rows) {
  const key = row.destinationSlug || row.islandName
  const values = islandGroups.get(key) || []
  values.push(row)
  islandGroups.set(key, values)
}

const result = {
  generatedAt: new Date().toISOString(),
  grain: 'One row per official signature-place identity represented by either a missing canonical-place candidate or a matched place overlay.',
  counts: {
    identities: rows.length,
    missingCandidates: documents.candidates.length,
    matchedOverlays: documents.places.length,
    islands: islandGroups.size,
    duplicateNormalizedTitles: [...normalizedTitles.values()].filter((values) => values.length > 1).length,
  },
  readinessDistribution: {
    accessibilityStatus: countBy('accessibilityStatus'),
    copyStatus: countBy('copyStatus'),
    mediaStatus: countBy('mediaStatus'),
    deliveryDecision: countBy('deliveryDecision'),
  },
  matchedOverlayCompleteness: {
    denominator: documents.places.length,
    shortDescription: countTrue('hasShortDescription'),
    fullDescription: countTrue('hasDescription'),
    primaryImage: countTrue('hasPrimaryImage'),
    primaryImageAlt: countTrue('primaryImageHasAlt'),
    primaryImageCredit: countTrue('primaryImageHasCredit'),
    primaryImageSourceUrl: countTrue('primaryImageHasSourceUrl'),
    accessibilityNotes: countTrue('hasAccessibilityNotes'),
    website: countTrue('hasWebsite'),
    phone: countTrue('hasPhone'),
    openingHours: countTrue('hasOpeningHours'),
    visitorTips: countTrue('hasVisitorTips'),
    withBuddyTips: documents.places.filter((document) => document.buddyTipCount > 0).length,
    galleryImages: documents.places.reduce((sum, document) => sum + document.galleryCount, 0),
    galleryImagesWithAlt: documents.places.reduce((sum, document) => sum + document.galleryWithAlt, 0),
    galleryImagesWithCredit: documents.places.reduce((sum, document) => sum + document.galleryWithCredit, 0),
    active: documents.places.filter((document) => document.active === true).length,
    withChannels: documents.places.filter((document) => document.channelCount > 0).length,
  },
  islands: [...islandGroups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([destinationSlug, islandRows]) => ({
    destinationSlug,
    destinationName: islandRows[0].destinationName,
    sourceIslandLabels: [...new Set(islandRows.map((row) => row.islandName))].sort(),
    identities: islandRows.length,
    missingCandidates: islandRows.filter((row) => row.recordType === 'missing_candidate').length,
    matchedOverlays: islandRows.filter((row) => row.recordType === 'matched_overlay').length,
    accessibilityPublishedOrPartial: islandRows.filter((row) => ['published', 'partial'].includes(row.readiness?.accessibilityStatus)).length,
    mediaRightsCleared: islandRows.filter((row) => row.readiness?.mediaStatus === 'rights_cleared').length,
    deliveryBlocked: islandRows.filter((row) => row.readiness?.deliveryDecision === 'blocked').length,
  })),
  duplicateTitles: [...normalizedTitles.values()].filter((values) => values.length > 1),
  candidates: documents.candidates,
  matchedOverlays: documents.places,
}

console.log(JSON.stringify(result, null, 2))
