

import { setDataOnHotDispose, getHot, acceptHot } from "epic-global"
declare global {
	
	interface IRepoSyncPending {
		resolver:Promise.Resolver<any>
		started:boolean
	}
	
}

const
	repoSyncMap = getHot(module,'repoSyncMap',{}) as {[repoId:number]:IRepoSyncPending}

setDataOnHotDispose(module,() => ({
	repoSyncMap
}))

/**
 * deleteRepoSync
 *
 * @param repoId
 */
export function deleteRepoSync(repoId:number) {
	delete repoSyncMap[repoId]
}

/**
 * setRepoSync
 *
 * @param repoId
 * @param sync
 */
export function setRepoSync(repoId:number,sync) {
	repoSyncMap[repoId] = sync
}

/**
 * Get the repo sync
 *
 * @param repoId
 * @returns {IRepoSyncPending}
 */
export function getRepoSync(repoId:number) {
	return repoSyncMap[repoId]
}

/**
 * Check to see if a pending repo sync exists
 *
 * @param repoId
 */
export function isRepoSyncPending(repoId:number) {
	return !!repoSyncMap[repoId] && !repoSyncMap[repoId].started
}


acceptHot(module)