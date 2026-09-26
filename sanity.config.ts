import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'

export default defineConfig({
  name: 'baha-buddy',
  title: 'Baha Buddy CMS',

  projectId: '593u37vh',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Site settings is a singleton opened directly from the desk structure.
    // Editors can publish it but cannot duplicate or delete it accidentally.
    actions: (previous, context) => {
      if (context.schemaType === 'siteSettings') {
        return previous.filter((action) => !['delete', 'duplicate'].includes(action.action ?? ''))
      }
      if (context.schemaType === 'imageCandidate') {
        return previous.filter((action) => action.action !== 'publish')
      }
      return previous
    },
    newDocumentOptions: (previous) =>
      previous.filter((template) => template.templateId !== 'siteSettings'),
  },
})
