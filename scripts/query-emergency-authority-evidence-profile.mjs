import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const outputPath = '/private/tmp/baha-buddy-emergency-authority-evidence-profile.json'

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

const gapDefinitions = [
  {
    title: 'Current 2026 inspection, suitability assessment, and shelter grade remain unverified',
    packetIds: ['drm_shelter_evacuation'],
    evidenceFields: ['facility_identity', 'inspection_date', 'inspecting_agencies', 'standard_version', 'structural_result', 'hazard_suitability', 'sanitation_result', 'security_result', 'accessibility_review', 'maximum_usable_capacity_and_method', 'grade', 'defects_and_restrictions', 'repair_and_reinspection_status', 'approval_and_supersession'],
  },
  {
    title: 'Current activation decision, evacuation order, and transport remain runtime-only',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration'],
    evidenceFields: ['exact_island_cay_settlement', 'decision_authority', 'activation_or_closure_state', 'order_issued_at_and_expiry', 'alert_route', 'catchment', 'assembly_points', 'ground_marine_air_transport', 'accessible_transport', 'timing_and_manifest_rules', 'weather_tide_road_limits', 'receiving_shelter_or_host_island', 'priority_and_medical_device_rules', 'fallback'],
  },
  {
    title: 'Current aerodrome RFFS readiness remains unverified',
    packetIds: ['caab_rffs'],
    evidenceFields: ['aerodrome_and_operator', 'current_aip_revision', 'published_rffs_category', 'active_flight_window', 'alert_receiver', 'station_and_appliances', 'agent_and_rescue_equipment', 'minimum_crew', 'last_response_test', 'difficult_terrain_or_water_rescue', 'structural_or_wildfire_handoff', 'ems_and_clinic_handoff', 'mutual_aid_and_fallback'],
  },
  {
    title: 'Current EMS dispatch and ambulance availability remain unverified',
    packetIds: ['pha_nems_medical'],
    evidenceFields: ['exact_service_area', 'public_dispatch_route', 'network_coverage_and_outage_fallback', 'ambulance_or_transport_base', 'vehicle_and_crew', 'operating_window', 'equipment_level', 'first_responder_programme', 'mobilization_and_travel_time_basis', 'clinic_rendezvous', 'receiving_hospital', 'medevac_trigger', 'weather_limits', 'accessibility_and_communication_accommodation'],
  },
  {
    title: 'Current evacuation route, assembly point, and transport remain unverified',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration'],
    evidenceFields: ['exact_origin', 'responsible_authority', 'alert_method', 'primary_and_alternate_routes', 'road_bridge_dock_airfield_dependencies', 'assembly_point', 'vehicle_vessel_or_aircraft', 'driver_or_crew_and_fuel', 'accessible_boarding_and_seating', 'weather_and_tide_limits', 'timing', 'receiving_facility', 'stranded_traveler_fallback'],
  },
  {
    title: 'Current marine distress route and communications remain unverified',
    packetIds: ['rbdf_rbpf_marine'],
    evidenceFields: ['authority_approved_public_distress_routes', 'telephone_and_vhf_monitoring_status', 'coverage_and_outage_limits', 'caller_location_method', 'responsible_watch_center', 'escalation_chain', 'island_or_cay_asset_or_regional_response', 'crew_fuel_and_launch_window', 'weather_and_sea_limits', 'estimated_time_basis', 'dock_clinic_or_ems_handoff', 'fallback'],
  },
  {
    title: 'Current shelter activation, condition, and usable capacity remain unverified',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration'],
    evidenceFields: ['facility_identity', 'current_open_closed_or_standby_state', 'activation_authority_and_time', 'inspection_and_condition', 'hazard_suitability', 'actual_usable_capacity', 'staffing', 'water_power_sanitation_food_and_supplies', 'communications', 'security', 'medical_support', 'accessibility_features', 'opening_and_closing_rules', 'fallback'],
  },
  {
    title: 'Current shelter inventory is not safe to reuse as complete',
    packetIds: ['drm_shelter_evacuation'],
    evidenceFields: ['complete_current_facility_list', 'island_cay_settlement', 'canonical_facility_name', 'address_or_authority_coordinates', 'designation', 'current_status', 'usable_capacity', 'inspection_or_grade_reference', 'services', 'accessibility_features', 'pet_and_service_animal_policy', 'publication_date', 'version_and_supersession'],
  },
  {
    title: 'Live ICC activation and public contact remain unverified',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration'],
    evidenceFields: ['icc_name_and_region', 'exact_service_area', 'activation_state', 'activated_at_and_expiry', 'responsible_officer_role', 'public_contact_route', 'hours_and_staffing', 'telephone_radio_satellite_or_digital_fallback', 'accessibility_accommodation', 'escalation_path', 'source_update_time'],
  },
  {
    title: 'Local response and evacuation capability remain unverified',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration', 'pha_nems_medical', 'rbdf_rbpf_marine'],
    evidenceFields: ['exact_island_cay_settlement', 'police_response', 'structural_and_wildfire_response', 'medical_and_first_response', 'marine_and_air_response', 'shelter_and_safer_location', 'road_dock_airfield_dependencies', 'receiving_facilities', 'mutual_aid', 'weather_limits', 'communications_fallback', 'realistic_response_time_basis', 'accessible_response_and_transport'],
  },
  {
    title: 'Local response and evacuation path remains unverified',
    packetIds: ['drm_shelter_evacuation', 'local_icc_administration', 'pha_nems_medical', 'rbdf_rbpf_marine'],
    evidenceFields: ['exact_island_cay_settlement', 'accountable_local_response', 'nearest_activated_safer_location', 'clinic_or_hospital_route', 'ground_marine_or_air_transport', 'receiving_facility', 'medevac_or_host_island_trigger', 'weather_limits', 'communications_fallback', 'accessible_transfer', 'last_verified_at'],
  },
]

