import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'callToAction',
  title: 'Call to Action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button Label',
      type: 'string',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'kind',
      title: 'Action Type',
      type: 'string',
      options: {
        list: [
          {title: 'Baha Buddy page or app route', value: 'internal'},
          {title: 'External website', value: 'external'},
          {title: 'Ask Buddy prompt', value: 'buddy'},
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'internalPath',
      title: 'Internal Path',
      type: 'string',
      description: 'Example: /explore/island/the-exumas',
      hidden: ({parent}) => parent?.kind !== 'internal',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const kind = (context.parent as {kind?: string} | undefined)?.kind
          if (kind !== 'internal') return true
          if (!value) return 'An internal path is required.'
          return value.startsWith('/') ? true : 'Internal paths must start with /.'
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({parent}) => parent?.kind !== 'external',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'buddyPrompt',
      title: 'Buddy Prompt',
      type: 'text',
      rows: 3,
      description: 'Write this naturally as the traveler’s opening message.',
      hidden: ({parent}) => parent?.kind !== 'buddy',
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'analyticsLabel',
      title: 'Analytics Label',
      type: 'string',
      description: 'Stable machine-readable label, such as destination_hero_plan_trip.',
      validation: (Rule) => Rule.regex(/^[a-z0-9_]+$/).max(80),
    }),
  ],
  preview: {
    select: {title: 'label', kind: 'kind', path: 'internalPath', url: 'externalUrl'},
    prepare({title, kind, path, url}) {
      return {title: title || 'Untitled action', subtitle: `${kind ?? 'action'} · ${path ?? url ?? ''}`}
    },
  },
})
