import {defineArrayMember, defineField, defineType} from 'sanity'

const navigationItem = defineArrayMember({
  name: 'navigationItem',
  title: 'Navigation Item',
  type: 'object',
  fields: [
    defineField({name: 'section', title: 'Section or Column', type: 'string', validation: (Rule) => Rule.max(60)}),
    defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required().max(40)}),
    defineField({name: 'path', title: 'Path or URL', type: 'string', description: 'Use /path for internal links or a complete https:// URL.', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'string', validation: (Rule) => Rule.max(120)}),
    defineField({name: 'badge', title: 'Badge', type: 'string', validation: (Rule) => Rule.max(24)}),
    defineField({name: 'openInNewTab', title: 'Open in New Tab', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'label', subtitle: 'path'}},
})

export default defineType({
  name: 'navigation',
  title: 'Navigation Menu',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Internal Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'key',
      title: 'Menu Key',
      type: 'string',
      description: 'Stable key used by product code.',
      options: {list: [
        {title: 'Web primary', value: 'web_primary'},
        {title: 'Web footer', value: 'web_footer'},
        {title: 'Mobile Explore', value: 'mobile_explore'},
        {title: 'Mobile support', value: 'mobile_support'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'items', title: 'Items', type: 'array', of: [navigationItem], validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
    defineField({name: 'source', title: 'Imported Source', type: 'contentSource'}),
  ],
  preview: {select: {title: 'title', subtitle: 'key'}},
})
