

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as MUI from 'material-ui'

export class Button1 extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	render() {
		return <MUI.RaisedButton label="Default1" onMouseUp={() => console.log('what2 up')} />
	}
}


