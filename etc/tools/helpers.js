const fs = require('fs')

export function readJSONFileSync(filename) {
	return JSON.parse(fs.readFileSync(filename,'utf-8'))
}

export function writeJSONFileSync(filename,json) {
	fs.writeFileSync(filename,JSON.stringify(json,null,4))
}

