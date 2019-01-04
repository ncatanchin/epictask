import * as React from 'react'
import {FlexScale} from "renderer/styles/ThemedStyles"
import {CSSProperties} from "@material-ui/core/styles/withStyles"

export function FlexSpacer():JSX.Element {
  return <div style={FlexScale as CSSProperties}/>
}
