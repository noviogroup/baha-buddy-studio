import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})

const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextAnnualReviewAt = '2027-08-05'
const seedPath = '/private/tmp/baha-buddy-heritage-source-replacement-evidence-sanity-seed.ndjson'
const manifestPath = '/private/tmp/baha-buddy-heritage-source-replacement-evidence-manifest.json'

const candidateIds = [
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-rum-cay-hartford-cave',
]

const blockedSourceIds = [
  'research-source-ammc-public-site-no-program-detail',
  'research-source-operator-rum-cay-heritage-unavailable',
]

const baseAuditIds = [
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-rum-cay',
]

function cleanDocument(document) {
  const {_rev, _createdAt, _updatedAt, ...clean} = document
  return clean
}

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

function mergeReferences(existing, sourceIds, prefix) {
  const references = [...(existing || [])]
  const present = new Set(references.map((item) => item._ref))
  for (const sourceId of sourceIds) {
    if (present.has(sourceId)) continue
    references.push(reference(sourceId, `${prefix}-${keyPart(sourceId)}`.slice(0, 96)))
    present.add(sourceId)
  }
  return references
}

function reviewPlan({cadenceBand, cadenceDays, relationship, method, triggers, scope, action}) {
  return {
    _type: 'researchSourceReviewPlan',
    plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: 'scheduled',
    freshnessStatus: 'current',
    cadenceBand,
    cadenceDays,
    sourceRelationship: relationship,
    verificationMethod: method,
    changeTriggers: triggers,
    reviewScope: scope,
    nextAction: action,
  }
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

const live = await client.fetch(`{
  "candidates": *[_id in $candidateIds],
  "blockedSources": *[_id in $blockedSourceIds],
  "baseAudits": *[_id in $baseAuditIds]
}`, {candidateIds, blockedSourceIds, baseAuditIds}, {perspective: 'raw'})

if (live.candidates.length !== 3) throw new Error(`Expected 3 candidates, found ${live.candidates.length}`)
if (live.blockedSources.length !== 2) throw new Error(`Expected 2 blocked sources, found ${live.blockedSources.length}`)
if (live.baseAudits.length !== 2) throw new Error(`Expected 2 base audits, found ${live.baseAudits.length}`)

const opmQueensId = 'research-source-opm-queens-staircase-rededication-2024'
const heritageActId = 'research-source-laws-antiquities-monuments-museum-act-2017-revision'
const rumCayCouncilId = 'research-source-bmot-rum-cay-district-council-contact'
const bmotContactId = 'research-source-bmot-general-contact-2026'

const sourceDocs = [
  {
    _id: opmQueensId,
    _type: 'researchSource',
    title: "Queen's Staircase — 2024 rededication and project-contributor record",
    url: 'https://opm.gov.bs/prime-minister-davis-queens-staircase-rededication/',
    publisher: 'Office of the Prime Minister, Government of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'access'],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    status: 'active',
    notes: "Dated 23 April 2024 government record of the Queen's Staircase rededication. It names AMMC, Tourism, Works, NPIPB and private contributors to the project and says Fort Fincastle work was still to come. It supports dated project provenance only, not current ownership, operation, hours, access, accessibility, condition, photography or media reuse.",
    reviewPlan: reviewPlan({
      cadenceBand: 'annual', cadenceDays: 365,
      relationship: 'official_context_publisher', method: 'webpage_review',
      triggers: ['publisher_url_or_scope_change', 'site_restoration_or_project_update', 'source_restored_replaced_or_superseded'],
      scope: 'Recheck the dated government project record and any later official completion or stewardship notice. Keep project participation separate from current site management and visitor operation.',
      action: `By ${nextAnnualReviewAt}, locate any later official Fort Fincastle or Queen's Staircase completion, stewardship, closure, access or visitor-operation notice and record it as a separate source.`,
    }),
  },
  {
    _id: heritageActId,
    _type: 'researchSource',
    title: 'Antiquities, Monuments and Museum Act — LRO 1/2017 framework',
    url: 'https://laws.bahamas.gov.bs/cms/images/LEGISLATION/PRINCIPAL/1998/1998-0005/1998-0005_2.pdf',
    publisher: 'Government of The Bahamas — Laws of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [
      reference('dest-nassau', 'destination-nassau-paradise-island'),
      reference('dest-rum-cay', 'destination-rum-cay'),
    ],
    topics: ['culture', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    status: 'active',
    notes: 'Official 2017 law revision defining national monument declaration, preservation and historical-site functions. It is general legal context only: it does not by itself prove that a named site was declared under section 3, identify the present site operator, or establish visitor access, hours, safety, accessibility, photography or media rights. Later amendments must be checked separately.',
    reviewPlan: reviewPlan({
      cadenceBand: 'annual', cadenceDays: 365,
      relationship: 'official_context_publisher', method: 'document_review',
      triggers: ['legislation_or_regulation_change', 'publisher_url_or_scope_change', 'source_restored_replaced_or_superseded'],
      scope: 'Recheck the current consolidated act, amendments, regulations and any site-specific declaration. Do not infer declaration, ownership, operation or access for a named feature from the general statute.',
      action: `By ${nextAnnualReviewAt}, verify the consolidated act and later amendments, then search the Gazette and National Register for site-specific declarations or management instruments for the affected features.`,
    }),
  },
  {
    _id: rumCayCouncilId,
    _type: 'researchSource',
    title: 'Rum Cay District Council — current contact corroboration',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/rum-cay-salt-pond',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'corroborating',
    destinations: [reference('dest-rum-cay', 'destination-rum-cay')],
    topics: ['overview', 'access', 'culture'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism attraction page names the Rum Cay District Council and repeats the telephone and email shown on the Hartford Cave page. This corroborates a local-government contact lead, not Council ownership or operation of Hartford Cave, permission to enter, a guide service, current cave condition, safety, accessibility, exact entrance disclosure or media rights.',
    reviewPlan: reviewPlan({
      cadenceBand: '30_day', cadenceDays: 30,
      relationship: 'official_context_publisher', method: 'webpage_and_responsible_contact',
      triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change'],
      scope: 'Recheck the exact contact details and ask the responsible local authority who controls Hartford Cave access. Keep the contact lead separate from evidence of site responsibility.',
      action: `By ${nextOperationalReviewAt}, verify the Council contact through an accountable government channel and obtain a named responsible authority, permission route, current access conditions and safety guidance for Hartford Cave.`,
    }),
  },
  {
    _id: bmotContactId,
    _type: 'researchSource',
    title: 'Bahamas Ministry of Tourism public contact route — 2026',
    url: 'https://www.bahamas.com/contact',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [
      reference('dest-nassau', 'destination-nassau-paradise-island'),
      reference('dest-rum-cay', 'destination-rum-cay'),
    ],
    topics: ['overview', 'access', 'culture'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current official Ministry contact page publishes the general Nassau routing telephone 1 (242) 302-2000 and tourism@bahamas.com. Use it only to route a site-responsibility evidence request when a dedicated accountable public office is not published. It is not an emergency route and does not itself confirm an attraction operator, opening condition, permission, accessibility, safety, or media rights.',
    reviewPlan: reviewPlan({
      cadenceBand: '30_day', cadenceDays: 30,
      relationship: 'official_context_publisher', method: 'webpage_and_responsible_contact',
      triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'public_contact_or_channel_change'],
      scope: 'Recheck the official Ministry contact page and preserve the general-inquiry boundary. Do not label this route as the operator, custodian, emergency contact, or site access authority.',
      action: `By ${nextOperationalReviewAt}, confirm the public Ministry telephone and email and whether a dedicated AMMC, Fort Fincastle, Queen's Staircase, Hartford Cave, or Rum Cay authority route has been published.`,
    }),
  },
]

const blockedSourceById = new Map(live.blockedSources.map((document) => [document._id, cleanDocument(document)]))
const updatedBlockedSources = [
  {
    ...blockedSourceById.get('research-source-ammc-public-site-no-program-detail'),
    notes: 'The AMMC URL remains unavailable and is preserved as provenance. A bounded replacement set now records current national-tourism pages for Queen’s Staircase and Fort Fincastle, the 2024 OPM rededication record, the general antiquities law, and the Ministry of Tourism public routing contact. Present site management and all traveler-operation gates remain unresolved.',
    replacementSources: [
      reference('research-source-bmot-queens-staircase', 'replacement-bmot-queens'),
      reference('research-source-bmot-queens-staircase-natural-wonder', 'replacement-bmot-queens-natural'),
      reference('research-source-bmot-fort-fincastle', 'replacement-bmot-fort'),
      reference(opmQueensId, 'replacement-opm-rededication'),
      reference(heritageActId, 'replacement-heritage-law'),
      reference(bmotContactId, 'replacement-bmot-contact'),
    ],
    replacementBoundary: "Current official tourism listings replace the dead AMMC page for Queen's Staircase and Fort Fincastle identity, public listing, public contact, and the Fort's displayed tour lead; the 2024 OPM record replaces it for dated Queen's Staircase project provenance; the Act supplies only general legal context. No replacement source proves the current site operator, site-confirmed hours or closures, entrance, condition, safety, accessibility, coordinate acceptance, photography rules, or reusable-media rights.",
    reviewPlan: {
      ...blockedSourceById.get('research-source-ammc-public-site-no-program-detail').reviewPlan,
      workflowStatus: 'replacement_recorded',
      nextAction: `By ${nextOperationalReviewAt}, recheck the unavailable URL and every recorded replacement. Separately obtain a site-responsible confirmation of the current operator, hours or closures, entrance, condition, safety, accessibility, photography, and media rules; do not reopen the completed source-replacement task unless the replacement set changes or fails.`,
    },
  },
  {
    ...blockedSourceById.get('research-source-operator-rum-cay-heritage-unavailable'),
    notes: 'The outbound Rum Cay heritage domain remains unavailable and is preserved as provenance. A bounded replacement set now records the current official Hartford Cave listing, the corroborated Rum Cay District Council contact, the general antiquities law, and the Ministry of Tourism public routing contact. Responsible authority and every traveler-operation gate remain unresolved.',
    replacementSources: [
      reference('research-source-bmot-hartford-cave', 'replacement-bmot-hartford'),
      reference(rumCayCouncilId, 'replacement-rum-cay-council'),
      reference(heritageActId, 'replacement-heritage-law'),
      reference(bmotContactId, 'replacement-bmot-contact'),
    ],
    replacementBoundary: 'The current official Hartford Cave listing and separately corroborated Rum Cay District Council contact replace the dead outbound domain for bounded site identity, protected-site context, and an accountable verification route; the Act supplies only general legal context. No replacement source proves the responsible cave authority, current visitor operation, permission, guide requirement, entrance disclosure, condition, hazards, emergency plan, accessibility, petroglyph rules, photography, or reusable-media rights.',
    reviewPlan: {
      ...blockedSourceById.get('research-source-operator-rum-cay-heritage-unavailable').reviewPlan,
      workflowStatus: 'replacement_recorded',
      nextAction: `By ${nextOperationalReviewAt}, recheck the unavailable domain and every recorded replacement. Separately obtain a responsible-authority confirmation of custodianship, permission, guide requirements, closures, condition, safety, accessibility, protection, disclosure, photography, and media rules; do not reopen the completed source-replacement task unless the replacement set changes or fails.`,
    },
  },
]

const candidateById = new Map(live.candidates.map((document) => [document._id, cleanDocument(document)]))
const queen = candidateById.get('drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase')
const fort = candidateById.get('drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle')
const hartford = candidateById.get('drafts.canonical-place-candidate-rum-cay-hartford-cave')

const candidateDocs = [
  {
    ...queen,
    identityEvidence: mergeReferences(queen.identityEvidence, [opmQueensId], 'replacement-identity-source'),
    travelerReadinessReview: {
      ...queen.travelerReadinessReview,
      sources: mergeReferences(queen.travelerReadinessReview?.sources, [opmQueensId, heritageActId], 'replacement-readiness-source'),
      notes: "Current tourism pages support the historic linear feature and public contact; the 23 April 2024 OPM rededication record establishes project completion and AMMC participation at that date. It does not establish the present operator, live hours, access, accessibility, condition or media rules. Two official points remain about 290 metres apart, so no point or traveler delivery is accepted.",
    },
    reviewedAt: checkedAt,
    reviewNotes: `${queen.reviewNotes || ''} Official restoration-provenance and legal-framework sources added ${checkedAt}; responsible operation, geometry, access, accessibility, safety and media rights remain blocked.`.trim().slice(0, 2200),
  },
  {
    ...fort,
    travelerReadinessReview: {
      ...fort.travelerReadinessReview,
      sources: mergeReferences(fort.travelerReadinessReview?.sources, [opmQueensId, heritageActId], 'replacement-readiness-source'),
      notes: "The current national-tourism page displays daily guided tours from 8:00 a.m. to 4:00 p.m., donations appreciated, and a public contact. The 23 April 2024 OPM record said Fort Fincastle work was still to come, so it is not completion evidence. Confirm the responsible operator and live tour status directly; point conflict, entrance, closures, condition, accessibility, safety and media rights remain unresolved.",
    },
    reviewedAt: checkedAt,
    reviewNotes: `${fort.reviewNotes || ''} Current official tour-listing and dated restoration-plan boundaries recorded ${checkedAt}; no live operator confirmation, coordinate acceptance or traveler delivery.`.trim().slice(0, 2200),
  },
  {
    ...hartford,
    travelerReadinessReview: {
      ...hartford.travelerReadinessReview,
      sources: mergeReferences(hartford.travelerReadinessReview?.sources, [rumCayCouncilId, heritageActId], 'replacement-readiness-source'),
      notes: 'The current Hartford Cave page identifies a protected historical site with Lucayan-Arawak material and lists a District Council contact. A separate current tourism page repeats that contact for the Council, strengthening the contact identity but not proving Council operation of the cave. The outbound heritage site remains unavailable. Responsible authority, permission, guide, entrance disclosure, condition, hazards, accessibility, photography and emergency planning remain unverified.',
    },
    reviewedAt: checkedAt,
    reviewNotes: `${hartford.reviewNotes || ''} Official District Council contact corroboration and legal-framework boundary added ${checkedAt}; the unavailable operator source and every traveler-delivery gate remain unresolved.`.trim().slice(0, 2200),
  },
]

const factDocs = [
  {
    _id: 'drafts.island-fact-source-replacement-queens-staircase-restoration-nassau-paradise-island',
    _type: 'islandFact',
    title: "Queen's Staircase: 2024 restoration provenance boundary",
    destination: reference('dest-nassau', 'destination-nassau-paradise-island'),
    topic: 'culture',
    claim: "An Office of the Prime Minister record dated 23 April 2024 documents the Queen's Staircase rededication and names AMMC, the Ministry of Tourism, the Ministry of Works, NPIPB and private contributors to that project.",
    travelerGuidance: 'Treat this as dated restoration provenance. It does not establish who currently operates the site, live opening conditions, accessibility, safety, photography or permission to reuse source media.',
    sources: [reference(opmQueensId, 'source-opm-rededication')],
    checkedAt,
    nextReviewAt: nextAnnualReviewAt,
    volatility: 'stable',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only fact. No public channel, point acceptance or operator claim is approved.',
    channels: [],
  },
  {
    _id: 'drafts.island-fact-source-replacement-fort-fincastle-tour-listing-nassau-paradise-island',
    _type: 'islandFact',
    title: 'Fort Fincastle: current tourism-listing boundary',
    destination: reference('dest-nassau', 'destination-nassau-paradise-island'),
    topic: 'access',
    claim: 'When checked on 5 August 2026, the official Bahamas tourism page for Fort Fincastle displayed daily guided tours from 8:00 a.m. to 4:00 p.m., donations appreciated, and a public contact. A 2024 government record described Fort work as still to come rather than completed.',
    travelerGuidance: 'This is an operational lead, not a guarantee. Confirm with the responsible site contact before relying on the tour window; current operator, closures, entrance, accessibility, condition and safety are not established.',
    sources: [
      reference('research-source-bmot-fort-fincastle', 'source-bmot-fort'),
      reference(opmQueensId, 'source-opm-rededication'),
    ],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'medium',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only operational lead. No delivery channel, booking promise, live-hours guarantee or restoration-completion claim is approved.',
    channels: [],
  },
  {
    _id: 'drafts.island-fact-source-replacement-hartford-cave-contact-boundary-rum-cay',
    _type: 'islandFact',
    title: 'Hartford Cave: protected-site and Council-contact boundary',
    destination: reference('dest-rum-cay', 'destination-rum-cay'),
    topic: 'culture',
    claim: 'The current official tourism page identifies Hartford Cave as a protected historical site with Lucayan-Arawak artifacts and petroglyphs and lists a Rum Cay District Council telephone and email. A separate current tourism page names the Council and repeats the same contact details.',
    travelerGuidance: 'The repeated contact is a verification lead only. It does not prove that the Council operates Hartford Cave or that entry, guiding, photography, exact-location disclosure, current cave condition or accessibility is authorized.',
    sources: [
      reference('research-source-bmot-hartford-cave', 'source-bmot-hartford'),
      reference(rumCayCouncilId, 'source-bmot-rum-cay-council'),
      reference(heritageActId, 'source-heritage-law-boundary'),
    ],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'medium',
    verificationStatus: 'source_verified',
    editorNotes: 'Review-only contact and identity evidence. The unavailable outbound heritage site remains provenance; no traveler delivery is approved.',
    channels: [],
  },
]

const baseAuditByIsland = new Map(live.baseAudits.map((document) => [document.destination?._ref, cleanDocument(document)]))
const nassauBase = baseAuditByIsland.get('dest-nassau')
const rumCayBase = baseAuditByIsland.get('dest-rum-cay')
if (!nassauBase || !rumCayBase) throw new Error('Base audit destination references are missing')

const auditDocs = [
  {
    _id: 'drafts.island-research-audit-2026-08-05-source-replacement-evidence-nassau-paradise-island',
    _type: 'islandResearchAudit',
    title: 'Nassau heritage source-replacement evidence — 2026-08-05',
    destination: reference('dest-nassau', 'destination-nassau-paradise-island'),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: nassauBase.overallScore,
    coverage: nassauBase.coverage,
    gaps: [
      gap('nassau-paradise-island', 'culture', 'p1', "Queen's Staircase 2024 restoration provenance", 'OPM rededication source, date, project scope and contributor boundary recorded without extending it to current operation.', 'resolved'),
      gap('nassau-paradise-island', 'culture', 'p1', 'Unavailable AMMC source replacement formally recorded', 'Current official replacement records and their claim boundaries are linked on the unavailable source. Preserve the historical URL and continue the separate responsible-authority and traveler-operation work.', 'resolved'),
      gap('nassau-paradise-island', 'access', 'p0', "Queen's Staircase current responsible operator and visitor operation", 'Obtain a current site-responsible source for operator identity, hours or closures, entrances, condition, security and visitor contact.', 'researching'),
      gap('nassau-paradise-island', 'access', 'p1', 'Fort Fincastle current tourism-listing lead', 'BMOT tour window, donations language and public contact recorded as a recheckable lead rather than a guarantee.', 'resolved'),
      gap('nassau-paradise-island', 'access', 'p0', 'Fort Fincastle responsible operator and live tour confirmation', 'Confirm the current operator, guided-tour schedule, donations policy, closures, entrance and restoration status through an accountable site-responsible channel.', 'researching'),
      gap('nassau-paradise-island', 'accessibility', 'p0', 'Nassau heritage feature-level accessibility and safe route', 'Verify surfaces, steps, handrails, gradients, step-free alternatives, rest points, lighting and accessible arrival for each feature.', 'open'),
      gap('nassau-paradise-island', 'culture', 'p1', 'Nassau heritage photography and media permissions', 'Obtain site-specific visitor-photography rules and reusable-media permission; source-page display is not a reuse licence.', 'open'),
    ],
    sources: [
      reference('research-source-bmot-queens-staircase', 'source-bmot-queens'),
      reference('research-source-bmot-queens-staircase-natural-wonder', 'source-bmot-queens-natural'),
      reference('research-source-bmot-fort-fincastle', 'source-bmot-fort'),
      reference(opmQueensId, 'source-opm-rededication'),
      reference(heritageActId, 'source-heritage-law'),
      reference(bmotContactId, 'source-bmot-contact'),
      reference('research-source-ammc-public-site-no-program-detail', 'source-ammc-unavailable'),
    ],
    methodologyNotes: 'This layer records a bounded replacement set, not responsible operation. It preserves the unavailable AMMC record as provenance, records the 2024 restoration project, current tourism listings, and public routing contact, and leaves live management, access, accessibility, safety, geometry and media-rights gates blocked. Coverage scores are carried from the latest signature-place content audit because no fact is approved for delivery.',
  },
  {
    _id: 'drafts.island-research-audit-2026-08-05-source-replacement-evidence-rum-cay',
    _type: 'islandResearchAudit',
    title: 'Rum Cay heritage source-replacement evidence — 2026-08-05',
    destination: reference('dest-rum-cay', 'destination-rum-cay'),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: rumCayBase.overallScore,
    coverage: rumCayBase.coverage,
    gaps: [
      gap('rum-cay', 'culture', 'p1', 'Hartford Cave identity and District Council contact lead', 'BMOT protected-site context and repeated Council contact recorded with an explicit no-operator inference boundary.', 'resolved'),
      gap('rum-cay', 'culture', 'p1', 'Unavailable Rum Cay heritage source replacement formally recorded', 'Current official replacement records and their claim boundaries are linked on the unavailable source. Preserve the historical URL and continue the separate responsible-authority and traveler-operation work.', 'resolved'),
      gap('rum-cay', 'access', 'p0', 'Hartford Cave responsible heritage authority and current visitor operation', 'Verify the named authority or custodian, current operation, permission route, guide requirement, closures and official visitor contact.', 'researching'),
      gap('rum-cay', 'safety', 'p0', 'Hartford Cave permission, guide, condition and emergency plan', 'Obtain current responsible guidance covering cave condition, terrain, air, wildlife, equipment, group control, communications and emergency response.', 'open'),
      gap('rum-cay', 'accessibility', 'p0', 'Hartford Cave feature-level accessibility', 'Verify arrival, route surface, gradients, clearance, lighting, assistance, sensory conditions and whether any accessible interpretation exists.', 'open'),
      gap('rum-cay', 'culture', 'p0', 'Hartford Cave petroglyph protection and media rules', 'Obtain heritage-authority rules for touching, lighting, photography, filming, location disclosure, interpretation and reusable media.', 'open'),
      gap('rum-cay', 'access', 'p1', 'Hartford Cave exact entrance disclosure decision', 'Do not publish a precise point until the responsible authority confirms that disclosure is appropriate and the entrance is correct.', 'open'),
    ],
    sources: [
      reference('research-source-bmot-rum-cay', 'source-bmot-rum-cay'),
      reference('research-source-bmot-hartford-cave', 'source-bmot-hartford'),
      reference(rumCayCouncilId, 'source-bmot-rum-cay-council'),
      reference(heritageActId, 'source-heritage-law'),
      reference(bmotContactId, 'source-bmot-contact'),
      reference('research-source-operator-rum-cay-heritage-unavailable', 'source-heritage-site-unavailable'),
      reference('research-source-rgd-family-island-administration-offices', 'source-rgd-administration-boundary'),
    ],
    methodologyNotes: 'This layer records a bounded replacement set for Hartford Cave identity and contact provenance only. The repeated District Council contact is not treated as proof that the Council operates the cave, and the off-island Family Island Administration listing is not an access route. Permission, guide, condition, safety, accessibility, disclosure and media-rights gaps remain active. Coverage scores are carried from the latest signature-place content audit because no fact is approved for delivery.',
  },
]

const documents = [
  ...sourceDocs,
  ...updatedBlockedSources,
  ...candidateDocs,
  ...factDocs,
  ...auditDocs,
]

const guardrails = {
  exactDocumentCount: documents.length === 14,
  fourNewActiveSources: sourceDocs.length === 4 && sourceDocs.every((document) => document.status === 'active' && document.reviewPlan?.workflowStatus === 'scheduled'),
  unavailableSourcesHaveBoundedReplacements: updatedBlockedSources.every((document) => document.status === 'unavailable' && document.reviewPlan?.workflowStatus === 'replacement_recorded' && document.replacementSources?.length >= 4 && document.replacementBoundary?.length > 300),
  allFactsAreDraftsAndChannelFree: factDocs.every((document) => document._id.startsWith('drafts.') && document.verificationStatus !== 'approved' && document.channels.length === 0),
  allAuditsAreDraftsAndResearching: auditDocs.every((document) => document._id.startsWith('drafts.') && document.status === 'researching'),
  allCandidatesRemainBlockedResearchDrafts: candidateDocs.every((document) => document._id.startsWith('drafts.') && document.canonicalCreationStatus === 'researching' && document.travelerReadinessReview?.overallStatus === 'blocked' && document.travelerReadinessReview?.deliveryDecision === 'blocked'),
  noAcceptedCoordinate: candidateDocs.every((document) => document.locationReview?.reviewDecision !== 'accepted'),
  noActivationOrDeliveryFieldsAdded: candidateDocs.every((document) => !Object.hasOwn(document, 'active') && !Object.hasOwn(document, 'channels')),
  noAccessibilityOrMediaApproval: candidateDocs.every((document) => document.travelerReadinessReview?.accessibilityStatus !== 'published' && document.travelerReadinessReview?.mediaStatus !== 'rights_cleared'),
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
    newSources: sourceDocs.length,
    unavailableSourcesUpdated: updatedBlockedSources.length,
    candidatesUpdated: candidateDocs.length,
    factDrafts: factDocs.length,
    auditDrafts: auditDocs.length,
    openP0Gaps: auditDocs.flatMap((document) => document.gaps).filter((item) => item.priority === 'p0' && item.status !== 'resolved').length,
    resolvedEvidenceTasks: auditDocs.flatMap((document) => document.gaps).filter((item) => item.status === 'resolved').length,
  },
  guardrails,
}, null, 2)}\n`)

console.log(JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), null, 2))
