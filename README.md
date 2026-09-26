# Baha Buddy Sanity Studio

Hosted Studio: **https://bahabuddy.sanity.studio/**

Sanity Studio is Baha Buddy's editorial CMS. It uses project `593u37vh` and the `production`
dataset. The canonical ownership decision is documented in
[`../docs/2026-08-04-ADR-SANITY-CONTENT-ARCHITECTURE.md`](../docs/2026-08-04-ADR-SANITY-CONTENT-ARCHITECTURE.md).

## What belongs here

- Destination narrative, trip-fit guidance, images, FAQs, and SEO
- Articles, travel guides, tips, editorial itineraries, and authors
- Editorial experiences and guided-tour presentation
- Curated collections, campaigns, social videos, and traveler stories
- Marketing/help/legal page drafts, navigation, homepage copy, starter prompts, and global settings
- Citation registry, verified island facts, dated island coverage audits, review-only emergency-facility evidence, provenance-safe historical facility-location reconciliation, source-linked signature-place coordinate review, and controlled candidates for official place identities missing from Supabase

Do not treat copied editorial overlays as live inventory. Canonical places, hotel/flight/tour
availability, verified prices, operational cruise itineraries, bookings, payments, partner records,
and traveler data remain in Supabase and approved provider systems.

## Editor navigation

The custom Studio desk is grouped into:

1. **Start Here** — pages, collections, navigation, and the Site & App Settings singleton
2. **Guides & Planning** — articles, itineraries, tips, FAQs, and authors
3. **Islands & Experiences** — destinations, editorial experiences, and guided tours
4. **Campaigns & Community** — deals, social videos, and traveler stories
5. **Content Migration** — Supabase place overlays and hardcoded-copy cleanup inventory
6. **Island Research Repository** — official sources, evidence-backed facts, and gap audits
7. **Recently Updated** — a cross-type recency view

The research repository also exposes operational queues for audits in progress, audits due, facts
awaiting approval, facts needing recheck, official signature-place catalog review, signature-place
location candidates, signature-place location conflicts and gaps, canonical-place candidates
missing from Supabase, candidate location conflicts and gaps, emergency
facilities awaiting review, emergency facilities needing recheck, pending shelter-location
candidates, unresolved shelter-location gaps, and sources needing recheck. Review dates and
reconciliation state drive these queues; they are not traveler-facing publication controls.

The source-adjudication queue isolates high-risk missing-place candidates where primary sources
can rank evidence but cannot yet justify a canonical point or public access decision:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;signaturePlaceSourceAdjudication`.

The traveler-readiness queue keeps all 37 missing-place candidates—including point, area,
distributed, source-only, invalid-point, related-site, and conflict states—separate from traveler
delivery until responsible ownership, operation, access, safety, accessibility, copy, and
media-rights evidence are all reviewed:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;signaturePlaceTravelerReadiness`.

The matched-place traveler-readiness queue applies the same independent gates to the 27 official
signature identities already matched to Supabase. A catalog match remains draft-only until its
operation or closure, access, safety, accessibility, copy, media, and location evidence are all
reviewed:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;matchedSignaturePlaceTravelerReadiness`.

The signature-place content-readiness queue combines all 37 missing candidates and 27 matched
overlays for the next evidence layer: feature-level accessibility, seven copy components, exact
media rights and credits, image-specific alt text, and final editorial delivery. Source-page
display, visitor photography permission, and park capture permission are recorded as boundaries,
not reusable licenses:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;signaturePlaceContentReadiness`.

The source registry has four maintenance views: all ownership and cadence plans, sources that need
recheck or replacement, unavailable provenance records with bounded replacements, and sources that
still lack evidence-backed island routing:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;sourceFreshnessOwnership`,
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;sourceAttentionRequired`,
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;sourceReplacementsRecorded`, and
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;sourceRoutingGaps`.

The heritage source-replacement queue isolates the current Nassau and Rum Cay evidence package.
It records dated restoration provenance, an operational tourism-listing lead, a corroborated
District Council contact, and the formal bounded replacement sets without reviving either dead URL
or approving traveler use:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;heritageSourceReplacementEvidence`.

The Andros signature-place pilot brings the three matched Supabase place reviews and one missing
canonical candidate together with their exact evidence facts, responsible sources, and open audit
gates. The queue preserves Blue Holes' temporary closure, area-versus-point boundaries for the reef
and parks, West Side's boat-only wilderness model, and the unavailable Androsia hours source without
approving coordinates or delivery:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;androsSignaturePlacePilot`.

