require('./init-scripts')



const
	_ = require('lodash'),
	{isEmpty} = _,
	fs = require('fs'),
	glob = require('glob-promise')



module.exports = async (accessKeyId,secretAccessKey,version,buildNumber) => {
	if (!(!isEmpty(accessKeyId) && !isEmpty(version) && !isEmpty(buildNumber)))
		return
	
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
	
	const
		files = await glob('**/*')
		
	
	echo(`Uploading ${files.length} files`)
	
	const
		promises = files.map(async (file,index) => {
			echo(`Uploading ${index} of ${files.length}: ${file}`)
			
			const
				stream = fs.createReadStream(file)
			
			await s3.upload({
				Bucket,
				Key: `electron/${file}`,
				Body: stream
			})
			
			echo(`Uploaded ${index} of ${files.length},${file}`)
		})
	
	await Promise.all(promises)
	
	echo(`All files uploaded`)
	
	
}