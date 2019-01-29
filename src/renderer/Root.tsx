//import {createMuiTheme} from '@material-ui/core/styles'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import * as React from "react"
//import Loadable from "react-loadable"

//import {makeTransition, mergeStyles, rem, remToPx} from "renderer/styles/ThemedStyles"
import {hot} from 'react-hot-loader/root'



import App from "renderer/components/App"
import {darkTheme} from "renderer/styles/Themes"
import {Provider} from "react-redux"
import getLogger from "common/log/Logger"

import ThemeProvider from '@material-ui/styles/ThemeProvider'
import HighlightStyles from "renderer/components/markdown/HighlightStyles"


const log = getLogger(__filename)


// const App = Loadable({
//   loader: () => import("renderer/components/App"),
//   loading: () => <div>loading</div>
// })

/**
 * Generate the MUI palette for mapper
 */

class Root extends React.Component<{}, {}> {

  constructor(props, context) {
    super(props, context)
  }

  render() {
    // ConnectedRouter will use the store from the Provider automatically
    return <Provider store={getReduxStore()}>
      <MuiThemeProvider theme={darkTheme}>
        <ThemeProvider theme={darkTheme}>
          <HighlightStyles/>
          <App/>
        </ThemeProvider>
      </MuiThemeProvider>
    </Provider>


  }
}


export default hot(Root)
