#!/usr/bin/env node

/**
 * Build a read-only accessibility, copy, and media-rights matrix for all 64
 * official signature-place identities. This script never mutates Sanity,
 * Supabase, coordinates, media, or consumer-delivery state.
 */

import fs from 'node:fs'

const pointCandidateSeedPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const identityCandidateSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-identity-readiness-research-sanity-seed.ndjson'
const matchedPlaceSeedPath = process.argv[4] || '/private/tmp/baha-buddy-matched-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const outputPath = process.argv[5] || '/private/tmp/baha-buddy-signature-place-content-readiness.json'
const checkedAt = '2026-08-05'
const nextReviewAt = '2026-09-04'

for (const inputPath of [pointCandidateSeedPath, identityCandidateSeedPath, matchedPlaceSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function islandSlug(destinationId) {
  const exceptions = {
    'dest-eleuthera': 'eleuthera-harbour-island',
    'dest-exuma': 'the-exumas',
    'dest-nassau': 'nassau-paradise-island',
  }
  return exceptions[destinationId] || destinationId.replace(/^dest-/, '')
}

function sourceIds(review) {
  return unique((review?.sources || []).map((source) => source._ref))
}

function accessibilityStatus(review) {
  if (review.accessibilityStatus === 'partial') return 'partial_responsible_evidence'
  const hasAccessContext = !['unresolved', 'source_conflict'].includes(review.accessStatus)
  const hasTerrainOrSafetyContext = !['not_established', 'not_applicable'].includes(review.safetyStatus)
  if (hasAccessContext || hasTerrainOrSafetyContext) return 'access_context_not_accessibility'
  return 'not_found_in_reviewed_sources'
}

function copyFoundationStatus(review) {
  return {
    source_backed_internal_only: 'source_backed_internal',
    identity_only: 'identity_only',
    blocked_by_source_conflict: 'blocked_by_conflict',
    needs_responsible_review: 'needs_responsible_recheck',
  }[review.copyStatus]
}

function component(component, status, evidenceSummary, nextAction) {
  return {component, status, evidenceSummary, nextAction}
}

function copyComponents(document, review, detailedAccessibilityStatus, mediaEvidenceStatus) {
  const identity = component(
    'identity',
    'source_backed_internal',
    `Reviewed official or responsible-source records establish ${document.title} as an identity under review; this does not approve a point, operation, or traveler recommendation.`,
    'Retain the exact identity and destination boundary during editorial review; do not merge related sites or promote a representative point without separate approval.',
  )

  const descriptionByFoundation = {
    source_backed_internal: component(
      'description', 'source_backed_internal',
      'Reviewed sources support a narrow internal evidence summary, but not polished or comprehensive traveler-facing copy.',
      'Draft only from cited claims, preserve qualifications, and require editorial and consumer-safety review before enabling any delivery channel.',
    ),
    identity_only: component(
      'description', 'missing',
      'The reviewed material establishes identity or broad context only; it is insufficient for a responsible traveler description.',
      'Find current responsible-source context for the exact feature, intended visitor use, and operational boundary before drafting public copy.',
    ),
    blocked_by_conflict: component(
      'description', 'blocked',
      'A source, identity, island, or catalog conflict prevents a reliable description from being assembled.',
      'Resolve and document the conflicting identity or catalog assignment before writing descriptive or planning copy.',
    ),
    needs_responsible_recheck: component(
      'description', 'blocked',
      'Available context needs a current responsible-authority or operator recheck before it can support editorial copy.',
      'Obtain current responsible-source confirmation and record the check date, scope, and limitations before drafting.',
    ),
  }

  let operationAccess
  if (review.operationStatus === 'source_conflict' || review.accessStatus === 'source_conflict') {
    operationAccess = component(
      'operation_access', 'blocked',
      'Operation or access evidence conflicts and cannot support a traveler instruction.',
      'Resolve the responsible authority or operator, exact feature, current access state, route, restrictions, and fallback before delivery.',
    )
  } else if (['unresolved'].includes(review.operationStatus) && review.accessStatus === 'unresolved') {
    operationAccess = component(
      'operation_access', 'missing',
      'The reviewed sources do not establish current operation or a responsible access path for the exact feature.',
      'Confirm current operation, accountable access provider or authority, route, restrictions, timing, and disruption handling.',
    )
  } else {
    operationAccess = component(
      'operation_access', 'partial',
      `The review records operation as ${review.operationStatus} and access as ${review.accessStatus}; those states remain narrower than a complete traveler plan.`,
      'Recheck current operation or closure and verify exact route, responsible provider, restrictions, live timing, accessibility assistance, and disruption fallback.',
    )
  }

  const safety = review.safetyStatus === 'not_applicable'
    ? component(
      'safety', 'not_applicable',
      'The earlier readiness review did not identify a feature-specific safety claim for this identity.',
      'Keep live hazards and emergency conditions in responsible runtime or operational sources; reclassify if the intended traveler use changes.',
    )
    : review.safetyStatus === 'not_established'
      ? component(
        'safety', 'missing',
        'No current feature-specific safety evidence was established in the reviewed sources.',
        'Verify hazards, supervision, conditions, emergency response, and traveler limitations with the responsible authority or operator.',
      )
      : component(
        'safety', 'partial',
        `The earlier review records ${review.safetyStatus}; this is context, not a live safety guarantee.`,
        'Preserve the cited limitation and verify current conditions, supervision, emergency capability, and any traveler prerequisites at delivery time.',
      )

  const accessibility = detailedAccessibilityStatus === 'partial_responsible_evidence'
    ? component(
      'accessibility', 'partial',
      'A responsible source publishes limited accessibility information, but the feature-level picture is incomplete.',
      'Confirm the exact accessible route and entrance, mobility-device circulation, transfers, restrooms, sensory support, service-animal policy, and assistance process.',
    )
    : component(
      'accessibility', 'missing',
      'No complete responsible, feature-level accessibility statement was found. Access mode, terrain, a boardwalk, stairs, a boat requirement, or silence does not establish accessibility.',
      'Ask the responsible authority or operator for current feature-level details covering routes, surfaces, gradients, transfers, restrooms, sensory support, service animals, and assistance.',
    )

  const media = mediaEvidenceStatus === 'source_display_only_not_cleared'
    ? component(
      'media', 'blocked',
      'Source pages display media, but display on a source page is not a reusable license and no selected asset has documented rights.',
      'Select an asset only from a controlled library or direct rights holder, record the exact license or permission, credit, source URL, usage limits, and then review factual alt text.',
    )
    : component(
      'media', 'missing',
      'No approved image or documented reusable asset is attached to this review record.',
      'Source a rights-cleared asset, record provenance and usage terms, and write alt text only after the exact approved image is selected.',
    )

  const travelerCopy = component(
    'traveler_copy', 'blocked',
    'Identity, operation, access, safety, accessibility, media, and editorial review do not yet form a complete delivery-safe content package.',
    'Keep all channels closed until the open component gaps are resolved, the final copy is reviewed, and a separate publication decision is recorded.',
  )

  return [identity, descriptionByFoundation[copyFoundationStatus(review)], operationAccess, safety, accessibility, media, travelerCopy]
}

const documentsById = new Map()
for (const document of [
  ...readNdjson(pointCandidateSeedPath),
  ...readNdjson(identityCandidateSeedPath),
  ...readNdjson(matchedPlaceSeedPath),
]) {
  if (!['canonicalPlaceCandidate', 'placeEditorial'].includes(document._type)) continue
  documentsById.set(document._id, document)
}

const documents = [...documentsById.values()]
if (documents.length !== 64) throw new Error(`Expected 64 distinct identities, found ${documents.length}`)

const rows = documents.map((document) => {
  const review = document.travelerReadinessReview || document.catalogTravelerReadinessReview
  if (!review) throw new Error(`Missing traveler-readiness review: ${document._id}`)
  const existingSourceIds = sourceIds(review)
  if (!existingSourceIds.length) throw new Error(`Missing reviewed sources: ${document._id}`)

  const detailedAccessibilityStatus = accessibilityStatus(review)
  const foundation = copyFoundationStatus(review)
  if (!foundation) throw new Error(`Unsupported copy status ${review.copyStatus}: ${document._id}`)

  const bntBacked = existingSourceIds.some((sourceId) => sourceId.includes('research-source-bnt-'))
  const nagb = document.title === 'National Art Gallery of The Bahamas'
  const mediaPolicySourceIds = bntBacked
    ? ['research-source-bnt-content-rights-terms', 'research-source-bnt-film-photography-permit']
    : nagb
      ? ['research-source-nagb-visitor-photography-policy']
      : ['research-source-bmot-brand-center-media-boundary']
  const mediaEvidenceStatus = review.mediaStatus === 'source_media_not_cleared'
    ? 'source_display_only_not_cleared'
    : 'no_candidate_media'
  const mediaRightsStatus = bntBacked || nagb
    ? 'publisher_identified_permission_required'
    : 'controlled_library_asset_license_required'

  return {
    documentId: document._id,
    documentType: document._type,
    recordType: document._type === 'canonicalPlaceCandidate' ? 'missing_candidate' : 'matched_overlay',
    title: document.title,
    islandSlug: islandSlug(document.destination?._ref),
    destinationId: document.destination?._ref,
    sourceIslandName: document.islandName,
    checkedAt,
    nextReviewAt,
    overallStatus: 'blocked',
    accessibilityEvidenceStatus: detailedAccessibilityStatus,
    accessibilitySourceIds: existingSourceIds,
    accessibilityBoundary: 'Reviewed access, terrain, vessel, trail, stair, boardwalk, hazard, and operating context does not establish wheelchair or mobility-device routes, transfers, restrooms, sensory support, service-animal handling, or assistance features. No feature-level claim may be inferred from silence; missing evidence is not proof that the place is inaccessible.',
    copyFoundationStatus: foundation,
    copyComponents: copyComponents(document, review, detailedAccessibilityStatus, mediaEvidenceStatus),
    mediaEvidenceStatus,
    mediaRightsStatus,
    mediaPolicySourceIds,
    altTextStatus: 'no_approved_image',
    publicCopyDecision: 'blocked',
    notes: `This research-only review preserves ${document.title}'s existing traveler-readiness boundary. No source image was copied or attached. A source page, visitor photography allowance, or park filming permit is not a reuse license. Select and license an exact asset before writing factual alt text, and obtain responsible feature-level accessibility evidence before public copy review.`,
    travelerReadiness: {
      operationStatus: review.operationStatus,
      accessStatus: review.accessStatus,
      safetyStatus: review.safetyStatus,
      accessibilityStatus: review.accessibilityStatus,
      copyStatus: review.copyStatus,
      mediaStatus: review.mediaStatus,
      deliveryDecision: review.deliveryDecision,
    },
  }
}).sort((left, right) => left.islandSlug.localeCompare(right.islandSlug) || left.title.localeCompare(right.title))

const duplicateTitles = [...rows.reduce((groups, row) => {
  const key = row.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  groups.set(key, [...(groups.get(key) || []), row.documentId])
  return groups
}, new Map()).entries()].filter(([, ids]) => ids.length > 1)

function distribution(field) {
  return Object.fromEntries(unique(rows.map((row) => row[field])).sort().map((value) => [value, rows.filter((row) => row[field] === value).length]))
}

const report = {
  generatedAt: new Date().toISOString(),
  checkedAt,
  methodology: {
    scope: 'All 64 official signature-place identities represented by 37 missing canonical-place candidates and 27 matched Supabase editorial overlays.',
    accessibilityRule: 'Access, terrain, safety, and operating evidence are recorded but never promoted to feature-level accessibility. Missing evidence is not evidence that a feature is inaccessible.',
    copyRule: 'Internal source-backed evidence is separated from final traveler copy. No public description, tip, accessibility note, or delivery approval is created by this audit.',
    mediaRule: 'Source display, personal visitor photography permission, and commercial capture permission do not create a reusable media license. Exact asset rights and alt text remain separate gates.',
    guardrail: 'Read-only audit. No Supabase write, coordinate acceptance, media download, Sanity publication, activation, channel, or public-copy decision is made.',
  },
  counts: {
    identities: rows.length,
    missingCandidates: rows.filter((row) => row.recordType === 'missing_candidate').length,
    matchedOverlays: rows.filter((row) => row.recordType === 'matched_overlay').length,
    islands: new Set(rows.map((row) => row.islandSlug)).size,
    duplicateNormalizedTitles: duplicateTitles.length,
  },
  distributions: {
    accessibilityEvidenceStatus: distribution('accessibilityEvidenceStatus'),
    copyFoundationStatus: distribution('copyFoundationStatus'),
    mediaEvidenceStatus: distribution('mediaEvidenceStatus'),
    mediaRightsStatus: distribution('mediaRightsStatus'),
    publicCopyDecision: distribution('publicCopyDecision'),
  },
  guardrails: {
    everyIdentityBlocked: rows.every((row) => row.overallStatus === 'blocked' && row.publicCopyDecision === 'blocked'),
    noRightsCleared: rows.every((row) => !['documented_license', 'direct_permission_recorded'].includes(row.mediaRightsStatus)),
    noApprovedImageOrAltText: rows.every((row) => row.altTextStatus === 'no_approved_image'),
    everyReviewHasSevenCopyComponents: rows.every((row) => row.copyComponents.length === 7),
    onlyOnePartialAccessibilityRecord: rows.filter((row) => row.accessibilityEvidenceStatus === 'partial_responsible_evidence').length === 1,
  },
  duplicateTitles,
  rows,
}

if (report.counts.missingCandidates !== 37 || report.counts.matchedOverlays !== 27 || report.counts.islands !== 16) {
  throw new Error(`Unexpected scope: ${JSON.stringify(report.counts)}`)
}
if (Object.values(report.guardrails).some((value) => value !== true)) {
  throw new Error(`Content-readiness guardrail failed: ${JSON.stringify(report.guardrails)}`)
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, counts: report.counts, distributions: report.distributions, guardrails: report.guardrails}, null, 2))
