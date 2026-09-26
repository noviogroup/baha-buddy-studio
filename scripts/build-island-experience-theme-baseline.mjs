import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})

const checkedAt = '2026-08-05'
const nextOperationalAuditAt = '2026-11-03'
const nextAnnualReviewAt = '2027-08-05'
const seedPath = '/private/tmp/baha-buddy-island-experience-theme-baseline-sanity-seed.ndjson'
const manifestPath = '/private/tmp/baha-buddy-island-experience-theme-baseline-manifest.json'

const profiles = [
  {
    slug: 'abacos',
    sourceId: 'research-source-bmot-abacos',
    claim: 'The current official island profile presents diving, cay-to-cay sailing and island hopping, visiting the local art-foundry tradition, and deep-sea fishing as experience themes for The Abacos.',
    guidance: 'Use these as itinerary themes, not proof that a particular foundry, ferry, guide, charter, or dive site is operating. Confirm the responsible operator, transport, access, conditions, qualifications, and safety before making a specific recommendation.',
  },
  {
    slug: 'acklins-crooked-island',
    sourceId: 'research-source-bmot-acklins-crooked-island',
    claim: 'The current official island profile presents bonefishing, secluded beaches and coastal exploration, Turtle Sound wildlife sightseeing, and the islands’ cascarilla tradition as experience themes for Acklins & Crooked Island.',
    guidance: 'Treat wildlife viewing and cascarilla as contextual themes, not permission to approach, collect, or harvest. Confirm guides, boats, coastal access, protected-area rules, current conditions, and safety before recommending a specific activity.',
  },
  {
    slug: 'andros',
    sourceId: 'research-source-bmot-andros',
    claim: 'The current official island profile presents Androsia batik visits and lessons, flats fishing, birdwatching in protected landscapes, and diving reefs, blue holes, wrecks, and walls as experience themes for Andros.',
    guidance: 'The profile establishes planning themes only. Confirm factory tours or lessons, park access, certified guides and dive operators, site suitability, weather, marine conditions, and participant qualifications before traveler delivery.',
  },
  {
    slug: 'berry-islands',
    sourceId: 'research-source-bmot-berry-islands',
    claim: 'The current official island profile presents bonefishing, diving the Chub Cay Wall, beachcombing, and visiting Hoffman’s Cay Blue Hole as experience themes for The Berry Islands.',
    guidance: 'Several themes require a boat, guide, or specialist water-safety assessment. Confirm access permission, responsible operators, dive credentials, sea state, current site conditions, and safe-entry guidance before naming a specific itinerary stop.',
  },
  {
    slug: 'cat-island',
    sourceId: 'research-source-bmot-cat-island',
    claim: 'The current official island profile presents secluded beaches, big-game or flats fishing, and Rake & Scrape music and festival culture as experience themes for Cat Island.',
    guidance: 'Festival timing and performances are not guaranteed by this stable profile. Confirm current event dates, venues, guides, charters, access, weather, marine conditions, and traveler suitability before making a specific recommendation.',
  },
  {
    slug: 'eleuthera-harbour-island',
    sourceId: 'research-source-bmot-eleuthera-harbour-island',
    claim: 'The current official island profile presents Queen’s Bath, island hopping and snorkeling, wreck and reef diving, beach exploration, and horseback riding as experience themes for Eleuthera & Harbour Island.',
    guidance: 'Tides, waves, sea state, road and shoreline access, operators, and participant ability materially affect these activities. Confirm low-tide guidance, current conditions, access, qualifications, and responsible providers before traveler delivery.',
  },
  {
    slug: 'inagua',
    sourceId: 'research-source-bmot-inagua',
    claim: 'The current official island profile presents birdwatching, boat access to protected Little Inagua, and flats or deep-water fishing as experience themes for Inagua.',
    guidance: 'Protected-area rules, wildlife distance, boat access, guides, fishing rules, weather, and marine conditions require current responsible-source confirmation. The profile is not permission to enter a park or approach wildlife.',
  },
  {
    slug: 'long-island',
    sourceId: 'research-source-bmot-long-island',
    claim: 'The current official island profile presents offshore fishing, boat trips toward Conception Island, the annual regatta tradition, cave exploration, and reef, wreck, blue-hole, or wall diving as experience themes for Long Island.',
    guidance: 'Confirm event dates, responsible cave access, boat and dive operators, participant qualifications, protected-area rules, weather, and marine conditions. This island-level profile does not establish live availability or authorize entry.',
  },
  {
    slug: 'mayaguana',
    sourceId: 'research-source-bmot-mayaguana',
    claim: 'The current official island profile presents beach picnicking, sunbathing, shelling, strolling, near-shore snorkeling, and offshore reef or wall diving as experience themes for Mayaguana.',
    guidance: 'Confirm shoreline access, conservation rules, responsible operators, dive qualifications, weather, currents, reef conditions, and emergency support before recommending a specific beach or water activity.',
  },
  {
    slug: 'nassau-paradise-island',
    sourceId: 'research-source-bmot-nassau-paradise-island',
    claim: 'The current official island profile presents art galleries and murals, nightlife, varied beaches, and diving walls, wrecks, a blue hole, and an underwater sculpture garden as experience themes for Nassau & Paradise Island.',
    guidance: 'Specific venues, hours, fees, age rules, beach access, dive operators, and site conditions are operational facts and must be confirmed separately. The profile does not guarantee availability or accessibility.',
  },
  {
    slug: 'ragged-island',
    sourceId: 'research-source-bmot-ragged-island',
    claim: 'The current official island profile presents cay-to-cay boating, Hog Cay picnics and community celebrations, and viewing the Pigeon Cay memorial as experience themes for Ragged Island.',
    guidance: 'These themes depend on boats, weather, landing permission, local guidance, fire restrictions, and current event details. Confirm safe access and responsible authority guidance before recommending a cay visit or bonfire.',
  },
  {
    slug: 'rum-cay',
    sourceId: 'research-source-bmot-rum-cay',
    claim: 'The current official island profile presents the HMS Conqueror wreck, boat trips toward Conception Island National Park, and surfing the northern coast as experience themes for Rum Cay.',
    guidance: 'An underwater museum, protected park, and surf coastline each require current access, operator, permission, qualification, sea-state, and safety verification. Do not treat the profile as authorization or live availability.',
  },
  {
    slug: 'san-salvador',
    sourceId: 'research-source-bmot-san-salvador',
    claim: 'The current official island profile presents secluded beaches, boating among bays and lagoons, varied diving, and deep-water or flats fishing as experience themes for San Salvador.',
    guidance: 'Confirm boat and dive operators, site access, fishing rules, credentials, weather, reef and sea conditions, wildlife guidance, and emergency support before turning a theme into a specific recommendation.',
  },
  {
    slug: 'the-exumas',
    sourceId: 'research-source-bmot-the-exumas',
    claim: 'The current official island profile presents Stocking Island visits, snorkeling an underwater plane wreck or sculpture, island hopping among cays and sandbars, and Bahamian sloop sailing as experience themes for The Exumas.',
    guidance: 'Boats, tides, weather, protected areas, wildlife encounters, specific businesses, event dates, operators, and participant ability all require current verification. This profile is planning context, not booking inventory or permission.',
  },
]

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function keyPart(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

function gap(slug, topic, priority, title, action, status) {
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

const slugs = profiles.map((profile) => profile.slug)
const sourceIds = profiles.map((profile) => profile.sourceId)
const baseAuditIds = slugs.map((slug) => `drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${slug}`)

const live = await client.fetch(`{
  "destinations": *[_type == "destination" && !(_id match "drafts.*") && islandId in $slugs] {
    _id, islandId, name
  },
  "sources": *[_id in $sourceIds] {
    _id, title, status, authorityLevel, topics, nextReviewAt,
    "destinationIds": destinations[]._ref
  },
  "baseAudits": *[_id in $baseAuditIds] {
    _id, destination, overallScore, coverage
  }
}`, {slugs, sourceIds, baseAuditIds}, {perspective: 'raw'})

if (live.destinations.length !== profiles.length) throw new Error(`Expected ${profiles.length} destinations, found ${live.destinations.length}`)
if (live.sources.length !== profiles.length) throw new Error(`Expected ${profiles.length} sources, found ${live.sources.length}`)
if (live.baseAudits.length !== profiles.length) throw new Error(`Expected ${profiles.length} base audits, found ${live.baseAudits.length}`)

const destinationBySlug = new Map(live.destinations.map((document) => [document.islandId, document]))
const sourceById = new Map(live.sources.map((document) => [document._id, document]))
const baseAuditById = new Map(live.baseAudits.map((document) => [document._id, document]))

for (const profile of profiles) {
  const destination = destinationBySlug.get(profile.slug)
  const source = sourceById.get(profile.sourceId)
  const baseAudit = baseAuditById.get(`drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${profile.slug}`)
  if (!destination || !source || !baseAudit) throw new Error(`Missing live input for ${profile.slug}`)
  if (source.status !== 'active' || !source.nextReviewAt || source.nextReviewAt < checkedAt) throw new Error(`Source is not current and active: ${source._id}`)
  if (!(source.topics || []).includes('experiences')) throw new Error(`Source lacks experiences routing: ${source._id}`)
  if (!(source.destinationIds || []).includes(destination._id)) throw new Error(`Source lacks destination routing for ${profile.slug}: ${source._id}`)
  if (baseAudit.destination?._ref !== destination._id || baseAudit.coverage?.length !== 10) throw new Error(`Invalid base audit for ${profile.slug}`)
}

const factDocs = profiles.map((profile) => {
  const destination = destinationBySlug.get(profile.slug)
  return {
    _id: `drafts.island-fact-official-experience-theme-${profile.slug}`,
    _type: 'islandFact',
    title: `${destination.name}: official experience-theme baseline`.slice(0, 140),
    destination: reference(destination._id, `destination-${profile.slug}`),
    topic: 'experiences',
    claim: profile.claim,
    travelerGuidance: profile.guidance,
    sources: [reference(profile.sourceId, `source-${keyPart(profile.sourceId)}`.slice(0, 96))],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    volatility: 'stable',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only island-level planning identity from the current official tourism profile. It is not a place record, operator record, access decision, safety approval, accessibility statement, booking promise, media licence, or traveler-delivery approval.',
    channels: [],
  }
})

const auditDocs = profiles.map((profile) => {
  const destination = destinationBySlug.get(profile.slug)
  const baseAudit = baseAuditById.get(`drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${profile.slug}`)
  return {
    _id: `drafts.island-research-audit-${checkedAt}-official-experience-theme-baseline-${profile.slug}`,
    _type: 'islandResearchAudit',
    title: `${destination.name} official experience-theme baseline — ${checkedAt}`.slice(0, 160),
    destination: reference(destination._id, `destination-${profile.slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalAuditAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: baseAudit.overallScore,
    coverage: baseAudit.coverage,
    gaps: [
      gap(profile.slug, 'experiences', 'p1', 'Official island-level experience-theme baseline captured', 'Current national-tourism profile reviewed and a bounded, source-linked, channel-free experience-theme fact created for editorial review.', 'resolved'),
      gap(profile.slug, 'experiences', 'p0', 'Verify specific operators, access, availability and activity safety before traveler delivery', 'For every named recommendation, confirm the responsible operator or authority, current operation or closure, booking or permission route, access conditions, qualifications, weather or marine limits, safety guidance and emergency support.', 'researching'),
      gap(profile.slug, 'accessibility', 'p0', 'Document feature-level accessibility for experience recommendations', 'Before delivery, verify arrival, transport, surfaces, gradients, steps, vessels, transfers, assistance, sensory conditions, accessible facilities and reasonable alternatives for each specific experience.', 'open'),
      gap(profile.slug, 'experiences', 'p1', 'Clear place-specific copy and reusable media evidence', 'Use the island-level theme only as a research starting point. Verify each named place claim, obtain reusable image rights and credits, and write image-specific alt text before editorial publication.', 'open'),
    ],
    sources: [reference(profile.sourceId, `source-${keyPart(profile.sourceId)}`.slice(0, 96))],
    methodologyNotes: 'This layer closes only the missing island/topic evidence cell: the current official tourism profile supports a stable island-level set of planning themes. It does not establish a live operator, booking inventory, price, schedule, permission, safe route, accessibility, media licence, exact point, or current activity conditions. The source page was reviewed without copying its images. The fact and audit remain drafts; the fact is source_verified rather than approved and has no delivery channels. Coverage scores are carried from the latest signature-place content-readiness audit because this package does not approve traveler delivery.',
  }
})

const documents = [...factDocs, ...auditDocs]
const guardrails = {
  exactDocumentCount: documents.length === 28,
  allInputsCurrentActiveAndRouted: profiles.every((profile) => {
    const destination = destinationBySlug.get(profile.slug)
    const source = sourceById.get(profile.sourceId)
    return source?.status === 'active' && source.nextReviewAt >= checkedAt && source.topics?.includes('experiences') && source.destinationIds?.includes(destination?._id)
  }),
  allFactsAreSourceVerifiedHighConfidenceDrafts: factDocs.every((document) => document._id.startsWith('drafts.') && document.verificationStatus === 'source_verified' && document.confidence === 'high'),
  allFactsAreStableCurrentAndChannelFree: factDocs.every((document) => document.volatility === 'stable' && document.checkedAt === checkedAt && document.nextReviewAt === nextAnnualReviewAt && document.channels.length === 0),
  allAuditsRemainResearchingDrafts: auditDocs.every((document) => document._id.startsWith('drafts.') && document.status === 'researching'),
  everyAuditPreservesDeliveryGates: auditDocs.every((document) => document.gaps.filter((item) => item.status === 'resolved').length === 1 && document.gaps.filter((item) => item.priority === 'p0' && item.status !== 'resolved').length === 2),
  noSourceOrDestinationMutation: documents.every((document) => ['islandFact', 'islandResearchAudit'].includes(document._type)),
}

if (Object.values(guardrails).some((value) => !value)) {
  throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)
}

fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  output: seedPath,
  counts: {
    documents: documents.length,
    factDrafts: factDocs.length,
    auditDrafts: auditDocs.length,
    sourceRecordsCreatedOrUpdated: 0,
    resolvedEvidenceCells: auditDocs.flatMap((document) => document.gaps).filter((item) => item.status === 'resolved').length,
    openP0DeliveryGates: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p0' && item.status !== 'resolved').length,
    openP1EnrichmentGaps: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p1' && item.status !== 'resolved').length,
  },
  guardrails,
}, null, 2)}\n`)

console.log(JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), null, 2))
