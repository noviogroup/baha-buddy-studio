import type {StructureResolver} from 'sanity/structure'

const emergencyAuthorityGapTitles = [
  'Current 2026 inspection, suitability assessment, and shelter grade remain unverified',
  'Current activation decision, evacuation order, and transport remain runtime-only',
  'Current aerodrome RFFS readiness remains unverified',
  'Current EMS dispatch and ambulance availability remain unverified',
  'Current evacuation route, assembly point, and transport remain unverified',
  'Current marine distress route and communications remain unverified',
  'Current shelter activation, condition, and usable capacity remain unverified',
  'Current shelter inventory is not safe to reuse as complete',
  'Live ICC activation and public contact remain unverified',
  'Local response and evacuation capability remain unverified',
  'Local response and evacuation path remains unverified',
]

const androsSignaturePlaceFactIds = [
  'drafts.island-fact-matched-signature-readiness-andros-barrier-reef-andros',
  'drafts.island-fact-matched-signature-readiness-androsia-batik-factory-andros',
  'drafts.island-fact-matched-signature-readiness-blue-holes-national-park-andros',
  'drafts.island-fact-signature-identity-readiness-west-side-national-park-andros',
  'drafts.island-fact-canonical-candidate-west-side-national-park-access-boundary-andros',
]

const androsSignaturePlaceSourceIds = [
  'research-source-bmot-andros',
  'research-source-bmot-andros-barrier-reef',
  'research-source-operator-androsia',
  'research-source-operator-androsia-contact-2026',
  'research-source-operator-androsia-hours-legacy-2026',
  'research-source-bnt-blue-holes-andros',
  'research-source-bnt-blue-holes-boundary-map',
  'research-source-bnt-andros',
  'research-source-bnt-andros-west-side-national-park',
  'research-source-bnt-west-side-boundary-map',
  'research-source-bnt-andros-north-south-marine-parks',
]

const exumasSignaturePlaceIds = [
  'drafts.place-supabase-397ca218-f9cb-456e-9d54-3d4eb6790cf3',
  'drafts.place-supabase-61cf7fb9-a680-4be9-b437-dbfaeee3d74a',
  'drafts.place-supabase-d18571d7-2c94-4437-a738-b53b8f7f1ec2',
]

const exumasSignaturePlaceFactIds = [
  'drafts.island-fact-matched-signature-readiness-big-major-cay-the-exumas',
  'drafts.island-fact-matched-signature-readiness-compass-cay-marina-the-exumas',
  'drafts.island-fact-matched-signature-readiness-exuma-cays-land-sea-park-the-exumas',
  'drafts.island-fact-signature-point-readiness-thunderball-grotto-the-exumas',
  'drafts.island-fact-pig-beach-public-copy-evidence-boundary-the-exumas',
]

const exumasSignaturePlaceSourceIds = [
  'research-source-bmot-the-exumas',
  'research-source-bmot-exuma-local-marine-transfer',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-big-major-cay-pig-beach',
  'research-source-bmot-thunderball-grotto',
  'research-source-bnt-exuma-cays-land-sea-park',
  'research-source-bnt-exuma-park-quick-guide',
  'research-source-bnt-exuma-cays-park-contact-2026',
  'research-source-bnt-exuma-cays-park-fees-2026',
  'research-source-operator-compass-cay-marina',
  'research-source-operator-compass-cay-marina-contact-2026',
  'research-source-operator-compass-cay-marina-policies-2026',
  'research-source-bmot-compass-cay-marina-resort-2026',
]

const exumasSignaturePlaceAuditIds = [
  'drafts.island-research-audit-2026-08-05-signature-place-catalog-the-exumas',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-the-exumas',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-the-exumas',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-the-exumas',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-the-exumas',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-the-exumas',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-the-exumas',
  'drafts.island-research-audit-2026-08-05-public-copy-conflicts-the-exumas',
]

const eleutheraSignaturePlaceIds = [
  'drafts.place-supabase-6c704b3f-daa4-45ff-aaaf-dadc4e9cb404',
  'drafts.place-supabase-dd04a350-1850-4858-8141-113c1a4a8eb0',
]

const eleutheraSignaturePlaceCandidateIds = [
  'drafts.canonical-place-candidate-eleuthera-harbour-island-pineapple-fields',
  'drafts.canonical-place-candidate-eleuthera-harbour-island-spanish-wells',
]

const eleutheraSignaturePlaceFactIds = [
  'drafts.island-fact-matched-signature-readiness-glass-window-bridge-eleuthera-harbour-island',
  'drafts.island-fact-matched-signature-readiness-pink-sands-beach-eleuthera-harbour-island',
  'drafts.island-fact-signature-identity-readiness-pineapple-fields-eleuthera-harbour-island',
  'drafts.island-fact-signature-identity-readiness-spanish-wells-eleuthera-harbour-island',
  'drafts.island-fact-pink-sands-public-copy-evidence-boundary-eleuthera-harbour-island',
]

const eleutheraSignaturePlaceSourceIds = [
  'research-source-bmot-eleuthera-harbour-island',
  'research-source-bmot-eleuthera-marine-arrival',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-bmot-glass-window-bridge',
  'research-source-mow-glass-window-bridge-traffic-advisory-2026',
  'research-source-opm-glass-window-bridge-procurement-2026',
  'research-source-bmot-pink-sands-beach',
  'research-source-bmot-eleuthera-pineapple-fields-identity',
  'research-source-bmot-lady-di-pineapple-farm-2026',
  'research-source-bmot-spanish-wells-community-access',
  'research-source-operator-bahamas-ferries-eleuthera-route-2026',
]

const eleutheraSignaturePlaceAuditIds = [
  'drafts.island-research-audit-2026-08-05-signature-place-catalog-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-eleuthera-harbour-island',
  'drafts.island-research-audit-2026-08-05-public-copy-conflicts-eleuthera-harbour-island',
]

const grandBahamaSignaturePlaceIds = [
  'drafts.place-supabase-8eae30a6-6626-4f0c-a376-30c61b63f731',
  'drafts.place-supabase-04cd8585-cbb6-4c9b-bb0a-97a7c78b532b',
]

const grandBahamaSignaturePlaceCandidateIds = [
  'drafts.canonical-place-candidate-grand-bahama-peterson-cay-national-park',
  'drafts.canonical-place-candidate-grand-bahama-port-lucaya-marketplace',
]

const grandBahamaSignaturePlaceFactIds = [
  'drafts.island-fact-matched-signature-readiness-gold-rock-beach-grand-bahama',
  'drafts.island-fact-matched-signature-readiness-lucayan-national-park-grand-bahama',
  'drafts.island-fact-canonical-candidate-peterson-cay-national-park-authority-boundary-grand-bahama',
  'drafts.island-fact-canonical-candidate-port-lucaya-marketplace-current-operator-context-grand-bahama',
  'drafts.island-fact-grand-bahama-public-copy-evidence-boundary',
]

const grandBahamaSignaturePlaceSourceIds = [
  'research-source-bmot-grand-bahama',
  'research-source-bmot-gold-rock-beach',
  'research-source-bnt-lucayan-national-park',
  'research-source-bmot-lucayan-national-park-2026',
  'research-source-bnt-peterson-cay-national-park',
  'research-source-bmot-port-lucaya-marketplace-2026',
  'research-source-operator-port-lucaya-marketplace',
  'research-source-operator-port-lucaya-contact-2026',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
]

const grandBahamaSignaturePlaceAuditIds = [
  'drafts.island-research-audit-2026-08-05-signature-place-catalog-grand-bahama',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-grand-bahama',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-grand-bahama',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-grand-bahama',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-grand-bahama',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-grand-bahama',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-grand-bahama',
  'drafts.island-research-audit-2026-08-05-public-copy-conflicts-grand-bahama',
]

const rumCaySignaturePlaceIds = [
  'drafts.place-supabase-a59c1f50-052c-45dd-8565-788c70cdfa17',
  'drafts.place-supabase-2df8651f-cbb9-4ab5-a7e5-7cc69cc73970',
  'drafts.place-supabase-d18571d7-2c94-4437-a738-b53b8f7f1ec2',
]

const rumCaySignaturePlaceCandidateIds = [
  'drafts.canonical-place-candidate-rum-cay-port-nelson',
  'drafts.canonical-place-candidate-rum-cay-hms-conqueror-shipwreck',
  'drafts.canonical-place-candidate-rum-cay-hartford-cave',
]

const rumCaySignaturePlaceFactIds = [
  'drafts.island-fact-signature-point-readiness-port-nelson-rum-cay',
  'drafts.island-fact-signature-point-readiness-hms-conqueror-shipwreck-rum-cay',
  'drafts.island-fact-signature-point-readiness-hartford-cave-rum-cay',
  'drafts.island-fact-matched-signature-readiness-conception-island-national-park-rum-cay',
  'drafts.island-fact-base-island-stay-pattern-rum-cay',
  'drafts.island-fact-deep-research-sumner-point-contradictory-operation-evidence-rum-cay',
  'drafts.island-fact-rum-cay-public-copy-evidence-boundary',
]

const rumCaySignaturePlaceSourceIds = [
  'research-source-bmot-rum-cay',
  'research-source-bmot-hms-conqueror-diving-2026',
  'research-source-bmot-hartford-cave',
  'research-source-bmot-rum-cay-district-council-contact',
  'research-source-bnt-conception-island',
  'research-source-bnt-conception-management-planning-2025',
  'research-source-caab-government-aerodromes-2026',
  'research-source-doa-airports',
  'research-source-bmot-flight-tables-current-review',
  'research-source-bmot-rum-cay-september-2025-stay-claims',
  'research-source-operator-sumner-point-marina-site',
  'research-source-independent-tribune-rum-cay-sumner-point-2026',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
]