The Exumas signature-place and public-copy pilot brings Big Major Cay, Compass Cay Marina, the
Exuma Cays Land & Sea Park, and the missing Thunderball Grotto canonical candidate into one review
desk with their source-backed facts and open gates. It also isolates a corrective Pig Beach article
draft after the live imported guide was found to contain unsupported provider, price, timing, and
animal-care claims. The published article, hardcoded fallback, Supabase rows, coordinates, and
delivery channels remain unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;exumasSignaturePlacePilot`.

The Eleuthera & Harbour Island pilot brings Glass Window Bridge and Pink Sands Beach together with
the missing Pineapple Fields and Spanish Wells canonical candidates, current Ministry bridge and
traffic evidence, a bounded passenger-route source, and a specific-farm research lead. It also
isolates a corrective Pink Sands article draft after fixed prices, timing, transport, population,
and named-venue claims in the live guide could not be supported by the reviewed current evidence.
Coordinates, Supabase rows, the published article, hardcoded fallback, and delivery channels remain
unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;eleutheraSignaturePlacePilot`.

The Grand Bahama pilot brings Gold Rock Beach and Lucayan National Park together with the missing
Peterson Cay National Park and Port Lucaya Marketplace canonical candidates. It records Lucayan's
current managing-authority facilities and cave restrictions, models Peterson as a protected area
rather than a single point, and flags Port Lucaya's stale, internally inconsistent operator page.
A corrective destination draft removes unsupported season, duration, value, suitability, route,
ranking, venue, and activity claims while leaving the published destination, hardcoded fallbacks,
Supabase rows, coordinates, media, and delivery channels unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;grandBahamaSignaturePlacePilot`.

Preview and explicitly apply that bounded batch with:

```bash
npm run research:grand-bahama:signature-places-plan
npm run research:grand-bahama:signature-places-apply
```

The Rum Cay pilot reconciles the existing `HMS Conqueror Underwater Museum` Supabase row as a
source-backed name variant of HMS Conqueror Shipwreck, preventing a duplicate canonical place. It
models Port Nelson as a community area and Conception Island National Park as a protected area,
keeps Hartford Cave access and disclosure blocked pending responsible heritage evidence, and
records the current Sumner Point stay/operation conflict. A corrective destination draft removes
unsupported superlatives, low-key-stay, day-trip, suitability, and external-image assumptions while
leaving the published destination, hardcoded web/mobile copy, Supabase rows, coordinates, media, and
delivery channels unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;rumCaySignaturePlacePilot`.

Preview and explicitly apply that bounded batch with:

```bash
npm run research:rum-cay:signature-places-plan
npm run research:rum-cay:signature-places-apply
```

The Mayaguana evidence-and-catalog pilot profiles all current Mayaguana Supabase place rows, the
published and draft Sanity overlays, and hardcoded web/mobile fallbacks. It records six active,
unverified, out-of-bounds catalog assignments as inactive correction drafts; models Abraham's Bay
and Booby Cay as area identities rather than accepted routing points; preserves the Pirates Well
Mayaguana/South Bimini source conflict; and captures Baycaner's 12-versus-16-room, insecure-link,
transport, accessibility, and operation conflicts. It also preserves the regulator-versus-AOPA
runway conflict as a current access/transport P0. The corrective destination draft removes
unsupported superlatives, suitability, longest-beach, pristine, one-resort, no-traffic-light, and
external-image assumptions while leaving Supabase, published Sanity, and hardcoded copy unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;mayaguanaEvidenceConflictPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=mayaguana npm run research:island-surfaces
ISLAND_SLUG=mayaguana npm run research:island-profile
npm run research:mayaguana:evidence-conflicts-plan
npm run research:mayaguana:evidence-conflicts-apply
```

The Acklins & Crooked evidence-and-image pilot adds a rights-aware image repository alongside the
existing content research workflow. Its queue contains three managed NASA/public-domain geography
assets ready for editorial review and four tourism-CDN candidates held as external links until the
exact controlled-library license, subject, creator, credit, and usage limits are documented. The
same queue exposes all 11 Supabase place corrections, Long Cay's area/community model, the invalid
Turtle Sound longitude, the distributed Ancient Lucayan Sites identity, the Bight measurement
conflict, ferry-source reconciliation, three evidence facts, and a corrective destination draft.
Published Sanity, Supabase, hardcoded web/mobile copy, coordinates, and delivery channels remain
unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;acklinsCrookedEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=acklins-crooked-island npm run research:island-surfaces
ISLAND_SLUG=acklins-crooked-island npm run research:island-profile
npm run research:acklins-crooked:evidence-media-plan
npm run research:acklins-crooked:evidence-media-apply
```

