import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'})
const locationSourceId = 'research-source-bahamas-2023-hurricane-shelter-gis'

const state = await client.fetch(
  `{
    "source": *[_id == $locationSourceId][0]{_id, title, status, authorityLevel, checkedAt, nextReviewAt, "destinationCount": count(destinations)},
    "counts": {
      "facilities": count(*[_type == "emergencyFacility" && _id match "drafts.*"]),
      "withLocationReview": count(*[_type == "emergencyFacility" && _id match "drafts.*" && defined(historicalLocationReview)]),
      "exactCandidates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "exact_candidate"]),
      "strongCandidates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus in ["strong_name_variant", "strong_location_variant"]]),
      "pendingCoordinates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reviewDecision == "pending" && defined(historicalLocationReview.candidateLocation)]),
      "acceptedCoordinates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reviewDecision == "accepted"]),
      "conflicts": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "conflict_or_ambiguous"]),
      "matchedWithoutCoordinates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "matched_without_coordinates"]),
      "unmatched": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "unmatched"]),
      "approvedFacilities": count(*[_type == "emergencyFacility" && _id match "drafts.*" && verificationStatus == "approved"]),
      "facilitiesWithChannels": count(*[_type == "emergencyFacility" && _id match "drafts.*" && count(channels) > 0]),
      "publishedFacilities": count(*[_type == "emergencyFacility" && !(_id match "drafts.*")])
    },
    "byIsland": *[_type == "destination" && !(_id match "drafts.*")] | order(islandId asc) {
      "island": islandId,
      "facilities": count(*[_type == "emergencyFacility" && _id match "drafts.*" && destination._ref == ^._id]),
      "pendingCoordinates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && destination._ref == ^._id && historicalLocationReview.reviewDecision == "pending" && defined(historicalLocationReview.candidateLocation)]),
      "locationGaps": count(*[_type == "emergencyFacility" && _id match "drafts.*" && destination._ref == ^._id && historicalLocationReview.reconciliationStatus in ["conflict_or_ambiguous", "matched_without_coordinates", "unmatched"]])
    }
  }`,
  {locationSourceId},
  {perspective: 'raw'},
)

console.log(JSON.stringify(state, null, 2))