const rumCaySignaturePlaceAuditIds = [
  'drafts.island-research-audit-2026-08-05-signature-place-catalog-rum-cay',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-rum-cay',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-rum-cay',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-rum-cay',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-rum-cay',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-rum-cay',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-rum-cay',
  'drafts.island-research-audit-2026-08-05-source-replacement-evidence-rum-cay',
  'drafts.island-research-audit-2026-08-05-public-copy-conflicts-rum-cay',
]

const mayaguanaEvidencePlaceIds = [
  'drafts.place-supabase-427ca602-1fed-48a4-84b8-1c4581de80a2',
  'drafts.place-supabase-350f1104-0491-4da9-80e9-6e6baa53d583',
  'drafts.place-supabase-c64b453a-dad0-429e-9665-52714574e1ca',
  'drafts.place-supabase-150a9cfd-e386-4607-9c29-fb648c402b88',
  'drafts.place-supabase-11f46d18-9857-4231-afef-50a7d696add7',
  'drafts.place-supabase-3ab05555-8783-44e5-8c44-87c1ed3744ca',
  'drafts.place-supabase-ece3fee6-38c1-4092-9a93-c8832befd4c9',
  'drafts.place-supabase-5d380f05-e3b8-4456-9316-16cb705da57a81',
  'drafts.place-supabase-d249261e-1c0b-4e26-b26e-5f8e66d57a81',
]

const mayaguanaEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-mayaguana-abraham-s-bay',
  'drafts.canonical-place-candidate-mayaguana-pirates-well',
]

const mayaguanaEvidenceFactIds = [
  'drafts.island-fact-signature-point-readiness-abraham-s-bay-mayaguana',
  'drafts.island-fact-matched-signature-readiness-booby-cay-mayaguana',
  'drafts.island-fact-deep-research-2025-accommodation-directory-mayaguana',
  'drafts.island-fact-deep-research-baycaner-operator-reconciliation-mayaguana',
  'drafts.island-fact-deep-research-baycaner-2026-operation-checkpoint-mayaguana',
  'drafts.island-fact-mayaguana-airport-and-route-source-conflict-boundary',
  'drafts.island-fact-mayaguana-public-copy-evidence-boundary',
]

const mayaguanaEvidenceSourceIds = [
  'research-source-bmot-mayaguana',
  'research-source-bmot-baycaner',
  'research-source-bmot-hotel-directory-2025',
  'research-source-operator-baycaner',
  'research-source-corrob-gofishingworldwide-mayaguana-2026',
  'research-source-aopa-mayaguana-kneeboard-2026',
  'research-source-caab-government-aerodromes-2026',
  'research-source-doa-airports',
  'research-source-bmot-flight-tables-current-review',
  'research-source-bmot-booby-cay',
  'research-source-bmot-abrahams-bay-town-square',
  'research-source-bmot-pirates-well-bimini-conflict',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-business-map-pins',
  'research-source-bmot-brand-center-media-boundary',
]

const mayaguanaEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-public-copy-conflicts-mayaguana',
  'drafts.island-research-audit-2026-08-04-catalog-adjudication-mayaguana',
  'drafts.island-research-audit-2026-08-04-coordinate-closure-mayaguana',
  'drafts.island-research-audit-2026-08-04-operation-evidence-mayaguana',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-mayaguana',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-mayaguana',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-mayaguana',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-mayaguana',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-mayaguana',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-mayaguana',
]

const acklinsCrookedEvidencePlaceIds = [
  'drafts.place-supabase-e0b54187-500d-444e-9bf1-caca74ffe7b2',
  'drafts.place-supabase-0f922564-abe0-4a1c-9461-7ff4fc8aadbc',
  'drafts.place-supabase-5afc71e2-5510-44f5-8649-c5bcda775678',
  'drafts.place-supabase-da05f700-a974-4631-985b-591ffd6dc8eb',
  'drafts.place-supabase-b46ec44d-3389-4df7-b2bd-736de04fc9b5',
  'drafts.place-supabase-5c50c16b-046e-4817-9a88-2e198e5192f5',
  'drafts.place-supabase-fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49',
  'drafts.place-supabase-838d0ae6-4413-4a03-99e1-39f0dbb72a77',
  'drafts.place-supabase-29c16c48-143c-495e-b5a3-901d18bf1090',
  'drafts.place-supabase-ae4607c9-304e-4fa2-8b63-8839d35f1a49',
  'drafts.place-supabase-f712e747-33df-4d0b-ba19-8cd89c304a54',
]

const acklinsCrookedEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-acklins-crooked-island-ancient-lucayan-sites',
  'drafts.canonical-place-candidate-acklins-crooked-island-long-cay',
  'drafts.canonical-place-candidate-acklins-crooked-island-turtle-sound',
]

const acklinsCrookedEvidenceFactIds = [
  'drafts.island-fact-signature-place-content-readiness-ancient-lucayan-sites-acklins-crooked-island',
  'drafts.island-fact-signature-place-content-readiness-long-cay-acklins-crooked-island',
  'drafts.island-fact-signature-place-content-readiness-the-bight-of-acklins-acklins-crooked-island',
  'drafts.island-fact-signature-place-content-readiness-turtle-sound-acklins-crooked-island',
  'drafts.island-fact-matched-signature-readiness-the-bight-of-acklins-acklins-crooked-island',
  'drafts.island-fact-signature-point-readiness-long-cay-acklins-crooked-island',
  'drafts.island-fact-acklins-crooked-media-and-legacy-hero-boundary',
  'drafts.island-fact-acklins-crooked-transport-source-conflict-boundary',
  'drafts.island-fact-acklins-crooked-public-copy-evidence-boundary',
]

const acklinsCrookedEvidenceSourceIds = [
  'research-source-bmot-acklins-crooked-island',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-bmot-long-cay-access',
  'research-source-bahamas-ferries-current-passenger-reconciliation',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-acklins-lucayan-indian-sites',
  'research-source-bmot-turtle-sound',
  'research-source-nasa-acklins-iss071e365062',
  'research-source-nasa-crooked-acklins-bank-iss043-e-120519',
  'research-source-nasa-jsc-astronaut-photo-reuse-terms',
  'research-source-wikimedia-acklins-crooked-topographic-map',
]

const acklinsCrookedImageCandidateIds = [
  'drafts.image-candidate-acklins-nasa-iss071e365062',
  'drafts.image-candidate-crooked-acklins-bank-nasa-iss043-e-120519',
  'drafts.image-candidate-acklins-crooked-topographic-map',
  'drafts.image-candidate-acklins-crooked-current-bmot-hero',
  'drafts.image-candidate-acklins-crooked-long-cay-bmot-display',
  'drafts.image-candidate-acklins-crooked-seaview-beach-bmot-display',
  'drafts.image-candidate-acklins-crooked-legacy-hero-rights-unresolved',
]

const acklinsCrookedEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-acklins-crooked-evidence-media',
  'drafts.island-research-audit-2026-08-04-catalog-adjudication-acklins-crooked-island',
  'drafts.island-research-audit-2026-08-04-coordinate-closure-acklins-crooked-island',
  'drafts.island-research-audit-2026-08-04-operation-evidence-acklins-crooked-island',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-acklins-crooked-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-acklins-crooked-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-acklins-crooked-island',
]

const raggedIslandEvidencePlaceIds = [
  'drafts.place-supabase-45659ca4-6b99-4c9f-a2d0-ff055b32ead6',
  'drafts.place-supabase-772ff262-e575-4661-9da2-f832c9f61bcd',
  'drafts.place-supabase-7838f434-8d50-4cc4-a712-c699243b94e4',
  'drafts.place-supabase-935046bd-076d-4b1f-a011-8ce22a46bf65',
  'drafts.place-supabase-6c81af6a-d8e7-48a7-9593-8cf6e1b16fd9',
  'drafts.place-supabase-66d0cf0d-1333-40ce-b00c-19b4afd34ba8',
  'drafts.place-supabase-a8cb11c5-2727-479a-b18d-de4f05e26d9c',
  'drafts.place-supabase-82a1c49d-17f5-4e14-a372-5733858c1e83',
  'drafts.place-supabase-2a4d34b8-67a1-4bfa-b26c-75eac4c75d07',
  'drafts.place-supabase-e804397c-917e-43a0-910c-0a63a1e13498',
]

const raggedIslandEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-ragged-island-duncan-town',
  'drafts.canonical-place-candidate-ragged-island-jumentos-cays',
  'drafts.canonical-place-candidate-ragged-island-pigeon-cay',
  'drafts.canonical-place-candidate-ragged-island-lost-key-lodge',
  'drafts.canonical-place-candidate-ragged-island-alvin-munroe',
  'drafts.canonical-place-candidate-ragged-island-man-o-war-tower',
]

const raggedIslandEvidenceFactIds = [
  'drafts.island-fact-ragged-island-image-and-legacy-hero-boundary',
  'drafts.island-fact-ragged-island-air-access-and-aerodrome-boundary',
  'drafts.island-fact-ragged-island-turtle-soup-legal-conflict',
  'drafts.island-fact-ragged-island-lost-key-operation-conflict',
  'drafts.island-fact-ragged-island-catalog-and-public-copy-boundary',
  'drafts.island-fact-matched-signature-readiness-hog-cay-ragged-island',
  'drafts.island-fact-signature-place-content-readiness-duncan-town-ragged-island',
  'drafts.island-fact-signature-place-content-readiness-hog-cay-ragged-island',
  'drafts.island-fact-signature-place-content-readiness-jumentos-cays-ragged-island',
  'drafts.island-fact-signature-place-content-readiness-pigeon-cay-ragged-island',
]

