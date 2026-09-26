import {defineArrayMember, defineField, defineType} from 'sanity'

/** Editorial ownership and freshness controls for one research source. */
export default defineType({
  name: 'researchSourceReviewPlan',
  title: 'Source Review Plan',
  type: 'object',
  description: 'Internal recheck ownership and cadence. A current source can still be insufficient for a specific traveler claim.',
  fields: [
    defineField({name: 'plannedAt', title: 'Plan Recorded', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'reviewOwner', title: 'Internal Review Owner', type: 'string', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'workflowStatus', title: 'Workflow Status', type: 'string', options: {list: [
      {title: 'Scheduled', value: 'scheduled'},
      {title: 'Attention required', value: 'attention_required'},
      {title: 'Replacement required', value: 'replacement_required'},
      {title: 'Replacement recorded', value: 'replacement_recorded'},
      {title: 'Overdue', value: 'overdue'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'freshnessStatus', title: 'Freshness Status at Planning', type: 'string', options: {list: [
      {title: 'Current', value: 'current'},
      {title: 'Needs recheck', value: 'needs_recheck'},
      {title: 'Unavailable or rejected', value: 'unavailable_or_rejected'},
      {title: 'Due today', value: 'due_today'},
      {title: 'Overdue', value: 'overdue'},
      {title: 'Review date missing', value: 'review_date_missing'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'cadenceBand', title: 'Review Cadence', type: 'string', options: {list: [
      {title: '30 days', value: '30_day'},
      {title: '90 days', value: '90_day'},
      {title: '180 days', value: '180_day'},
      {title: 'Annual', value: 'annual'},
      {title: 'Long term', value: 'long_term'},
      {title: 'Unassigned', value: 'unassigned'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'cadenceDays', title: 'Planned Interval (Days)', type: 'number', validation: (Rule) => Rule.required().integer().min(1).max(1460)}),
    defineField({name: 'sourceRelationship', title: 'Publisher Relationship', type: 'string', options: {list: [
      {title: 'Responsible or owning publisher', value: 'responsible_or_owning_publisher'},
      {title: 'Official context publisher', value: 'official_context_publisher'},
      {title: 'Corroborating source', value: 'corroborating_source'},
      {title: 'Discovery lead only', value: 'discovery_lead_only'},
      {title: 'Primary scope requires review', value: 'primary_source_scope_requires_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'verificationMethod', title: 'Recheck Method', type: 'string', options: {list: [
      {title: 'Webpage review', value: 'webpage_review'},
      {title: 'Document or PDF review', value: 'document_review'},
      {title: 'Dataset or map review', value: 'dataset_review'},
      {title: 'Internal repository review', value: 'repository_review'},
      {title: 'Webpage plus responsible contact', value: 'webpage_and_responsible_contact'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'changeTriggers', title: 'Early Recheck Triggers', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}, validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'reviewScope', title: 'Review Scope', type: 'text', rows: 4, validation: (Rule) => Rule.required().max(1000)}),
    defineField({name: 'nextAction', title: 'Next Action', type: 'text', rows: 4, validation: (Rule) => Rule.required().max(1000)}),
  ],
  preview: {
    select: {status: 'workflowStatus', cadence: 'cadenceBand', owner: 'reviewOwner'},
    prepare({status, cadence, owner}) {
      return {title: status || 'Source review plan', subtitle: [cadence, owner].filter(Boolean).join(' · ')}
    },
  },
})