The Ragged Island evidence-and-image pilot applies the same rights-aware workflow to the current
destination, Supabase catalog, hardcoded web/mobile image maps, and named place/provider leads. Its
queue contains two managed NASA geography images and one managed CC BY-SA locator map ready for
editorial review, plus six tourism-CDN candidates held as external links until exact controlled-
library identity, creator, permission, credit, and usage limits are documented. It also exposes ten
inactive Supabase correction drafts, six research-only place/provider candidates, the no-commercial-
flight/private-charter boundary, the Lost Key capacity conflict, the turtle-soup versus fisheries-
regulation conflict, five evidence facts, and a corrective destination draft. Published Sanity,
Supabase, hardcoded web/mobile copy, coordinates, providers, and delivery channels remain unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;raggedIslandEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=ragged-island npm run research:island-surfaces
ISLAND_SLUG=ragged-island npm run research:island-profile
npm run research:ragged-island:evidence-media-plan
npm run research:ragged-island:evidence-media-apply
```

The Berry Islands evidence-and-image pilot adds a bounded image-provenance, catalog, private-access,
operator, airport, and Blue Hole safety review. Its queue contains one managed NASA geography image,
one managed CC BY Great Harbour Cay aerial, and one managed CC BY-SA locator map ready for editorial
review. Six tourism-CDN images and the hardcoded generated web hero remain external-only until their
exact controlled-library or generation-provenance records are approved. The queue also exposes ten
inactive Supabase correction drafts, the three foreign/wrong-island collisions, Carriearl/Soul Fly
reconciliation, Chub Cay’s members-only boundary, Great Harbour Cay and Chub Cay air-access gates,
CocoCay cruise entitlement, Hoffman’s Cay cliff-jump safety, six evidence facts, and a corrective
destination draft. Published Sanity, Supabase, hardcoded web/mobile copy, coordinates, providers,
images, and delivery channels remain unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;berryIslandsEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=berry-islands npm run research:island-surfaces
ISLAND_SLUG=berry-islands npm run research:island-profile
npm run research:berry-islands:evidence-media-plan
npm run research:berry-islands:evidence-media-apply
```

The Inagua evidence-and-image pilot adds a bounded image-provenance, catalog, protected-area,
airport, lighthouse-safety, and wildlife-count review. Its queue contains a managed CC BY-SA
lighthouse image, a managed CC BY-SA orbital image, a managed archival CC BY flamingo image, a
managed public-domain Little Inagua satellite image, and a managed CC BY-SA locator map ready for
editorial review. The current and legacy tourism heroes, hardcoded generated web hero, tourism
lighthouse image, and three BNT protected-area displays remain external-only until their exact
controlled-library, asset-specific permission, or generation-provenance records are approved. The
queue also exposes 15 inactive Supabase correction drafts, seven foreign/wrong-island collisions,
the generic destination duplicate, 70,000-versus-over-80,000 flamingo-count conflict, three
protected-area access gates, Great Inagua Lighthouse climb-safety gate, Matthew Town airport gate,
seven evidence facts, and a corrective destination draft. Published Sanity, Supabase, hardcoded
web/mobile copy, coordinates, providers, wildlife claims, images, and delivery channels remain
unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;inaguaEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=inagua npm run research:island-surfaces
ISLAND_SLUG=inagua npm run research:island-profile
npm run research:inagua:evidence-media-plan
npm run research:inagua:evidence-media-apply
```

The Nassau & Paradise Island evidence-and-image pilot reconciles a split image-provenance path
across published Sanity/Supabase/mobile delivery, the generated web hero, current and legacy BMOT
heroes, and three hardcoded NPIPB mobile images. Its queue contains seven managed Creative Commons
assets ready for editorial review and seven live, official, hardcoded, or generated images held as
external links until exact rights, releases, or provenance are approved. It also exposes 44 inactive
catalog-correction drafts, the duplicate Hotel Riu pair, Fish Fry/Arawak Cay area-versus-venue
decision, 12 legacy landmark overlays, NAGB's Sunday-hours/elevator conflict, LPIA onward-transfer
boundary, New Providence/Paradise Island geography boundary, signature-heritage operation gates,
seven evidence facts, and a corrective destination draft. Published Sanity, Supabase, hardcoded
web/mobile copy, coordinates, providers, images, schedules, accessibility claims, and delivery
channels remain unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;nassauEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=nassau-paradise-island npm run research:island-surfaces
ISLAND_SLUG=nassau-paradise-island npm run research:island-profile
npm run research:nassau:evidence-media-plan
npm run research:nassau:evidence-media-apply
```

