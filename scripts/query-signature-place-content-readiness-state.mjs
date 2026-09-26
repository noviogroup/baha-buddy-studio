import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bmot-brand-center-media-boundary',
  'research-source-bnt-content-rights-terms',
  'research-source-bnt-film-photography-permit',
  'research-source-nagb-visitor-photography-policy',
]

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, title, url, publisher, sourceClass, authorityLevel, checkedAt, nextReviewAt, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-signature-place-content-readiness-*"]{
    _id, title, verificationStatus, channels, "sourceCount": count(sources)
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-signature-place-content-readiness-*"]{
    _id, title, "island": destination->islandId, status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "candidates": *[_type == "canonicalPlaceCandidate" && _id match "drafts.*" && defined(contentReadinessReview)]{
    _id, title, canonicalCreationStatus,
    "coordinateDecision": locationReview.reviewDecision,
    "travelerDeliveryDecision": travelerReadinessReview.deliveryDecision,
    "travelerAccessibilityStatus": travelerReadinessReview.accessibilityStatus,
    "travelerSourceIds": travelerReadinessReview.sources[]._ref,
    contentReadinessReview{
      checkedAt, nextReviewAt, overallStatus, accessibilityEvidenceStatus,
      "accessibilitySourceCount": count(accessibilitySources),
      copyFoundationStatus, "copyComponentCount": count(copyComponents),
      mediaEvidenceStatus, mediaRightsStatus, "mediaPolicySourceCount": count(mediaPolicySources),
      altTextStatus, publicCopyDecision
    }
  },
  "places": *[_type == "placeEditorial" && _id match "drafts.*" && defined(catalogContentReadinessReview)]{
    _id, title, active, channels, catalogReviewStatus,
    "coordinateDecision": catalogLocationReview.reviewDecision,
    "travelerDeliveryDecision": catalogTravelerReadinessReview.deliveryDecision,
    "travelerOperationStatus": catalogTravelerReadinessReview.operationStatus,
    "travelerAccessibilityStatus": catalogTravelerReadinessReview.accessibilityStatus,
    "travelerSourceIds": catalogTravelerReadinessReview.sources[]._ref,
    catalogContentReadinessReview{
      checkedAt, nextReviewAt, overallStatus, accessibilityEvidenceStatus,
      "accessibilitySourceCount": count(accessibilitySources),
      copyFoundationStatus, "copyComponentCount": count(copyComponents),
      mediaEvidenceStatus, mediaRightsStatus, "mediaPolicySourceCount": count(mediaPolicySources),
      altTextStatus, publicCopyDecision
    }
  },
  "publishedCandidates": *[_type == "canonicalPlaceCandidate" && !(_id match "drafts.*") && defined(contentReadinessReview)]{_id},
  "publishedPlaces": *[_type == "placeEditorial" && !(_id match "drafts.*") && defined(catalogContentReadinessReview)]{_id},
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-signature-place-content-readiness-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-signature-place-content-readiness-*"]{_id}
}`, {sourceIds})

const identities = [
  ...documents.candidates.map((document) => ({...document, review: document.contentReadinessReview, recordType: 'missing_candidate'})),
  ...documents.places.map((document) => ({...document, review: document.catalogContentReadinessReview, recordType: 'matched_overlay'})),
]
const placeByTitle = new Map(documents.places.map((place) => [place.title, place]))
const compassCay = placeByTitle.get('Compass Cay Marina')
const blueHoles = placeByTitle.get('Blue Holes National Park')
const nagb = placeByTitle.get('National Art Gallery of The Bahamas')
const bntBacked = identities.filter((document) => (document.travelerSourceIds || []).some((sourceId) => sourceId?.startsWith('research-source-bnt-')))

function distribution(field) {
  return Object.fromEntries(
    [...new Set(identities.map((document) => document.review?.[field] || 'missing'))]
      .sort()
      .map((value) => [value, identities.filter((document) => (document.review?.[field] || 'missing') === value).length]),
  )
}

const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    trancheSources: documents.sources.length,
    factDrafts: documents.facts.length,
    auditDrafts: documents.audits.length,
    candidates: documents.candidates.length,
    matchedOverlays: documents.places.length,
    identities: identities.length,
    islands: new Set(documents.audits.map((document) => document.island)).size,
    activeMatchedOverlays: documents.places.filter((document) => document.active === true).length,
    matchedOverlaysWithChannels: documents.places.filter((document) => (document.channels || []).length > 0).length,
    acceptedCoordinateDecisions: identities.filter((document) => document.coordinateDecision === 'accepted').length,
    contentRightsCleared: identities.filter((document) => ['documented_license', 'direct_permission_recorded'].includes(document.review?.mediaRightsStatus)).length,
    approvedImagesOrAltText: identities.filter((document) => document.review?.altTextStatus !== 'no_approved_image').length,
    publicCopyAllowed: identities.filter((document) => document.review?.publicCopyDecision !== 'blocked').length,
    factDraftsWithChannels: documents.facts.filter((document) => (document.channels || []).length > 0).length,
    publishedCandidates: documents.publishedCandidates.length,
    publishedPlaces: documents.publishedPlaces.length,
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  distributions: {
    accessibilityEvidenceStatus: distribution('accessibilityEvidenceStatus'),
    copyFoundationStatus: distribution('copyFoundationStatus'),
    mediaEvidenceStatus: distribution('mediaEvidenceStatus'),
    mediaRightsStatus: distribution('mediaRightsStatus'),
    publicCopyDecision: distribution('publicCopyDecision'),
  },
  guardrails: {
    allFourPolicySourcesPresent: documents.sources.length === 4,
    allSixtyFourFactsAreDraftsAndChannelFree: documents.facts.length === 64 && documents.facts.every((document) => (document.channels || []).length === 0),
    allSixteenAuditsAreDrafts: documents.audits.length === 16 && new Set(documents.audits.map((document) => document.island)).size === 16,
    allThirtySevenCandidatesRemainResearchingDrafts: documents.candidates.length === 37 && documents.candidates.every((document) => document.canonicalCreationStatus === 'researching'),
    allTwentySevenMatchedOverlaysRemainInactiveAndChannelFree: documents.places.length === 27 && documents.places.every((document) => document.active === false && (document.channels || []).length === 0),
    everyIdentityHasDetailedReviewAndSevenCopyComponents: identities.length === 64 && identities.every((document) => document.review?.copyComponentCount === 7 && document.review.accessibilitySourceCount > 0 && document.review.mediaPolicySourceCount > 0),
    everyPublicCopyDecisionIsBlocked: identities.length === 64 && identities.every((document) => document.review?.publicCopyDecision === 'blocked' && document.review.overallStatus === 'blocked'),
    everyTravelerDeliveryDecisionRemainsBlocked: identities.length === 64 && identities.every((document) => document.travelerDeliveryDecision === 'blocked'),
    noAcceptedCoordinates: identities.every((document) => document.coordinateDecision !== 'accepted'),
    noMediaRightsClaimedCleared: identities.every((document) => !['documented_license', 'direct_permission_recorded'].includes(document.review?.mediaRightsStatus) && document.review?.mediaEvidenceStatus !== 'rights_cleared'),
    noApprovedImagesOrAltText: identities.every((document) => document.review?.altTextStatus === 'no_approved_image'),
    noPublishedTrancheDocuments: documents.publishedCandidates.length === 0 && documents.publishedPlaces.length === 0 && documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
    compassCayWrongIslandConflictPreserved: compassCay?.catalogReviewStatus === 'island_assignment_conflict' && compassCay?.catalogContentReadinessReview?.publicCopyDecision === 'blocked',
    blueHolesClosurePreserved: blueHoles?.travelerOperationStatus === 'current_responsible_closure' && blueHoles?.catalogContentReadinessReview?.publicCopyDecision === 'blocked',
    nagbPartialAccessibilityPreserved: nagb?.travelerAccessibilityStatus === 'partial' && nagb?.catalogContentReadinessReview?.accessibilityEvidenceStatus === 'partial_responsible_evidence',
    bntMediaPermissionBoundaryPreserved: bntBacked.length > 0 && bntBacked.every((document) => document.review?.mediaRightsStatus === 'publisher_identified_permission_required'),
  },
  sources: documents.sources.sort((left, right) => left._id.localeCompare(right._id)),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
  identities: identities.sort((left, right) => left._id.localeCompare(right._id)),
}

console.log(JSON.stringify(state, null, 2))
