
import { getHot, setDataOnHotDispose } from "epic-global/HotUtils"

const
	proxyWrapCache = getHot(module,'proxyWrapCache',{}) as any

setDataOnHotDispose(module,() => ({proxyWrapCache}))

export function ProxyWrap<T>(mod,name:string,value):T {
	const
		modId = mod.id,
		modCache = proxyWrapCache[ modId ] || (proxyWrapCache[ modId ] = {} as any)
	let
		record = modCache[ name ]
	
	if (!record) {
		record = modCache[ name ] = {
			modId,
			name,
			proxy: new Proxy({}, {
				get(noop, prop) {
					return proxyWrapCache[ modId ][ name ].value[ prop ]
				}
			})
		}
	}
	
	record.value = value
	
	return record.proxy
}