The Long Island evidence-and-image pilot reconciles the published Supabase/mobile hero, generated
web hero, legacy mobile tourism hero, and false `deansBlueHole` image alias. Its queue contains six
managed public-domain or Creative Commons assets ready for editorial review and eight live,
official, hardcoded, or generated images held as external links until exact rights or provenance
is approved. It also exposes 28 inactive catalog-correction drafts, three wrong-island Supabase
assignments, three null or `0,0` points, the generic destination duplicate, Chez Pierre category
pair, Dean's Blue Hole rank and water-safety conflict, Conception Island date/trail and boat-access
conflicts, two-airport transfer boundary, signature-place gates, seven evidence facts, and a
corrective destination draft. Published Sanity, Supabase, hardcoded web/mobile copy, coordinates,
providers, images, schedules, safety/accessibility claims, and delivery channels remain unchanged:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;longIslandEvidenceMediaPilot`.

Preview and explicitly apply that bounded batch with:

```bash
ISLAND_SLUG=long-island npm run research:island-surfaces
ISLAND_SLUG=long-island npm run research:island-profile
npm run research:long-island:evidence-media-plan
npm run research:long-island:evidence-media-apply
```

The Cat Island evidence-and-image pilot reconciles the published Supabase hero, generated web
hero, and legacy mobile tourism hero. Its queue contains five managed public-domain or Creative
Commons assets ready for editorial review and nine published, official, hardcoded, or generated
images held as external-only records. The generated web hero is explicitly rejected for factual
use because its synthetic building and coastal vista do not match the reviewed Hermitage image.
The queue also exposes 33 inactive catalog-correction drafts, six known wrong-island Supabase
assignments, two null or 0,0 points, the New Bight Fish Fry duplicate, the Shannas Cove
property/venue pair, two-airport transfer boundary, Hermitage trail/safety/accessibility gates,
Sidney Poitier heritage/privacy gate, distinct beach identities, seven evidence facts, and a
corrective destination draft. Published Sanity, Supabase, hardcoded web/mobile copy, coordinates,
providers, images, schedules, safety/accessibility claims, privacy/consent, and delivery channels
remain unchanged:
https://bahabuddy.sanity.studio/structure/islandResearchRepository;catIslandEvidenceMediaPilot.

Preview and explicitly apply that bounded batch with:

    ISLAND_SLUG=cat-island npm run research:island-surfaces
    ISLAND_SLUG=cat-island npm run research:island-profile
    npm run research:cat-island:evidence-media-plan
    npm run research:cat-island:evidence-media-apply

The San Salvador evidence-and-image queue separates the island from San Salvador city and Little
San Salvador, quarantines 22 wrong-country/island Supabase assignments plus three unusable points,
and exposes 41 inactive, channel-free place-correction drafts. It also holds the current MYSM/ZSA
regulator baseline, Southern Great Lake wilderness gate, Watling's Blue Hole safety gate, Gerace
eligibility gate, heritage/designation boundary, and eight channel-free facts. Six exact visually
reviewed Commons files are copied into Sanity as managed research assets with their dates and
licenses; eleven published, official, hardcoded, or generated images remain external-only. The
generated web hero is rejected for factual San Salvador use. Published Sanity, Supabase,
hardcoded web/mobile content, coordinates, providers, schedules, safety/accessibility claims, and
delivery channels remain unchanged:
https://bahabuddy.sanity.studio/structure/islandResearchRepository;sanSalvadorEvidenceMediaPilot.

Preview and explicitly apply that bounded batch with:

    ISLAND_SLUG=san-salvador npm run research:island-surfaces
    ISLAND_SLUG=san-salvador npm run research:island-profile
    npm run research:san-salvador:evidence-media-plan
    npm run research:san-salvador:evidence-media-apply

The official experience-theme queue isolates the 14 island-level facts added to close the live
`experiences` topic gap. Each fact is sourced from the current national-tourism island profile but
remains a channel-free review draft; operator, access, activity safety, accessibility, place-level
copy, and media evidence remain separate gates:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;officialExperienceThemeReview`.

