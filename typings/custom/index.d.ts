/// <reference path="./reflect-metadata/index.d.ts" />
/// <reference path="./material-ui/index.d.ts" />
/// <reference path="./webpack-env.d.ts" />
/// <reference path="./element-class.d.ts" />
/// <reference path="./lodash-mixins.d.ts" />



interface Window {
	devToolsExtension:any
}

declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
	}
}

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

declare namespace Reselect {


	type Selector<TInput, TOutput> = (state: TInput, props?: any) => TOutput;

	function createSelector<TInput, TOutput, T1>(selector1: Selector<TInput, T1>[], combiner: (...args:T1[]) => TOutput): Selector<TInput, TOutput>;
}
// declare global {
// 	import * as assertGlobal from 'assert'
// 	import * as ImmutableGlobal from 'immutable'
// 	import * as LodashGlobal from 'lodash'
//
// 	declare var
// }