const requestPackets = [
  {
    id: 'drm_shelter_evacuation',
    label: 'DRM shelter, evacuation, activation and national coordination evidence',
    lead: 'Bahamas Disaster Risk Management Authority',
    supportingAuthorities: ['Ministry of Public Works', 'Department of Environmental Health Services', 'Department of Social Services Disaster Management Unit', 'Family Island Administrators and Incident Coordination Centres', 'facility owners'],
    officialRoute: {url: 'https://drm.gov.bs/contact-us/', type: 'general_inquiry', emergencyDispatch: false, descriptor: 'connect@drm.gov.bs; Monday–Friday, 8:00 am–5:00 pm'},
    routeBoundary: 'General inquiry and collaboration route only. It may take time, prohibits sensitive information in the form, and is not emergency dispatch.',
    sourceIds: [
      'research-source-drm-live-alerts',
      'research-source-drm-2026-hurricane-shelters',
      'research-source-drm-official-2026-emergency-shelter-list-pdf',
      'research-source-drm-national-humanitarian-assistance-standards-2025',
      'research-source-drm-shelter-inspection-grading-programme',
      'research-source-drm-national-disaster-coordination-protocols',
      'research-source-drm-fidep-local-response-asset-standard',
      'research-source-rgd-family-island-administration-offices',
    ],
  },
  {
    id: 'local_icc_administration',
    label: 'Family Island ICC and administration evidence',
    lead: 'DRM Authority with the responsible Family Island Administrator or New Providence coordination lead',
    supportingAuthorities: ['Department of Local Government', 'responsible district councils', 'local emergency-support agencies'],
    officialRoute: {url: 'https://drm.gov.bs/contact-us/', type: 'general_inquiry', emergencyDispatch: false, descriptor: 'Request authority routing through DRM; do not infer emergency status from the Registrar General service directory'},
    routeBoundary: 'The existing Family Island office directory is an administrative-service lead, not a live ICC directory or emergency-dispatch promise.',
    sourceIds: ['research-source-drm-national-disaster-coordination-protocols', 'research-source-rgd-family-island-administration-offices'],
  },
  {
    id: 'caab_rffs',
    label: 'Aerodrome rescue and firefighting evidence',
    lead: 'Civil Aviation Authority Bahamas — Aerodromes and Ground Aids',
    supportingAuthorities: ['Airport Authority of The Bahamas', 'Department of Aviation', 'responsible aerodrome operator', 'NEMS or local first response'],
    officialRoute: {url: 'https://caabahamas.com/contact/', type: 'technical_evidence_request', emergencyDispatch: false, descriptor: 'CAA-B general office/contact form; Monday–Friday, 9:00 am–5:00 pm'},
    routeBoundary: 'Request routing to Aerodromes and Ground Aids. Do not store personal cell numbers from the department directory or treat the office route as airport emergency dispatch.',
    sourceIds: [
      'research-source-caab-rffs-standard',
      'research-source-caab-government-aerodrome-rffs-register',
      'research-source-caab-government-aerodromes-2026',
      'research-source-airport-authority-rff-service-footprint',
      'research-source-doa-airport-emergency-contact-review',
    ],
  },
  {
    id: 'pha_nems_medical',
    label: 'NEMS dispatch, ambulance and receiving-facility evidence',
    lead: 'Public Hospitals Authority / National Emergency Medical Services',
    supportingAuthorities: ['Ministry of Health and Wellness', 'Family Island health clinics', 'Rand Memorial Hospital and Princess Margaret Hospital as applicable', 'local first responders'],
    officialRoute: {url: 'https://www.govnet.bs/wps/portal/public/gov/government/contacts/', type: 'general_inquiry', emergencyDispatch: false, descriptor: 'Government contact directory for PHA corporate routing; ask for the accountable NEMS liaison'},
    routeBoundary: 'Corporate inquiry route only. The current repository system description is a historical responsibility lead; it does not prove the current fleet, bases, coverage, or response times.',
    sourceIds: [
      'research-source-pha-nems-ambulance-system-snapshot',
      'research-source-moh-family-islands-health-clinics',
      'research-source-moh-new-providence-health-clinics',
      'research-source-drm-emergency-numbers',
      'research-source-rbpf-national-district-emergency-baseline',
    ],
  },
  {
    id: 'rbdf_rbpf_marine',
    label: 'Marine distress, police routing and interagency handoff evidence',
    lead: 'Royal Bahamas Defence Force Operations/Search and Rescue with Royal Bahamas Police Force emergency dispatch',
    supportingAuthorities: ['DRM Authority', 'Port Department', 'local police divisions', 'NEMS and receiving clinics'],
    officialRoute: {url: 'https://rbdf.gov.bs/contact-us/', type: 'public_emergency_route_and_general_contact', emergencyDispatch: true, descriptor: 'Official page currently publishes Search & Rescue at (242) 362-3816, Harbour Control on VHF Channel 16, and 919/911 for police emergencies'},
    routeBoundary: 'The national public route is verified. Island/cay radio and telephone coverage, outage fallback, caller location, responsible asset, launch readiness, response time, and medical handoff remain evidence gaps.',
    sourceIds: [
      'research-source-rbdf-public-sar-contact-2026',
      'research-source-rbdf-national-search-rescue-protocols',
      'research-source-rbdf-operations-satellite-base-directory',
      'research-source-rbdf-sarops-rcc-status-2025',
      'research-source-rbpf-national-district-emergency-baseline',
      'research-source-rbpf-police-telephone-directory-partial',
      'research-source-rbpf-family-islands-division-directory',
      'research-source-rbpf-northern-bahamas-division-directory',
    ],
  },
]