The official culture-and-nature queue isolates the 11 bounded facts added for the seven missing
`culture` cells and four missing `nature` cells. They remain source-linked, channel-free review
drafts. Community authority, live access, conservation state, safety, accessibility, place-level
copy, and reusable-media evidence remain explicit gates:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;officialCultureNatureReview`.

Rebuild a read-only, cross-audit open-gap rollup with `npm run research:gaps`. It deduplicates exact
island/topic/title repetitions but preserves differently named gaps rather than assuming that one
research layer resolved another. Use `npm run research:gaps:full` only when the complete action and
source-audit payload is needed.

Rebuild the review-only 2026-facility versus 2023-GIS location crosswalk with:

```bash
npm run research:build-baseline
npm run research:shelter-gis:crosswalk
```

The crosswalk script downloads the public GIS snapshot only when the temporary input is absent and
emits reports plus a targeted Sanity replacement file under `/private/tmp`. Review the classifications
before importing; the script does not mutate Sanity itself.

Rebuild the read-only 64-place official island-profile crosswalk and its review-only Sanity tranche
with:

```bash
npm run research:signature-places:build
npm run research:signature-places:state
```

The build reads all current Supabase `places` rows without mutation, preserves explicit
primary-source decisions for known name variants, and emits 16 island audits plus inactive,
channel-free review drafts only for matched canonical candidates. Missing identities remain gaps.
Review the generated artifacts before running the explicit `research:signature-places:seed` import.

Rebuild the point-level review for the 19 location-blocked signature-place matches with:

```bash
npm run research:signature-place-locations:build
npm run research:signature-place-locations:state
```

The location audit queries all 16 public national-tourism map destination payloads and keeps exact
feature points, source-backed name variants, related visitor-site pins, geographic areas, and
coordinate conflicts distinct. The build writes local artifacts only. Review them before running
the explicit `research:signature-place-locations:seed` replacement import; every generated overlay
remains a draft with `active=false`, no delivery channels, and no accepted coordinate decision.

Rebuild the review-only tranche for the 37 official signature-place identities missing from
Supabase with:

```bash
npm run research:missing-signature-places:build
npm run research:missing-signature-places:state
```

The audit preserves exact points, source-backed aliases, conflicts, invalid coordinates, related
visitor sites, communities, geographic areas, and plural-site identities as different evidence
states. Review the local artifacts before running the explicit
`research:missing-signature-places:seed` import. `canonicalPlaceCandidate` documents have no
activation or delivery-channel fields; approving one records an editorial decision only and does
not write Supabase.

Rebuild the primary-source adjudication for Fountain of Youth, Queen's Staircase, Fort Fincastle,
Ancient Lucayan Sites, Twin Churches, Dolphin House Museum, Sir Sidney Poitier's Boyhood Home, and
Pigeon Cay with:

```bash
npm run research:signature-place-adjudication:build
npm run research:signature-place-adjudication:state
```

The audit uses reproducible Haversine comparisons only to rank conflicting official point evidence.
It preserves linear, distributed, component-site, operator-only, and relative-location identities
without collapsing them into one POI. Review the local manifest before the explicit
`research:signature-place-adjudication:seed` replacement import. Every candidate remains a research
draft, every fact has no delivery channels, and no coordinate is accepted.

Rebuild the traveler-readiness review for all 19 missing signature-place candidates that have one
official point candidate with:

```bash
npm run research:signature-place-readiness:build
npm run research:signature-place-readiness:state
```

The audit keeps a point, listing, managing authority, operator, and access instruction as separate
evidence. It records current restrictions and conflicts without turning static source text into a
live safety or access decision. Review the manifest before the explicit
`research:signature-place-readiness:seed` replacement import. All candidates remain researching,
all facts remain draft and channel-free, every traveler-delivery decision is blocked, and no point,
accessibility statement, media right, activation field, or Supabase write is approved.

Rebuild the complementary readiness review for the 18 missing identities that have an area,
source-only, point-conflict, invalid-point, or related-site-only evidence state with:

```bash
npm run research:signature-place-identity-readiness:build
npm run research:signature-place-identity-readiness:state
```

This layer keeps communities, waterways, protected areas, beaches, historic complexes, distributed
cultural identities, and cay chains out of a fabricated one-point model. It also keeps a related
operator or component-site marker from becoming authority for the whole identity. Review the local
manifest before the explicit `research:signature-place-identity-readiness:seed` import. Together
with the one-point tranche, the hosted traveler-readiness queue covers all 37 missing canonical
place candidates while approving none for Supabase or traveler delivery.

Rebuild the traveler-readiness review for the 27 official signature identities already matched to
Supabase with:

```bash
npm run research:matched-signature-place-readiness:build
npm run research:matched-signature-place-readiness:state
```

The audit preserves a current responsible closure at Blue Holes National Park, Compass Cay's
wrong-island conflict, location conflicts and related-site-only pins, wilderness and marine-access
constraints, operator-versus-listing authority, and NAGB's partial accessibility evidence. Review
the local manifest before the explicit `research:matched-signature-place-readiness:seed` import.
All 27 overlays remain drafts with `active=false`, empty channels, blocked delivery, no accepted
coordinates, no published accessibility claim, no cleared media right, and no Supabase mutation.

Rebuild the detailed accessibility, copy-component, media-rights, and alt-text review for all 64
official signature identities with:

```bash
npm run research:signature-place-content:build
npm run research:signature-place-content:state
```

The build combines all 37 missing candidates and 27 matched overlays, adds one draft evidence
boundary per identity and one audit per canonical island group, and records controlled media-policy
sources. Review the manifest before the explicit `research:signature-place-content:seed` replacement
import. All public-copy decisions remain blocked, and the workflow never copies source imagery,
approves alt text, accepts a coordinate, activates an overlay, enables a channel, or writes Supabase.

Rebuild the source-registry ownership and freshness layer with:

```bash
npm run research:sources:freshness:profile
npm run research:sources:freshness:build
npm run research:sources:freshness:state
```

The profile reads all live source documents and preserves their existing dates and status. The build
adds an internal owner, cadence, publisher relationship, verification method, early-change triggers,
and next action, plus one draft audit per island. Review the manifest before the explicit
`research:sources:freshness:seed` replacement import. Never resolve an unrouted national source or
promote a needs-recheck source by inference.

Profile any one island, or reproduce the bounded Andros, Exumas, or Eleuthera place-evidence
alignment, with:

```bash
ISLAND_SLUG=andros npm run research:island-profile
npm run research:andros:signature-places-plan
npm run research:andros:signature-places-apply
ISLAND_SLUG=the-exumas npm run research:island-profile
npm run research:exumas:signature-places-plan
npm run research:exumas:signature-places-apply
ISLAND_SLUG=eleuthera-harbour-island npm run research:island-profile
npm run research:eleuthera:signature-places-plan
npm run research:eleuthera:signature-places-apply
```

The generic profile is read-only. The Andros, Exumas, and Eleuthera apply commands change only their
named internal source records and review drafts after rechecking official-source signals. They do
not mutate Supabase, accept coordinates, activate place overlays, publish facts, add research
delivery channels, copy media, or contact a source owner. The Exumas and Eleuthera commands also
leave their published articles and hardcoded web fallbacks untouched.

Profile and rebuild the bounded heritage source-replacement package with:

```bash
npm run research:sources:replacement-profile
npm run research:sources:replacement:build
npm run research:sources:replacement:state
npm run research:sources:heritage-replacements-plan
```

The package adds official project, legal-framework, District Council contact, and Ministry routing
evidence for Queen's Staircase, Fort Fincastle, and Hartford Cave. The guarded alignment records
bounded replacement sources on the two unavailable provenance records and changes their workflow to
`replacement_recorded`; it does not revive the URLs or close current management, live access,
accessibility, safety, exact-location disclosure, or media-rights gates. Review the local manifest
before the explicit `research:sources:replacement:seed` import, then use
`research:sources:heritage-replacements-apply` only after the alignment plan passes. Facts and audits
remain drafts with no delivery channels.

Profile the live 16-island by 10-topic fact matrix, then rebuild the review-only official
experience-theme baseline with:

```bash
npm run research:facts:coverage-profile
npm run research:facts:experience-themes:build
npm run research:facts:experience-themes:state
```

The coverage profile defines a usable draft as current, `source_verified`, medium/high confidence,
and backed only by current active sources. That means internally reviewable evidence, not approved
or traveler-deliverable content. The experience-theme build adds one channel-free fact and one
researching audit for each of the 14 missing island cells without creating sources, changing
Supabase, or claiming live operators, access, safety, accessibility, media rights, or inventory.
Review the manifest before the explicit `research:facts:experience-themes:seed` import.

Rebuild the review-only official culture-and-nature evidence package with:

```bash
npm run research:facts:coverage-profile
npm run research:facts:culture-nature:build
npm run research:facts:culture-nature:state
```

The build closes only the seven missing culture and four missing nature matrix cells with bounded,
attributed claims from current official tourism pages. It creates 11 fact drafts and 10 researching
audits without creating sources or changing destinations, Supabase, delivery channels, or approval
state. Review the local manifest before the explicit `research:facts:culture-nature:seed` import.

Profile the remaining food gaps and their already-routed source candidates with:

```bash
npm run research:facts:food:profile
```

This read-only profile lists existing food drafts and only those candidate sources that are active,
current, destination-routed, and explicitly routed to `food`. Candidate status is not claim support
or proof that a restaurant currently operates.

Preview and then explicitly apply the bounded official-profile food routing with:

```bash
npm run research:facts:food:routing-plan
npm run research:facts:food:routing-apply
```

The alignment script validates all 13 active, current destination routes and appends only `food` to
each official island profile's existing topic list. It does not change source status, dates,
authority, URLs, owner plans, destinations, facts, audits, delivery, approval, or Supabase.

Rebuild the review-only official food package with:

```bash
npm run research:facts:food:build
npm run research:facts:food:state
```

The build adds one bounded food-identity fact and one researching audit for each of the 13 missing
cells. Current providers, menus, prices, allergens, food safety, sourcing, harvest legality,
conservation, accessibility and media rights remain open gates. Review the manifest before the
explicit `research:facts:food:seed` import. The dedicated queue is:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;officialFoodReview`.

