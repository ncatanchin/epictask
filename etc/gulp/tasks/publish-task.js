/**
 * Publish packages to NPM
 *
 */
function publish() {
	if (releaseFiles.length < 1)
		throw new Error('No releases were created')

	const baseUrl = "https://github.com/densebrain/typestore/releases/download"
	const releaseUrl = `${baseUrl}/v${nextMinorVersion}/gitop-${nextMinorVersion}.tar.gz`

	log.info(`Publishing gitop@ ${nextMinorVersion} from ${releaseUrl}`)
	if (exec(`npm publish ${releaseUrl}`).code !== 0) {
		throw new Error(`Failed to publish gitop`)
	}
}


module.exports = gulp.task('publish',['release'],publish)