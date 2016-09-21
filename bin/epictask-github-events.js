global.DEBUG = true

process.env.EPIC_CLI = true

const
	path = require('path'),
	srcRoot = '../dist/out'

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:../dist/out:./node_modules`

require('source-map-support').install()
require('babel-polyfill')
require('reflect-metadata')


require(`${srcRoot}/shared/NamespaceConfig`)
require(`${srcRoot}/shared/ProcessConfig`)
require(`${srcRoot}/shared/PromiseConfig`)
require(`${srcRoot}/shared/LogConfig`)
require(`${srcRoot}/shared/Globals`)

const
	log = getLogger(__filename),
	eventMonitor = require(`${srcRoot}/job/GithubEventMonitor`).getGithubEventMonitor()

log.info(`Starting event monitor`)

eventMonitor.addRepoListener({
	id: 58922079,
	fullName: 'densebrain/epictask'
}, {
	repoEventsReceived(eTag, ...events) {
		//log.info(`Received repo events`, events)
		events.forEach(event => log.info(`Received Repo Event (eTag: ${eTag}) ${event.created_at}: ${event.type}`))
	},
	issuesEventsReceived(eTag, ...events) {
		//log.info(`Received issues events`, events)
		events.forEach(event => log.info(`Received Issues Event (eTag: ${eTag}) ${event.created_at}: ${event.event}`))
	}
})
