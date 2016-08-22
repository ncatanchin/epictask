declare module 'typescript-ioc' {
	export class Container {
		static bind(source: Function): Config;
		//static get<T>(source:{new():T}&Function|any):T&Function|any;
		static get<T>(source:{new():T}&Function):T&Function;
	}
	
	export function Singleton(target: Function): void;
	export function Scoped(scope: Scope): (target: Function) => void;
	export function Provided(provider: Provider): (target: Function) => void;
	export function Provides(target: Function): (to: Function) => void;
	export function AutoWired(target: Function): any;
	export function Inject(...args: any[]): any;
	
	export interface Config {
		to(target: Object): Config;
		provider(provider: Provider): Config;
		scope(scope: Scope): Config;
	}
	export interface Provider {
		get(): Object;
	}
	export abstract class Scope {
		static Local: Scope;
		static Singleton: Scope;
		abstract resolve(provider: Provider, source: Function): any;
		reset(source: Function): void;
	}
	
}