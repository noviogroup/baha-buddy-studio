import {defineArrayMember, defineField, defineType} from 'sanity'

/** Searchable inventory of user-facing strings that are still embedded in app source. */
export default defineType({
  name: 'legacyCopyInventory',
  title: 'Hardcoded Copy Inventory',
  type: 'document',
  description: 'Review and edit legacy copy here while each consumer is progressively switched to a canonical Sanity document or key.',
  fields: [
    defineField({name: 'title', title: 'Source File', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'surface', title: 'Surface', type: 'string', options: {list: [{title: 'Web', value: 'web'}, {title: 'Mobile', value: 'mobile'}]}, validation: (Rule) => Rule.required()}),
    defineField({name: 'sourcePath', title: 'Repository Path', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'entries',
      title: 'Detected Copy',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'legacyCopyEntry',
          title: 'Copy Entry',
          type: 'object',
          fields: [
            defineField({name: 'line', title: 'Original Line', type: 'number', readOnly: true}),
            defineField({name: 'key', title: 'Stable Key', type: 'string', readOnly: true}),
            defineField({name: 'value', title: 'Editable Copy', type: 'text', rows: 3, validation: (Rule) => Rule.required()}),
            defineField({name: 'context', title: 'Detected Context', type: 'string', readOnly: true}),
            defineField({
              name: 'status',
              title: 'Migration Status',
              type: 'string',
              options: {list: [
                {title: 'Needs review', value: 'needs_review'},
                {title: 'Approved; consumer not wired', value: 'approved_not_wired'},
                {title: 'Moved to canonical Sanity content', value: 'sanity_backed'},
                {title: 'Keep in code', value: 'keep_in_code'},
              ]},
              initialValue: 'needs_review',
            }),
            defineField({name: 'canonicalDocument', title: 'Canonical Sanity Document', type: 'reference', weak: true, to: [{type: 'article'}, {type: 'contentPage'}, {type: 'destination'}, {type: 'faq'}, {type: 'navigation'}, {type: 'tip'}]}),
          ],
          preview: {select: {title: 'value', line: 'line', status: 'status'}, prepare({title, line, status}) { return {title, subtitle: [`Line ${line ?? '?'}`, status].join(' · ')} }},
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'source', title: 'Imported Source', type: 'contentSource', validation: (Rule) => Rule.required()}),
    defineField({name: 'reviewed', title: 'File Review Complete', type: 'boolean', initialValue: false}),
    defineField({name: 'notes', title: 'Reviewer Notes', type: 'text', rows: 3}),
  ],
  preview: {select: {title: 'title', surface: 'surface', reviewed: 'reviewed'}, prepare({title, surface, reviewed}) { return {title, subtitle: `${surface ?? 'surface'} · ${reviewed ? 'Reviewed' : 'Needs review'}`} }},
  orderings: [
    {title: 'Surface and file', name: 'surfaceFile', by: [{field: 'surface', direction: 'asc'}, {field: 'sourcePath', direction: 'asc'}]},
    {title: 'Needs review first', name: 'reviewed', by: [{field: 'reviewed', direction: 'asc'}, {field: 'sourcePath', direction: 'asc'}]},
  ],
})
