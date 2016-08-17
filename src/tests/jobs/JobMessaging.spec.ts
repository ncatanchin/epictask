
import * as Electron from 'electron'
import * as path from 'path'
import {toDataUrl} from "main/MainTemplates"
import Worker from 'main/Worker'
import {IWorkerEventListener} from "main/Worker"
import {IWorkerMessage} from "main/Worker"
const
	log = getLogger(__filename),
	{BrowserWindow,app,ipcMain} = Electron


/**
 * Main worker tests
 */
describe('Main & Job can communicate', function () {
	const workerScriptFile = path.resolve(__dirname,'fixtures/worker-fixture.js')
	log.info(`Using worker script @ ${workerScriptFile}`)
	
	let worker:Worker = null, workersStarted = false
	
	before(async () => {
		worker = new Worker(workerScriptFile,{
			onError(worker:Worker,err) {
				log.error('worker error occurred',err)
			},
			onStart(worker:Worker,err) {
				log.info('worker started',err)
			},
			onStop(worker:Worker,err) {
				log.info('worker exited',err)
			},
			onMessage(worker:Worker,message:IWorkerMessage) {
				log.info('worker message',message)
			}
		} as IWorkerEventListener)
		
		await worker.start()
		log.info('worker started')
	})
	
	after(() => {
		worker.kill()
		log.info('worker killed')
	})
	
	/**
	 * Test Communication Between main and workers
	 */
	describe('Main <> Worker (via electron-worker & process)',function() {
		
		
		it("Worker says 'who dat'", async () => {
			
			
			const who = 'coolio'
			
			// Flag for completion
			const deferred = Promise.defer()
			
			// The listener
			const listener:IWorkerEventListener = {
				onError(worker:Worker,err) {
					deferred.reject(err)
				},
				onMessage(worker:Worker,message) {
					log.info('Got message',message)
					if (message && message.type === 'there') {
						deferred.resolve(message.body)
					}
				}
			}
			
			// Add the listener
			worker.addListener(listener)
			
			try {
				worker.sendMessage('who',{who})
				
				const {there} = await Promise.resolve(deferred.promise).timeout(3000)
				
				log.info('got response from worker: who ',there)
				expect(there).toBe(`who ${who}`)
				
			} finally {
				worker.removeListener(listener)
			}
			
		})
	})
	
	/**
	 * Browser <> Worker Tests
	 */
	describe('BrowserWindow <> Worker (via ipcMain)', function() {
		
		it('can start subscript and communicate over ipcMain with a browser window',function (done) {
			
			
			
			const win = new BrowserWindow({
				show: false
			})
			
			// ipcMain.on('browser-message',(event) => {
			// 	log.info('ipc message received', event)
			// 	//process.send({event:'worker-test-complete'})
			// 	// process.send({workerEvent: 'browser-message-received'})
			//
			//
			// })
			
			
			process.on('worker-test-complete',() => {
				log.info('worker test complete received')
				win.close()
			})
			
			// ipcMain.on('test-complete',(event) => {
			// 	log.info('Test completed')
			// 	win.close()
			// 	//done()
			// })
			
			const htmlUrl = toDataUrl(`
				<html>
				<head>
				<script>
				window.onload = () => {
					
					
					console.log('in window');
					const 
						electron = require('electron'),
						{remote,ipcRenderer} = electron,
						log = electron.remote.getGlobal('getLogger')('browser-test')
					
					try {
						log.info('Starting')
						
						ipcRenderer.send('browser-message','123124')
						ipcRenderer.send('test-complete')		
						
						log.info('sent')
					} catch (err) {
						log.error('Failed to send',err)
						ipcRenderer.send('test-error')
					}
					
				}
				</script>
				</head>
				<body>
				</body>
				</html>
			`)
			
			win.webContents.on('did-fail-load',(event,code,desc,url,mainFrame) => {
				log.error('web content failed to load',event,code,desc,url)
				
				done(new Error(desc))
			})
			
			win.on('did-finish-load',() => {
				log.info('bg window loaded, should get a message AFTER this')
			})
			
			win.on('closed',() => {
				log.info('window closed, test is done')
				done()
			})
			
			
			win.loadURL(htmlUrl)
			
			
		})
	})
	
})


