import {defineArrayMember, defineField, defineType} from 'sanity'

/** Portable Text shared by articles, pages, itineraries, and FAQs. */
export default defineType({
  name: 'richText',
  title: 'Rich Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullets', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL or App Path',
                type: 'string',
                description: 'Use /path for Baha Buddy links or a complete https:// URL for external links.',
                validation: (Rule) => Rule.required(),
              }),
              defineField({
                name: 'openInNewTab',
                title: 'Open in New Tab',
                type: 'boolean',
                initialValue: false,
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({type: 'contentImage'}),
  ],
})
