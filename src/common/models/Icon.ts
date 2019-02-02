import * as Octicons from "@githubprimer/octicons-react"
import * as MUIIcons from "@material-ui/icons"

export enum IconType {
  Octicon = "Octicon",
  MUI = "MUI"
}

export type IconKey<Type extends IconType> =
  Type extends IconType.Octicon ? keyof typeof Octicons :
    Type extends IconType.MUI ? keyof typeof MUIIcons :
      never

export interface IIcon<Type extends IconType> {
  type:Type
  key:IconKey<Type>
}


export  function makeOcticonIcon(key:IconKey<IconType.Octicon>):IIcon<IconType.Octicon> {
  return {
    type: IconType.Octicon,
    key
  }
}

export function makeMUIIcon(key:IconKey<IconType.MUI>):IIcon<IconType.MUI> {
  return {
    type: IconType.MUI,
    key
  }
}