Rebuild the consequence-weighted P0 portfolio profile with:

```bash
npm run research:gaps:p0-priority
```

The read-only profile uses the canonical exact-title rollup, assigns every open P0 to a responsible
workstream, identifies cross-island actions that close the most risk at once, and reports both the
highest-consequence islands and the lowest residual-P0 pilot candidates. Weights prioritize work;
they do not label an island unsafe or approve content. Hosted work queues are under:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;p0DeliveryWorkstreams`.

Build the Board-gated emergency-authority evidence request profile with:

```bash
npm run research:gaps:emergency-authority-profile
```

This read-only profile extracts the 11 emergency and safety P0 patterns repeated across all 16
island groups, maps the resulting 176 occurrences in 112 audit documents to five
responsible-authority request packets, and verifies the 25 primary-government sources used to
frame them. It records the current
official RBDF public SAR and VHF routing as a national baseline without treating it as island-level
coverage or operational proof. It does not contact an authority, send email, approve content,
publish a document, add delivery channels, or mutate Supabase. The focused hosted queue is:
`https://bahabuddy.sanity.studio/structure/islandResearchRepository;p0DeliveryWorkstreams;emergencyAuthorityEvidenceRequests`.

Preview and explicitly apply the bounded RBDF public SAR source alignment with:

