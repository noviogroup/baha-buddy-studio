import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'contentSection',
  title: 'Content Section',
  type: 'object',
  fields: [
    defineField({
      name: 'anchor',
      title: 'Section Anchor',
      type: 'string',
      description: 'Optional URL anchor without #, for example getting-there.',
      validation: (Rule) => Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (Rule) => Rule.max(50)}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'body', title: 'Body', type: 'richText'}),
    defineField({name: 'image', title: 'Supporting Image', type: 'contentImage'}),
    defineField({
      name: 'items',
      title: 'Feature or Checklist Items',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'sectionItem',
          title: 'Item',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(100)}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.max(400)}),
            defineField({name: 'icon', title: 'Icon Name or Emoji', type: 'string', validation: (Rule) => Rule.max(40)}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      of: [defineArrayMember({type: 'callToAction'})],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'layout',
      title: 'Layout Hint',
      type: 'string',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Two columns', value: 'two_columns'},
          {title: 'Cards', value: 'cards'},
          {title: 'Callout', value: 'callout'},
        ],
      },
      initialValue: 'default',
    }),
  ],
  preview: {
    select: {title: 'heading', subtitle: 'eyebrow'},
    prepare({title, subtitle}) {
      return {title: title || 'Untitled section', subtitle: subtitle || 'Content section'}
    },
  },
})
