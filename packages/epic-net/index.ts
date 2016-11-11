import { Transport, ITransportConstructor, TransportScheme, ITransportOptions } from "./Transport"
export * from "./Transport"
export * from "./IPCTransport"
export * from "./IPCUtil"
export * from './IPCServer'





/**
 * Map of Transport enum values to function providers
 */
export type TTransportProviderMap = {[name: string]: () => ITransportConstructor}


/**
 * Default scheme
 * @type {TransportScheme}
 */
export const DefaultTransportScheme: TransportScheme =
	(TransportScheme[process.env.DefaultTransportScheme] || TransportScheme.IPC) as any


/**
 * Scheme >> Provider Mappings
 *
 * @type {TTransportProviderMap}
 */
export const TransportSchemeProviders: TTransportProviderMap = {
	[TransportScheme[TransportScheme.IPC]]: () => require('./IPCTransport').default
}

/**
 * Get a new transport for a given scheme and options
 *
 * @param opts
 * @returns {Transport}
 */
export function getDefaultTransport(opts: ITransportOptions = {}) {
	
	const
		transportScheme = opts.scheme || getDefaultScheme(),
		transportProvider = TransportSchemeProviders[transportScheme] ||
			TransportSchemeProviders[TransportScheme[transportScheme]],
		transportClazz = transportProvider() as ITransportConstructor
	
	return new transportClazz(opts)
}

/**
 * Get the default scheme currently configured
 *
 * @returns {TransportScheme}
 */
export function getDefaultScheme(): TransportScheme {
	return DefaultTransportScheme
}


/**
 * Get a new default transport instance with options
 *
 * @param opts
 * @returns {Transport}
 */
export function getTransport(opts: ITransportOptions = {}): Transport {
	return getDefaultTransport(assign(opts,{scheme:DefaultTransportScheme}))
}