```bash
npm run research:sources:rbdf-sar-plan
npm run research:sources:rbdf-sar-apply
```

The alignment verifies the current official page signals before adding or updating one live/internal
source, then appends that citation and a narrow resolved national-routing baseline to all 16
existing marine-SAR fact and audit drafts. It leaves the island/cay communications P0 open, keeps
facts channel-free, and never approves, publishes, contacts an authority, or mutates Supabase.

Profile the live consumer boundary and rerun its static safety gates with:

```bash
npm run research:content-delivery:profile
npm run research:content-delivery:audit
```

The profile distinguishes published documents, drafts, explicit delivery channels, and legacy
channel-free content. The audit fails if current web/mobile GROQ starts reading an internal research
type, obsolete mobile `island`/`guide` queries return, required draft/channel filters disappear, or a
live fact becomes deliverable without the approval boundary. It never publishes or mutates content.

## Before publishing

1. Choose the correct delivery channels. Existing consumers treat documents without a channel as
   legacy content and continue showing them.
2. For destinations, use the exact Supabase `islands.slug` in **Canonical Island ID**. Add old names
   under **Legacy Slug Aliases**.
3. Add alt text and photo credit/source metadata to editorial images.
4. Do not claim live availability or guaranteed prices in narrative fields. Deal and tour display
   prices must say “from” or otherwise explain their planning-only status.
