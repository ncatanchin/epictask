import {isString,toNumber} from 'typeguard'
import * as msgpack from 'msgpack-lite'

const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


export interface IIPCBufferedMessageHolder {
	bufferedMessage:IPCBufferedMessage
}

export default class IPCBufferedMessage {
	
	static handleData(handler:IIPCBufferedMessageHolder,socket,buf:Buffer,dataCallback:(socket,data:any) => any):any {
		if (handler.bufferedMessage) {
			
			const
				newBufLength = buf.length,
				remaining = handler.bufferedMessage.size - handler.bufferedMessage.read,
				read = Math.min(newBufLength,remaining),
				overflow = newBufLength - read
			
			
			
			handler.bufferedMessage.push(buf)
			if (!handler.bufferedMessage.complete)
				return
			
			buf = handler.bufferedMessage.buf
			
			handler.bufferedMessage = null
			
			if (overflow > 0) {
				
			}
		}
		
		const
			data = msgpack.decode(buf)
		
		if (isString(data) && data.startsWith("@@dataStart")) {
			const
				size = toNumber(data.split('-')[1])
			log.debug(`Starting data of size ${size}`)
			handler.bufferedMessage = new IPCBufferedMessage(size)
			return null
		}
		
		return dataCallback(socket,data)
	}
	
	buf:Buffer
	read:number = 0
	complete = false
	constructor(public size:number) {
		this.buf = Buffer.alloc(size)
	}
	
	push(data:Buffer, offset = 0, length = data.length) {
		data.copy(this.buf,this.read,offset,length)
		
		this.read += data.length
		this.complete = this.read >= this.size
		
		debugger
		log.debug(`Received ${this.read} of ${this.size} bytes, complete=${this.complete}`)
	}
}


export function makeIPCMsgPackReadStream(dataCallback:(socket,data:any) => any) {
	const
		readStream = msgpack.createDecodeStream()
	
	let
		msgSocket = null
	
	readStream.on('data',(data:any) => {
		log.debug(`Data read from msg pack`,data)
		
		if (!isString(data))
			dataCallback(msgSocket,data)
	})
	
	return (socket,buf:Buffer) => {
		msgSocket = socket
		readStream.write(buf)
	}
		
	
}