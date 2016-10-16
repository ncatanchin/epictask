require('./init-scripts')


const
	_ = require('lodash'),
	{isEmpty} = _,
	fs = require('fs'),
	glob = require('glob-promise'),
	path = require('path')


const
	{
		AWS_ACCESS_KEY_ID:accessKeyId,
		AWS_SECRET_ACCESS_KEY:secretAccessKey,
		EPICTASK_BUILD:buildNumber,
		EPICTASK_VERSION:version
	} = process.env



async function upload() {
	
	
	const
		AWS = require('aws-sdk')
	
	AWS.config.setPromisesDependency(require('bluebird'))
	AWS.config.update({
		accessKeyId,
		secretAccessKey,
		region: 'us-east-1'
	})
	
	
	const
		Bucket = 'epictask-releases',
		s3 = new AWS.S3()
	
	cd('dist/build')
	
	let
		files = [],
		promises = [],
		basePath = pwd()
	
	for (let buildRoot of ['','mac']) {
		const newRoot = path.resolve(basePath,buildRoot)
		echo(`Publishing from ${newRoot}`)
		cd(newRoot)
		for (let filePath of ["*.dmg", "*.zip", "*.exe", "*.deb", "*.AppImage"]) {
			files = files.concat(await glob(filePath))
		}
		
		files = files.filter(file => !fs.statSync(file).isDirectory())
		
		echo(`Uploading ${files.length} files`)
		
		promises.push(...files.map(async(file, index) => {
				echo(`Uploading ${index} of ${files.length}: ${file}`)
				
				try {
					const
						stream = fs.createReadStream(file)
					
					await s3.putObject({
						Bucket,
						Key: `electron/${file}`,
						Body: stream,
						ACL: 'public-read'
					}).promise()
					
					echo(`Uploaded ${index} of ${files.length},${file}`)
				} catch (err) {
					console.error(`Failed to upload ${file}`,err)
				}
			}))
	}
	
	
	await Promise.all(promises)
	
	echo(`All files uploaded`)
	
}

if (!isEmpty(accessKeyId) && !isEmpty(version) && !isEmpty(buildNumber))
	upload()
