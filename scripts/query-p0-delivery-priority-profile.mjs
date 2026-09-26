import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const outputPath = '/private/tmp/baha-buddy-p0-delivery-priority-profile.json'

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

const workstreams = {
  emergency_safety: {
    label: 'Emergency, medical and personal safety',
    weight: 5,
    owner: 'Safety & Operations with the responsible government or emergency authority',
  },
  access_transport: {
    label: 'Access and transport continuity',
    weight: 4,
    owner: 'Transport Operations with the responsible carrier, airport, port or local authority',
  },
  canonical_place_integrity: {
    label: 'Canonical place identity, coordinates and operation',
    weight: 4,
    owner: 'Place Data Operations with the owning operator, authority or community source',
  },
  accessibility: {
    label: 'Feature-level accessibility',
    weight: 4,
    owner: 'Accessibility Editorial with the responsible facility, carrier, venue or guide',
  },
  provider_activity_food: {
    label: 'Provider, activity and food readiness',
    weight: 3,
    owner: 'Content Operations with the responsible provider, guide, host or conservation authority',
  },
  editorial_media: {
    label: 'Traveler-safe copy and reusable media',
    weight: 2,
    owner: 'Editorial & Media Rights',
  },
  other_delivery: {
    label: 'Other delivery-blocking evidence',
    weight: 3,
    owner: 'Baha Buddy Content Operations',
  },
}

const emergencyLayers = new Set([
  'medical-access', 'emergency-readiness', 'local-authority-routing',
  'police-response-facility-coverage', 'marine-search-rescue-facility-coverage',
  'airport-fire-ems-facility-coverage', 'hurricane-shelter-facility-coverage',
  'shelter-inspection-governance-and-activation',
])
const accessLayers = new Set([
  'access-transport', 'scheduled-air-operator-coverage', 'scheduled-marine-operator-coverage',
  'licensed-arrival-ground-transfer', 'air-transport-accessibility', 'seasonality-weather',
])
const placeLayers = new Set([
  'quality', 'signature-place-catalog', 'signature-place-location-evidence',
  'signature-place-canonical-candidates', 'signature-place-source-adjudication',
  'signature-place-traveler-readiness', 'signature-place-identity-readiness',
  'signature-place-matched-readiness', 'operator-reconciliation', 'catalog-adjudication',
  'coordinate-closure', 'operation-evidence', 'source-replacement-evidence',
])
const providerLayers = new Set([
  'official-experience-theme-baseline', 'official-culture-nature-baseline', 'official-food-baseline',
])

function auditLayer(id) {
  for (const layer of layerOrder.slice(1)) {
    if (id.includes(`-${layer}-`)) return layer
  }
  return 'baseline'
}