const raggedIslandEvidenceSourceIds = [
  'research-source-bmot-ragged-island',
  'research-source-bmot-flight-tables-current-review',
  'research-source-caab-government-aerodromes-2026',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-operator-lost-key',
  'research-source-corrob-meridia-lost-key',
  'research-source-bahamas-tin-lost-key-2023',
  'research-source-bmot-ragged-alvin-munroe',
  'research-source-bmot-ragged-man-o-war-tower',
  'research-source-laws-bahamas-marine-turtle-prohibition',
  'research-source-nasa-ragged-range-iss052-e-78442',
  'research-source-nasa-ragged-island-duncan-town-iss024-e-11938',
  'research-source-nasa-jsc-astronaut-photo-reuse-terms',
  'research-source-wikimedia-ragged-island-locator-map',
]

const raggedIslandImageCandidateIds = [
  'drafts.image-candidate-ragged-range-nasa-iss052-e-78442',
  'drafts.image-candidate-ragged-island-duncan-town-nasa-iss024-e-11938',
  'drafts.image-candidate-ragged-island-wikimedia-locator-map',
  'drafts.image-candidate-ragged-island-current-bmot-hero',
  'drafts.image-candidate-ragged-island-duncan-town-bmot-display',
  'drafts.image-candidate-ragged-island-jumentos-bmot-display',
  'drafts.image-candidate-ragged-island-hog-cay-bmot-display',
  'drafts.image-candidate-ragged-island-pigeon-cay-bmot-display',
  'drafts.image-candidate-ragged-island-legacy-hero-rights-unresolved',
]

const raggedIslandEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-evidence-media-ragged-island',
  'drafts.island-research-audit-2026-08-04-catalog-adjudication-ragged-island',
  'drafts.island-research-audit-2026-08-04-access-transport-ragged-island',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-ragged-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-ragged-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-ragged-island',
]

const berryIslandsEvidencePlaceIds = [
  'drafts.place-supabase-09911e3b-f9ff-427f-a9f5-9290b20d6726',
  'drafts.place-supabase-fa7d5f7d-ae3f-4a6c-ab05-564e4a44571c',
  'drafts.place-supabase-561abe21-623b-4439-9178-46454185ee02',
  'drafts.place-supabase-74aedc62-dbc0-4b8a-8ca3-97f22db6175c',
  'drafts.place-supabase-3f132897-e764-46d3-b6fd-095fe62c73a0',
  'drafts.place-supabase-cf2226fc-2a54-4d49-9043-6a24d91bc26c',
  'drafts.place-supabase-e49d2895-76a0-43c5-9aba-08a44022d488',
  'drafts.place-supabase-d563af93-f3de-4e15-a2ef-52f669049c38',
  'drafts.place-supabase-dfce0ba3-f179-4b85-8595-75278bca0a7d',
  'drafts.place-supabase-32fc8c39-1ae9-4dd5-ab2c-3dd335f9052a',
]

const berryIslandsEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-berry-islands-chub-cay',
  'drafts.canonical-place-candidate-berry-islands-sugar-beach',
]

const berryIslandsEvidenceFactIds = [
  'drafts.island-fact-berry-islands-image-provenance-boundary',
  'drafts.island-fact-berry-islands-catalog-boundary',
  'drafts.island-fact-berry-islands-air-access-boundary',
  'drafts.island-fact-berry-islands-chub-cay-access-boundary',
  'drafts.island-fact-berry-islands-place-and-operator-boundary',
  'drafts.island-fact-berry-islands-hoffmans-blue-hole-safety-boundary',
]

const berryIslandsEvidenceSourceIds = [
  'research-source-bmot-berry-islands',
  'research-source-bmot-chub-cay-club',
  'research-source-bmot-flos-conch-bar',
  'research-source-bmot-hoffmans-cay-blue-hole',
  'research-source-bmot-sugar-beach',
  'research-source-operator-chub-cay-current',
  'research-source-makers-air-destinations',
  'research-source-operator-soul-fly',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-nasa-jsc-astronaut-photo-reuse-terms',
  'research-source-caab-government-aerodromes-2026',
  'research-source-nasa-berry-islands-iss056-e-9948',
  'research-source-wikimedia-great-harbour-cay-aerial',
  'research-source-wikimedia-berry-islands-locator-map',
  'research-source-caab-private-aerodromes-2025',
  'research-source-operator-royal-caribbean-cococay-access',
  'research-source-operator-the-osprey-great-harbour-cay',
  'research-source-operator-great-harbour-cay-marina',
  'research-source-bmot-stingray-city-berry-islands',
  'research-source-baha-buddy-web-berry-islands-generated-image-provenance',
]

const berryIslandsImageCandidateIds = [
  'drafts.image-candidate-berry-islands-nasa-iss056-e-9948',
  'drafts.image-candidate-great-harbour-cay-commons-aerial',
  'drafts.image-candidate-berry-islands-commons-locator-map',
  'drafts.image-candidate-berry-islands-current-bmot-hero',
  'drafts.image-candidate-berry-islands-chub-cay-bmot-display',
  'drafts.image-candidate-berry-islands-sugar-beach-bmot-display',
  'drafts.image-candidate-berry-islands-hoffmans-blue-hole-bmot-display',
  'drafts.image-candidate-berry-islands-flos-conch-bar-bmot-display',
  'drafts.image-candidate-berry-islands-legacy-hero-rights-unresolved',
  'drafts.image-candidate-berry-islands-web-generated-hero-provenance-unresolved',
]

const berryIslandsEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-evidence-media-berry-islands',
  'drafts.island-research-audit-2026-08-04-catalog-adjudication-berry-islands',
  'drafts.island-research-audit-2026-08-04-access-transport-berry-islands',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-berry-islands',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-berry-islands',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-berry-islands',
]

const inaguaEvidencePlaceIds = [
  'drafts.place-supabase-96abb6cc-3c1e-47d9-9156-eea0d8110451',
  'drafts.place-supabase-38e58595-16ee-4b9d-b5b1-5dcc503dd91e',
  'drafts.place-supabase-6bcbfd2e-bbb3-42d2-bdc2-71d5f29f9b1d',
  'drafts.place-supabase-680e0b9a-2de2-490f-882c-c94ef225606e',
  'drafts.place-supabase-f32a6dd6-4b83-48b4-a061-692226880a86',
  'drafts.place-supabase-87ae3f5c-af3c-4a67-a4b1-e32225419a92',
  'drafts.place-supabase-3bf80cc5-55a4-4407-b5c7-f56adcc942f7',
  'drafts.place-supabase-35b81b0f-bd11-4188-9b2e-270fc2d0b9ef',
  'drafts.place-supabase-eb5d4dad-0ba6-45ab-a9ca-071a36e7c223',
  'drafts.place-supabase-f5887d16-cab3-4698-8144-50b84fcc786a',
  'drafts.place-supabase-d803369c-50d5-4ee1-8efb-8ede5a769d4f',
  'drafts.place-supabase-d717fabc-c4a1-4039-aa8b-5620bacd10f7',
  'drafts.place-supabase-8b3cbc71-a1a9-4702-8c6a-563f30762c63',
  'drafts.place-supabase-190bcf64-c027-4077-9aec-66c9360ba75d',
  'drafts.place-supabase-8fd67764-cab2-4561-8797-8f1f4f6e934f',
]

const inaguaEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-inagua-great-inagua-lighthouse',
  'drafts.canonical-place-candidate-inagua-union-creek-reserve',
]

const inaguaEvidenceFactIds = [
  'drafts.island-fact-inagua-image-provenance-boundary',
  'drafts.island-fact-inagua-catalog-quarantine-boundary',
  'drafts.island-fact-inagua-flamingo-count-conflict-boundary',
  'drafts.island-fact-inagua-national-park-visit-boundary',
  'drafts.island-fact-inagua-protected-area-access-boundary',
  'drafts.island-fact-inagua-lighthouse-access-safety-boundary',
  'drafts.island-fact-inagua-matthew-town-airport-boundary',
]

const inaguaEvidenceSourceIds = [
  'research-source-bmot-inagua',
  'research-source-bmot-great-inagua-lighthouse',
  'research-source-bnt-inagua-national-park',
  'research-source-bnt-little-inagua',
  'research-source-bnt-union-creek-reserve',
  'research-source-bnt-inagua-national-park-travel-info',
  'research-source-bnt-content-rights-terms',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-bmot-public-map-dataset',
  'research-source-caab-government-aerodrome-rffs-register',
  'research-source-bmot-enricas-inn',
  'research-source-operator-enricas-site',
  'research-source-wikimedia-inagua-lighthouse-oscar-flowers',
  'research-source-wikimedia-great-little-inagua-iss',
  'research-source-wikimedia-inagua-three-flamingos',
  'research-source-wikimedia-little-inagua-nasa-geocover',
  'research-source-wikimedia-inagua-locator-map',
  'research-source-baha-buddy-web-inagua-generated-image-provenance',
]

const inaguaImageCandidateIds = [
  'drafts.image-candidate-inagua-lighthouse-oscar-flowers',
  'drafts.image-candidate-inagua-great-little-iss',
  'drafts.image-candidate-inagua-three-flamingos-archive',
  'drafts.image-candidate-little-inagua-nasa-geocover',
  'drafts.image-candidate-inagua-commons-locator-map',
  'drafts.image-candidate-inagua-current-bmot-hero',
  'drafts.image-candidate-inagua-live-legacy-hero-rights-unresolved',
  'drafts.image-candidate-inagua-web-generated-hero-provenance-unresolved',
  'drafts.image-candidate-inagua-lighthouse-bmot-display',
  'drafts.image-candidate-inagua-national-park-bnt-display',
  'drafts.image-candidate-little-inagua-bnt-display',
  'drafts.image-candidate-union-creek-bnt-display',
]

const inaguaEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-evidence-media-inagua',
  'drafts.island-research-audit-2026-08-04-catalog-adjudication-inagua',
  'drafts.island-research-audit-2026-08-04-coordinate-closure-inagua',
  'drafts.island-research-audit-2026-08-04-access-transport-inagua',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-inagua',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-inagua',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-inagua',
]

const nassauEvidencePlaceIds = [
  'drafts.place-landmark-0aa1cb38-57a9-4c8e-8f3e-70450b4df5a1',
  'drafts.place-landmark-26e90e33-be23-4c83-8a88-dbf61773ca02',
  'drafts.place-landmark-2852494d-0cfc-4694-a892-c2c34b83d0d3',
  'drafts.place-landmark-525e9054-ec1b-4cc4-abf4-84ece492680c',
  'drafts.place-landmark-6958e5bb-c5e5-44db-a3fa-1c1fa0ed0f7c',
  'drafts.place-landmark-85f5f617-1cff-45b7-9734-02329238dab1',
  'drafts.place-landmark-8759b2a9-53fb-424b-8c85-ac6e96837fc0',
  'drafts.place-landmark-967ec4cc-e3bb-467f-87d0-fdd3eee33850',
  'drafts.place-landmark-b1c1c83b-2247-4c25-9a80-0d2f1bc26335',
  'drafts.place-landmark-d371f073-70eb-4ffc-bc85-609ca00500e2',
  'drafts.place-landmark-ea308c57-024e-433a-a7b2-fdd1067b1936',
  'drafts.place-landmark-fae80c6c-17a7-466f-b7a6-4569f42932e4',
  'drafts.place-supabase-01bf36d6-a0e4-4a7d-a249-f672dbfbce5a',
  'drafts.place-supabase-116d9905-e4f5-4df3-aff3-13e13b73c893',
  'drafts.place-supabase-128da7d9-bc91-47f1-a094-d58a8879504c',
  'drafts.place-supabase-1834a7f7-0d5c-4ba0-8113-1c16bf20eeeb',
  'drafts.place-supabase-1bdddec6-c49d-4a4a-9e4d-2dc410031234',
  'drafts.place-supabase-25a9d563-d7a8-474d-8fc3-7e2c71fcdeb3',
  'drafts.place-supabase-27aca30e-cf55-43a3-8c88-5a90f0007950',
  'drafts.place-supabase-3457bf0b-a2e7-4c62-9d1b-ce7632e70468',
  'drafts.place-supabase-34796a8f-82ce-4668-a121-b3356035c0d7',
  'drafts.place-supabase-3548fbe9-ce4a-468e-827c-3e128ca00298',
  'drafts.place-supabase-3ade4e09-afb7-421b-bdd6-979447ec4362',
  'drafts.place-supabase-400c3b0a-cc36-4860-9547-0957719a2e72',
  'drafts.place-supabase-468be626-1af0-4e8f-b2db-2b54a77ca9bc',
  'drafts.place-supabase-479f2b93-085d-4543-b5d5-e3f530820d1c',
  'drafts.place-supabase-4858792f-5514-4d49-b93a-0978fd906afb',
  'drafts.place-supabase-4a1f1da8-44cc-4915-ab25-36a62db70f5e',
  'drafts.place-supabase-511aa357-8ae3-4b7e-ae76-56d3ce94d83e',
  'drafts.place-supabase-633121aa-9a6c-48ef-9f87-f8e40dbca7e1',
  'drafts.place-supabase-6d92c147-f207-4aff-a97c-9b4f1b717ead',
  'drafts.place-supabase-70d11ec9-2478-4ed5-bf07-c43445fcf28b',
  'drafts.place-supabase-7194d53d-7e89-4fea-8880-d14c5c51b21b',
  'drafts.place-supabase-81c0b535-4d47-460e-b765-2906c407edee',
  'drafts.place-supabase-8a815057-fdc4-4782-8835-e4ad4ca05b3f',
  'drafts.place-supabase-a10e04c7-9b65-43eb-9b75-7bed5d72c78a',
  'drafts.place-supabase-a53e9e4c-53c7-4890-97de-dba635fd9e2d',
  'drafts.place-supabase-b28d47c0-0cfe-4ce4-b69e-40435c376dd3',
  'drafts.place-supabase-cacf0701-3286-441e-ad23-c29e1beb705a',
  'drafts.place-supabase-cb77bc27-7fa4-4f24-954c-9a1b9cd36f18',
  'drafts.place-supabase-dd3c4409-6447-4305-8bf7-1f1e5ab8845d',
  'drafts.place-supabase-f765c54e-d379-4358-9554-310790122be1',
  'drafts.place-supabase-f7c87927-bb64-4002-8ed5-a5091d11bc86',
  'drafts.place-supabase-fbd70e32-518b-43d5-8955-adda119b9604',
]

const nassauEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-nassau-paradise-island-government-house',
]

const nassauEvidenceFactIds = [
  'drafts.island-fact-nassau-split-live-image-provenance-boundary',
  'drafts.island-fact-nassau-catalog-legacy-overlay-quarantine-boundary',
  'drafts.island-fact-nassau-nagb-hours-accessibility-conflict-boundary',
  'drafts.island-fact-nassau-new-providence-paradise-island-boundary',
  'drafts.island-fact-nassau-signature-heritage-operation-access-boundary',
  'drafts.island-fact-nassau-lpia-accessibility-onward-transfer-boundary',
  'drafts.island-fact-nassau-provider-stay-food-inventory-boundary',
]

const nassauEvidenceSourceIds = [
  'research-source-bmot-nassau-paradise-island',
  'research-source-bmot-public-map-dataset',
  'research-source-bmot-brand-center-media-boundary',
  'research-source-bmot-queens-staircase',
  'research-source-bmot-queens-staircase-natural-wonder',
  'research-source-bmot-fort-fincastle',
  'research-source-bmot-government-house-nassau',
  'research-source-opm-queens-staircase-rededication-2024',
  'research-source-opm-government-house-current-use',
  'research-source-operator-nagb',
  'research-source-nagb-visitor-photography-policy',
  'research-source-lpia-accessibility',
  'research-source-lpia-taxi-pickup',
  'research-source-wikimedia-nassau-aerial-quintin-soloviev',
  'research-source-wikimedia-nassau-satellite-axelspace',
  'research-source-wikimedia-nassau-queens-staircase-klotz',
  'research-source-wikimedia-nassau-fort-fincastle-klotz',
  'research-source-wikimedia-nassau-government-house-hughes',
  'research-source-wikimedia-nassau-nagb-bluerasberry',
  'research-source-wikimedia-nassau-paradise-island-bridge-lucas',
  'research-source-npipb-terms-media-reuse-boundary',
  'research-source-npipb-press-media-asset-library',
  'research-source-baha-buddy-web-nassau-generated-image-provenance',
  'research-source-baha-buddy-nassau-published-hero-provenance',
  'research-source-baha-buddy-mobile-nassau-image-provenance',
]

const nassauImageCandidateIds = [
  'drafts.image-candidate-nassau-current-aerial-quintin-soloviev',
  'drafts.image-candidate-nassau-satellite-axelspace',
  'drafts.image-candidate-nassau-queens-staircase-klotz',
  'drafts.image-candidate-nassau-fort-fincastle-klotz',
  'drafts.image-candidate-nassau-government-house-hughes',
  'drafts.image-candidate-nassau-nagb-bluerasberry',
  'drafts.image-candidate-nassau-paradise-island-bridge-lucas',
  'drafts.image-candidate-nassau-published-supabase-hero-provenance',
  'drafts.image-candidate-nassau-web-generated-hero-provenance',
  'drafts.image-candidate-nassau-bmot-legacy-hero-rights',
  'drafts.image-candidate-nassau-bmot-current-hero-rights',
  'drafts.image-candidate-nassau-mobile-npipb-portrait-rights',
  'drafts.image-candidate-nassau-mobile-rose-island-rights',
  'drafts.image-candidate-nassau-mobile-people-relaxing-rights',
]

const nassauEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-evidence-media-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-04-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-04-access-transport-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-04-air-transport-accessibility-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-source-adjudication-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-nassau-paradise-island',
]

