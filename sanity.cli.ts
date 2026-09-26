import * as sanityCli from 'sanity/cli'

const defineCliConfig = sanityCli.defineCliConfig ?? sanityCli.default?.defineCliConfig

export default defineCliConfig({
  studioHost: 'bahabuddy',
  api: {
    projectId: '593u37vh',
    dataset: 'production',
  },
  autoUpdates: false,
})
