import getLogger from "../../common/log/Logger"


const log = getLogger(__filename)

export async function init():Promise<void> {
	log.info("Init DB")
	const db = (await import("../db/ObjectDatabase")).default
	await db.open()
	
	;(await (await import("../db/OrgObjectManager")).default()).start()
	;(await (await import("../db/RepoObjectManager")).default()).start()
	
}
