import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tip',
  title: 'Tip',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Local Knowledge', value: 'local_knowledge'},
          {title: 'Safety', value: 'safety'},
          {title: 'Money & Budget', value: 'money_budget'},
          {title: 'Getting Around', value: 'getting_around'},
          {title: 'Food & Drink', value: 'food_drink'},
          {title: 'Culture & Etiquette', value: 'culture_etiquette'},
          {title: 'Weather', value: 'weather'},
          {title: 'Packing', value: 'packing'},
        ],
      },
    }),
    defineField({
      name: 'destination',
      title: 'Destination (optional)',
      type: 'reference',
      to: [{type: 'destination'}],
    }),
    defineField({
      name: 'emoji',
      title: 'Emoji',
      type: 'string',
      description: 'Single emoji to display with tip (e.g. 🏖️, 💡, 🦈)',
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category'},
    prepare({title, subtitle}) {
      return {title, subtitle: subtitle?.replace('_', ' ')};
    },
  },
})