const longIslandEvidencePlaceIds = [
  'drafts.place-landmark-0bc2b766-03a4-4d0b-bf6f-e14359beaa78',
  'drafts.place-landmark-14816e4b-2833-42ad-af4c-7d79b036ceec',
  'drafts.place-landmark-1abc3ba1-03fc-45aa-82c6-79305705f255',
  'drafts.place-landmark-487b904c-940e-4067-8830-124755237e21',
  'drafts.place-landmark-641def95-a59f-4d6c-93b7-419720b45841',
  'drafts.place-landmark-69720d90-46f2-4248-b9fd-e7e7cec33adf',
  'drafts.place-landmark-8f96346e-cbf8-459d-9b68-24a1f8766bd7',
  'drafts.place-landmark-bdb0de82-3fe8-40bd-a400-2c50d17d6ae7',
  'drafts.place-landmark-c79b1004-cf25-40cd-a763-1405771e00ec',
  'drafts.place-landmark-cf1b088c-36c9-4cc9-8973-02be72ff0c2b',
  'drafts.place-landmark-e0d15b2b-d39f-417a-9ffa-802891a3347f',
  'drafts.place-landmark-eea68873-c0e2-4f50-8ff6-b4bfa636a220',
  'drafts.place-supabase-019b96fd-58ab-4016-8b33-97c60888f605',
  'drafts.place-supabase-105b797d-ddf8-4ba4-a18a-d6d6d18b5e56',
  'drafts.place-supabase-19353872-1684-4c21-ae4e-a87716542517',
  'drafts.place-supabase-20f7ced8-1e74-49d9-be5a-bf9c460ec0d4',
  'drafts.place-supabase-26f1539d-b867-4872-b474-6d4091cbdfba',
  'drafts.place-supabase-2d451dbe-1ddb-4d6e-86c1-5a215111f7ab',
  'drafts.place-supabase-31166c88-a6fc-426d-93c7-23ce7b8f36e6',
  'drafts.place-supabase-349e887f-3cd9-47d2-a20c-94b0681dce29',
  'drafts.place-supabase-6866e551-7899-4142-bdee-76a66ffd0cf3',
  'drafts.place-supabase-6cdda038-4c38-41d3-9fc1-fe0610e15d62',
  'drafts.place-supabase-9835e679-bb58-4beb-a48f-2dbc46d7a15c',
  'drafts.place-supabase-9c19f04f-4fd8-4c20-8d9a-d5eaf6498a9e',
  'drafts.place-supabase-a216d460-3d05-4818-986f-7f72faf6c217',
  'drafts.place-supabase-bd2b65a7-fbec-423f-9b8b-0bb650878c4c',
  'drafts.place-supabase-d7c8f169-19cc-445a-9d2c-40f9c5908b75',
  'drafts.place-supabase-e7a912a5-b839-4e5f-a8eb-be88faef85e8',
]

const longIslandEvidenceCandidateIds = [
  'drafts.canonical-place-candidate-long-island-cape-santa-maria-beach',
  'drafts.canonical-place-candidate-long-island-columbus-point',
  'drafts.canonical-place-candidate-long-island-twin-churches',
]

const longIslandEvidenceFactIds = [
  'drafts.island-fact-long-island-split-live-image-provenance-boundary',
  'drafts.island-fact-long-island-catalog-legacy-overlay-quarantine-boundary',
  'drafts.island-fact-long-island-deans-blue-hole-rank-safety-boundary',
  'drafts.island-fact-long-island-conception-island-access-date-conflict-boundary',
  'drafts.island-fact-long-island-two-airport-transfer-boundary',
  'drafts.island-fact-long-island-signature-place-operation-access-boundary',
  'drafts.island-fact-long-island-provider-stay-food-inventory-boundary',
]

const longIslandEvidenceSourceIds = [
  'research-source-bmot-long-island',
  'research-source-bnt-conception-island',
  'research-source-wikimedia-long-island-iss-tidal-flats-nasa',
  'research-source-wikimedia-long-island-aerial-stehn-1989',
  'research-source-wikimedia-deans-blue-hole-engwirda',
  'research-source-wikimedia-long-island-st-pauls-stehn',
  'research-source-wikimedia-long-island-st-peter-stehn',
  'research-source-wikimedia-long-island-locator-map',
  'research-source-baha-buddy-long-island-published-hero-provenance',
  'research-source-baha-buddy-web-long-island-generated-image-provenance',
  'research-source-baha-buddy-mobile-long-island-image-provenance',
]

const longIslandImageCandidateIds = [
  'drafts.image-candidate-long-island-iss-tidal-flats-nasa',
  'drafts.image-candidate-long-island-aerial-stehn-1989',
  'drafts.image-candidate-long-island-deans-blue-hole-engwirda',
  'drafts.image-candidate-long-island-st-pauls-stehn',
  'drafts.image-candidate-long-island-st-peter-stehn',
  'drafts.image-candidate-long-island-commons-locator-map',
  'drafts.image-candidate-long-island-published-supabase-hero-provenance',
  'drafts.image-candidate-long-island-web-generated-hero-provenance',
  'drafts.image-candidate-long-island-bmot-legacy-hero-rights',
  'drafts.image-candidate-long-island-bmot-current-hero-rights',
  'drafts.image-candidate-long-island-bmot-deans-blue-hole-rights',
  'drafts.image-candidate-long-island-bmot-twin-churches-rights',
  'drafts.image-candidate-long-island-bmot-hamiltons-cave-rights',
  'drafts.image-candidate-long-island-bnt-conception-island-rights',
]

const longIslandEvidenceAuditIds = [
  'drafts.island-research-audit-2026-08-05-evidence-media-long-island',
  'drafts.island-research-audit-2026-08-04-long-island',
  'drafts.island-research-audit-2026-08-04-access-transport-long-island',
  'drafts.island-research-audit-2026-08-04-air-transport-accessibility-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-catalog-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-long-island',
  'drafts.island-research-audit-2026-08-05-signature-place-source-adjudication-long-island',
  'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-long-island',
]

