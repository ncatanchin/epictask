//
//
//
// const log = getLogger(__filename)
//
//
// import {UserStore} from 'shared/models/User'
// import Electron = require('electron')
// //import {toDataUrl} from 'main/MainTemplates'
//
// const {BrowserWindow,ipcMain} = Electron
//
//
// xdescribe('Database Remote (IPC) Service',() => {
// 	before(async () => {
// 		log.info(`Loading database service`)
// 	})
//
// 	after(async () => {
// 		log.info(`Shutting down database service`)
// 	})
//
// 	it('Can open an close a background window',(done) => {
// 		try {
//
// 			const bgWindow = new BrowserWindow({
// 				show: false
// 			})
//
// 			ipcMain.on('test-bg-request',(event,arg1) => {
// 				log.info('bg window message received')
// 				event.sender.send('test-bg-response',arg1)
// 			})
//
// 			ipcMain.on('test-end',(event) => {
// 				log.info('test-end received')
// 				bgWindow.close()
// 			})
//
// 			const bgTestHtml = toDataUrl(`
// 				<html>
// 				<head>
// 				<script>
// 				window.onload = () => {
// 					const {ipcRenderer} = require('electron')
// 					const assert = require('assert')
// 					const testPayload = "1234"
// 					ipcRenderer.on('test-bg-response',(event,arg1) => {
// 						assert(arg1 === testPayload,'test payloads not equal')
// 						ipcRenderer.send('test-end')
// 					})
//
// 					console.log('sending payload test')
// 					ipcRenderer.send('test-bg-request',testPayload)
// 				}
// 				</script>
// 				</head>
// 				<body>
// 				</body>
// 				</html>
// 			`)
//
// 			bgWindow.webContents.on('did-fail-load',(event,code,desc,url,mainFrame) => {
// 				log.error('web content failed to load',event,code,desc,url)
//
// 				done(new Error(desc))
// 			})
//
// 			bgWindow.on('did-finish-load',() => {
// 				log.info('bg window loaded, should get a message AFTER this')
// 			})
//
// 			bgWindow.on('closed',() => {
// 				log.info('window closed, test is done')
// 				done()
// 			})
//
// 			bgWindow.loadURL(bgTestHtml)
//
// 		} catch (err) {
// 			log.error('bg window failed', err)
// 			done(err)
// 		}
//
//
// 	})
//
// 	it('Object proxies everything in node',async () => {
// 		const userStore:UserStore = new Proxy({},{
// 			get(target,name) {
// 				log.info('Proxying request for?',name)
// 				return function(...args) {
// 					return Promise.resolve([1])
// 				}
//
// 			}
// 		}) as any
//
// 		const results = await userStore.findAll()
// 		expect(results[0]).toEqual(1)
// 	})
// 	// it(`creates user`,async () => {
// 	// 	log.info('Create user')
// 	// 	let user = new User({
// 	// 		id: 1,
// 	// 		login: 'jonny',
// 	// 		repoIds:[],
// 	// 		name: 'shortcircuit'
// 	// 	})
// 	//
// 	// 	user = await dbService.stores.user.save(user)
// 	// 	expect((user as any).$$_doc).not.toBeNull()
// 	// })
// 	//
// 	// it(`gets users`,async () => {
// 	// 	log.info('Getting users')
// 	// 	const users = await dbService.stores.user.findAll()
// 	// 	expect(users.length).toEqual(1)
// 	// })
// })
