import {defineArrayMember, defineField, defineType} from 'sanity'

/** Non-public evidence gates that must pass before a candidate can become traveler content. */
export default defineType({
  name: 'placeTravelerReadinessReview',
  title: 'Traveler Readiness Review',
  type: 'object',
  description: 'Research-only readiness evidence. This does not activate, publish, locate, or approve a canonical place.',
  fields: [
    defineField({name: 'checkedAt', title: 'Checked At', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'nextReviewAt', title: 'Review Again By', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'overallStatus', title: 'Overall Readiness', type: 'string', options: {list: [
      {title: 'Blocked', value: 'blocked'},
      {title: 'Researching', value: 'researching'},
      {title: 'Editorial review', value: 'editorial_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'responsibleSourceStatus', title: 'Responsible Source', type: 'string', options: {list: [
      {title: 'Current managing authority', value: 'current_managing_authority'},
      {title: 'Current responsible operator', value: 'current_responsible_operator'},
      {title: 'Current government authority', value: 'current_government_authority'},
      {title: 'Current official-tourism listing only', value: 'current_official_listing_only'},
      {title: 'Related operator only', value: 'related_operator_only'},
      {title: 'Source conflict', value: 'source_conflict'},
      {title: 'Unresolved', value: 'unresolved'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'operationStatus', title: 'Current Operation', type: 'string', options: {list: [
      {title: 'Current responsible operation', value: 'current_responsible_operation'},
      {title: 'Current responsible closure', value: 'current_responsible_closure'},
      {title: 'Current official listing only', value: 'current_official_listing_only'},
      {title: 'Not applicable to area/community identity', value: 'not_applicable_identity'},
      {title: 'Source conflict', value: 'source_conflict'},
      {title: 'Unresolved', value: 'unresolved'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'accessStatus', title: 'Access Evidence', type: 'string', options: {list: [
      {title: 'Current responsible access evidence', value: 'current_responsible_access'},
      {title: 'Partial official context', value: 'partial_official_context'},
      {title: 'Operator/member restricted', value: 'operator_restricted'},
      {title: 'Permission, guide, or vessel required', value: 'permission_or_guide_required'},
      {title: 'Source conflict', value: 'source_conflict'},
      {title: 'Unresolved', value: 'unresolved'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'safetyStatus', title: 'Safety Evidence', type: 'string', options: {list: [
      {title: 'Specific source hazard context', value: 'specific_hazard_context'},
      {title: 'General caution only', value: 'general_caution_only'},
      {title: 'Not established', value: 'not_established'},
      {title: 'Not applicable', value: 'not_applicable'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'accessibilityStatus', title: 'Accessibility Evidence', type: 'string', options: {list: [
      {title: 'Published by responsible source', value: 'published'},
      {title: 'Partial evidence', value: 'partial'},
      {title: 'Not published', value: 'not_published'},
      {title: 'Not applicable', value: 'not_applicable'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'copyStatus', title: 'Copy Evidence', type: 'string', options: {list: [
      {title: 'Source-backed internal copy only', value: 'source_backed_internal_only'},
      {title: 'Identity/context only', value: 'identity_only'},
      {title: 'Blocked by source conflict', value: 'blocked_by_source_conflict'},
      {title: 'Needs responsible review', value: 'needs_responsible_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'mediaStatus', title: 'Media Rights', type: 'string', options: {list: [
      {title: 'Rights cleared', value: 'rights_cleared'},
      {title: 'Source media not cleared for reuse', value: 'source_media_not_cleared'},
      {title: 'No approved media', value: 'no_approved_media'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'deliveryDecision', title: 'Traveler Delivery Decision', type: 'string', options: {list: [
      {title: 'Blocked', value: 'blocked'},
      {title: 'Research only', value: 'research_only'},
      {title: 'Ready for editorial review', value: 'ready_for_editorial_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({
      name: 'sources',
      title: 'Readiness Sources',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'notes',
      title: 'Evidence Boundary and Next Check',
      type: 'text',
      rows: 7,
      validation: (Rule) => Rule.required().max(2400),
    }),
  ],
  preview: {
    select: {status: 'overallStatus', source: 'responsibleSourceStatus', decision: 'deliveryDecision'},
    prepare({status, source, decision}) {
      return {title: status || 'Traveler readiness', subtitle: [source, decision].filter(Boolean).join(' · ')}
    },
  },
})
