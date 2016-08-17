

const
	electron = require('electron'),
	{app,ipcMain} = electron,
	workerId = process.env.ELECTRON_WORKER_ID

const log = (...args) => console.log('WORKER',...args)

log('Starting worker fixtures',workerId)

// process.send('worker-test-message','test123')
// log.info('Send simple IPC test')


const sendMessage = (type,body = {}) => {
	process.send({type,body})
}


// When 'Ready', initialize listeners, etc
app.on('ready',() => {
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
	
	ipcMain.on('browser-message',(event) => {
		log.info('Worker got browser message')
	})
	
	
})


	

