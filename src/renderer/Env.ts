/* eslint-disable typescript/no-namespace */

Object.assign(global,{
	isDev: process.env.NODE_ENV !== 'production'
})

declare global {
	const isDev:boolean
}

export {}
