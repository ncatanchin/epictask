import getLogger from "../../common/log/Logger"


const log = getLogger(__filename)

export async function init():Promise<void> {
	log.info("Init DB")
	const db = (require("../db/ObjectDatabase")).default
	await db.open()
	await navigator.storage.persist()

	;(await (require("../db/OrgObjectManager")).default()).start()
	;(await (require("../db/RepoObjectManager")).default()).start()
	;(await (require("../db/IssueObjectManager")).default()).start()
  ;(await (require("../db/OrgObjectManager")).default()).start()

  ;(await (require("../db/NotificationObjectManager")).default()).start()

}
