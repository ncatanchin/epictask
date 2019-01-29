import Deferred from "common/Deferred"
import * as React from "react"
import Controller from "renderer/controllers/Controller"

export interface IDialogProps<T = any, D = any, C extends Controller = any> {
  dialog: IDialog<T,D>
  dialogClasses: any
  onDialogComplete: (result?:T) => void
  controller:C | null
  updateController: ((newController:C) => void) | ((fn:(newController:C) => C) => void) | null
}

export type DialogElement<T = any, D = any, C extends Controller = any> = string | React.ReactNode | ((props:IDialogProps<T,D,C>) => React.ReactElement<IDialogProps<T,D,C>>)

export type DialogVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface IDialog<T = any, D = any, C extends Controller = any> {
  id: string
  deferred: Deferred<T>
  type: "Confirm" | "IssueEdit" | "IssueCreate"
  variant?: DialogVariant
  title: DialogElement<T, D,C>
  content: DialogElement<T, D,C>
  actions?: DialogElement<T, D,C> | null
  controller?: C
  data?: D
  defaultResult: T
}


export const DialogDefaults:Partial<IDialog> = {
  variant: 'xl'
}
