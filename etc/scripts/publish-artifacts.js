require('./init-scripts')


const
	AWS = require('./aws-init')

if (AWS) {
	const
		{process} = global,
		_ = require('lodash'),
		{isEmpty} = _,
		fs = require('fs'),
		glob = require('glob-promise'),
		path = require('path')
	
	
	const
		{
			EPICTASK_BUILD:buildNumber,
			EPICTASK_VERSION:version
		} = process.env
	
	
	async function upload() {
		const
			Promise = require('bluebird'),
			Bucket = 'epictask-releases',
			s3 = new AWS.S3(),
			[artifactPath,extensions] =
				isMac ? ['dist/build/mac',["*.dmg", "*.zip"]] :
					process.platform === 'win32' ? ['dist/build',['*.exe','*.nupkg','*.msi','*.zip']] :
					['dist/build',["*.deb","*.rpm","*.AppImage"]]
			
		
		cd(artifactPath)
		
		let
			promises = [],
			files = []
		
		
		//const newRoot = path.resolve(basePath,buildRoot)
		//echo(`Publishing from ${newRoot}`)
		
		
		for (let filePath of extensions) {
			files = files.concat(await glob(filePath))
		}
		
		files = files.filter(file => !fs.statSync(file).isDirectory())
		
		echo(`Uploading ${files.length} files`)
		
		promises.push(...files.map(async(file, index) => {
			echo(`Uploading ${index} of ${files.length}: ${file}`)
			
			try {
				const
					stream = fs.createReadStream(file),
					ext = path.extname(file),
					releaseFilename = `epictask-${platformName}-v${version}-${buildNumber}${ext}`
				
				echo(`Mapped filename ${releaseFilename}`)
				
				await s3.putObject({
					Bucket,
					Key: `electron/${releaseFilename}`,
					Body: stream,
					ACL: 'public-read'
				}).promise()
				
				echo(`Uploaded ${index} of ${files.length},${file}`)
			} catch (err) {
				console.error(`Failed to upload ${file}`, err)
			}
		}))
		
		
		await Promise.all(promises)
		
		echo(`All files uploaded`)
		
	}
	if (!isEmpty(version) && !isEmpty(buildNumber))
		upload()
	
}
