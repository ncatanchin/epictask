import * as React from "react"


import {
  FillWindow,
  FlexColumn,
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ConnectedRouter} from "react-router-redux"
import {Redirect, Route} from "react-router"
import Loadable from "react-loadable"
import Header from "renderer/components/Header"
import {HeaderContext} from "renderer/components/Context"
import IssuesLayout from "./issues/Layout"

function baseStyles():StyleDeclaration {
  return {
    app: [FillWindow, FlexColumn, {
    }],
    "@global": {
      ".auth0-lock-container": [{
        zIndex: 20000
      }]
    }
  } as any
}

// const IssuesLayoutLoader = Loadable({
//   loader:  () => import("./issues/Layout"),
//   loading: () => <div>loading</div>,
//   // render(loaded:any, props) {
//   //   let Component = loaded.namedExport;
//   //   return <Component {...props}/>;
//   // }
// })

interface S {
  headerRef:Header | null
}

@withStatefulStyles(baseStyles)
export class App extends React.Component<IThemedProperties,S> {
	
  constructor(props,context) {
		super(props,context)
    
    this.state = {
		  headerRef: null
    }
	}
	
	private setHeaderRef = (headerRef:Header):void =>
    this.setState({headerRef})
  
	
  render() {
    const
      {classes} = this.props,
      {headerRef} = this.state
    return <>
      <Header headerRef={this.setHeaderRef} className={classes.header}/>
      {headerRef &&
      <ConnectedRouter store={getReduxStore()} history={getRouterHistory()}>
        <HeaderContext.Provider value={headerRef}>
      
      
          <div id="content" className={classes.app}>
            <Route path="/issues" component={() => <IssuesLayout header={headerRef}/>}/>
            <Redirect to="/issues" path="/" exact/>
          </div>
    
        </HeaderContext.Provider>
      </ConnectedRouter>
      }
    </>
  }
}

export default App
