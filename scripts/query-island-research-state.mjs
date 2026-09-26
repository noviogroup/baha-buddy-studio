import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli

const client = getCliClient({apiVersion: '2026-08-04'})
const islandSlugs = [
  'abacos',
  'acklins-crooked-island',
  'andros',
  'berry-islands',
  'bimini',
  'cat-island',
  'eleuthera-harbour-island',
  'grand-bahama',
  'inagua',
  'long-island',
  'mayaguana',
  'nassau-paradise-island',
  'ragged-island',
  'rum-cay',
  'san-salvador',
  'the-exumas',
]
const medicalAccessFactIds = islandSlugs.map((slug) => slug === 'nassau-paradise-island'
  ? 'drafts.island-fact-deep-research-new-providence-clinic-baseline-nassau-paradise-island'
  : `drafts.island-fact-deep-research-family-island-clinic-baseline-${slug}`)
const medicalAccessAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-medical-access-${slug}`)
const emergencyFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-national-emergency-evacuation-baseline-${slug}`)
const emergencyAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-emergency-readiness-${slug}`)
const seasonalityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-national-climate-seasonality-baseline-${slug}`)
const seasonalityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-seasonality-weather-${slug}`)
const accessFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-national-air-and-island-hopping-access-baseline-${slug}`)
const accessAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-access-transport-${slug}`)
const scheduledAirFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-scheduled-air-operator-baseline-${slug}`)
const scheduledAirAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-scheduled-air-operator-coverage-${slug}`)
const scheduledMarineFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-passenger-marine-operator-baseline-${slug}`)
const scheduledMarineAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-scheduled-marine-operator-coverage-${slug}`)
const licensedArrivalTransferFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-licensed-arrival-ground-transfer-baseline-${slug}`)
const licensedArrivalTransferAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-licensed-arrival-ground-transfer-${slug}`)
const policeResponseFacilityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-police-division-and-station-baseline-${slug}`)
const policeResponseFacilityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-police-response-facility-coverage-${slug}`)
const marineSearchRescueFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-marine-search-rescue-coordination-and-facility-baseline-${slug}`)
const marineSearchRescueAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-marine-search-rescue-facility-coverage-${slug}`)
const airportFireEmsFacilityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-airport-rescue-fire-and-ems-facility-baseline-${slug}`)
const airportFireEmsFacilityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-airport-fire-ems-facility-coverage-${slug}`)
const hurricaneShelterFacilityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-dated-2026-hurricane-shelter-facility-list-baseline-${slug}`)
const hurricaneShelterFacilityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-hurricane-shelter-facility-coverage-${slug}`)
const shelterGovernanceFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-shelter-inspection-governance-and-activation-standard-${slug}`)
const shelterGovernanceAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-shelter-inspection-governance-and-activation-${slug}`)
const airAccessibilityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-national-air-accessibility-assistance-baseline-${slug}`)
const airAccessibilityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-air-transport-accessibility-${slug}`)
const lpiaAccessibilityFactId = 'drafts.island-fact-deep-research-lpia-feature-level-accessibility-baseline-nassau-paradise-island'
const localAuthorityFactIds = islandSlugs.map((slug) => `drafts.island-fact-deep-research-local-administration-and-incident-coordination-baseline-${slug}`)
const localAuthorityAuditIds = islandSlugs.map((slug) => `drafts.island-research-audit-2026-08-04-local-authority-routing-${slug}`)

const state = await client.fetch(
  `{
    "counts": {
      "sources": count(*[_type == "researchSource"]),
      "sourcesActive": count(*[_type == "researchSource" && status == "active"]),
      "sourcesNeedsRecheck": count(*[_type == "researchSource" && status == "needs_recheck"]),
      "sourcesRetired": count(*[_type == "researchSource" && status == "retired"]),
      "factDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
      "factDraftsResearching": count(*[_type == "islandFact" && _id match "drafts.*" && verificationStatus == "researching"]),
      "factDraftsSourceVerified": count(*[_type == "islandFact" && _id match "drafts.*" && verificationStatus == "source_verified"]),
      "factDraftsEditorialReview": count(*[_type == "islandFact" && _id match "drafts.*" && verificationStatus == "editorial_review"]),
      "factDraftsApproved": count(*[_type == "islandFact" && _id match "drafts.*" && verificationStatus == "approved"]),
      "factDraftsRetired": count(*[_type == "islandFact" && _id match "drafts.*" && verificationStatus == "retired"]),
      "factDraftsWithoutStatus": count(*[_type == "islandFact" && _id match "drafts.*" && !defined(verificationStatus)]),
      "publishedFacts": count(*[_type == "islandFact" && !(_id match "drafts.*")]),
      "factDraftsWithChannels": count(*[_type == "islandFact" && _id match "drafts.*" && count(channels) > 0]),
      "auditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
      "medicalAccessFactDrafts": count(*[_id in $medicalAccessFactIds]),
      "medicalAccessAuditDrafts": count(*[_id in $medicalAccessAuditIds]),
      "emergencyFactDrafts": count(*[_id in $emergencyFactIds]),
      "emergencyAuditDrafts": count(*[_id in $emergencyAuditIds]),
      "seasonalityFactDrafts": count(*[_id in $seasonalityFactIds]),
      "seasonalityAuditDrafts": count(*[_id in $seasonalityAuditIds]),
      "accessFactDrafts": count(*[_id in $accessFactIds]),
      "accessAuditDrafts": count(*[_id in $accessAuditIds]),
      "scheduledAirFactDrafts": count(*[_id in $scheduledAirFactIds]),
      "scheduledAirAuditDrafts": count(*[_id in $scheduledAirAuditIds]),
      "scheduledMarineFactDrafts": count(*[_id in $scheduledMarineFactIds]),
      "scheduledMarineAuditDrafts": count(*[_id in $scheduledMarineAuditIds]),
      "licensedArrivalTransferFactDrafts": count(*[_id in $licensedArrivalTransferFactIds]),
      "licensedArrivalTransferAuditDrafts": count(*[_id in $licensedArrivalTransferAuditIds]),
      "policeResponseFacilityFactDrafts": count(*[_id in $policeResponseFacilityFactIds]),
      "policeResponseFacilityAuditDrafts": count(*[_id in $policeResponseFacilityAuditIds]),
      "marineSearchRescueFactDrafts": count(*[_id in $marineSearchRescueFactIds]),
      "marineSearchRescueAuditDrafts": count(*[_id in $marineSearchRescueAuditIds]),
      "airportFireEmsFacilityFactDrafts": count(*[_id in $airportFireEmsFacilityFactIds]),
      "airportFireEmsFacilityAuditDrafts": count(*[_id in $airportFireEmsFacilityAuditIds]),
      "hurricaneShelterFacilityFactDrafts": count(*[_id in $hurricaneShelterFacilityFactIds]),
      "hurricaneShelterFacilityAuditDrafts": count(*[_id in $hurricaneShelterFacilityAuditIds]),
      "shelterGovernanceFactDrafts": count(*[_id in $shelterGovernanceFactIds]),
      "shelterGovernanceAuditDrafts": count(*[_id in $shelterGovernanceAuditIds]),
      "emergencyFacilityDrafts": count(*[_type == "emergencyFacility" && _id match "drafts.*"]),
      "emergencyFacilityDraftsSourceVerified": count(*[_type == "emergencyFacility" && _id match "drafts.*" && verificationStatus == "source_verified"]),
      "emergencyFacilityDraftsApproved": count(*[_type == "emergencyFacility" && _id match "drafts.*" && verificationStatus == "approved"]),
      "emergencyFacilityDraftsWithChannels": count(*[_type == "emergencyFacility" && _id match "drafts.*" && count(channels) > 0]),
      "publishedEmergencyFacilities": count(*[_type == "emergencyFacility" && !(_id match "drafts.*")]),
      "emergencyFacilityDraftsWithLocationReview": count(*[_type == "emergencyFacility" && _id match "drafts.*" && defined(historicalLocationReview)]),
      "emergencyFacilityLocationCandidatesPending": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reviewDecision == "pending" && defined(historicalLocationReview.candidateLocation)]),
      "emergencyFacilityLocationCandidatesAccepted": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reviewDecision == "accepted"]),
      "emergencyFacilityLocationExactCandidates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "exact_candidate"]),
      "emergencyFacilityLocationStrongCandidates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus in ["strong_name_variant", "strong_location_variant"]]),
      "emergencyFacilityLocationConflicts": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "conflict_or_ambiguous"]),
      "emergencyFacilityLocationMatchesWithoutCoordinates": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "matched_without_coordinates"]),
      "emergencyFacilityLocationUnmatched": count(*[_type == "emergencyFacility" && _id match "drafts.*" && historicalLocationReview.reconciliationStatus == "unmatched"]),
      "airAccessibilityFactDrafts": count(*[_id in $airAccessibilityFactIds]),
      "airAccessibilityAuditDrafts": count(*[_id in $airAccessibilityAuditIds]),
      "lpiaAccessibilityFactDrafts": count(*[_id == $lpiaAccessibilityFactId]),
      "localAuthorityFactDrafts": count(*[_id in $localAuthorityFactIds]),
      "localAuthorityAuditDrafts": count(*[_id in $localAuthorityAuditIds]),
      "placeReviewDrafts": count(*[_type == "placeEditorial" && _id match "drafts.place-supabase-*"])
    },
    "emergencyFacilityRollup": *[_type == "destination" && !(_id match "drafts.*") && islandId in $islandSlugs] | order(islandId asc) {
      "slug": islandId,
      "facilityDrafts": count(*[_type == "emergencyFacility" && _id match "drafts.*" && destination._ref == ^._id]),
      "printedCapacity": coalesce(math::sum(*[_type == "emergencyFacility" && _id match "drafts.*" && destination._ref == ^._id].publishedCapacity), 0)
    },
    "placeReviewDrafts": *[
      _id in [
        "drafts.place-supabase-74aedc62-dbc0-4b8a-8ca3-97f22db6175c",
        "drafts.place-supabase-fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49",
        "drafts.place-supabase-427ca602-1fed-48a4-84b8-1c4581de80a2",
        "drafts.place-supabase-96abb6cc-3c1e-47d9-9156-eea0d8110451",
        "drafts.place-supabase-dc5fb048-5231-4111-8ff9-8e17873accd0"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      address,
      active,
      channels
    },
    "researchReviewUpdates": *[
      _id == "drafts.island-fact-deep-research-baycaner-operator-reconciliation-mayaguana"
    ] {
      _id,
      _rev,
      _updatedAt,
      title,
      verificationStatus,
      channels
    },
    "healthSources": *[
      _id in [
        "research-source-moh-family-islands-health-clinics",
        "research-source-moh-new-providence-health-clinics"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      "destinationSlugs": destinations[]->islandId
    },
    "emergencySources": *[
      _id in [
        "research-source-drm-emergency-numbers",
        "research-source-drm-evacuation-guidance",
        "research-source-drm-disability-preparedness",
        "research-source-drm-live-alerts",
        "research-source-drm-2026-hurricane-shelters"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "seasonalitySources": *[
      _id in [
        "research-source-bahamas-met-climate-overview",
        "research-source-drm-hazard-season-planning"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "accessSources": *[
      _id in [
        "research-source-doa-airports",
        "research-source-bmot-island-hopping-access",
        "research-source-bahamas-ferries-travel"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "scheduledAirSources": *[
      _id in [
        "research-source-bmot-flight-tables-current-review",
        "research-source-western-air-route-directory",
        "research-source-makers-air-destinations",
        "research-source-southern-air-travel-guide"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "scheduledMarineSources": *[
      _id in [
        "research-source-bahamas-ferries-current-passenger-reconciliation",
        "research-source-bmot-eleuthera-marine-arrival",
        "research-source-bmot-exuma-local-marine-transfer"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "licensedArrivalTransferSources": *[
      _id in [
        "research-source-bmot-licensed-ground-transport-baseline",
        "research-source-rtd-taxi-licensing-inspection",
        "research-source-laws-family-island-taxi-zone-fares-2008",
        "research-source-laws-new-providence-taxi-fares-2024",
        "research-source-lpia-taxi-pickup",
        "research-source-bmot-bimini-arrival-transfer-chain"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "policeResponseFacilitySources": *[
      _id in [
        "research-source-rbpf-national-district-emergency-baseline",
        "research-source-rbpf-police-telephone-directory-partial",
        "research-source-rbpf-family-islands-division-directory",
        "research-source-rbpf-northern-bahamas-division-directory"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "marineSearchRescueSources": *[
      _id in [
        "research-source-rbdf-public-sar-contact-2026",
        "research-source-rbdf-national-search-rescue-protocols",
        "research-source-rbdf-operations-satellite-base-directory",
        "research-source-rbdf-sarops-rcc-status-2025",
        "research-source-rbdf-hmbs-abaco-site-assessment-2026",
        "research-source-rbdf-grand-bahama-readiness-assessment-2026",
        "research-source-rbdf-hmbs-matthew-town-use-2026",
        "research-source-rbdf-gun-point-operation-2024"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "airportFireEmsFacilitySources": *[
      _id in [
        "research-source-caab-rffs-standard",
        "research-source-caab-government-aerodrome-rffs-register",
        "research-source-airport-authority-rff-service-footprint",
        "research-source-doa-airport-emergency-contact-review",
        "research-source-pha-nems-ambulance-system-snapshot",
        "research-source-drm-fidep-local-response-asset-standard",
        "research-source-rbpf-fire-service-directory-scope",
        "research-source-drm-bimini-fire-equipment-training-2026",
        "research-source-aaia-airport-incident-response-evidence-2026",
        "research-source-rbpf-eleuthera-volunteer-fire-response-2024"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "hurricaneShelterFacilitySources": *[
      _id in [
        "research-source-drm-official-2026-emergency-shelter-list-pdf",
        "research-source-drm-2026-hurricane-shelters",
        "research-source-drm-evacuation-guidance",
        "research-source-drm-disability-preparedness",
        "research-source-drm-fidep-local-response-asset-standard",
        "research-source-bahamas-2023-hurricane-shelter-gis"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "shelterGovernanceSources": *[
      _id in [
        "research-source-drm-national-humanitarian-assistance-standards-2025",
        "research-source-drm-shelter-inspection-grading-programme",
        "research-source-drm-national-disaster-coordination-protocols",
        "research-source-opm-hurricane-melissa-evacuation-shelter-activation-2025"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "localAuthoritySources": *[
      _id in [
        "research-source-drm-national-disaster-coordination-protocols",
        "research-source-rgd-family-island-administration-offices"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    },
    "airAccessibilitySources": *[
      _id in [
        "research-source-caab-special-assistance-facilitation",
        "research-source-bahamasair-passenger-disability",
        "research-source-bahamasair-accessibility-request",
        "research-source-lpia-accessibility",
        "research-source-bahamas-ferries-passenger-policies"
      ]
    ] | order(_id asc) {
      _id,
      _rev,
      _updatedAt,
      title,
      status,
      "destinationCount": count(destinations)
    }
  }`,
  {islandSlugs, medicalAccessFactIds, medicalAccessAuditIds, emergencyFactIds, emergencyAuditIds, seasonalityFactIds, seasonalityAuditIds, accessFactIds, accessAuditIds, scheduledAirFactIds, scheduledAirAuditIds, scheduledMarineFactIds, scheduledMarineAuditIds, licensedArrivalTransferFactIds, licensedArrivalTransferAuditIds, policeResponseFacilityFactIds, policeResponseFacilityAuditIds, marineSearchRescueFactIds, marineSearchRescueAuditIds, airportFireEmsFacilityFactIds, airportFireEmsFacilityAuditIds, hurricaneShelterFacilityFactIds, hurricaneShelterFacilityAuditIds, shelterGovernanceFactIds, shelterGovernanceAuditIds, airAccessibilityFactIds, airAccessibilityAuditIds, lpiaAccessibilityFactId, localAuthorityFactIds, localAuthorityAuditIds},
  {perspective: 'raw'},
)

console.log(JSON.stringify(state, null, 2))