function normalized(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function auditLayer(id) {
  for (const layer of layerOrder.slice(1)) {
    if (id.includes(`-${layer}-`)) return layer
  }
  return 'baseline'
}

const requestedSourceIds = [...new Set(requestPackets.flatMap((packet) => packet.sourceIds))]
const [audits, sources] = await Promise.all([
  client.fetch(`*[_type == "islandResearchAudit" && _id match "drafts.*"] {
    _id, _updatedAt, auditedAt, title,
    "destinationSlug": destination->islandId,
    "destinationName": destination->name,
    gaps[] {topic, priority, title, action, status}
  }`),
  client.fetch(`*[_type == "researchSource" && _id in $ids] | order(_id asc) {
    _id, title, url, publisher, sourceClass, authorityLevel, status, checkedAt, nextReviewAt,
    "destinationCount": count(destinations), topics,
    reviewPlan{reviewOwner, workflowStatus, freshnessStatus, cadenceBand, cadenceDays, sourceRelationship, verificationMethod}
  }`, {ids: requestedSourceIds}),
])

const rawRows = audits.flatMap((audit) => (audit.gaps || []).map((gap) => ({
  destinationSlug: audit.destinationSlug,
  destinationName: audit.destinationName,
  auditId: audit._id,
  auditTitle: audit.title,
  auditedAt: audit.auditedAt,
  updatedAt: audit._updatedAt,
  layer: auditLayer(audit._id),
  layerRank: layerOrder.indexOf(auditLayer(audit._id)),
  ...gap,
})))

const latestByExactTitle = new Map()
for (const row of rawRows) {
  const key = [row.destinationSlug, row.topic, normalized(row.title)].join('|')
  const current = latestByExactTitle.get(key)
  if (!current || row.layerRank > current.layerRank || (row.layerRank === current.layerRank && row.updatedAt > current.updatedAt)) {
    latestByExactTitle.set(key, row)
  }
}

const expectedTitles = new Set(gapDefinitions.map((gap) => gap.title))
const rows = [...latestByExactTitle.values()]
  .filter((row) => expectedTitles.has(row.title) && row.priority === 'p0' && ['open', 'researching'].includes(row.status))
  .sort((left, right) => left.title.localeCompare(right.title) || left.destinationSlug.localeCompare(right.destinationSlug))

const rowsByTitle = new Map()
for (const row of rows) {
  const group = rowsByTitle.get(row.title) || []
  group.push(row)
  rowsByTitle.set(row.title, group)
}

const sourceById = new Map(sources.map((source) => [source._id, source]))
const patterns = gapDefinitions.map((definition) => {
  const items = rowsByTitle.get(definition.title) || []
  return {
    ...definition,
    occurrences: items.length,
    islandCount: new Set(items.map((item) => item.destinationSlug)).size,
    islands: items.map(({destinationSlug, destinationName, auditId, layer, topic, action, status}) => ({destinationSlug, destinationName, auditId, layer, topic, action, status})),
  }
})

const islands = [...new Map(rows.map((row) => [row.destinationSlug, {slug: row.destinationSlug, name: row.destinationName}])).values()]
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((island) => ({
    ...island,
    recurringGapCount: rows.filter((row) => row.destinationSlug === island.slug).length,
    evidenceWorksheetFields: ['exact_island', 'exact_cay_or_settlement', 'responsible_authority', 'named_facility_or_asset', 'public_contact_or_alert_route', 'operating_or_activation_state', 'effective_at', 'expires_or_review_by', 'coverage_and_limits', 'accessibility', 'fallback', 'source_document_or_authority_signoff'],
  }))

const packetProfiles = requestPackets.map((packet) => ({
  ...packet,
  gaps: gapDefinitions.filter((gap) => gap.packetIds.includes(packet.id)).map((gap) => gap.title),
  sources: packet.sourceIds.map((id) => sourceById.get(id) || {_id: id, missing: true}),
}))

const guardrails = {
  exactlyElevenRecurringPatterns: patterns.length === 11,
  everyPatternOccursOnAllSixteenIslands: patterns.every((pattern) => pattern.occurrences === 16 && pattern.islandCount === 16),
  exactlyOneHundredSeventySixRolledUpRows: rows.length === 176,
  allSixteenIslandGroupsRepresented: islands.length === 16 && islands.every((island) => island.recurringGapCount === 11),
  everyPatternHasEvidenceFields: patterns.every((pattern) => pattern.evidenceFields.length >= 10),
  everyPatternHasAnAuthorityPacket: patterns.every((pattern) => pattern.packetIds.length > 0 && pattern.packetIds.every((id) => requestPackets.some((packet) => packet.id === id))),
  everyRequiredRepositorySourceExists: requestedSourceIds.every((id) => sourceById.has(id)),
  everyRepositorySourceIsPrimaryGovernmentEvidence: sources.every((source) => source.sourceClass === 'government' && source.authorityLevel === 'primary'),
  noRejectedOrUnavailableSourcesUsed: sources.every((source) => !['rejected', 'unavailable'].includes(source.status)),
  everySourceHasOwnerAndCadence: sources.every((source) => source.reviewPlan?.reviewOwner === 'Baha Buddy Content Operations' && source.reviewPlan?.cadenceDays > 0),
  generalInquiryRoutesNotMislabelledAsEmergencyDispatch: requestPackets.filter((packet) => packet.officialRoute.type !== 'public_emergency_route_and_general_contact').every((packet) => packet.officialRoute.emergencyDispatch === false) && requestPackets.filter((packet) => packet.officialRoute.type === 'public_emergency_route_and_general_contact').every((packet) => packet.officialRoute.emergencyDispatch === true),
  noMutationOrDeliveryFields: rows.every((row) => !('channels' in row) && !('approvalStatus' in row)),
}

if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const result = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  status: 'internal_draft_not_sent',
  policyBoundary: 'This profile is an internal evidence-request work package. It does not contact an authority, approve or publish content, turn a general inquiry route into emergency dispatch, or prove island-level readiness. External email or outreach requires explicit Board approval.',
  methodology: {
    auditScope: 'Live draft islandResearchAudit documents, raw perspective, canonical exact-title rollup, open or researching P0 only.',
    sourceScope: 'Existing live primary-government researchSource records required to frame the requests. A source can establish responsibility or a national route without proving island-level operation.',
    acceptanceRule: 'Evidence must identify exact geography, responsible authority, effective time or revision, scope and limits, accessibility, fallback, and an official source document or accountable sign-off. A directory entry, national standard, past incident, or general contact alone cannot close a runtime or facility-level gap.',
  },
  counts: {
    recurringPatterns: patterns.length,
    rolledUpGapOccurrences: rows.length,
    focusedAuditDocuments: new Set(rows.map((row) => row.auditId)).size,
    islands: islands.length,
    requestPackets: packetProfiles.length,
    repositorySources: sources.length,
    sourcesActive: sources.filter((source) => source.status === 'active').length,
    sourcesNeedingRecheck: sources.filter((source) => source.status === 'needs_recheck').length,
  },
  guardrails,
  nationalPublicRoutingUpdate: {
    sourceUrl: 'https://rbdf.gov.bs/contact-us/',
    checkedAt: '2026-08-05',
    verifiedBaseline: 'The current official RBDF page publishes Search & Rescue at (242) 362-3816, Harbour Control on VHF Channel 16, and Police Emergency at 919/911.',
    remainingBoundary: 'This verifies a national public routing baseline only. Island/cay coverage, continuous monitoring under outage conditions, caller location, responding asset, crew and fuel, weather limits, response time, dock/clinic handoff, and fallback remain open.',
  },
  requestPackets: packetProfiles,
  recurringPatterns: patterns,
  islandWorksheets: islands,
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
