const fs = require('fs')
const path = require('path')
const targetDir = `${processDir}/target/gitop`

function release() {
	log.info(`Packaging GitOp`)
	const releaseFile = `${releaseDir}/gitop-${nextMinorVersion}.tar.gz`
	releaseFiles.push(releaseFile)
	const targetPackageJsonFile = `${targetDir}/package.json`

	rm('-Rf',targetDir)
	mkdir('-p',targetDir)
	mkdir('-p',releaseDir)
	cp('-Rf',['src','dist','package.json','LICENSE*','*.md'],targetDir)
	rm('-Rf',`${targetDir}/node_modules`)
	cp('./README.md',targetDir)


	Object.assign(packageJson,{
		version: nextMinorVersion
	})

	_.defaultsDeep(packageJson,{
		main: "dist/index.js",
		typings: "dist/index.d.ts"

	})


	log.info(`Writing package.json to ${targetPackageJsonFile}`)
	fs.writeFileSync(targetPackageJsonFile,JSON.stringify(packageJson,null,4))

	log.info(`Compressing to ${releaseFile}`)
	if (exec(`cd ${targetDir} && tar -cvzf ${releaseFile} .`).code !== 0) {
		throw new Error('Failed to compress archive')
	}

	log.info(`${projectName} is ready for release - publish-all will actually publish to npm`)
}

/**
 * Push compiled release files to github
 *
 * @returns {*}
 */
function releasePush() {
	if (releaseFiles.length < 1)
		throw new Error('No releases were created')


	basePackageJson.version = nextMinorVersion
	fs.writeFileSync(`${process.cwd()}/package.json`,JSON.stringify(basePackageJson,null,4))

	gulp.src('.')
		.pipe(git.add())
		.pipe(git.commit(`[Release] Release Push ${nextMinorVersion}`))

	return gulp.src(releaseFiles)
		.pipe(ghRelease({
			tag: `v${nextMinorVersion}`,
			name: `GitOp Release ${nextMinorVersion}`,
			draft:false,
			prerelease:false,
			manifest:basePackageJson
		}))

}

/**
 * Release all task, sequentially calls
 * individual release tasks, after all are successful
 * it then runs release-push
 *
 * @param done
 */
function releasePackage(done) {
	runSequence('release','release-push',done)
}

gulp.task('release',[], release)
gulp.task('release-package',[], releasePackage)
gulp.task('release-push',[],releasePush)