const log = getLogger(__filename)

/**
 * Load all model classes
 *
 * @returns {any[]}
 */
export function loadModelClasses() {
	const allModelsAndRepos = require('shared/models')
	const names = Object.keys(allModelsAndRepos)

	return names
		.filter(name => {
			const val = allModelsAndRepos[name]
			return !_.endsWith(name,'Store') && _.isFunction(val)
		})
		.map(name => {
			log.debug(`Loading model class: ${name}`)
			return allModelsAndRepos[name]
		})
}