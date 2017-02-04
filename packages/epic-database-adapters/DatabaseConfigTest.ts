import { uuid } from 'epic-util'
import { tempFilename } from "epic-global"

const
	log = getLogger(__filename),
	dbName = `epictask-test-${uuid()}`,
	dbPath = tempFilename(dbName + '.db')

if (Env.isTest) {
	log.info(`In test, ensuring path exists: ${dbPath}`)
	//
	// const
	// 	dbDir = Path.dirname(dbPath)
	//
	require('mkdirp').sync(dbPath)
}


log.debug('DB Path:', dbPath)

export =
	// OPTIONS FOR LEVEL & INDEXED
	{
		// 1 DB PER MODEL/REPO
		databasePerRepo: true,
		
		// FILENAME
		filename: dbPath,
		
		// OVERWRITE ON CONFLICT
		overwriteConflicts: true,
		skipIndexes: !ProcessConfig.isType(ProcessType.DatabaseServer),
		cacheSize: 32 * 1024 * 1024
	}
