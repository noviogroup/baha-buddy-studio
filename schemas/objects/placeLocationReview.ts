import {defineArrayMember, defineField, defineType} from 'sanity'

/** Review-only point evidence for a Supabase-backed place. Never changes live inventory. */
export default defineType({
  name: 'placeLocationReview',
  title: 'Signature-place Location Evidence',
  type: 'object',
  description: 'Official point and access evidence awaiting an editorial decision. Candidate points are not live coordinates.',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({name: 'checkedAt', title: 'Evidence Checked', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'reconciliationStatus',
      title: 'Location Reconciliation Status',
      type: 'string',
      options: {list: [
        {title: 'One official point candidate', value: 'official_point_candidate'},
        {title: 'Consistent official point candidates', value: 'official_points_consistent'},
        {title: 'Official point conflict', value: 'official_point_conflict'},
        {title: 'Official map point is invalid', value: 'official_invalid_point'},
        {title: 'Related visitor-site point only', value: 'official_related_site_point_only'},
        {title: 'Official identity, but no point', value: 'identity_without_point'},
        {title: 'Area identity—not a single point', value: 'area_identity_no_point'},
        {title: 'Official identity source, no map point', value: 'official_identity_source_no_point'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'candidates',
      title: 'Official Coordinate Candidates',
      type: 'array',
      description: 'Each point keeps its exact source and feature relationship. Related beach, entrance, and visitor-site pins must not be promoted automatically to a whole cay, lake, lagoon, or park.',
      of: [defineArrayMember({
        name: 'placeLocationCandidate',
        title: 'Location Candidate',
        type: 'object',
        fields: [
          defineField({name: 'label', title: 'Candidate Label', type: 'string', validation: (Rule) => Rule.required().max(220)}),
          defineField({
            name: 'relationship',
            title: 'Relationship to Catalog Place',
            type: 'string',
            options: {list: [
              {title: 'Exact feature point', value: 'exact_feature'},
              {title: 'Operator or venue entrance', value: 'operator_entrance'},
              {title: 'Visitor site within the feature', value: 'visitor_site'},
              {title: 'Related site only', value: 'related_site'},
            ]},
            validation: (Rule) => Rule.required(),
          }),
          defineField({
            name: 'location',
            title: 'Candidate Point',
            type: 'geopoint',
            description: 'Pending evidence only. This is not an approved Supabase coordinate or routing destination.',
            validation: (Rule) => Rule.required(),
          }),
          defineField({name: 'source', title: 'Evidence Source', type: 'reference', to: [{type: 'researchSource'}], validation: (Rule) => Rule.required()}),
          defineField({name: 'sourceRecordType', title: 'Source Record Type', type: 'string', options: {list: [
            {title: 'Tourism business record', value: 'tourism_business'},
            {title: 'Tourism map pin', value: 'tourism_map_pin'},
            {title: 'Responsible operator directions', value: 'operator_directions'},
          ]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'sourceRecordId', title: 'Source Record ID', type: 'string', validation: (Rule) => Rule.max(120)}),
          defineField({name: 'sourceName', title: 'Source Feature Name', type: 'string', validation: (Rule) => Rule.required().max(220)}),
          defineField({name: 'sourceUpdatedAt', title: 'Source-reported Update', type: 'string', description: 'Stored as printed because the source does not publish a timezone.', validation: (Rule) => Rule.max(80)}),
          defineField({name: 'sourceUrl', title: 'Point Source URL', type: 'url', validation: (Rule) => Rule.uri({scheme: ['https']})}),
          defineField({name: 'confidence', title: 'Point Evidence Confidence', type: 'string', options: {list: [
            {title: 'High', value: 'high'},
            {title: 'Medium', value: 'medium'},
            {title: 'Low', value: 'low'},
          ]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'notes', title: 'Candidate Notes', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(900)}),
        ],
        preview: {
          select: {title: 'label', relationship: 'relationship', confidence: 'confidence'},
          prepare({title, relationship, confidence}) {
            return {title: title || 'Unnamed candidate', subtitle: [relationship, confidence].filter(Boolean).join(' · ')}
          },
        },
      })],
    }),
    defineField({
      name: 'evidenceSources',
      title: 'Location and Access Sources',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'locationConfidence', title: 'Overall Location Confidence', type: 'string', options: {list: [
      {title: 'High', value: 'high'},
      {title: 'Medium', value: 'medium'},
      {title: 'Low', value: 'low'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'operationEvidenceStatus', title: 'Current-operation Evidence', type: 'string', options: {list: [
      {title: 'Current responsible operator', value: 'current_responsible_operator'},
      {title: 'Current managing authority context', value: 'current_managing_authority'},
      {title: 'Current official listing only', value: 'current_official_listing_only'},
      {title: 'Not applicable—natural/geographic feature', value: 'not_applicable_natural_feature'},
      {title: 'Not established', value: 'not_established'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'accessEvidenceStatus', title: 'Access Evidence', type: 'string', options: {list: [
      {title: 'Current responsible source', value: 'current_responsible_source'},
      {title: 'Partial official context', value: 'partial_official_context'},
      {title: 'Unresolved', value: 'unresolved'},
      {title: 'Not applicable', value: 'not_applicable'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'reviewDecision', title: 'Editorial Coordinate Decision', type: 'string', options: {list: [
      {title: 'Pending review', value: 'pending'},
      {title: 'Accepted for canonical reconciliation', value: 'accepted'},
      {title: 'Rejected', value: 'rejected'},
      {title: 'Not applicable—no canonical point candidate', value: 'not_applicable'},
    ]}, validation: (Rule) => Rule.required()}),
    defineField({
      name: 'notes',
      title: 'Location Review Notes',
      type: 'text',
      rows: 6,
      description: 'Record identity limits, point conflicts, feature-versus-entrance distinctions, operation and access boundaries, and the next responsible check.',
      validation: (Rule) => Rule.required().max(2200),
    }),
  ],
  preview: {
    select: {status: 'reconciliationStatus', decision: 'reviewDecision', confidence: 'locationConfidence'},
    prepare({status, decision, confidence}) {
      return {title: status || 'Location evidence', subtitle: [decision, confidence].filter(Boolean).join(' · ')}
    },
  },
})
