import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const checkedAt = '2026-08-05'
const nextOperationalAuditAt = '2026-11-03'
const nextAnnualReviewAt = '2027-08-05'
const seedPath = '/private/tmp/baha-buddy-island-food-baseline-sanity-seed.ndjson'
const manifestPath = '/private/tmp/baha-buddy-island-food-baseline-manifest.json'

const profiles = [
  {
    slug: 'abacos',
    sourceId: 'research-source-bmot-abacos',
    claim: 'The current official island profile describes dining in The Abacos as ranging from no-frills to fine dining and identifies the Goombay Smash as a drink invented in the island group.',
    guidance: 'Use this as attributed island-level culinary context, not proof that a particular restaurant, bar, recipe, or event is operating or available. Confirm providers, hours, menus, alcohol age rules, transport, accessibility, ingredients, allergens, pricing, and responsible service before traveler delivery.',
  },
  {
    slug: 'acklins-crooked-island',
    sourceId: 'research-source-bmot-acklins-crooked-island',
    claim: 'The current official island profile presents stuffed lobster, chicken with peas and rice, and fresh local seafood as food themes of Acklins & Crooked Island.',
    guidance: 'This does not establish a current menu, provider, harvest season, supply, price, food-safety practice, or legal catch. Confirm responsible venues, operation, ingredients, allergens, fisheries rules, seasonal availability, accessibility, and safe preparation before a recommendation.',
  },
  {
    slug: 'andros',
    sourceId: 'research-source-bmot-andros',
    claim: 'The current official island profile identifies traditional Bahamian dishes and land crab as defining food themes of Andros.',
    guidance: 'Treat land crab as a culinary identity, not permission to catch, buy, or consume it in any season or from any source. Confirm harvest and sale rules, conservation guidance, responsible sourcing, provider operation, preparation, allergens, accessibility, and current availability.',
  },
  {
    slug: 'bimini',
    sourceId: 'research-source-bmot-bimini',
    claim: 'The current official island profile identifies very fresh seafood and freshly baked Bimini Bread as signature elements of Bimini’s food identity.',
    guidance: 'The profile does not establish a particular bakery, restaurant, daily supply, recipe, freshness standard, price, ingredient list, allergen control, or opening schedule. Verify these details and venue accessibility before traveler delivery.',
  },
  {
    slug: 'cat-island',
    sourceId: 'research-source-bmot-cat-island',
    claim: 'The current official island profile frames Cat Island dining around beach-side settings and fresh seafood and identifies the Fish Fry at New Bight as a place associated with that food experience.',
    guidance: 'This is not proof that every beach-side venue or the Fish Fry is open, safe, accessible, staffed, or serving a particular dish. Confirm current operation, vendors, dates and hours, access, transport, seafood sourcing, preparation, allergens, sanitation, and payment options.',
  },
  {
    slug: 'eleuthera-harbour-island',
    sourceId: 'research-source-bmot-eleuthera-harbour-island',
    claim: 'The current official island profile presents fresh seafood and local Bahamian flavours across beach-side dining in Eleuthera and more formal dining in Harbour Island.',
    guidance: 'Use this as an island-level range, not a current venue or menu recommendation. Confirm responsible providers, operation, reservations, transport, accessibility, dress or age rules, ingredients, seafood sourcing, allergens, prices, and current availability.',
  },
  {
    slug: 'grand-bahama',
    sourceId: 'research-source-bmot-grand-bahama',
    claim: 'The current official island profile characterises dining on Grand Bahama as a mix of local Bahamian and international cuisines.',
    guidance: 'This broad identity does not establish any specific restaurant, dish, event, location, opening hour, price, dietary option, accessibility feature, or food-safety practice. Verify each provider and menu claim independently before traveler delivery.',
  },
  {
    slug: 'long-island',
    sourceId: 'research-source-bmot-long-island',
    claim: 'The current official island profile highlights conch prepared in multiple forms and identifies mutton as a Long Island specialty associated with the island’s Mutton Fest.',
    guidance: 'Treat the festival association and food themes as stable context only. Confirm current event dates, venues, providers, animal and seafood sourcing, fisheries and sale rules, preparation, allergens, accessibility, transport, and menu availability before a recommendation.',
  },
  {
    slug: 'mayaguana',
    sourceId: 'research-source-bmot-mayaguana',
    claim: 'The current official island profile associates Mayaguana’s homecoming food traditions with land crab served with grits, rice, or dumplings, as well as fish salad and boiled conch.',
    guidance: 'The profile does not establish a current festival date, vendor, menu, harvest legality, conservation status, supply, safe preparation, price, allergen control, or access. Recheck all operational, sourcing, fisheries, accessibility, and food-safety details before traveler delivery.',
  },
  {
    slug: 'nassau-paradise-island',
    sourceId: 'research-source-bmot-nassau-paradise-island',
    claim: 'The current official island profile presents Nassau & Paradise Island’s dining range from chef-led meals to Fish Fry dining and fresh conch salad, combining Bahamian recipes with contemporary techniques.',
    guidance: 'Use this as broad culinary context, not proof that a named venue, vendor, menu, event, or price is current. Confirm operation, reservations, transport, accessibility, seafood sourcing, ingredients, allergens, sanitation, alcohol rules, and current conditions.',
  },
  {
    slug: 'ragged-island',
    sourceId: 'research-source-bmot-ragged-island',
    claim: 'The current official island profile lists grilled and steamed fish, cracked conch, and fresh mutton among favourite local dishes associated with Ragged Island.',
    guidance: 'Do not extend this list to protected or legally sensitive wildlife dishes. Confirm current fisheries, harvest, sale and conservation rules; responsible sourcing; provider or host consent; preparation; allergens; sanitation; accessibility; and availability before any recommendation.',
  },
  {
    slug: 'san-salvador',
    sourceId: 'research-source-bmot-san-salvador',
    claim: 'The current official island profile describes San Salvador dining as combining international cuisine with local favourites and links Bahamian cuisine with the Discovery Day Festival & Homecoming.',
    guidance: 'This does not establish a current resort menu, local dish, festival date, vendor, access, price, ingredient, dietary option, or food-safety practice. Confirm providers, event details, operation, transport, accessibility, allergens, and availability before traveler delivery.',
  },
  {
    slug: 'the-exumas',
    sourceId: 'research-source-bmot-the-exumas',
    claim: 'The current official island profile characterises dining in The Exumas as ranging from grilled lobster and cracked conch to international cuisine.',
    guidance: 'The profile establishes a broad food theme only. Confirm responsible providers, current operation and menus, lobster and conch season and fisheries rules, sourcing, preparation, allergens, accessibility, transport, prices, and availability before recommending a meal.',
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
  "destinations": *[_type == "destination" && !(_id match "drafts.*") && islandId in $slugs] {_id, islandId, name},
  "sources": *[_id in $sourceIds] {
    _id, title, status, authorityLevel, topics, nextReviewAt,
    "destinationIds": destinations[]._ref
  },
  "baseAudits": *[_id in $baseAuditIds] {_id, destination, overallScore, coverage}
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
  if (!source.topics?.includes('food')) throw new Error(`Source lacks food routing: ${source._id}`)
  if (!source.destinationIds?.includes(destination._id)) throw new Error(`Source lacks destination routing for ${profile.slug}: ${source._id}`)
  if (baseAudit.destination?._ref !== destination._id || baseAudit.coverage?.length !== 10) throw new Error(`Invalid base audit for ${profile.slug}`)
}

const factDocs = profiles.map((profile) => {
  const destination = destinationBySlug.get(profile.slug)
  return {
    _id: `drafts.island-fact-official-food-baseline-${profile.slug}`,
    _type: 'islandFact',
    title: `${destination.name}: official food baseline`.slice(0, 140),
    destination: reference(destination._id, `destination-${profile.slug}`),
    topic: 'food',
    claim: profile.claim,
    travelerGuidance: profile.guidance,
    sources: [reference(profile.sourceId, `source-${keyPart(profile.sourceId)}`.slice(0, 96))],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    volatility: 'stable',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only island-level culinary identity from a current official tourism profile. It is not a restaurant, host, menu, price, availability, sourcing, fisheries, conservation, allergen, food-safety, accessibility, media-rights, booking, or traveler-delivery approval.',
    channels: [],
  }
})

const auditDocs = profiles.map((profile) => {
  const destination = destinationBySlug.get(profile.slug)
  const baseAudit = baseAuditById.get(`drafts.island-research-audit-${checkedAt}-signature-place-content-readiness-${profile.slug}`)
  return {
    _id: `drafts.island-research-audit-${checkedAt}-official-food-baseline-${profile.slug}`,
    _type: 'islandResearchAudit',
    title: `${destination.name} official food baseline — ${checkedAt}`.slice(0, 160),
    destination: reference(destination._id, `destination-${profile.slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalAuditAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: baseAudit.overallScore,
    coverage: baseAudit.coverage,
    gaps: [
      gap(profile.slug, 'food', 'p1', 'Official island-level food baseline captured', 'Current national-tourism evidence reviewed and a bounded, source-linked, channel-free food fact created for editorial review.', 'resolved'),
      gap(profile.slug, 'food', 'p0', 'Verify current food providers, menus, availability and food-safety details', 'For every recommendation, confirm the responsible provider or host, current operation and hours, reservations, exact menu and price, ingredients, allergens, preparation and sanitation, dietary options, alcohol rules, payment and last-mile access.', 'researching'),
      gap(profile.slug, 'food', 'p0', 'Verify sourcing, harvest legality, seasonality and conservation before recommending island foods', 'Where seafood, land crab, conch, lobster, mutton or other island-sourced ingredients are named, confirm current fisheries, harvest, sale and conservation rules, responsible sourcing, season, supply, traceability and safe handling.', 'researching'),
      gap(profile.slug, 'accessibility', 'p0', 'Document feature-level accessibility for food recommendations', 'Before delivery, verify transport, entrance route, surfaces and steps, seating, toilets, service format, communication support, sensory conditions, dietary accommodation, assistance, and reasonable alternatives for each specific provider or event.', 'open'),
      gap(profile.slug, 'food', 'p1', 'Clear provider-specific copy and reusable media evidence', 'Use the island-level food identity only as a research starting point. Verify every named provider, dish and event, obtain reusable image rights and credits, and write image-specific alt text before editorial publication.', 'open'),
    ],
    sources: [reference(profile.sourceId, `source-${keyPart(profile.sourceId)}`.slice(0, 96))],
    methodologyNotes: 'This layer closes only the missing food evidence cell with a bounded, attributed food-identity claim from a current official tourism profile. It does not establish a current restaurant, host, event, menu, price, reservation, food-safety practice, dietary accommodation, ingredient source, legal harvest, conservation status, accessibility, media licence, or traveler delivery. Wildlife-sensitive or legally uncertain dishes are not promoted. Source-page images were not copied. Facts and audits remain drafts; facts are source_verified rather than approved and have no delivery channels. Coverage scores are carried from the latest signature-place content-readiness audit because this package does not approve traveler delivery.',
  }
})

const documents = [...factDocs, ...auditDocs]
const guardrails = {
  exactDocumentCount: documents.length === 26,
  allInputsCurrentActiveAndRouted: profiles.every((profile) => {
    const destination = destinationBySlug.get(profile.slug)
    const source = sourceById.get(profile.sourceId)
    return source?.status === 'active' && source.nextReviewAt >= checkedAt && source.topics?.includes('food') && source.destinationIds?.includes(destination?._id)
  }),
  allFactsAreSourceVerifiedHighConfidenceDrafts: factDocs.every((document) => document._id.startsWith('drafts.') && document.topic === 'food' && document.verificationStatus === 'source_verified' && document.confidence === 'high'),
  allFactsAreStableCurrentAndChannelFree: factDocs.every((document) => document.volatility === 'stable' && document.checkedAt === checkedAt && document.nextReviewAt === nextAnnualReviewAt && document.channels.length === 0),
  allAuditsRemainResearchingDrafts: auditDocs.every((document) => document._id.startsWith('drafts.') && document.status === 'researching'),
  everyAuditPreservesDeliveryGates: auditDocs.every((document) => document.gaps.filter((item) => item.status === 'resolved').length === 1 && document.gaps.filter((item) => item.priority === 'p0' && item.status !== 'resolved').length === 3 && document.gaps.filter((item) => item.priority === 'p1' && item.status !== 'resolved').length === 1),
  noSourceDestinationOrSupabaseMutation: documents.every((document) => ['islandFact', 'islandResearchAudit'].includes(document._type)),
}

if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  output: seedPath,
  counts: {
    documents: documents.length,
    factDrafts: factDocs.length,
    auditDrafts: auditDocs.length,
    islandsCovered: profiles.length,
    sourceRecordsCreatedOrUpdated: 0,
    resolvedEvidenceCells: auditDocs.flatMap((document) => document.gaps).filter((item) => item.status === 'resolved').length,
    openP0DeliveryGates: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p0' && item.status !== 'resolved').length,
    openP1EnrichmentGaps: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p1' && item.status !== 'resolved').length,
  },
  guardrails,
}, null, 2)}\n`)

console.log(JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), null, 2))
