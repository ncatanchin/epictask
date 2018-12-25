import {State} from "typedux"


export interface IActionFactoryBase<S extends State<string>> {
	setState(state:S):(state:S) => void
}

export interface IActionFactoryBaseConstructor<S extends State<string>> {
	new ():IActionFactoryBase<S>
}
