import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-04'}).withConfig({useCdn: false, perspective: 'raw'})
const includeFullBacklog = process.env.RESEARCH_GAPS_FULL === '1'
const outputPath = process.env.RESEARCH_GAPS_OUTPUT || '/private/tmp/baha-buddy-island-research-gaps.json'

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

const audits = await client.fetch(
  `*[_type == "islandResearchAudit" && _id match "drafts.*"] {
    _id,
    _updatedAt,
    auditedAt,
    title,
    "destinationSlug": destination->islandId,
    "destinationName": destination->name,
    gaps[] {
      topic,
      priority,
      title,
      action,
      status
    }
  }`,
  {},
  {perspective: 'raw'},
)

const rows = audits.flatMap((audit) => (audit.gaps || []).map((item) => ({
  destinationSlug: audit.destinationSlug,
  destinationName: audit.destinationName,
  auditId: audit._id,
  auditTitle: audit.title,
  auditedAt: audit.auditedAt,
  updatedAt: audit._updatedAt,
  layer: auditLayer(audit._id),
  layerRank: layerOrder.indexOf(auditLayer(audit._id)),
  topic: item.topic,
  priority: item.priority,
  title: item.title,
  action: item.action,
  status: item.status || 'open',
})))

const latestByExactTitle = new Map()
for (const row of rows) {
  const key = [row.destinationSlug, row.topic, normalized(row.title)].join('|')
  const current = latestByExactTitle.get(key)
  if (!current || row.layerRank > current.layerRank ||
      (row.layerRank === current.layerRank && row.updatedAt > current.updatedAt)) {
    latestByExactTitle.set(key, row)
  }
}

const open = [...latestByExactTitle.values()]
  .filter((row) => row.status !== 'resolved')
  .sort((a, b) => a.destinationName.localeCompare(b.destinationName) ||
    a.priority.localeCompare(b.priority) || a.topic.localeCompare(b.topic) ||
    b.layerRank - a.layerRank || a.title.localeCompare(b.title))

function countBy(values, key) {
  return Object.fromEntries([...values.reduce((counts, item) => {
    const value = item[key] || 'unknown'
    counts.set(value, (counts.get(value) || 0) + 1)
    return counts
  }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)))
}

const islandGroups = new Map()
for (const row of open) {
  const key = row.destinationSlug
  if (!islandGroups.has(key)) islandGroups.set(key, [])
  islandGroups.get(key).push(row)
}

const result = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  methodology: {
    scope: 'All live draft islandResearchAudit documents in the raw Sanity perspective.',
    rollup: 'Gaps are deduplicated by island, topic, and normalized title. When the exact title recurs, the most specific later research layer wins; a later exact-title resolution suppresses the older open copy.',
    caveat: 'Different titles may represent related work and are intentionally preserved. Audit documents are evidence snapshots, so this rollup does not infer that one research layer resolved a differently named gap.',
  },
  counts: {
    audits: audits.length,
    rawGapEntries: rows.length,
    exactTitleRollupEntries: latestByExactTitle.size,
    openGapEntries: open.length,
    islands: islandGroups.size,
    byPriority: countBy(open, 'priority'),
    byTopic: countBy(open, 'topic'),
    byResearchLayer: countBy(open, 'layer'),
  },
  islands: [...islandGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([slug, gaps]) => {
    const summary = {
      slug,
      name: gaps[0]?.destinationName,
      openGapCount: gaps.length,
      p0: gaps.filter((gap) => gap.priority === 'p0').length,
      p1: gaps.filter((gap) => gap.priority === 'p1').length,
      topics: countBy(gaps, 'topic'),
      p0Gaps: gaps.filter((gap) => gap.priority === 'p0').map(({topic, title, layer}) => ({topic, title, layer})),
    }
    if (!includeFullBacklog) return summary
    return {
      ...summary,
      gaps: gaps.map(({topic, priority, title, action, status, layer, auditId}) => ({
        topic,
        priority,
        title,
        action,
        status,
        layer,
        auditId,
      })),
    }
  }),
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
