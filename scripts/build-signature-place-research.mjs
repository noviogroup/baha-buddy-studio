#!/usr/bin/env node

/**
 * Turn the read-only official signature-place crosswalk into a review-only
 * Sanity research tranche. This script only writes local artifacts. Import is
 * a separate, explicit command.
 */

import fs from 'node:fs'

const crosswalkPath = process.argv[2] || '/private/tmp/baha-buddy-official-signature-place-crosswalk.json'
const contentImportPath = process.argv[3] || '/private/tmp/baha-buddy-sanity-content-import.ndjson'
const baselineSeedPath = process.argv[4] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const outputBase = process.argv[5] || '/private/tmp/baha-buddy-signature-place-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'

for (const inputPath of [crosswalkPath, contentImportPath, baselineSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function destinationId(slug) {
  if (slug === 'nassau-paradise-island') return 'dest-nassau'
  if (slug === 'the-exumas') return 'dest-exuma'
  if (slug === 'eleuthera-harbour-island') return 'dest-eleuthera'
  return `dest-${slug}`
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

function gap(slug, topic, priority, title, action, status = 'open') {
  return {
    _type: 'researchGap',
    _key: `gap-${keyPart(slug)}-${keyPart(topic)}-${keyPart(title)}`.slice(0, 96),
    topic,
    priority,
    title,
    action,
    status,
  }
}

const report = JSON.parse(fs.readFileSync(crosswalkPath, 'utf8'))
if (report.crosswalk?.length !== 64) throw new Error(`Expected 64 official signature-place rows, found ${report.crosswalk?.length || 0}`)

const contentDocs = readNdjson(contentImportPath)
const baselineDocs = readNdjson(baselineSeedPath)
const placeById = new Map(contentDocs.filter((doc) => doc._type === 'placeEditorial').map((doc) => [doc.source?.recordId, doc]))
const qualityAuditBySlug = new Map(
  baselineDocs
    .filter((doc) => doc._type === 'islandResearchAudit' && doc._id.includes('-quality-'))
    .map((doc) => [doc._id.split('-quality-')[1], doc]),
)

const sourceDocs = [
  {
    _id: 'research-source-operator-androsia',
    _type: 'researchSource',
    title: 'Androsia Batik Factory',
    url: 'https://androsia.com/',
    publisher: 'Androsia Batik Factory',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-andros', 'destination-andros')],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    status: 'active',
    notes: 'Current operator site confirming the Androsia Factory identity, Andros Town location, direct contact, and continuing handmade-batik operation. Use for identity reconciliation; recheck hours, access, and accessibility before traveler delivery.',
  },
  {
    _id: 'research-source-operator-nagb',
    _type: 'researchSource',
    title: 'National Art Gallery of The Bahamas — plan your visit',
    url: 'https://nagb.org.bs/admission/',
    publisher: 'National Art Gallery of The Bahamas',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'experiences', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current institution page confirming the full identity and downtown Nassau location. It reported the elevator under maintenance at review time, so accessibility and visit conditions require an operational recheck.',
  },
]

const factDocs = [
  {
    _id: 'drafts.island-fact-signature-place-androsia-identity-andros',
    _type: 'islandFact',
    title: 'Androsia Batik Factory: source-backed catalog identity',
    destination: reference('dest-andros', 'destination-andros'),
    topic: 'culture',
    claim: 'The national tourism profile names Androsia Batik Factory as an Andros highlight, and the current operator site identifies the Andros Town location as Androsia Factory. The Supabase name “Androsia Batik Works Factory” is a source-backed name variant of this identity.',
    travelerGuidance: 'Treat the identity as a catalog-reconciliation decision only. Recheck current opening arrangements, exact entrance, visitor access, and accessibility before recommending a visit.',
    sources: [
      reference('research-source-bmot-andros', 'source-bmot-andros'),
      reference('research-source-operator-androsia', 'source-operator-androsia'),
    ],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Identity evidence is sufficient for a manual name-variant match, not for Supabase verification or traveler delivery. Channels intentionally left empty.',
    channels: [],
  },
  {
    _id: 'drafts.island-fact-signature-place-nagb-current-access-nassau-paradise-island',
    _type: 'islandFact',
    title: 'National Art Gallery of The Bahamas: current identity and access caveat',
    destination: reference('dest-nassau', 'destination-nassau-paradise-island'),
    topic: 'accessibility',
    claim: 'The institution’s current visitor page confirms the full National Art Gallery of The Bahamas identity in downtown Nassau. At the 2026-08-05 review it reported that its elevator was under maintenance, which may limit access for some visitors.',
    travelerGuidance: 'Recheck the institution’s current visitor page and contact it for the traveler’s exact access requirements before recommending a visit. Do not infer that every floor or exhibition is accessible.',
    sources: [reference('research-source-operator-nagb', 'source-operator-nagb')],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The elevator condition is operational and may change quickly. Delivery channels intentionally left empty pending editorial review.',
    channels: [],
  },
]

const rowsByIsland = new Map()
for (const row of report.crosswalk) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const qualityAudit = qualityAuditBySlug.get(slug)
  if (!qualityAudit) throw new Error(`Missing quality audit seed for ${slug}`)
  const counts = {
    exact: rows.filter((row) => row.classification === 'exact_in_bounds').length,
    variants: rows.filter((row) => row.classification === 'strong_variant_in_bounds').length,
    location: rows.filter((row) => row.classification === 'assigned_but_location_invalid').length,
    wrongIsland: rows.filter((row) => row.classification === 'strong_name_wrong_island').length,
    ambiguous: rows.filter((row) => row.classification === 'ambiguous_or_conflicting').length,
    absent: rows.filter((row) => row.classification === 'absent').length,
  }
  const matchedRows = rows.filter((row) => row.classification !== 'absent')
  const islandName = rows[0].islandName
  const coverage = qualityAudit.coverage.map((item) => item.topic === 'experiences'
    ? {...item, score: 2, finding: `Four official signature-place identities were reviewed: ${counts.exact} exact in-bounds, ${counts.variants} source-backed name variant, ${counts.location} matched but location-blocked, ${counts.wrongIsland} wrong-island conflict, ${counts.ambiguous} ambiguous, and ${counts.absent} absent from the canonical catalog. None is verified or launch-ready.`}
    : item)
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const gaps = [
    gap(slug, 'experiences', 'p1', 'Official signature-place identities source-checked', `Retain the reviewed official set: ${rows.map((row) => row.officialName).join('; ')}.`, 'resolved'),
    gap(slug, 'places', 'p0', 'Official signature-place set crosswalked to canonical inventory', `The four official identities were crosswalked against all ${report.inventory.places} current Supabase place rows without mutating the catalog.`, 'resolved'),
  ]
  if (counts.absent) gaps.push(gap(slug, 'places', 'p0', `${counts.absent} official signature-place ${counts.absent === 1 ? 'identity is' : 'identities are'} absent from the canonical catalog`, `Create controlled canonical candidates for: ${rows.filter((row) => row.classification === 'absent').map((row) => row.officialName).join('; ')}. Verify exact identity, island or cay, coordinates, category, operation, sourced copy, and media rights before activation.`, 'researching'))
  if (counts.location) gaps.push(gap(slug, 'places', 'p0', `${counts.location} matched signature-place ${counts.location === 1 ? 'row fails' : 'rows fail'} the location gate`, `Resolve coordinates and active state for: ${rows.filter((row) => row.classification === 'assigned_but_location_invalid').map((row) => `${row.officialName} (${row.best?.id})`).join('; ')}.`, 'researching'))
  if (counts.wrongIsland) gaps.push(gap(slug, 'places', 'p0', `${counts.wrongIsland} signature-place ${counts.wrongIsland === 1 ? 'row has' : 'rows have'} an island-assignment conflict`, `Correct only after adjudication: ${rows.filter((row) => row.classification === 'strong_name_wrong_island').map((row) => `${row.officialName} is assigned to ${row.best?.islandId || row.best?.islandName} (${row.best?.id})`).join('; ')}.`, 'researching'))
  if (counts.variants) gaps.push(gap(slug, 'places', 'p1', `${counts.variants} source-backed catalog-name ${counts.variants === 1 ? 'variant needs' : 'variants need'} editorial approval`, rows.filter((row) => row.classification === 'strong_variant_in_bounds').map((row) => `${row.officialName} ↔ ${row.best?.name}: ${row.identityDecision?.rationale || 'Review the primary-source identity decision.'}`).join('; '), 'researching'))
  if (matchedRows.length) gaps.push(gap(slug, 'places', 'p0', `${matchedRows.length} matched signature-place ${matchedRows.length === 1 ? 'candidate remains' : 'candidates remain'} unverified and not launch-ready`, 'For every matched candidate, complete identity, precise coordinate, sourced description, rights-cleared media, current-operation, safety, accessibility, and editorial approval gates. The review drafts remain inactive and channel-free.', 'researching'))
  gaps.push(gap(slug, 'access', 'p1', 'Signature-place access and operating conditions remain incomplete', 'Research current responsible-operator or authority evidence for approach, hours or access arrangements, closures, fees, reservations, safety constraints, and accessibility. Keep live price, availability, weather, and schedules out of canonical CMS facts.', 'open'))

  const sourceIds = [...new Set(rows.flatMap((row) => row.sourceIds || [row.sourceId]))]
  return {
    _id: `drafts.island-research-audit-${checkedAt}-signature-place-catalog-${slug}`,
    _type: 'islandResearchAudit',
    title: `${islandName} official signature-place catalog crosswalk — ${checkedAt}`,
    destination: reference(destinationId(slug), `destination-${slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps,
    sources: sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: 'Four signature-place identities from the current national-tourism island profile were checked against the complete current Supabase places table. Exact and fuzzy discovery was followed by manual primary-source adjudication for known name variants. Bounds are a broad screening gate, not coordinate proof. An identity match does not establish operation, location precision, safe access, accessibility, copy quality, media rights, or launch readiness. No Supabase row was mutated; all place overlays are drafts, inactive, and have no delivery channels.',
  }
})

const matchedRows = report.crosswalk.filter((row) => row.classification !== 'absent')
const seenPlaceIds = new Set()
const placeDraftDocs = matchedRows.map((row) => {
  const placeId = row.best?.id
  if (!placeId) throw new Error(`Matched row lacks a place ID: ${row.islandSlug} / ${row.officialName}`)
  if (seenPlaceIds.has(placeId)) throw new Error(`Multiple official identities selected the same Supabase place: ${placeId}`)
  seenPlaceIds.add(placeId)
  const base = placeById.get(placeId)
  if (!base) throw new Error(`Missing imported placeEditorial base for ${placeId}`)

  const catalogReviewStatus = row.classification === 'strong_name_wrong_island'
    ? 'island_assignment_conflict'
    : row.classification === 'assigned_but_location_invalid'
      ? 'location_blocked'
      : row.classification === 'strong_variant_in_bounds'
        ? 'name_variant'
        : 'exact_candidate'
  const locationSummary = row.best.inBounds
    ? `The current coordinate (${row.best.latitude}, ${row.best.longitude}) falls within the broad ${row.islandName} screening bounds but still requires point-level verification.`
    : `The current coordinate is ${row.best.latitude ?? 'missing'}, ${row.best.longitude ?? 'missing'} and does not pass the broad ${row.islandName} screening gate.`
  const assignmentSummary = row.best.assignedToExpectedIsland
    ? `The current island assignment is ${row.best.islandId || row.best.islandName}.`
    : `The current island assignment is ${row.best.islandId || row.best.islandName}, while the official source places this identity in ${row.islandName}.`
  const identitySummary = row.identityDecision?.rationale || (row.classification === 'exact_in_bounds'
    ? 'The normalized official and catalog names match exactly.'
    : 'The official and catalog names require editorial identity adjudication.')

  return {
    ...base,
    _id: `drafts.${base._id}`,
    active: false,
    channels: [],
    officialSourceName: row.officialName,
    catalogReviewStatus,
    evidenceSources: (row.sourceIds || [row.sourceId]).map((sourceId, index) => reference(sourceId, `evidence-${index + 1}`)),
    catalogReviewNotes: `${identitySummary} ${assignmentSummary} ${locationSummary} Current gates: active=${row.best.active}; verified=${row.best.verified}; sourced description=${row.best.hasDescription}; media=${row.best.hasMedia}. Do not activate or assign delivery channels until the canonical Supabase record and every publication gate have been reviewed.`,
    source: {
      ...base.source,
      notes: `Official signature-place review draft created ${checkedAt}. Status: ${catalogReviewStatus}. Supabase remains authoritative for identity, coordinates, operation, and verification. Keep inactive and channel-free until every catalog and publication gate passes.`,
    },
    reviewedAt: checkedAt,
  }
})

const seedDocs = [...sourceDocs, ...factDocs, ...auditDocs, ...placeDraftDocs]
const seedPath = `${outputBase}-sanity-seed.ndjson`
fs.writeFileSync(seedPath, seedDocs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')

const summary = {
  generatedAt: new Date().toISOString(),
  checkedAt,
  sourceScope: 'Current national-tourism island profiles plus explicit operator/conservation identity decisions.',
  inventory: report.inventory,
  classifications: report.classifications,
  islands: auditDocs.length,
  officialIdentities: report.crosswalk.length,
  matchedCandidates: matchedRows.length,
  absentIdentities: report.crosswalk.filter((row) => row.classification === 'absent').length,
  sourceDocs: sourceDocs.length,
  factDrafts: factDocs.length,
  auditDrafts: auditDocs.length,
  placeReviewDrafts: placeDraftDocs.length,
  seedDocs: seedDocs.length,
  seedPath,
}
fs.writeFileSync(`${outputBase}.json`, JSON.stringify({summary, islands: Object.fromEntries(rowsByIsland)}, null, 2) + '\n')

const table = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const count = (classification) => rows.filter((row) => row.classification === classification).length
  const absent = rows.filter((row) => row.classification === 'absent').map((row) => row.officialName).join('; ') || '—'
  return `| ${rows[0].islandName} | ${count('exact_in_bounds')} | ${count('strong_variant_in_bounds')} | ${count('assigned_but_location_invalid')} | ${count('strong_name_wrong_island')} | ${count('absent')} | ${absent} |`
}).join('\n')
const markdown = `# Official Signature-Place Catalog Crosswalk\n\n**Snapshot:** ${checkedAt}  \n**Boundary:** review-only; no Supabase mutation; no traveler delivery\n\n## Outcome\n\nThe current official island profiles supply 64 signature-place identities across all 16 canonical island groups. The current Supabase catalog contains ${summary.matchedCandidates} matched candidates and is missing ${summary.absentIdentities} identities. None of the matched candidates is verified or launch-ready.\n\n## Crosswalk\n\n| Island group | Exact in bounds | Name variant | Location blocked | Wrong island | Absent | Absent identities |\n|---|---:|---:|---:|---:|---:|---|\n${table}\n\n## Guardrails\n\n- Exact-name and broad-bound matches are candidates, not verified locations.\n- Fuzzy matches never merge identities automatically; Androsia and Southern Great Lake are explicit, cited decisions.\n- Every matched place overlay is a Sanity draft with active=false and no delivery channels.\n- Missing identities remain audit gaps; the script does not fabricate Supabase records.\n- Operation, hours, fees, access, safety, accessibility, description, media rights, and point coordinates still require their responsible source and editorial approval.\n`
fs.writeFileSync(`${outputBase}.md`, markdown)

console.log(JSON.stringify(summary, null, 2))
