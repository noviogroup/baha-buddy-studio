import {defineArrayMember, defineField, defineType} from 'sanity'

/** Detailed non-public audit of accessibility, copy completeness, and media rights. */
export default defineType({
  name: 'placeContentReadinessReview',
  title: 'Accessibility, Copy & Media Review',
  type: 'object',
  description: 'Research-only content gates. Absence of accessibility evidence is not evidence that a feature is inaccessible, and source images are not reusable without recorded rights.',
  fields: [
    defineField({name: 'checkedAt', title: 'Checked At', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'nextReviewAt', title: 'Review Again By', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'overallStatus', title: 'Overall Content Readiness', type: 'string', options: {list: [
      {title: 'Blocked', value: 'blocked'},
      {title: 'Researching', value: 'researching'},
      {title: 'Editorial review', value: 'editorial_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'accessibilityEvidenceStatus', title: 'Feature-level Accessibility Evidence', type: 'string', options: {list: [
      {title: 'Responsible feature-level evidence', value: 'responsible_feature_level'},
      {title: 'Partial responsible evidence', value: 'partial_responsible_evidence'},
      {title: 'Access or terrain context only—not accessibility', value: 'access_context_not_accessibility'},
      {title: 'Not found in reviewed sources', value: 'not_found_in_reviewed_sources'},
      {title: 'Conflicting evidence', value: 'conflicting_evidence'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'accessibilitySources', title: 'Accessibility Sources Reviewed', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})], validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'accessibilityBoundary', title: 'Accessibility Evidence Boundary', type: 'text', rows: 5, validation: (Rule) => Rule.required().max(1800)}),
    defineField({name: 'copyFoundationStatus', title: 'Copy Foundation', type: 'string', options: {list: [
      {title: 'Source-backed internal draft possible', value: 'source_backed_internal'},
      {title: 'Identity only', value: 'identity_only'},
      {title: 'Blocked by source or catalog conflict', value: 'blocked_by_conflict'},
      {title: 'Responsible-source recheck required', value: 'needs_responsible_recheck'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({
      name: 'copyComponents',
      title: 'Copy Component Checklist',
      type: 'array',
      of: [defineArrayMember({
        name: 'placeCopyComponentReview',
        title: 'Copy Component',
        type: 'object',
        fields: [
          defineField({name: 'component', title: 'Component', type: 'string', options: {list: [
            {title: 'Identity and naming', value: 'identity'},
            {title: 'Descriptive context', value: 'description'},
            {title: 'Operation and access', value: 'operation_access'},
            {title: 'Safety boundary', value: 'safety'},
            {title: 'Accessibility', value: 'accessibility'},
            {title: 'Media and alt text', value: 'media'},
            {title: 'Final traveler copy', value: 'traveler_copy'},
          ]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'status', title: 'Status', type: 'string', options: {list: [
            {title: 'Source-backed internal only', value: 'source_backed_internal'},
            {title: 'Partial evidence', value: 'partial'},
            {title: 'Missing', value: 'missing'},
            {title: 'Blocked', value: 'blocked'},
            {title: 'Not applicable', value: 'not_applicable'},
          ]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'evidenceSummary', title: 'Evidence Summary', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(700)}),
          defineField({name: 'nextAction', title: 'Next Action', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(700)}),
        ],
        preview: {select: {title: 'component', subtitle: 'status'}},
      })],
      validation: (Rule) => Rule.required().min(7).max(7).unique(),
    }),
    defineField({name: 'mediaEvidenceStatus', title: 'Media Evidence', type: 'string', options: {list: [
      {title: 'No candidate media', value: 'no_candidate_media'},
      {title: 'Source display only—not cleared', value: 'source_display_only_not_cleared'},
      {title: 'Candidate media—rights unverified', value: 'candidate_rights_unverified'},
      {title: 'Rights cleared', value: 'rights_cleared'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'mediaRightsStatus', title: 'Rights-holder / License Status', type: 'string', options: {list: [
      {title: 'Unknown or unverified', value: 'unknown_or_unverified'},
      {title: 'Publisher identified—permission required', value: 'publisher_identified_permission_required'},
      {title: 'Controlled library—asset license required', value: 'controlled_library_asset_license_required'},
      {title: 'Documented license', value: 'documented_license'},
      {title: 'Direct permission recorded', value: 'direct_permission_recorded'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'mediaPolicySources', title: 'Media Policy Sources', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})], validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'altTextStatus', title: 'Alt-text Status', type: 'string', options: {list: [
      {title: 'No approved image', value: 'no_approved_image'},
      {title: 'Missing', value: 'missing'},
      {title: 'Draft—not reviewed', value: 'draft_unreviewed'},
      {title: 'Reviewed', value: 'reviewed'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'publicCopyDecision', title: 'Public Copy Decision', type: 'string', options: {list: [
      {title: 'Blocked', value: 'blocked'},
      {title: 'Research only', value: 'research_only'},
      {title: 'Ready for editorial review', value: 'ready_for_editorial_review'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'notes', title: 'Evidence Boundary and Next Check', type: 'text', rows: 7, validation: (Rule) => Rule.required().max(2400)}),
  ],
  preview: {
    select: {status: 'overallStatus', accessibility: 'accessibilityEvidenceStatus', media: 'mediaEvidenceStatus'},
    prepare({status, accessibility, media}) {
      return {title: status || 'Content readiness', subtitle: [accessibility, media].filter(Boolean).join(' · ')}
    },
  },
})