/** Purpose-built desk structure for the editorial team. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Baha Buddy Content')
    .items([
      S.listItem()
        .title('Start Here')
        .child(
          S.list()
            .title('Start Here')
            .items([
              S.documentTypeListItem('contentPage').title('Pages'),
              S.documentTypeListItem('contentCollection').title('Curated Collections'),
              S.documentTypeListItem('navigation').title('Navigation Menus'),
              S.divider(),
              S.listItem()
                .id('siteSettings')
                .title('Site & App Settings')
                .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            ]),
        ),
      S.divider(),
      S.listItem()
        .id('islandResearchRepository')
        .title('Island Research Repository')
        .child(
          S.list()
            .title('Island Research Repository')
            .items([
              S.documentTypeListItem('islandResearchAudit').title('Island Coverage Audits'),
              S.documentTypeListItem('islandFact').title('Verified Island Facts'),
              S.documentTypeListItem('researchSource').title('Source Registry'),
              S.listItem()
                .id('sourceFreshnessOwnership')
                .title('Source Freshness & Ownership')
                .child(
                  S.documentList()
                    .title('Source Freshness & Ownership')
                    .schemaType('researchSource')
                    .filter('_type == "researchSource" && defined(reviewPlan)')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('sourceAttentionRequired')
                .title('Source Attention Required')
                .child(
                  S.documentList()
                    .title('Source Attention Required')
                    .schemaType('researchSource')
                    .filter('_type == "researchSource" && reviewPlan.workflowStatus in ["attention_required", "replacement_required", "overdue"]')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('sourceReplacementsRecorded')
                .title('Source Replacements Recorded')
                .child(
                  S.documentList()
                    .title('Source Replacements Recorded')
                    .schemaType('researchSource')
                    .filter('_type == "researchSource" && reviewPlan.workflowStatus == "replacement_recorded" && count(replacementSources) > 0')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('sourceRoutingGaps')
                .title('Sources Without Island Routing')
                .child(
                  S.documentList()
                    .title('Sources Without Island Routing')
                    .schemaType('researchSource')
                    .filter('_type == "researchSource" && count(destinations) == 0')
                    .defaultOrdering([{field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('imageCandidateRepository')
                .title('Image Candidate Repository')
                .child(
                  S.list()
                    .title('Image Candidate Repository')
                    .items([
                      S.listItem()
                        .id('allDraftImageCandidates')
                        .title('All Review Candidates')
                        .child(
                          S.documentList()
                            .title('All Review Image Candidates')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**")')
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('imageRightsReview')
                        .title('Rights Review')
                        .child(
                          S.documentList()
                            .title('Image Rights Review')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && rightsStatus in ["source_display_only_not_cleared", "controlled_library_asset_license_required", "permission_required"] && reviewStatus != "rejected"')
                            .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('imageEditorialReview')
                        .title('Ready for Editorial Review')
                        .child(
                          S.documentList()
                            .title('Images Ready for Editorial Review')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && reviewStatus == "ready_for_editorial_review" && approvalStatus == "research_only"')
                            .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('imageExternalOnly')
                        .title('External-only / Not Copied')
                        .child(
                          S.documentList()
                            .title('External-only Image Candidates')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && !defined(reviewImage.asset)')
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('imageRejected')
                        .title('Rejected or Unavailable')
                        .child(
                          S.documentList()
                            .title('Rejected or Unavailable Images')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && (reviewStatus == "rejected" || rightsStatus == "rejected")')
                            .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('heritageSourceReplacementEvidence')
                .title('Heritage Source Replacement Evidence')
                .child(
                  S.documentList()
                    .title('Heritage Source Replacement Evidence')
                    .schemaType('islandResearchAudit')
                    .filter('_type == "islandResearchAudit" && _id match "drafts.island-research-audit-*-source-replacement-evidence-*"')
                    .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('androsSignaturePlacePilot')
                .title('Andros Signature-Place Pilot')
                .child(
                  S.list()
                    .title('Andros Signature-Place Pilot')
                    .items([
                      S.listItem()
                        .id('androsSignaturePlaceOverlays')
                        .title('Matched Place Reviews')
                        .child(
                          S.documentList()
                            .title('Andros Matched Place Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in path("drafts.**") && destination._ref == "dest-andros" && defined(catalogReviewStatus)')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('androsMissingCanonicalCandidate')
                        .title('Missing Canonical Candidate')
                        .child(
                          S.documentList()
                            .title('Andros Missing Canonical Candidate')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && destination._ref == "dest-andros"')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('androsSignaturePlaceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Andros Signature-Place Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: androsSignaturePlaceFactIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('androsSignaturePlaceSources')
                        .title('Evidence Sources')
                        .child(
                          S.documentList()
                            .title('Andros Signature-Place Evidence Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: androsSignaturePlaceSourceIds})
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('androsSignaturePlaceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Andros Signature-Place Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in path("drafts.**") && destination._ref == "dest-andros" && (_id match "*signature-place*" || _id match "*source-freshness-owner-cadence*")')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('exumasSignaturePlacePilot')
                .title('Exumas Signature-Place & Copy Pilot')
                .child(
                  S.list()
                    .title('Exumas Signature-Place & Copy Pilot')
                    .items([
                      S.listItem()
                        .id('exumasSignaturePlaceOverlays')
                        .title('Matched Place Reviews')
                        .child(
                          S.documentList()
                            .title('Exumas Matched Place Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: exumasSignaturePlaceIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('exumasMissingCanonicalCandidate')
                        .title('Thunderball Canonical Candidate')
                        .child(
                          S.documentList()
                            .title('Thunderball Grotto Canonical Candidate')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id == "drafts.canonical-place-candidate-the-exumas-thunderball-grotto"'),
                        ),
                      S.listItem()
                        .id('exumasSignaturePlaceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Exumas Signature-Place Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: exumasSignaturePlaceFactIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('exumasSignaturePlaceSources')
                        .title('Evidence Sources')
                        .child(
                          S.documentList()
                            .title('Exumas Signature-Place Evidence Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: exumasSignaturePlaceSourceIds})
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('exumasCorrectivePigBeachDraft')
                        .title('Corrective Pig Beach Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Pig Beach Draft')
                            .schemaType('article')
                            .filter('_type == "article" && _id == "drafts.article-hardcoded-swimming-pigs-exuma"'),
                        ),
                      S.listItem()
                        .id('exumasSignaturePlaceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Exumas Signature-Place Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: exumasSignaturePlaceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('eleutheraSignaturePlacePilot')
                .title('Eleuthera Signature-Place & Copy Pilot')
                .child(
                  S.list()
                    .title('Eleuthera Signature-Place & Copy Pilot')
                    .items([
                      S.listItem()
                        .id('eleutheraSignaturePlaceOverlays')
                        .title('Matched Place Reviews')
                        .child(
                          S.documentList()
                            .title('Eleuthera Matched Place Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: eleutheraSignaturePlaceIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('eleutheraMissingCanonicalCandidates')
                        .title('Missing Canonical Candidates')
                        .child(
                          S.documentList()
                            .title('Eleuthera Missing Canonical Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: eleutheraSignaturePlaceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('eleutheraSignaturePlaceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Eleuthera Signature-Place Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: eleutheraSignaturePlaceFactIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('eleutheraSignaturePlaceSources')
                        .title('Evidence Sources')
                        .child(
                          S.documentList()
                            .title('Eleuthera Signature-Place Evidence Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: eleutheraSignaturePlaceSourceIds})
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('eleutheraCorrectivePinkSandsDraft')
                        .title('Corrective Pink Sands Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Pink Sands Draft')
                            .schemaType('article')
                            .filter('_type == "article" && _id == "drafts.article-hardcoded-pink-sand-harbour-island"'),
                        ),
                      S.listItem()
                        .id('eleutheraSignaturePlaceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Eleuthera Signature-Place Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: eleutheraSignaturePlaceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('grandBahamaSignaturePlacePilot')
                .title('Grand Bahama Signature-Place & Copy Pilot')
                .child(
                  S.list()
                    .title('Grand Bahama Signature-Place & Copy Pilot')
                    .items([
                      S.listItem()
                        .id('grandBahamaSignaturePlaceOverlays')
                        .title('Matched Place Reviews')
                        .child(
                          S.documentList()
                            .title('Grand Bahama Matched Place Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: grandBahamaSignaturePlaceIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('grandBahamaMissingCanonicalCandidates')
                        .title('Missing Canonical Candidates')
                        .child(
                          S.documentList()
                            .title('Grand Bahama Missing Canonical Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: grandBahamaSignaturePlaceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('grandBahamaSignaturePlaceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Grand Bahama Signature-Place Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: grandBahamaSignaturePlaceFactIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('grandBahamaSignaturePlaceSources')
                        .title('Evidence Sources')
                        .child(
                          S.documentList()
                            .title('Grand Bahama Signature-Place Evidence Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: grandBahamaSignaturePlaceSourceIds})
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('grandBahamaCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Grand Bahama Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-grand-bahama"'),
                        ),
                      S.listItem()
                        .id('grandBahamaSignaturePlaceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Grand Bahama Signature-Place Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: grandBahamaSignaturePlaceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('rumCaySignaturePlacePilot')
                .title('Rum Cay Signature-Place & Copy Pilot')
                .child(
                  S.list()
                    .title('Rum Cay Signature-Place & Copy Pilot')
                    .items([
                      S.listItem()
                        .id('rumCaySignaturePlaceOverlays')
                        .title('Matched & Name-Variant Reviews')
                        .child(
                          S.documentList()
                            .title('Rum Cay Matched & Name-Variant Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: rumCaySignaturePlaceIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('rumCayCanonicalCandidates')
                        .title('Canonical Reconciliation Candidates')
                        .child(
                          S.documentList()
                            .title('Rum Cay Canonical Reconciliation Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: rumCaySignaturePlaceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('rumCaySignaturePlaceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Rum Cay Signature-Place Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: rumCaySignaturePlaceFactIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('rumCaySignaturePlaceSources')
                        .title('Evidence Sources')
                        .child(
                          S.documentList()
                            .title('Rum Cay Signature-Place Evidence Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: rumCaySignaturePlaceSourceIds})
                            .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('rumCayCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Rum Cay Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-rum-cay"'),
                        ),
                      S.listItem()
                        .id('rumCaySignaturePlaceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Rum Cay Signature-Place Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: rumCaySignaturePlaceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('mayaguanaEvidenceConflictPilot')
                .title('Mayaguana Evidence & Catalog Pilot')
                .child(
                  S.list()
                    .title('Mayaguana Evidence & Catalog Pilot')
                    .items([
                      S.listItem()
                        .id('mayaguanaEvidencePlaceOverlays')
                        .title('Place & Catalog Conflict Reviews')
                        .child(
                          S.documentList()
                            .title('Mayaguana Place & Catalog Conflict Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: mayaguanaEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('mayaguanaEvidenceCandidates')
                        .title('Community & Site Candidates')
                        .child(
                          S.documentList()
                            .title('Mayaguana Community & Site Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: mayaguanaEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('mayaguanaEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Mayaguana Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: mayaguanaEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('mayaguanaEvidenceSources')
                        .title('Evidence & Conflict Sources')
                        .child(
                          S.documentList()
                            .title('Mayaguana Evidence & Conflict Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: mayaguanaEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('mayaguanaCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Mayaguana Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-mayaguana"'),
                        ),
                      S.listItem()
                        .id('mayaguanaEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Mayaguana Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: mayaguanaEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('acklinsCrookedEvidenceMediaPilot')
                .title('Acklins & Crooked Evidence + Images')
                .child(
                  S.list()
                    .title('Acklins & Crooked Evidence + Images')
                    .items([
                      S.listItem()
                        .id('acklinsCrookedPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: acklinsCrookedEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('acklinsCrookedPlaceCandidates')
                        .title('Community, Area & Site Candidates')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Community, Area & Site Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: acklinsCrookedEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('acklinsCrookedImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: acklinsCrookedImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('acklinsCrookedEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: acklinsCrookedEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('acklinsCrookedEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: acklinsCrookedEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('acklinsCrookedCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Acklins & Crooked Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-acklins-crooked-island"'),
                        ),
                      S.listItem()
                        .id('acklinsCrookedEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Acklins & Crooked Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: acklinsCrookedEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('raggedIslandEvidenceMediaPilot')
                .title('Ragged Island Evidence + Images')
                .child(
                  S.list()
                    .title('Ragged Island Evidence + Images')
                    .items([
                      S.listItem()
                        .id('raggedIslandPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Ragged Island Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: raggedIslandEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('raggedIslandPlaceCandidates')
                        .title('Community, Operator & Site Candidates')
                        .child(
                          S.documentList()
                            .title('Ragged Island Community, Operator & Site Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: raggedIslandEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('raggedIslandImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Ragged Island Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: raggedIslandImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('raggedIslandEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Ragged Island Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: raggedIslandEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('raggedIslandEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Ragged Island Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: raggedIslandEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('raggedIslandCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Ragged Island Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-ragged-island"'),
                        ),
                      S.listItem()
                        .id('raggedIslandEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Ragged Island Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: raggedIslandEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('berryIslandsEvidenceMediaPilot')
                .title('Berry Islands Evidence + Images')
                .child(
                  S.list()
                    .title('Berry Islands Evidence + Images')
                    .items([
                      S.listItem()
                        .id('berryIslandsPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Berry Islands Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: berryIslandsEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('berryIslandsPlaceCandidates')
                        .title('Cay & Beach Candidates')
                        .child(
                          S.documentList()
                            .title('Berry Islands Cay & Beach Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: berryIslandsEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('berryIslandsImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Berry Islands Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: berryIslandsImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('berryIslandsEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Berry Islands Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: berryIslandsEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('berryIslandsEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Berry Islands Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: berryIslandsEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('berryIslandsCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Berry Islands Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-berry-islands"'),
                        ),
                      S.listItem()
                        .id('berryIslandsEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Berry Islands Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: berryIslandsEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('inaguaEvidenceMediaPilot')
                .title('Inagua Evidence + Images')
                .child(
                  S.list()
                    .title('Inagua Evidence + Images')
                    .items([
                      S.listItem()
                        .id('inaguaPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Inagua Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: inaguaEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('inaguaPlaceCandidates')
                        .title('Park & Lighthouse Candidates')
                        .child(
                          S.documentList()
                            .title('Inagua Park & Lighthouse Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: inaguaEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('inaguaImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Inagua Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: inaguaImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('inaguaEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Inagua Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: inaguaEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('inaguaEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Inagua Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: inaguaEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('inaguaCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Inagua Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-inagua"'),
                        ),
                      S.listItem()
                        .id('inaguaEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Inagua Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: inaguaEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('nassauEvidenceMediaPilot')
                .title('Nassau Evidence + Images')
                .child(
                  S.list()
                    .title('Nassau & Paradise Island Evidence + Images')
                    .items([
                      S.listItem()
                        .id('nassauPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Nassau Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: nassauEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('nassauPlaceCandidates')
                        .title('Signature Place Candidates')
                        .child(
                          S.documentList()
                            .title('Nassau Signature Place Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: nassauEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('nassauImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Nassau Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: nassauImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('nassauEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Nassau Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: nassauEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('nassauEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Nassau Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: nassauEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('nassauCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Nassau Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-nassau"'),
                        ),
                      S.listItem()
                        .id('nassauEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Nassau Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: nassauEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('longIslandEvidenceMediaPilot')
                .title('Long Island Evidence + Images')
                .child(
                  S.list()
                    .title('Long Island Evidence + Images')
                    .items([
                      S.listItem()
                        .id('longIslandPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Long Island Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in $ids')
                            .params({ids: longIslandEvidencePlaceIds})
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('longIslandPlaceCandidates')
                        .title('Signature Place Candidates')
                        .child(
                          S.documentList()
                            .title('Long Island Signature Place Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in $ids')
                            .params({ids: longIslandEvidenceCandidateIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('longIslandImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Long Island Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in $ids')
                            .params({ids: longIslandImageCandidateIds})
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('longIslandEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Long Island Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in $ids')
                            .params({ids: longIslandEvidenceFactIds})
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('longIslandEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Long Island Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && _id in $ids')
                            .params({ids: longIslandEvidenceSourceIds})
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('longIslandCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Long Island Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-long-island"'),
                        ),
                      S.listItem()
                        .id('longIslandEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Long Island Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in $ids')
                            .params({ids: longIslandEvidenceAuditIds})
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('catIslandEvidenceMediaPilot')
                .title('Cat Island Evidence + Images')
                .child(
                  S.list()
                    .title('Cat Island Evidence + Images')
                    .items([
                      S.listItem()
                        .id('catIslandPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('Cat Island Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in path("drafts.**") && destination._ref == "dest-cat-island"')
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('catIslandPlaceCandidates')
                        .title('Signature Place Candidates')
                        .child(
                          S.documentList()
                            .title('Cat Island Signature Place Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && destination._ref == "dest-cat-island"')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('catIslandImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('Cat Island Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && destination._ref == "dest-cat-island"')
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('catIslandEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('Cat Island Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in path("drafts.**") && destination._ref == "dest-cat-island"')
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('catIslandEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('Cat Island Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && references("dest-cat-island")')
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('catIslandCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective Cat Island Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-cat-island"'),
                        ),
                      S.listItem()
                        .id('catIslandEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('Cat Island Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in path("drafts.**") && destination._ref == "dest-cat-island"')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('sanSalvadorEvidenceMediaPilot')
                .title('San Salvador Evidence + Images')
                .child(
                  S.list()
                    .title('San Salvador Evidence + Images')
                    .items([
                      S.listItem()
                        .id('sanSalvadorPlaceReviews')
                        .title('Place & Catalog Reviews')
                        .child(
                          S.documentList()
                            .title('San Salvador Place & Catalog Reviews')
                            .schemaType('placeEditorial')
                            .filter('_type == "placeEditorial" && _id in path("drafts.**") && destination._ref == "dest-san-salvador"')
                            .defaultOrdering([{field: 'catalogReviewStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('sanSalvadorPlaceCandidates')
                        .title('Signature Place Candidates')
                        .child(
                          S.documentList()
                            .title('San Salvador Signature Place Candidates')
                            .schemaType('canonicalPlaceCandidate')
                            .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && destination._ref == "dest-san-salvador"')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('sanSalvadorImageCandidates')
                        .title('Image Candidates & Rights')
                        .child(
                          S.documentList()
                            .title('San Salvador Image Candidates & Rights')
                            .schemaType('imageCandidate')
                            .filter('_type == "imageCandidate" && _id in path("drafts.**") && destination._ref == "dest-san-salvador"')
                            .defaultOrdering([{field: 'rightsStatus', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('sanSalvadorEvidenceFacts')
                        .title('Evidence Facts')
                        .child(
                          S.documentList()
                            .title('San Salvador Evidence Facts')
                            .schemaType('islandFact')
                            .filter('_type == "islandFact" && _id in path("drafts.**") && destination._ref == "dest-san-salvador"')
                            .defaultOrdering([{field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('sanSalvadorEvidenceSources')
                        .title('Evidence & Image Sources')
                        .child(
                          S.documentList()
                            .title('San Salvador Evidence & Image Sources')
                            .schemaType('researchSource')
                            .filter('_type == "researchSource" && references("dest-san-salvador")')
                            .defaultOrdering([{field: 'status', direction: 'desc'}, {field: 'nextReviewAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('sanSalvadorCorrectiveDestinationDraft')
                        .title('Corrective Destination Draft')
                        .child(
                          S.documentList()
                            .title('Corrective San Salvador Destination Draft')
                            .schemaType('destination')
                            .filter('_type == "destination" && _id == "drafts.dest-san-salvador"'),
                        ),
                      S.listItem()
                        .id('sanSalvadorEvidenceAudits')
                        .title('Audits & Open Gates')
                        .child(
                          S.documentList()
                            .title('San Salvador Audits & Open Gates')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && _id in path("drafts.**") && destination._ref == "dest-san-salvador"')
                            .defaultOrdering([{field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('officialExperienceThemeReview')
                .title('Official Experience Theme Review')
                .child(
                  S.documentList()
                    .title('Official Experience Theme Review')
                    .schemaType('islandFact')
                    .filter('_type == "islandFact" && _id match "drafts.island-fact-official-experience-theme-*"')
                    .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('officialCultureNatureReview')
                .title('Official Culture & Nature Review')
                .child(
                  S.documentList()
                    .title('Official Culture & Nature Review')
                    .schemaType('islandFact')
                    .filter('_type == "islandFact" && _id match "drafts.island-fact-official-topic-baseline-*"')
                    .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'topic', direction: 'asc'}]),
                ),
              S.listItem()
                .id('officialFoodReview')
                .title('Official Food Review')
                .child(
                  S.documentList()
                    .title('Official Food Review')
                    .schemaType('islandFact')
                    .filter('_type == "islandFact" && _id match "drafts.island-fact-official-food-baseline-*"')
                    .defaultOrdering([{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('p0DeliveryWorkstreams')
                .title('P0 Delivery Workstreams')
                .child(
                  S.list()
                    .title('P0 Delivery Workstreams')
                    .items([
                      S.listItem()
                        .id('allP0DeliveryAudits')
                        .title('All P0 Audit Layers')
                        .child(
                          S.documentList()
                            .title('All P0 Audit Layers')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"]]) > 0')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('p0EmergencySafety')
                        .title('1 · Emergency & Safety')
                        .child(
                          S.documentList()
                            .title('P0 Emergency & Safety')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"]]) > 0 && (_id match "drafts.island-research-audit-*-medical-access-*" || _id match "drafts.island-research-audit-*-emergency-readiness-*" || _id match "drafts.island-research-audit-*-local-authority-routing-*" || _id match "drafts.island-research-audit-*-police-response-facility-coverage-*" || _id match "drafts.island-research-audit-*-marine-search-rescue-facility-coverage-*" || _id match "drafts.island-research-audit-*-airport-fire-ems-facility-coverage-*" || _id match "drafts.island-research-audit-*-hurricane-shelter-facility-coverage-*" || _id match "drafts.island-research-audit-*-shelter-inspection-governance-and-activation-*")')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('emergencyAuthorityEvidenceRequests')
                        .title('1A · Authority Evidence Requests')
                        .child(
                          S.documentList()
                            .title('Emergency Authority Evidence Requests')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"] && title in $titles]) > 0')
                            .params({titles: emergencyAuthorityGapTitles})
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('p0AccessTransport')
                        .title('2 · Access & Transport')
                        .child(
                          S.documentList()
                            .title('P0 Access & Transport')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"]]) > 0 && (_id match "drafts.island-research-audit-*-access-transport-*" || _id match "drafts.island-research-audit-*-scheduled-air-operator-coverage-*" || _id match "drafts.island-research-audit-*-scheduled-marine-operator-coverage-*" || _id match "drafts.island-research-audit-*-licensed-arrival-ground-transfer-*" || _id match "drafts.island-research-audit-*-air-transport-accessibility-*" || _id match "drafts.island-research-audit-*-seasonality-weather-*")')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('p0CanonicalPlaces')
                        .title('3 · Canonical Places')
                        .child(
                          S.documentList()
                            .title('P0 Canonical Places')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"]]) > 0 && (_id match "drafts.island-research-audit-*-quality-*" || _id match "drafts.island-research-audit-*-signature-place-*" || _id match "drafts.island-research-audit-*-operator-reconciliation-*" || _id match "drafts.island-research-audit-*-catalog-adjudication-*" || _id match "drafts.island-research-audit-*-coordinate-closure-*" || _id match "drafts.island-research-audit-*-operation-evidence-*" || _id match "drafts.island-research-audit-*-source-replacement-evidence-*")')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('p0ProviderEditorial')
                        .title('4 · Provider & Editorial')
                        .child(
                          S.documentList()
                            .title('P0 Provider & Editorial')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && status in ["open", "researching"]]) > 0 && (_id match "drafts.island-research-audit-*-official-experience-theme-baseline-*" || _id match "drafts.island-research-audit-*-official-culture-nature-baseline-*" || _id match "drafts.island-research-audit-*-official-food-baseline-*" || _id match "drafts.island-research-audit-*-signature-place-content-readiness-*")')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                      S.listItem()
                        .id('p0Accessibility')
                        .title('5 · Accessibility')
                        .child(
                          S.documentList()
                            .title('P0 Accessibility')
                            .schemaType('islandResearchAudit')
                            .filter('_type == "islandResearchAudit" && count(gaps[priority == "p0" && topic == "accessibility" && status in ["open", "researching"]]) > 0')
                            .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                        ),
                    ]),
                ),
              S.documentTypeListItem('emergencyFacility').title('Emergency Facilities'),
              S.documentTypeListItem('canonicalPlaceCandidate').title('Missing Canonical Place Candidates'),
              S.divider(),
              S.listItem()
                .id('auditsInProgress')
                .title('Audits In Progress')
                .child(
                  S.documentList()
                    .title('Audits In Progress')
                    .filter('_type == "islandResearchAudit" && status in ["baseline", "researching", "editorial_review"]')
                    .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}]),
                ),
              S.listItem()
                .id('auditsDue')
                .title('Audits Due')
                .child(
                  S.documentList()
                    .title('Audits Due')
                    .filter('_type == "islandResearchAudit" && defined(nextAuditAt) && nextAuditAt < now()')
                    .defaultOrdering([{field: 'nextAuditAt', direction: 'asc'}]),
                ),
              S.listItem()
                .id('factsAwaitingApproval')
                .title('Facts Awaiting Approval')
                .child(
                  S.documentList()
                    .title('Facts Awaiting Approval')
                    .filter('_type == "islandFact" && verificationStatus != "approved" && verificationStatus != "retired"')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}]),
                ),
              S.listItem()
                .id('factsNeedingRecheck')
                .title('Facts Needing Recheck')
                .child(
                  S.documentList()
                    .title('Facts Needing Recheck')
                    .filter('_type == "islandFact" && verificationStatus != "retired" && nextReviewAt < now()')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}]),
                ),
              S.listItem()
                .id('placeDraftsAwaitingReview')
                .title('Place Drafts Awaiting Review')
                .child(
                  S.documentList()
                    .title('Place Drafts Awaiting Review')
                    .filter('_type == "placeEditorial" && _id in path("drafts.**") && active == false && count(channels) == 0')
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .id('signaturePlaceCatalogReview')
                .title('Official Signature Place Review')
                .child(
                  S.documentList()
                    .title('Official Signature Place Review')
                    .schemaType('placeEditorial')
                    .filter('_type == "placeEditorial" && _id in path("drafts.**") && defined(catalogReviewStatus) && catalogReviewStatus != "approved" && catalogReviewStatus != "rejected"')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('signaturePlaceLocationCandidates')
                .title('Signature Place Location Candidates')
                .child(
                  S.documentList()
                    .title('Signature Place Location Candidates')
                    .schemaType('placeEditorial')
                    .filter('_type == "placeEditorial" && _id in path("drafts.**") && catalogLocationReview.reviewDecision == "pending" && count(catalogLocationReview.candidates) > 0 && catalogLocationReview.reconciliationStatus in ["official_point_candidate", "official_points_consistent"]')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('signaturePlaceLocationGaps')
                .title('Signature Place Location Conflicts & Gaps')
                .child(
                  S.documentList()
                    .title('Signature Place Location Conflicts & Gaps')
                    .schemaType('placeEditorial')
                    .filter('_type == "placeEditorial" && _id in path("drafts.**") && defined(catalogLocationReview.reconciliationStatus) && !(catalogLocationReview.reconciliationStatus in ["official_point_candidate", "official_points_consistent"])')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('missingCanonicalPlaceCandidates')
                .title('Missing Canonical Place Candidates')
                .child(
                  S.documentList()
                    .title('Missing Canonical Place Candidates')
                    .schemaType('canonicalPlaceCandidate')
                    .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && canonicalCreationStatus in ["researching", "editorial_review"]')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('missingCanonicalPlaceLocationGaps')
                .title('Candidate Location Conflicts & Gaps')
                .child(
                  S.documentList()
                    .title('Candidate Location Conflicts & Gaps')
                    .schemaType('canonicalPlaceCandidate')
                    .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && !(locationReview.reconciliationStatus in ["official_point_candidate", "official_points_consistent"])')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('signaturePlaceSourceAdjudication')
                .title('Signature Place Source Adjudication')
                .child(
                  S.documentList()
                    .title('Signature Place Source Adjudication')
                    .schemaType('canonicalPlaceCandidate')
                    .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && defined(sourceAdjudicationStatus)')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('signaturePlaceTravelerReadiness')
                .title('Signature Place Traveler Readiness')
                .child(
                  S.documentList()
                    .title('Signature Place Traveler Readiness')
                    .schemaType('canonicalPlaceCandidate')
                    .filter('_type == "canonicalPlaceCandidate" && _id in path("drafts.**") && defined(travelerReadinessReview)')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('matchedSignaturePlaceTravelerReadiness')
                .title('Matched Place Traveler Readiness')
                .child(
                  S.documentList()
                    .title('Matched Place Traveler Readiness')
                    .schemaType('placeEditorial')
                    .filter('_type == "placeEditorial" && _id in path("drafts.**") && defined(catalogTravelerReadinessReview)')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('signaturePlaceContentReadiness')
                .title('Signature Place Content Readiness')
                .child(
                  S.documentList()
                    .title('Signature Place Content Readiness')
                    .filter('_type in ["canonicalPlaceCandidate", "placeEditorial"] && _id in path("drafts.**") && (defined(contentReadinessReview) || defined(catalogContentReadinessReview))')
                    .defaultOrdering([{field: 'islandName', direction: 'asc'}, {field: 'title', direction: 'asc'}]),
                ),
              S.listItem()
                .id('emergencyFacilitiesAwaitingReview')
                .title('Emergency Facilities Awaiting Review')
                .child(
                  S.documentList()
                    .title('Emergency Facilities Awaiting Review')
                    .filter('_type == "emergencyFacility" && verificationStatus != "approved" && verificationStatus != "retired"')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'sourceEntryNumber', direction: 'asc'}]),
                ),
              S.listItem()
                .id('emergencyFacilitiesNeedingRecheck')
                .title('Emergency Facilities Needing Recheck')
                .child(
                  S.documentList()
                    .title('Emergency Facilities Needing Recheck')
                    .filter('_type == "emergencyFacility" && verificationStatus != "retired" && nextReviewAt < now()')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}, {field: 'sourceEntryNumber', direction: 'asc'}]),
                ),
              S.listItem()
                .id('emergencyFacilityLocationCandidates')
                .title('Shelter Location Candidates')
                .child(
                  S.documentList()
                    .title('Shelter Location Candidates')
                    .filter('_type == "emergencyFacility" && historicalLocationReview.reviewDecision == "pending" && defined(historicalLocationReview.candidateLocation)')
                    .defaultOrdering([{field: 'sourceEntryNumber', direction: 'asc'}]),
                ),
              S.listItem()
                .id('emergencyFacilityLocationGaps')
                .title('Shelter Location Gaps')
                .child(
                  S.documentList()
                    .title('Shelter Location Gaps')
                    .filter('_type == "emergencyFacility" && historicalLocationReview.reconciliationStatus in ["conflict_or_ambiguous", "matched_without_coordinates", "unmatched"]')
                    .defaultOrdering([{field: 'sourceEntryNumber', direction: 'asc'}]),
                ),
              S.listItem()
                .id('sourcesNeedingRecheck')
                .title('Sources Needing Recheck')
                .child(
                  S.documentList()
                    .title('Sources Needing Recheck')
                    .filter('_type == "researchSource" && (status == "needs_recheck" || nextReviewAt < now() || reviewPlan.workflowStatus in ["replacement_required", "overdue"])')
                    .defaultOrdering([{field: 'nextReviewAt', direction: 'asc'}]),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Content Migration')
        .child(
          S.list()
            .title('Content Migration')
            .items([
              S.documentTypeListItem('legacyCopyInventory').title('Hardcoded Copy Inventory'),
              S.documentTypeListItem('placeEditorial').title('Supabase Place Overlays'),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Guides & Planning')
        .child(
          S.list()
            .title('Guides & Planning')
            .items([
              S.documentTypeListItem('article').title('Articles & Guides'),
              S.documentTypeListItem('itinerary').title('Editorial Itineraries'),
              S.documentTypeListItem('tip').title('Travel Tips'),
              S.documentTypeListItem('faq').title('FAQs'),
              S.documentTypeListItem('author').title('Authors'),
            ]),
        ),
      S.listItem()
        .title('Islands & Experiences')
        .child(
          S.list()
            .title('Islands & Experiences')
            .items([
              S.documentTypeListItem('destination').title('Destinations'),
              S.documentTypeListItem('placeEditorial').title('Place Editorial Overlays'),
              S.documentTypeListItem('experience').title('Editorial Experiences'),
              S.documentTypeListItem('guidedTour').title('Guided Tours'),
            ]),
        ),
      S.listItem()
        .title('Campaigns & Community')
        .child(
          S.list()
            .title('Campaigns & Community')
            .items([
              S.documentTypeListItem('deal').title('Editorial Deals'),
              S.documentTypeListItem('socialVideo').title('Social Videos'),
              S.documentTypeListItem('travelerStory').title('Traveler Stories'),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Recently Updated')
        .child(
          S.documentList()
            .title('Recently Updated')
            .filter('_type in $types')
            .params({
              types: [
                'article',
                'author',
                'contentCollection',
                'contentPage',
                'deal',
                'destination',
                'emergencyFacility',
                'experience',
                'faq',
                'guidedTour',
                'itinerary',
                'islandFact',
                'islandResearchAudit',
                'legacyCopyInventory',
                'navigation',
                'placeEditorial',
                'siteSettings',
                'socialVideo',
                'tip',
                'travelerStory',
                'researchSource',
              ],
            })
            .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
        ),
    ])
