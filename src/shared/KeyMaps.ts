
export enum CommonKeys {
	MoveUp = 1,
	MoveDown,
	MoveRight,
	MoveLeft,
	New,
	Edit,
	Escape,
	Enter,
	Delete,
	Space
}

export const Global = {
	[CommonKeys.New]: ['command+n','ctrl+n'],
	[CommonKeys.Edit]: ['command+e','ctrl+e'],
	[CommonKeys.MoveUp]: 'up',
	[CommonKeys.MoveDown]: 'down',
	[CommonKeys.MoveLeft]: 'left',
	[CommonKeys.MoveRight]: 'right',
	[CommonKeys.Enter]: 'enter',
	[CommonKeys.Escape]: 'esc',
	[CommonKeys.Space]: 'space',
	[CommonKeys.Delete]: ['del','backspace']
}

export const App = Object.assign({},Global,{

})

export const Main = Object.assign({},Global,{

})