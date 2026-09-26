import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required().max(180)}),
    defineField({name: 'answer', title: 'Answer', type: 'richText', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Planning with Buddy', value: 'planning'},
          {title: 'Account', value: 'account'},
          {title: 'Bookings & payments', value: 'bookings'},
          {title: 'Destinations', value: 'destinations'},
          {title: 'Travel logistics', value: 'logistics'},
          {title: 'Safety & accessibility', value: 'safety_accessibility'},
          {title: 'Partners', value: 'partners'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'destination', title: 'Related Destination', type: 'reference', to: [{type: 'destination'}]}),
    defineField({name: 'relatedPage', title: 'Related Page', type: 'reference', to: [{type: 'contentPage'}]}),
    defineField({
      name: 'audiences',
      title: 'Traveler Audiences',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'channels',
      title: 'Delivery Channels',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [{title: 'Web', value: 'web'}, {title: 'Mobile', value: 'mobile'}, {title: 'Buddy knowledge', value: 'buddy'}]},
      initialValue: ['web', 'mobile'],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 99}),
    defineField({name: 'reviewedAt', title: 'Last Reviewed', type: 'date'}),
    defineField({name: 'source', title: 'Imported Source', type: 'contentSource'}),
  ],
  preview: {select: {title: 'question', subtitle: 'category'}},
  orderings: [
    {title: 'Manual order', name: 'manualOrder', by: [{field: 'order', direction: 'asc'}, {field: 'question', direction: 'asc'}]},
  ],
})
