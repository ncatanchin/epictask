
export enum CommonKeys {
	MoveUp = 1,
	MoveDown,
	MoveRight,
	MoveLeft,
	MoveUpSelect,
	MoveDownSelect,
	New,
	Edit,
	Escape,
	Enter,
	Delete,
	Space,
	Find
}

export const Global = {
	[CommonKeys.New]: ['command+n','ctrl+n'],
	[CommonKeys.Edit]: ['command+e','ctrl+e'],
	[CommonKeys.MoveUp]: 'up',
	[CommonKeys.MoveDown]: 'down',
	[CommonKeys.MoveLeft]: 'left',
	[CommonKeys.MoveRight]: 'right',
	[CommonKeys.MoveUpSelect]: 'shift+up',
	[CommonKeys.MoveDownSelect]: 'shift+down',
	[CommonKeys.Enter]: 'enter',
	[CommonKeys.Escape]: 'esc',
	[CommonKeys.Find]: 'command+f',
	[CommonKeys.Space]: 'space',
	[CommonKeys.Delete]: ['del','backspace']
}

export const App = Object.assign({},Global,{

})

export const Main = Object.assign({},Global,{

})