function normalized(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function classify(row) {
  const title = normalized(row.title)
  if (row.topic === 'accessibility') return 'accessibility'
  if (emergencyLayers.has(row.layer) || row.topic === 'safety') return 'emergency_safety'
  if (placeLayers.has(row.layer) || row.topic === 'places' || (row.layer === 'source-freshness-owner-cadence' && title.startsWith('replace unavailable source'))) return 'canonical_place_integrity'
  if (accessLayers.has(row.layer) || row.topic === 'access') return 'access_transport'
  if (providerLayers.has(row.layer) || ['stays', 'food', 'experiences', 'culture', 'nature'].includes(row.topic)) return 'provider_activity_food'
  if (row.layer === 'signature-place-content-readiness' || row.layer === 'evidence-media' || ['editorial', 'media'].includes(row.topic) || title.includes('copy') || title.includes('media') || title.includes('image') || title.includes('hero') || title.includes('alt text')) return 'editorial_media'
  return 'other_delivery'
}

const audits = await client.fetch(`*[_type == "islandResearchAudit" && _id match "drafts.*"] {
  _id, _updatedAt, auditedAt, title,
  "destinationSlug": destination->islandId,
  "destinationName": destination->name,
  gaps[] {topic, priority, title, action, status}
}`, {}, {perspective: 'raw'})

const rawRows = audits.flatMap((audit) => (audit.gaps || []).map((item) => ({
  destinationSlug: audit.destinationSlug,
  destinationName: audit.destinationName,
  auditId: audit._id,
  auditTitle: audit.title,
  auditedAt: audit.auditedAt,
  updatedAt: audit._updatedAt,
  layer: auditLayer(audit._id),
  layerRank: layerOrder.indexOf(auditLayer(audit._id)),
  ...item,
})))

const latestByExactTitle = new Map()
for (const row of rawRows) {
  const key = [row.destinationSlug, row.topic, normalized(row.title)].join('|')
  const current = latestByExactTitle.get(key)
  if (!current || row.layerRank > current.layerRank ||
      row.layerRank === current.layerRank && row.updatedAt > current.updatedAt) {
    latestByExactTitle.set(key, row)
  }
}

const rows = [...latestByExactTitle.values()].filter((row) =>
  row.priority === 'p0' && ['open', 'researching'].includes(row.status),
).map((row) => {
  const workstream = classify(row)
  return {...row, workstream, consequenceWeight: workstreams[workstream].weight, responsibleOwner: workstreams[workstream].owner}
})

const heritageAccessRows = rows.filter((row) => row.topic === 'access' && (
  row.layer === 'source-replacement-evidence' ||
  (row.layer === 'source-freshness-owner-cadence' && normalized(row.title).startsWith('replace unavailable source'))
))
const accessTransportRows = rows.filter((row) => row.workstream === 'access_transport')
const mayaguanaAirportConflictRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'mayaguana' &&
  normalized(row.title) === 'mayaguana airport runway availability and scheduled service state remain source conflicted'
)
const acklinsFerryConflictRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'acklins-crooked-island' &&
  normalized(row.title) === 'tourism ferry frequency claims lack responsible operator reconciliation'
)
const raggedCharterConflictRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'ragged-island' &&
  normalized(row.title) === 'no commercial flight access lacks an accountable live charter and transfer package'
)
const berryAccessConflictRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'berry-islands' && [
    'chub cay property access is restrictive and source conflicted',
    'great harbour cay and chub cay air access lacks live trip ready verification',
  ].includes(normalized(row.title))
)
const inaguaAccessClosureRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'inagua' && [
    'inagua national park visit operations need one current authoritative package',
    'little inagua boat access lacks a complete responsible visit package',
    'matthew town airport and onward transport need live verification',
    'union creek public and research access remains unresolved',
  ].includes(normalized(row.title))
)
const nassauAccessClosureRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'nassau-paradise-island' && [
    'nagb sunday hours conflict within the responsible page',
    'bridge road water taxi ferry and marine conditions need trip date verification',
  ].includes(normalized(row.title))
)
const longIslandAccessClosureRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'long-island' && [
    'conception island boat mooring weather and emergency plan is incomplete',
    'lgi and sml need live airport and onward transfer verification',
  ].includes(normalized(row.title))
)
const catIslandAccessClosureRows = accessTransportRows.filter((row) =>
  row.destinationSlug === 'cat-island' &&
  normalized(row.title) === 'atc and tbi need live airport and onward transfer verification'
)

