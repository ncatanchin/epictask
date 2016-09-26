
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
	Backspace,
	Space,
	Find
	// View1,
	// View2,
	// SetAssignee,
	// SetMilestone,
	// AddLabels,
	// CreateComment
}

export const GlobalKeys = {
	[CommonKeys.New]: 'super+n',
	[CommonKeys.Edit]: 'super+e',
	[CommonKeys.MoveUp]: 'ArrowUp',
	[CommonKeys.MoveDown]: 'ArrowDown',
	[CommonKeys.MoveLeft]: 'ArrowLeft',
	[CommonKeys.MoveRight]: 'ArrowRight',
	[CommonKeys.MoveUpSelect]: 'Shift+ArrowUp',
	[CommonKeys.MoveDownSelect]: 'Shift+ArrowDown',
	[CommonKeys.Enter]: 'Enter',
	[CommonKeys.Escape]: 'Escape',
	[CommonKeys.Find]: 'Super+F',
	[CommonKeys.Space]: 'Space',
	[CommonKeys.Delete]: 'Delete',
	[CommonKeys.Backspace]: 'Backspace'
	// [CommonKeys.SetAssignee]: ['alt+a','a'],
	// [CommonKeys.SetMilestone]: ['alt+m','m'],
	// [CommonKeys.AddLabels]: ['alt+t','t'],
	// [CommonKeys.CreateComment]: ['alt+c','c']

}

export const App = Object.assign({},GlobalKeys,{

})

export const Main = Object.assign({},GlobalKeys,{

})