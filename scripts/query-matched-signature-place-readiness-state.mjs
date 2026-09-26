import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bmot-man-o-war-cay',
  'research-source-bmot-tahiti-beach',
  'research-source-bmot-andros-barrier-reef',
  'research-source-bmot-bimini-road',
  'research-source-bmot-pink-sands-beach',
  'research-source-bmot-gold-rock-beach',
  'research-source-operator-compass-cay-marina',
  'research-source-bmot-big-major-cay-pig-beach',
]

const placeIds = [
  '0f922564-abe0-4a1c-9461-7ff4fc8aadbc',
  '2a219b40-3191-49df-b8a2-5aef332ee442',
  '08ee2b46-fb82-4920-9092-5b440a695391',
  '5935503a-cea3-4cec-95ac-8dd47bf6a76b',
  'e62d6f20-dab1-49df-8735-ac43012aff14',
  '6c704b3f-daa4-45ff-aaaf-dadc4e9cb404',
  'dd04a350-1850-4858-8141-113c1a4a8eb0',
  '8eae30a6-6626-4f0c-a376-30c61b63f731',
  '04cd8585-cbb6-4c9b-bb0a-97a7c78b532b',
  '8fd67764-cab2-4561-8797-8f1f4f6e934f',
  'f32a6dd6-4b83-48b4-a061-692226880a86',
  'e7a912a5-b839-4e5f-a8eb-be88faef85e8',
  '350f1104-0491-4da9-80e9-6e6baa53d583',
  'c64b453a-dad0-429e-9665-52714574e1ca',
  '25a9d563-d7a8-474d-8fc3-7e2c71fcdeb3',
  '45659ca4-6b99-4c9f-a2d0-ff055b32ead6',
  'd18571d7-2c94-4437-a738-b53b8f7f1ec2',
  '2df8651f-cbb9-4ab5-a7e5-7cc69cc73970',
  '61e516f7-b72a-4525-b7c8-7312bae392ca',
  '7befb31e-4ec9-40cb-a416-f8082415f45b',
  'b2cd568b-7ef1-4c0a-8dfe-5ece8e77479c',
  'a09ebcdb-b922-431c-baaf-993ed90db462',
  '0f53515b-b574-47f0-8f91-44c49a2efac1',
  'fa7d5f7d-ae3f-4a6c-ab05-564e4a44571c',
  '561abe21-623b-4439-9178-46454185ee02',
  '397ca218-f9cb-456e-9d54-3d4eb6790cf3',
  '61cf7fb9-a680-4be9-b437-dbfaeee3d74a',
].map((id) => `drafts.place-supabase-${id}`)
const publishedPlaceIds = placeIds.map((id) => id.replace(/^drafts\./, ''))

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, title, url, checkedAt, nextReviewAt, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-matched-signature-readiness-*"]{
    _id, title, verificationStatus, channels
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-*"]{
    _id,
    title,
    "island": destination->islandId,
    status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "places": *[_id in $placeIds]{
    _id,
    title,
    islandName,
    active,
    channels,
    catalogReviewStatus,
    "locationStatus": catalogLocationReview.reconciliationStatus,
    "coordinateDecision": catalogLocationReview.reviewDecision,
    catalogTravelerReadinessReview{
      checkedAt,
      nextReviewAt,
      overallStatus,
      responsibleSourceStatus,
      operationStatus,
      accessStatus,
      safetyStatus,
      accessibilityStatus,
      copyStatus,
      mediaStatus,
      deliveryDecision,
      "sourceCount": count(sources)
    }
  },
  "publishedPlaces": *[_id in $publishedPlaceIds && defined(catalogTravelerReadinessReview)]{_id},
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-matched-signature-readiness-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-signature-place-matched-readiness-*"]{_id}
}`, {sourceIds, placeIds, publishedPlaceIds})

const placeByTitle = new Map(documents.places.map((place) => [place.title, place]))
const compassCay = placeByTitle.get('Compass Cay Marina')
const blueHoles = placeByTitle.get('Blue Holes National Park')
const nagb = placeByTitle.get('National Art Gallery of The Bahamas')

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
    placeDrafts: documents.places.length,
    activePlaces: documents.places.filter((document) => document.active === true).length,
    placesWithChannels: documents.places.filter((document) => (document.channels || []).length > 0).length,
    acceptedCoordinateDecisions: documents.places.filter((document) => document.coordinateDecision === 'accepted').length,
    accessibilityPublished: documents.places.filter((document) => document.catalogTravelerReadinessReview?.accessibilityStatus === 'published').length,
    mediaRightsCleared: documents.places.filter((document) => document.catalogTravelerReadinessReview?.mediaStatus === 'rights_cleared').length,
    travelerDeliveryAllowed: documents.places.filter((document) => document.catalogTravelerReadinessReview && document.catalogTravelerReadinessReview.deliveryDecision !== 'blocked').length,
    factDraftsWithChannels: documents.facts.filter((document) => (document.channels || []).length > 0).length,
    publishedPlaces: documents.publishedPlaces.length,
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  guardrails: {
    allEightSourcesPresent: documents.sources.length === 8,
    allTwentySevenFactsAreDraftsAndChannelFree: documents.facts.length === 27 && documents.facts.every((document) => (document.channels || []).length === 0),
    allFifteenAuditsAreDrafts: documents.audits.length === 15,
    allTwentySevenPlacesRemainInactiveAndChannelFree: documents.places.length === 27 && documents.places.every((document) => document.active === false && (document.channels || []).length === 0),
    everyTravelerDeliveryDecisionIsBlocked: documents.places.length === 27 && documents.places.every((document) => document.catalogTravelerReadinessReview?.deliveryDecision === 'blocked'),
    noAcceptedCoordinates: documents.places.every((document) => document.coordinateDecision !== 'accepted'),
    noAccessibilityClaimedPublished: documents.places.every((document) => document.catalogTravelerReadinessReview?.accessibilityStatus !== 'published'),
    noMediaRightsClaimedCleared: documents.places.every((document) => document.catalogTravelerReadinessReview?.mediaStatus !== 'rights_cleared'),
    noPublishedTrancheDocuments: documents.publishedPlaces.length === 0 && documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
    compassCayWrongIslandConflictPreserved: compassCay?.catalogReviewStatus === 'island_assignment_conflict' && compassCay?.catalogTravelerReadinessReview?.deliveryDecision === 'blocked',
    blueHolesClosurePreserved: blueHoles?.catalogTravelerReadinessReview?.operationStatus === 'current_responsible_closure',
    nagbAccessibilityLimitPreserved: nagb?.catalogTravelerReadinessReview?.accessibilityStatus === 'partial',
  },
  responsibleSourceStatuses: Object.fromEntries(
    [...new Set(documents.places.map((document) => document.catalogTravelerReadinessReview?.responsibleSourceStatus))]
      .filter(Boolean)
      .sort()
      .map((status) => [status, documents.places.filter((document) => document.catalogTravelerReadinessReview?.responsibleSourceStatus === status).length]),
  ),
  operationStatuses: Object.fromEntries(
    [...new Set(documents.places.map((document) => document.catalogTravelerReadinessReview?.operationStatus))]
      .filter(Boolean)
      .sort()
      .map((status) => [status, documents.places.filter((document) => document.catalogTravelerReadinessReview?.operationStatus === status).length]),
  ),
  sources: documents.sources.sort((left, right) => left._id.localeCompare(right._id)),
  places: documents.places.sort((left, right) => left._id.localeCompare(right._id)),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
