global.DEBUG = true

process.env.EPIC_CLI = true

const
	path = require('path'),
	srcRoot = '../dist/out',
	moment = require('moment')

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
		events.forEach(event => log.info(`Received Repo Event (eTag: ${eTag}) ${moment(event.created_at).fromNow()}: ${event.type}`))
	},
	issuesEventsReceived(eTag, ...events) {
		//log.info(`Received issues events`, events)
		events.forEach(event => {
			const
				{issue} = event,
				{created_at,updated_at} = issue || {}
				
			log.info(`Received Issues Event (eTag: ${eTag}) ${moment(event.created_at).fromNow()}: ${event.event}
				\tIssue (${issue && issue.id}): ${issue && issue.title}
				\t\tcreated at ${!created_at ? 'N/A' : moment(created_at).fromNow()}
				\t\tupdated at ${!updated_at ? 'N/A' : moment(updated_at).fromNow()}
			`)
		})
	}
})
