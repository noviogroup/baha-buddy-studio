import {defineField, defineType} from 'sanity'

/** Provenance for records copied from Supabase or legacy source code. */
export default defineType({
  name: 'contentSource',
  title: 'Imported Content Source',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'system',
      title: 'Source System',
      type: 'string',
      options: {list: [
        {title: 'Supabase', value: 'supabase'},
        {title: 'Web source code', value: 'web_source'},
        {title: 'Mobile source code', value: 'mobile_source'},
        {title: 'Manual Sanity content', value: 'sanity'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'table', title: 'Supabase Table', type: 'string'}),
    defineField({name: 'recordId', title: 'Source Record ID', type: 'string'}),
    defineField({name: 'sourcePath', title: 'Source File', type: 'string'}),
    defineField({name: 'sourceKey', title: 'Source Key', type: 'string'}),
    defineField({
      name: 'ownership',
      title: 'Ownership Mode',
      type: 'string',
      options: {list: [
        {title: 'Sanity is now canonical', value: 'sanity_canonical'},
        {title: 'Editorial overlay on Supabase', value: 'editorial_overlay'},
        {title: 'Copied for cleanup; consumer migration pending', value: 'cleanup_inventory'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'importedAt', title: 'Imported At', type: 'datetime', readOnly: true}),
    defineField({name: 'notes', title: 'Migration Notes', type: 'text', rows: 3, validation: (Rule) => Rule.max(500)}),
  ],
  preview: {
    select: {system: 'system', table: 'table', recordId: 'recordId', sourcePath: 'sourcePath'},
    prepare({system, table, recordId, sourcePath}) {
      return {title: [system, table].filter(Boolean).join(' · ') || 'Content source', subtitle: recordId || sourcePath || 'Manual record'}
    },
  },
})
