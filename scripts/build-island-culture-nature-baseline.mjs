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
const seedPath = '/private/tmp/baha-buddy-island-culture-nature-baseline-sanity-seed.ndjson'
const manifestPath = '/private/tmp/baha-buddy-island-culture-nature-baseline-manifest.json'

const profiles = [
  {
    slug: 'abacos',
    topic: 'culture',
    sourceId: 'research-source-bmot-abacos',
    claim: 'The current official island profile identifies a hand-built boatbuilding tradition centred on Man-O-War Cay and describes Loyalist and colonial architectural heritage in Hope Town and New Plymouth.',
    guidance: 'Use this as attributed cultural and historical context only. Confirm community interpretation, the status and access of any specific workshop or heritage site, opening arrangements, accessibility, and permission before recommending a visit.',
  },
  {
    slug: 'berry-islands',
    topic: 'culture',
    sourceId: 'research-source-bmot-berry-islands',
    claim: 'The current official island profile frames boating and sport fishing as longstanding parts of The Berry Islands’ island identity, with Chub Cay described as a sport-fishing hub.',
    guidance: 'Treat this as an attributed island-level identity, not proof that a marina, charter, tournament, venue, or community activity is currently operating. Confirm local interpretation, responsible providers, access, dates, and conditions before traveler delivery.',
  },
  {
    slug: 'berry-islands',
    topic: 'nature',
    sourceId: 'research-source-bmot-berry-islands',
    claim: 'The current official island profile describes The Berry Islands as a cluster of nearly 30 cays bordering the Tongue of the Ocean and identifies beaches, Hoffman’s Cay Blue Hole, and the Chub Cay Wall among its natural features.',
    guidance: 'This island profile does not establish exact measurements, public access, safe entry, conservation status, or present site conditions. Confirm boat and landing arrangements, permissions, weather, water conditions, responsible guides, qualifications, and safety before a specific recommendation.',
  },
  {
    slug: 'grand-bahama',
    topic: 'culture',
    sourceId: 'research-source-bmot-grand-bahama',
    claim: 'The current official island profile identifies West End as Grand Bahama’s oldest town and connects its history with Civil War-era smuggling and Prohibition-era rum-running; it also presents Bahamian handicrafts and live entertainment as themes at Port Lucaya Marketplace.',
    guidance: 'Use the West End material as attributed historical context. Treat every venue, market, performance, opening-hour, event, and access statement as operational and confirm it separately before traveler delivery.',
  },
  {
    slug: 'inagua',
    topic: 'culture',
    sourceId: 'research-source-bmot-great-inagua-lighthouse',
    claim: 'The current official Great Inagua Lighthouse listing connects the lighthouse’s construction in the 1800s with efforts to reduce shipwrecks and states that the formerly kerosene-burning light is now automated.',
    guidance: 'This supports a bounded historical claim only. It does not establish current public access, climbing permission, staffing, structural condition, accessibility, hours, or safe visitation; confirm those with the responsible authority before a recommendation.',
  },
  {
    slug: 'mayaguana',
    topic: 'culture',
    sourceId: 'research-source-bmot-mayaguana',
    claim: 'The current official island profile states that Mayaguana is the only Bahamian island retaining its original Arawak name and says the name refers to the Mayaguana iguana.',
    guidance: 'Keep this explicitly attributed to the tourism profile rather than presenting it as independently established linguistic or archaeological proof. Seek Indigenous, historical, or heritage-authority corroboration before adding a deeper interpretation.',
  },
  {
    slug: 'ragged-island',
    topic: 'culture',
    sourceId: 'research-source-bmot-ragged-island',
    claim: 'The current official island profile presents seafaring, boat and spar building, regattas, fishing, and family-plot salt harvesting around Duncan Town as living traditions of Ragged Island.',
    guidance: 'Treat this as attributed community-level cultural context, not a universal description of residents or a promise that visitors can observe or participate. Confirm community interpretation, permission, timing, access, and respectful visitor guidance before traveler delivery.',
  },
  {
    slug: 'the-exumas',
    topic: 'culture',
    sourceId: 'research-source-bmot-the-exumas',
    claim: 'The current official island profile presents woodcarving, music made with goatskin drums and hand saws and rooted in oral storytelling, and Bahamian sloop sailing as cultural traditions of The Exumas.',
    guidance: 'Use these as high-level attributed traditions only. Do not promise a specific artisan, performance, sailing programme, event, or interpretive authority without current community verification, consent, schedules, access, and responsible-provider checks.',
  },
  {
    slug: 'bimini',
    topic: 'nature',
    sourceId: 'research-source-bmot-bimini',
    claim: 'The current official island profile identifies Bimini Road as an underwater rock formation of large boulders off the northern coast and separately describes Bimini’s beaches, Gulf Stream setting, and marine waters.',
    guidance: 'The profile does not establish the formation’s origin, safe access, a responsible operator, wildlife-interaction permission, current visibility, or site conditions. Treat Atlantis associations as folklore rather than fact and verify all activity details separately.',
  },
  {
    slug: 'cat-island',
    topic: 'nature',
    sourceId: 'research-source-bmot-cat-island',
    claim: 'The current official island profile identifies Mount Alvernia at 206 feet as The Bahamas’ highest point and characterises Cat Island with rolling hills, nature trails, and white- and pink-sand beaches.',
    guidance: 'The profile does not prove current trail or beach access, route condition, step-free access, exact beach length, or safe conditions. Confirm land access, route details, weather, assistance needs, and current local guidance before a specific recommendation.',
  },
  {
    slug: 'rum-cay',
    topic: 'nature',
    sourceId: 'research-source-bmot-rum-cay',
    claim: 'The current official island profile characterises Rum Cay by coral reefs, white-sand beaches, surf, and offshore marine life, and describes underwater walls, drop-offs, and tunnels around the island.',
    guidance: 'This is not a current reef-health assessment or proof of safe access, suitable conditions, a responsible operator, or participant readiness. Confirm conservation guidance, weather, sea state, qualifications, emergency support, and exact-site suitability before traveler delivery.',
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

const slugs = [...new Set(profiles.map((profile) => profile.slug))]
const sourceIds = [...new Set(profiles.map((profile) => profile.sourceId))]
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

if (live.destinations.length !== slugs.length) throw new Error(`Expected ${slugs.length} destinations, found ${live.destinations.length}`)
if (live.sources.length !== sourceIds.length) throw new Error(`Expected ${sourceIds.length} sources, found ${live.sources.length}`)
if (live.baseAudits.length !== slugs.length) throw new Error(`Expected ${slugs.length} base audits, found ${live.baseAudits.length}`)

const destinationBySlug = new Map(live.destinations.map((document) => [document.islandId, document]))
const destinationSlugById = new Map(live.destinations.map((document) => [document._id, document.islandId]))
const sourceById = new Map(live.sources.map((document) => [document._id, document]))
const baseAuditById = new Map(live.baseAudits.map((document) => [document._id, document]))

for (const profile of profiles) {
  const destination = destinationBySlug.get(profile.slug)
  const source = sourceById.get(profile.sourceId)
  const baseAudit = baseAuditById.get(`drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${profile.slug}`)
  if (!destination || !source || !baseAudit) throw new Error(`Missing live input for ${profile.slug}/${profile.topic}`)
  if (source.status !== 'active' || !source.nextReviewAt || source.nextReviewAt < checkedAt) throw new Error(`Source is not current and active: ${source._id}`)
  if (!source.topics?.includes(profile.topic)) throw new Error(`Source lacks ${profile.topic} routing: ${source._id}`)
  if (!source.destinationIds?.includes(destination._id)) throw new Error(`Source lacks destination routing for ${profile.slug}: ${source._id}`)
  if (baseAudit.destination?._ref !== destination._id || baseAudit.coverage?.length !== 10) throw new Error(`Invalid base audit for ${profile.slug}`)
}

const factDocs = profiles.map((profile) => {
  const destination = destinationBySlug.get(profile.slug)
  return {
    _id: `drafts.island-fact-official-topic-baseline-${profile.topic}-${profile.slug}`,
    _type: 'islandFact',
    title: `${destination.name}: official ${profile.topic} baseline`.slice(0, 140),
    destination: reference(destination._id, `destination-${profile.slug}`),
    topic: profile.topic,
    claim: profile.claim,
    travelerGuidance: profile.guidance,
    sources: [reference(profile.sourceId, `source-${keyPart(profile.sourceId)}`.slice(0, 96))],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    volatility: 'stable',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only island-level evidence from a current official tourism page. It is not a place or operator record, access decision, safety approval, accessibility statement, booking promise, media licence, interpretive-authority decision, or traveler-delivery approval.',
    channels: [],
  }
})

const profilesBySlug = new Map(slugs.map((slug) => [slug, profiles.filter((profile) => profile.slug === slug)]))
const auditDocs = slugs.map((slug) => {
  const destination = destinationBySlug.get(slug)
  const islandProfiles = profilesBySlug.get(slug)
  const baseAudit = baseAuditById.get(`drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${slug}`)
  const topics = islandProfiles.map((profile) => profile.topic)
  const topicLabel = topics.join(' and ')
  return {
    _id: `drafts.island-research-audit-${checkedAt}-official-culture-nature-baseline-${slug}`,
    _type: 'islandResearchAudit',
    title: `${destination.name} official ${topicLabel} baseline — ${checkedAt}`.slice(0, 160),
    destination: reference(destination._id, `destination-${slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalAuditAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: baseAudit.overallScore,
    coverage: baseAudit.coverage,
    gaps: [
      ...islandProfiles.flatMap((profile) => [
        gap(slug, profile.topic, 'p1', `Official island-level ${profile.topic} baseline captured`, `Current national-tourism evidence reviewed and a bounded, source-linked, channel-free ${profile.topic} fact created for editorial review.`, 'resolved'),
        profile.topic === 'culture'
          ? gap(slug, 'culture', 'p0', 'Verify community authority, interpretation, operation and access before traveler delivery', 'For every specific cultural recommendation, confirm responsible community or heritage authority, respectful interpretation, consent, current operation, access, dates, visitor guidance, and any permission requirements.', 'researching')
          : gap(slug, 'nature', 'p0', 'Verify site access, conservation status and activity safety before traveler delivery', 'For every specific natural-site recommendation, confirm responsible authority or guide, current access and conditions, conservation rules, permissions, qualifications, weather or marine limits, safety guidance, and emergency support.', 'researching'),
      ]),
      gap(slug, 'accessibility', 'p0', `Document feature-level accessibility for ${topicLabel} recommendations`, 'Before delivery, verify transport, arrival, surfaces, gradients, steps, vessels or transfers, assistance, sensory conditions, accessible facilities, communication options, and reasonable alternatives for each named place or activity.', 'open'),
      gap(slug, topicLabel, 'p1', 'Clear place-specific copy and reusable media evidence', 'Use each island-level fact only as a research starting point. Verify named-place claims, obtain reusable image rights and credits, and write image-specific alt text before editorial publication.', 'open'),
    ],
    sources: [...new Set(islandProfiles.map((profile) => profile.sourceId))].map((sourceId) => reference(sourceId, `source-${keyPart(sourceId)}`.slice(0, 96))),
    methodologyNotes: 'This layer closes only missing island/topic evidence cells using current official tourism pages and bounded, attributed claims. It does not establish a live operator, opening schedule, permission, safe route, accessibility, media licence, exact point, conservation state, current natural condition, or community interpretive authority. Source-page images were not copied. Facts and audits remain drafts; facts are source_verified rather than approved and have no delivery channels. Coverage scores are carried from the latest signature-place content-readiness audit because this package does not approve traveler delivery.',
  }
})

const documents = [...factDocs, ...auditDocs]
const guardrails = {
  exactDocumentCount: documents.length === 21,
  allInputsCurrentActiveAndRouted: profiles.every((profile) => {
    const destination = destinationBySlug.get(profile.slug)
    const source = sourceById.get(profile.sourceId)
    return source?.status === 'active' && source.nextReviewAt >= checkedAt && source.topics?.includes(profile.topic) && source.destinationIds?.includes(destination?._id)
  }),
  allFactsAreSourceVerifiedHighConfidenceDrafts: factDocs.every((document) => document._id.startsWith('drafts.') && document.verificationStatus === 'source_verified' && document.confidence === 'high'),
  allFactsAreStableCurrentAndChannelFree: factDocs.every((document) => document.volatility === 'stable' && document.checkedAt === checkedAt && document.nextReviewAt === nextAnnualReviewAt && document.channels.length === 0),
  allAuditsRemainResearchingDrafts: auditDocs.every((document) => document._id.startsWith('drafts.') && document.status === 'researching'),
  everyAuditPreservesDeliveryGates: auditDocs.every((document) => {
    const expectedTopicFacts = profilesBySlug.get(destinationSlugById.get(document.destination._ref))?.length
    const resolved = document.gaps.filter((item) => item.status === 'resolved').length
    const openP0 = document.gaps.filter((item) => item.priority === 'p0' && item.status !== 'resolved').length
    return resolved === expectedTopicFacts && openP0 === expectedTopicFacts + 1 && document.gaps.filter((item) => item.priority === 'p1' && item.status !== 'resolved').length === 1
  }),
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
    islandsCovered: auditDocs.length,
    sourceRecordsCreatedOrUpdated: 0,
    resolvedEvidenceCells: auditDocs.flatMap((document) => document.gaps).filter((item) => item.status === 'resolved').length,
    openP0DeliveryGates: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p0' && item.status !== 'resolved').length,
    openP1EnrichmentGaps: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p1' && item.status !== 'resolved').length,
  },
  guardrails,
}, null, 2)}\n`)

console.log(JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), null, 2))