5. Confirm usage rights before activating social videos and publication consent before publishing
   traveler stories.
6. Set review dates for facts that can change, including access, seasonality, safety, price guidance,
   and partner offers.
7. Publish in Sanity, then verify the relevant consumer route. New authoring-ready document types do
   not appear in product UI until their web/mobile consumer is wired.
8. Keep research separate from delivery: sources and island facts must be evidence-backed, dated,
   confidence-rated, and approved before their claims are copied into public destination content.
9. Treat emergency-facility names and capacities as dated source evidence only. Never infer current
   activation, opening, condition, usable capacity, transport, services, or accessibility from a
   facility record or special-needs designation.
10. Treat historical shelter GIS coordinates as discovery candidates. A pending or accepted
    historical point is not a live entrance, evacuation route, current inspection result, or
    activation instruction.
11. Treat an official signature-place match as identity evidence only. Broad-bound coordinates,
    exact names, and source-backed aliases do not prove current operation, precise entrance,
    safety, accessibility, sourced copy, media rights, or launch readiness.
12. Treat official map coordinates as pending evidence. A beach, marina, museum, entrance, or
    visitor-site pin must not be promoted automatically to a whole cay, lagoon, park, lake, or blue
    hole; map visibility and update metadata do not prove current operation or safe access.
13. Treat a missing canonical-place candidate as an internal proposal only. A Sanity draft or even
    an editorial approval does not create a Supabase place; the catalog change requires a separate,
    reviewed migration or admin workflow after all identity, duplicate, point/area, operation,
    access, safety, accessibility, copy, and media-rights gates pass.
14. Treat a traveler-readiness review as a dated evidence boundary, not an authorization. Tide,
    weather, transport, opening, permission, and emergency conditions still require a responsible
    live source at the time of travel.

## Current delivery matrix

| Type | Web | Mobile |
|---|---|---|
| Article | Live on Guides, Explore, and home editorial cards | Detail route can load by slug |
| Destination | Live on `/explore/island/[id]` | Island details currently use Supabase |
| Tip | Live home-card query | Live home-card query with static fallback |
| Social video / traveler story | Live Explore Community query | Consumer wiring pending |
| Deal / experience / site settings | Query helpers present | Deal query contract present |
| Guided tour | Consumer wiring pending | Schema matches the existing query contract and now exposes explicit delivery channels; current imports remain legacy channel-free until reviewed |
| Page | About, How It Works, Help, Accessibility, Contact, Privacy, and Terms are Sanity-first | Consumer wiring pending |
| Collection / FAQ / itinerary / author / navigation / place overlay | Consumer wiring varies; see migration handoff | Consumer wiring pending |
| Research source / island fact / audit / emergency facility / canonical place candidate | Internal review repository only; no consumer query | Internal review repository only; no consumer query |

The exact production route map, current publication/channel counts, Buddy/Supabase boundary, public
slugs, validation proof, and deployment links are recorded in
[`../docs/2026-08-05-CONTENT-DELIVERY-CONSUMER-TRACE.md`](../docs/2026-08-05-CONTENT-DELIVERY-CONSUMER-TRACE.md).

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 3333
```

Open [http://localhost:3333](http://localhost:3333).

## Imported content refresh

The repeatable importer reads public editorial tables from Supabase and inventories hardcoded web/mobile copy:

```bash
npm run content:build-import
npm run content:import
```

The normal import uses `--missing`, preserving editor changes. `npm run content:refresh-source` replaces matching source-derived documents and must only be used after reviewing or exporting editorial changes.

Current migration and ownership details: [`../docs/2026-08-04-SANITY-CONTENT-MIGRATION-AND-HOSTING.md`](../docs/2026-08-04-SANITY-CONTENT-MIGRATION-AND-HOSTING.md).

## Release checks

```bash
npm run build
npm run deploy -- --schema-required
```

The installed Sanity 3.x toolchain currently emits a non-blocking `styled-components` compatibility
warning. A clean `npm run build` is the required schema release check before deployment.
