import * as React from "react"


import {
  FillWidth,
  FillWindow,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {ConnectedRouter} from "react-router-redux"
import {Redirect, Route} from "react-router"
import IssuesLayout from "./issues/Layout"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

function baseStyles():StyleDeclaration {
  return {
    app: [FillWindow, FlexColumn, {
      "& .content": [FlexScale,FillWidth,PositionRelative]
    }],
    "@global": {
      ".auth0-lock-container": [{
        zIndex: 20000
      }]
    }
  } as any
}

export default StyledComponent(baseStyles)(function App(props:IThemedProperties): React.ReactElement<IThemedProperties> {
  const
    {classes} = props

  return <div className={classes.app}>
    <ConnectedRouter store={getReduxStore()} history={getRouterHistory()}>
      <div id="content" className="content">
        <Route path="/issues" component={() => <IssuesLayout />}/>
        <Redirect to="/issues" path="/" exact/>
      </div>
    </ConnectedRouter>
  </div>
})
