import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const workspace = path.resolve(scriptDir, '../..')
const outputPath = process.env.CONTENT_DELIVERY_AUDIT_OUTPUT || '/private/tmp/baha-buddy-content-consumer-gate-audit.json'

const files = {
  webQueries: path.join(workspace, 'bahabuddy-web/src/lib/sanity/queries.ts'),
  mobileSanity: path.join(workspace, 'Baha-Buddy-V2/lib/core/services/sanity_service.dart'),
  mobileExplore: path.join(workspace, 'Baha-Buddy-V2/lib/services/explore_content_service.dart'),
  factSchema: path.join(workspace, 'studio/schemas/islandFact.ts'),
  profile: '/private/tmp/baha-buddy-content-consumer-delivery-profile.json',
}

const source = Object.fromEntries(
  Object.entries(files)
    .filter(([, filePath]) => fs.existsSync(filePath))
    .map(([key, filePath]) => [key, fs.readFileSync(filePath, 'utf8')]),
)

function check(id, passed, evidence) {
  return {id, passed: Boolean(passed), evidence}
}

const forbiddenResearchTypes = [
  'canonicalPlaceCandidate',
  'emergencyFacility',
  'islandFact',
  'islandResearchAudit',
  'legacyCopyInventory',
  'researchSource',
]
const consumerSource = `${source.webQueries || ''}\n${source.mobileSanity || ''}\n${source.mobileExplore || ''}`
const forbiddenMatches = forbiddenResearchTypes.filter((type) => consumerSource.includes(`_type == "${type}"`))

const profile = source.profile ? JSON.parse(source.profile) : null
const checks = [
  check(
    'research-types-not-queried-by-web-or-mobile',
    forbiddenMatches.length === 0,
    forbiddenMatches.length === 0 ? 'No internal research document type appears in product GROQ.' : `Found: ${forbiddenMatches.join(', ')}`,
  ),
  check(
    'obsolete-mobile-types-removed',
    !source.mobileExplore?.includes('_type == "island"') && !source.mobileExplore?.includes('_type == "guide"'),
    'The old direct mobile Sanity path no longer queries nonexistent island/guide types.',
  ),
  check(
    'mobile-sanity-is-proxied',
    source.mobileSanity?.includes("functions.invoke(\n        'sanity-proxy'") && !source.mobileExplore?.includes('api.sanity.io'),
    'The active Flutter Sanity service invokes sanity-proxy; Explore has no direct Content Lake request.',
  ),
  check(
    'web-deals-require-web-channel',
    source.webQueries?.includes('_type == "deal" && active == true && "web" in channels && !(_id in path("drafts.**"))'),
    'Active web deals require an explicit web channel and published document ID.',
  ),
  check(
    'web-current-consumers-filter-drafts',
    (source.webQueries?.match(/!\(_id in path\("drafts\.\*\*"\)\)/g) || []).length >= 15,
    'All current web list/detail query families retain explicit draft exclusion.',
  ),
  check(
    'mobile-current-consumers-filter-channel-and-drafts',
    (source.mobileSanity?.match(/\(!defined\(channels\) \|\| "mobile" in channels\)/g) || []).length >= 7 &&
      (source.mobileSanity?.match(/!\(_id in path\("drafts\.\*\*"\)\)/g) || []).length >= 7,
    'All current Flutter article, tip, deal, and guided-tour query families retain mobile-channel and draft gates.',
  ),
  check(
    'fact-schema-requires-explicit-approval-contract',
    source.factSchema?.includes("{title: 'Approved', value: 'approved'}") &&
      source.factSchema?.includes("name: 'channels'") &&
      source.factSchema?.includes('Only set after approval and consumer review.'),
    'Island facts have separate approval status and explicit delivery channels.',
  ),
  check(
    'live-profile-has-no-deliverable-island-facts',
    profile?.counts?.strictWebFacts === 0 && profile?.counts?.strictMobileFacts === 0 && profile?.counts?.strictBuddyFacts === 0,
    profile ? `web=${profile.counts.strictWebFacts}, mobile=${profile.counts.strictMobileFacts}, buddy=${profile.counts.strictBuddyFacts}` : 'Live profile missing; run research:content-delivery:profile first.',
  ),
  check(
    'live-profile-guards-pass',
    profile?.strictResearchDelivery?.guards?.noUnapprovedFactIsStrictlyDeliverable === true &&
      profile?.strictResearchDelivery?.guards?.noDraftFactCountedAsStrictlyDeliverable === true,
    profile?.strictResearchDelivery?.guards || 'Live profile missing.',
  ),
]

const report = {
  generatedAt: new Date().toISOString(),
  files,
  passed: checks.every((entry) => entry.passed),
  checks,
  boundary: 'This audit proves query and publication gates. It does not approve, publish, activate, or synchronize any document.',
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, passed: report.passed, checks}, null, 2))

if (!report.passed) process.exitCode = 1
