

//const workerId = process.env.WORKER_ID

const log = (...args) => console.log('WORKER',...args)

log('Starting worker fixtures')

// process.send('worker-test-message','test123')
// log.info('Send simple IPC test')

debugger

const sendMessage = (type,body = {}) => {
	process.send({type,body})
}


// When 'Ready', initialize listeners, etc

log('app ready')

process.on('message',(data) => {
	
	switch (data.type) {
		case 'ping':
			sendMessage('pong')
			break
		case 'who':
			sendMessage('there',{there: `who ${data.body.who}`})
			break
	}
	
})



	

