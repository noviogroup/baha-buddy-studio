import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'islandResearchAudit',
  title: 'Island Research Audit',
  type: 'document',
  description: 'A dated completeness review for one island. Scores describe evidence quality, not destination quality.',
  groups: [
    {name: 'audit', title: 'Audit', default: true},
    {name: 'coverage', title: 'Coverage Scores'},
    {name: 'gaps', title: 'Gap Backlog'},
  ],
  fields: [
    defineField({name: 'title', title: 'Audit Title', type: 'string', group: 'audit', validation: (Rule) => Rule.required().max(160)}),
    defineField({name: 'destination', title: 'Destination', type: 'reference', group: 'audit', to: [{type: 'destination'}], validation: (Rule) => Rule.required()}),
    defineField({name: 'auditedAt', title: 'Audited At', type: 'date', group: 'audit', validation: (Rule) => Rule.required()}),
    defineField({name: 'nextAuditAt', title: 'Next Audit By', type: 'date', group: 'audit'}),
    defineField({name: 'owner', title: 'Owner', type: 'string', group: 'audit', validation: (Rule) => Rule.max(120)}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'audit',
      options: {list: [
        {title: 'Baseline only', value: 'baseline'},
        {title: 'Research in progress', value: 'researching'},
        {title: 'Editorial review', value: 'editorial_review'},
        {title: 'Ready with caveats', value: 'ready_with_caveats'},
        {title: 'Ready', value: 'ready'},
      ]},
      initialValue: 'baseline',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'overallScore', title: 'Overall Evidence Score', type: 'number', group: 'audit', description: 'Average of the ten topic scores, from 0 to 3.', validation: (Rule) => Rule.required().min(0).max(3).precision(2)}),
    defineField({
      name: 'coverage',
      title: 'Topic Scores',
      type: 'array',
      group: 'coverage',
      of: [defineArrayMember({
        name: 'researchCoverageScore',
        title: 'Topic Score',
        type: 'object',
        fields: [
          defineField({name: 'topic', title: 'Topic', type: 'string', options: {list: [
            {title: 'Overview & identity', value: 'overview'},
            {title: 'Access & transport', value: 'access'},
            {title: 'Stays', value: 'stays'},
            {title: 'Food & drink', value: 'food'},
            {title: 'Experiences', value: 'experiences'},
            {title: 'Beaches & nature', value: 'nature'},
            {title: 'Culture & history', value: 'culture'},
            {title: 'Seasonality & weather', value: 'seasonality'},
            {title: 'Safety & practical guidance', value: 'safety'},
            {title: 'Accessibility', value: 'accessibility'},
          ]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'score', title: 'Score (0–3)', type: 'number', description: '0 missing · 1 weak/uncited · 2 sourced but incomplete/stale · 3 strong and current', validation: (Rule) => Rule.required().integer().min(0).max(3)}),
          defineField({name: 'evidenceCount', title: 'Approved Fact Count', type: 'number', validation: (Rule) => Rule.min(0).integer()}),
          defineField({name: 'finding', title: 'Finding', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(600)}),
        ],
        preview: {select: {title: 'topic', score: 'score', subtitle: 'finding'}, prepare({title, score, subtitle}) { return {title: `${title || 'Topic'} · ${score ?? 0}/3`, subtitle} }},
      })],
      validation: (Rule) => Rule.required().min(10).max(10).unique(),
    }),
    defineField({
      name: 'gaps',
      title: 'Open Gaps',
      type: 'array',
      group: 'gaps',
      of: [defineArrayMember({
        name: 'researchGap',
        title: 'Research Gap',
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Gap', type: 'string', validation: (Rule) => Rule.required().max(180)}),
          defineField({name: 'topic', title: 'Topic', type: 'string', validation: (Rule) => Rule.required()}),
          defineField({name: 'priority', title: 'Priority', type: 'string', options: {list: [{title: 'P0 — blocks trustworthy delivery', value: 'p0'}, {title: 'P1 — important', value: 'p1'}, {title: 'P2 — enrichment', value: 'p2'}]}, validation: (Rule) => Rule.required()}),
          defineField({name: 'action', title: 'Next Action', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(600)}),
          defineField({name: 'status', title: 'Status', type: 'string', options: {list: [{title: 'Open', value: 'open'}, {title: 'Researching', value: 'researching'}, {title: 'Resolved', value: 'resolved'}, {title: 'Explicit N/A', value: 'not_applicable'}]}, initialValue: 'open', validation: (Rule) => Rule.required()}),
        ],
        preview: {select: {title: 'title', priority: 'priority', status: 'status'}, prepare({title, priority, status}) { return {title, subtitle: [priority, status].filter(Boolean).join(' · ')} }},
      })],
    }),
    defineField({name: 'sources', title: 'Sources Reviewed', type: 'array', group: 'audit', of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})]}),
    defineField({name: 'methodologyNotes', title: 'Methodology & Caveats', type: 'text', rows: 6, group: 'audit', validation: (Rule) => Rule.max(2400)}),
  ],
  preview: {
    select: {title: 'title', destination: 'destination.name', score: 'overallScore', status: 'status'},
    prepare({title, destination, score, status}) {
      return {title: title || destination || 'Untitled audit', subtitle: [destination, score == null ? null : `${score}/3`, status].filter(Boolean).join(' · ')}
    },
  },
  orderings: [{title: 'Latest audits', name: 'auditedAt', by: [{field: 'auditedAt', direction: 'desc'}]}],
})
