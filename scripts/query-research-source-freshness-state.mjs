import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_type == "researchSource"] | order(_id asc){
    _id, title, url, publisher, sourceClass, authorityLevel,
    "destinationCount": count(destinations), topics, checkedAt, nextReviewAt, status,
    replacementBoundary, "replacementSourceIds": replacementSources[]._ref,
    "referenceCount": count(*[references(^._id)]),
    reviewPlan{
      plannedAt, reviewOwner, workflowStatus, freshnessStatus, cadenceBand, cadenceDays,
      sourceRelationship, verificationMethod, changeTriggers, reviewScope, nextAction
    }
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-*"]{
    _id, title, "island": destination->islandId, status,
    "sourceCount": count(sources),
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "openP1": count(gaps[priority == "p1" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-source-freshness-owner-cadence-*"]{_id}
}`)

function distribution(field, nested = false) {
  const values = documents.sources.map((source) => nested ? source.reviewPlan?.[field] : source[field])
  return Object.fromEntries([...new Set(values)].filter(Boolean).sort().map((value) => [value, values.filter((item) => item === value).length]))
}

const sourceById = new Map(documents.sources.map((source) => [source._id, source]))
const bahamasair = sourceById.get('research-source-bahamasair')
const bmotIslandIndex = sourceById.get('research-source-bmot-islands-index')
const bntParkIndex = sourceById.get('research-source-bnt-national-parks')
const ammc = sourceById.get('research-source-ammc-public-site-no-program-detail')
const rumCayHeritage = sourceById.get('research-source-operator-rum-cay-heritage-unavailable')
const activeSourceCount = documents.sources.filter((source) => source.status === 'active').length
const needsRecheckSourceCount = documents.sources.filter((source) => source.status === 'needs_recheck').length
const unavailableOrRejectedSourceCount = documents.sources.filter((source) => ['unavailable', 'rejected'].includes(source.status)).length
const scheduledWorkflowCount = documents.sources.filter((source) => source.reviewPlan?.workflowStatus === 'scheduled').length
const attentionWorkflowCount = documents.sources.filter((source) => source.reviewPlan?.workflowStatus === 'attention_required').length
const replacementWorkflowCount = documents.sources.filter((source) => ['replacement_required', 'replacement_recorded'].includes(source.reviewPlan?.workflowStatus)).length

const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    plannedSources: documents.sources.filter((source) => source.reviewPlan).length,
    auditDrafts: documents.audits.length,
    islands: new Set(documents.audits.map((document) => document.island)).size,
    sourcesWithoutDestinationRouting: documents.sources.filter((source) => !source.destinationCount).length,
    sourcesWithoutReferences: documents.sources.filter((source) => source.referenceCount === 0).length,
    sourcesWithoutOwner: documents.sources.filter((source) => !source.reviewPlan?.reviewOwner).length,
    sourcesWithoutCadence: documents.sources.filter((source) => !source.reviewPlan?.cadenceDays).length,
    publishedAudits: documents.publishedAudits.length,
  },
  distributions: {
    sourceStatus: distribution('status'),
    workflowStatus: distribution('workflowStatus', true),
    freshnessStatus: distribution('freshnessStatus', true),
    cadenceBand: distribution('cadenceBand', true),
    sourceRelationship: distribution('sourceRelationship', true),
    sourceClass: distribution('sourceClass'),
    authorityLevel: distribution('authorityLevel'),
  },
  guardrails: {
    everySourceHasReviewPlanOwnerAndCadence: documents.sources.length > 0 && documents.sources.every((source) => source.reviewPlan?.reviewOwner === 'Baha Buddy Content Operations' && source.reviewPlan.cadenceDays > 0),
    workflowCountsPreserved: scheduledWorkflowCount === activeSourceCount && attentionWorkflowCount === needsRecheckSourceCount && replacementWorkflowCount === unavailableOrRejectedSourceCount && scheduledWorkflowCount + attentionWorkflowCount + replacementWorkflowCount === documents.sources.length,
    sourceStatusesMappedWithoutPromotion: documents.sources.every((source) => {
      if (source.status === 'needs_recheck') return source.reviewPlan?.freshnessStatus === 'needs_recheck' && source.reviewPlan.workflowStatus === 'attention_required'
      if (['unavailable', 'rejected'].includes(source.status)) {
        const replacementRecorded = source.reviewPlan?.workflowStatus === 'replacement_recorded' && source.replacementSourceIds?.length > 0 && source.replacementBoundary
        const replacementRequired = source.reviewPlan?.workflowStatus === 'replacement_required' && !source.replacementSourceIds?.length && !source.replacementBoundary
        return source.reviewPlan?.freshnessStatus === 'unavailable_or_rejected' && (replacementRecorded || replacementRequired)
      }
      return source.reviewPlan?.freshnessStatus === 'current' && source.reviewPlan.workflowStatus === 'scheduled'
    }),
    allSixteenIslandAuditsAreDrafts: documents.audits.length === 16 && new Set(documents.audits.map((document) => document.island)).size === 16,
    noPublishedTrancheAudits: documents.publishedAudits.length === 0,
    threeUnroutedSourcesPreserved: documents.sources.filter((source) => !source.destinationCount).length === 3 && !bahamasair?.destinationCount && !bmotIslandIndex?.destinationCount && !bntParkIndex?.destinationCount,
    twoUnreferencedSourcesPreserved: documents.sources.filter((source) => source.referenceCount === 0).length === 2 && bmotIslandIndex?.referenceCount === 0 && bntParkIndex?.referenceCount === 0,
    unavailableSourcesRemainProvenanceWithBoundedReplacements: ammc?.status === 'unavailable' && ammc?.reviewPlan?.workflowStatus === 'replacement_recorded' && ammc?.replacementSourceIds?.length === 6 && rumCayHeritage?.status === 'unavailable' && rumCayHeritage?.reviewPlan?.workflowStatus === 'replacement_recorded' && rumCayHeritage?.replacementSourceIds?.length === 4,
    noMissingSourceReviewDates: documents.sources.every((source) => source.checkedAt && source.nextReviewAt),
  },
  attentionSources: documents.sources.filter((source) => !['scheduled', 'replacement_recorded'].includes(source.reviewPlan?.workflowStatus)),
  recordedReplacementSources: documents.sources.filter((source) => source.reviewPlan?.workflowStatus === 'replacement_recorded'),
  unroutedSources: documents.sources.filter((source) => !source.destinationCount),
  unreferencedSources: documents.sources.filter((source) => source.referenceCount === 0),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
