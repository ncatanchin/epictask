const
	log = getLogger(__filename),
	dbName = `epictask-${Env.envName}`,
	dbPath = dbName

log.debug('DB Path:', dbPath)

export = {
	// 1 DB PER MODEL/REPO
	databasePerRepo: true,
	
	// FILENAME
	filename: dbPath,
	
	// OVERWRITE ON CONFLICT
	overwriteConflicts: true,
	
	skipIndexes: !ProcessConfig.isType(ProcessType.DatabaseServer)
}