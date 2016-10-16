require('./init-scripts')


const
	_ = require('lodash'),
	{isEmpty} = _,
	fs = require('fs'),
	glob = require('glob-promise')


const
	{
		AWS_ACCESS_KEY_ID:accessKeyId,
		AWS_SECRET_ACCESS_KEY:secretAccessKey,
		EPICTASK_BUILD:buildNumber,
		EPICTASK_VERSION:version
	} = process.env

if (!(!isEmpty(accessKeyId) && !isEmpty(version) && !isEmpty(buildNumber)))
	process.exit(0)

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
		files = []
	
	for (let filePath of ["*.dmg","*.zip","*.exe","*.deb","*.AppImage"]) {
		files = files.concat(await glob(filePath))
	}
	
	files = files.filter(file => !fs.statSync(file).isDirectory())
	
	echo(`Uploading ${files.length} files`)
	
	const
		promises = files.map(async(file, index) => {
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
		})
	
	await Promise.all(promises)
	
	echo(`All files uploaded`)
	
	
}

upload()