function countBy(items, key) {
  return Object.fromEntries([...items.reduce((counts, item) => {
    const value = item[key] || 'unknown'
    counts.set(value, (counts.get(value) || 0) + 1)
    return counts
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)))
}

const byIsland = new Map()
for (const row of rows) {
  if (!byIsland.has(row.destinationSlug)) byIsland.set(row.destinationSlug, [])
  byIsland.get(row.destinationSlug).push(row)
}

const patternGroups = new Map()
for (const row of rows) {
  const key = [row.workstream, row.topic, normalized(row.title)].join('|')
  if (!patternGroups.has(key)) patternGroups.set(key, [])
  patternGroups.get(key).push(row)
}

const crossIslandWork = [...patternGroups.values()].map((items) => ({
  workstream: items[0].workstream,
  workstreamLabel: workstreams[items[0].workstream].label,
  responsibleOwner: workstreams[items[0].workstream].owner,
  topic: items[0].topic,
  title: items[0].title,
  action: items[0].action,
  islandCount: new Set(items.map((item) => item.destinationSlug)).size,
  occurrences: items.length,
  consequenceWeight: items[0].consequenceWeight,
  portfolioPriorityScore: items[0].consequenceWeight * new Set(items.map((item) => item.destinationSlug)).size,
  islands: [...new Set(items.map((item) => item.destinationSlug))].sort(),
})).sort((left, right) => right.portfolioPriorityScore - left.portfolioPriorityScore ||
  right.islandCount - left.islandCount || left.title.localeCompare(right.title))

const islands = [...byIsland.entries()].map(([slug, items]) => ({
  slug,
  name: items[0]?.destinationName,
  p0Count: items.length,
  consequenceScore: items.reduce((sum, item) => sum + item.consequenceWeight, 0),
  byWorkstream: countBy(items, 'workstream'),
  byTopic: countBy(items, 'topic'),
  topConsequenceGaps: items.sort((left, right) => right.consequenceWeight - left.consequenceWeight || left.title.localeCompare(right.title)).slice(0, 12).map(({workstream, topic, title, layer, responsibleOwner}) => ({workstream, topic, title, layer, responsibleOwner})),
})).sort((left, right) => right.consequenceScore - left.consequenceScore || right.p0Count - left.p0Count || left.name.localeCompare(right.name))

const lowestResidualP0 = [...islands].sort((left, right) => left.consequenceScore - right.consequenceScore || left.p0Count - right.p0Count || left.name.localeCompare(right.name))

const guardrails = {
  allSixteenIslandsRepresented: islands.length === 16,
  exactRolledUpP0Count: rows.length > 0 && rows.length === new Set(rows.map((row) => [row.destinationSlug, row.topic, normalized(row.title)].join('|'))).size,
  allRowsClassified: rows.every((row) => workstreams[row.workstream]),
  noResidualOtherDeliveryRows: rows.every((row) => row.workstream !== 'other_delivery'),
  knownAccessTransportClosuresClassified: accessTransportRows.length === 14 && mayaguanaAirportConflictRows.length === 1 && acklinsFerryConflictRows.length === 1 && raggedCharterConflictRows.length === 1 && berryAccessConflictRows.length === 2 && inaguaAccessClosureRows.length === 4 && nassauAccessClosureRows.length === 2 && longIslandAccessClosureRows.length === 2 && catIslandAccessClosureRows.length === 1,
  fourOpenUnavailableSourceAccessRowsClassifiedAsPlaceIntegrity: heritageAccessRows.length === 4 && heritageAccessRows.every((row) => row.workstream === 'canonical_place_integrity'),
  allRowsHaveResponsibleOwner: rows.every((row) => row.responsibleOwner),
  noResolvedOrNonP0RowsIncluded: rows.every((row) => row.priority === 'p0' && ['open', 'researching'].includes(row.status)),
  crossIslandPatternsPreserveEveryRow: crossIslandWork.reduce((sum, pattern) => sum + pattern.occurrences, 0) === rows.length,
}

if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const result = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  methodology: {
    scope: 'All live open or researching P0 gaps from draft islandResearchAudit documents, using the same exact-title rollup as the canonical gap query.',
    consequenceWeights: Object.fromEntries(Object.entries(workstreams).map(([id, item]) => [id, {label: item.label, weight: item.weight, responsibleOwner: item.owner}])),
    boundary: 'Weights prioritize closure work; they do not approve content, infer that an island is unsafe, or replace current responsible-source verification. Lower residual P0 is not readiness.',
  },
  counts: {
    auditsReviewed: audits.length,
    rawOpenP0Entries: rawRows.filter((row) => row.priority === 'p0' && ['open', 'researching'].includes(row.status)).length,
    rolledUpOpenP0Entries: rows.length,
    islands: islands.length,
    byWorkstream: countBy(rows, 'workstream'),
    byTopic: countBy(rows, 'topic'),
  },
  guardrails,
  portfolioPriority: crossIslandWork.slice(0, 40),
  accessTransportClosureRows: rows.filter((row) => row.workstream === 'access_transport').map(({destinationSlug, destinationName, topic, title, action, layer, auditId, responsibleOwner}) => ({destinationSlug, destinationName, topic, title, action, layer, auditId, responsibleOwner})),
  heritageAccessClassificationRows: heritageAccessRows.map(({destinationSlug, destinationName, topic, title, action, layer, auditId, workstream, responsibleOwner}) => ({destinationSlug, destinationName, topic, title, action, layer, auditId, workstream, responsibleOwner})),
  residualClassificationReview: rows.filter((row) => row.workstream === 'other_delivery').map(({destinationSlug, destinationName, topic, title, action, layer, auditId}) => ({destinationSlug, destinationName, topic, title, action, layer, auditId})),
  highestConsequenceIslands: islands,
  lowestResidualP0,
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
