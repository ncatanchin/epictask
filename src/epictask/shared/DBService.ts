
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {IndexedDBPlugin} from 'typestore-plugin-indexeddb'

import {Repo, User, Milestone, Issue, Comment, AvailableRepo}  from './GitHubModels'

export type TRepoMap = {[name:string]:TSRepo<any>}

export let coordinator:TSCoordinator = null
export let repos:TRepoMap = null
export let storePlugin:IndexedDBPlugin = null

async function start() {

	// Create the store Plugin first
	storePlugin = new IndexedDBPlugin({
		databaseName: `epictask-db${Env.isDev ? '-dev' : ''}`,
		version: 1
	})


	// Pass plugin(s) to the coordinator
	coordinator = new TSCoordinator()
	await coordinator.init({},storePlugin)

	// const {Repo, User, Milestone, Issue, Comment, AvailableRepo} = require('./GitHubModels')
	const modelClazzes = [Repo,User,Milestone,Issue,Comment,AvailableRepo]
	await coordinator.start(...modelClazzes)

	repos = modelClazzes.reduce((repoMap,modelClazz:Function) => {
		repoMap[modelClazz.name] = coordinator.getRepo

		return repoMap
	},{})

	return true
}

export function getRepo<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
	return coordinator.getRepo(repoClazz)
}



export const starter = start()

