import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  FlexColumnCenter,
  Fill,
  FillWidth,
  makePaddingRem,
  makeMarginRem,
  FlexColumn,
  PositionAbsolute,
  makeHeightConstraint,
  rem, FlexAuto, FlexScale, Transparent, Ellipsis, FlexRowCenter
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import Dialog from "@material-ui/core/Dialog/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent/DialogContent"
import {DialogDefaults, DialogElement, DialogVariant, IDialog, IDialogProps} from "renderer/models/Dialog"
import {currentDialogSelector} from "renderer/store/selectors/UISelectors"
import {useCallback, useMemo, useRef, useState} from "react"
import {getValue, isFunction, isNil} from "typeguard"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import DialogActions from "@material-ui/core/DialogActions/DialogActions"
import Button from "@material-ui/core/Button/Button"
import {Run} from "common/util/fn"
import {useCommandManager} from "renderer/command-manager-ui"
import CommonElementIds from "renderer/CommonElements"
import Slide from "@material-ui/core/Slide/Slide"
import {darken} from "@material-ui/core/styles/colorManipulator"
import classNames from "classnames"
import {capitalize} from "@material-ui/core/utils/helpers"
import {
  ControllerContext,
  ControllerProviderState,
  useController,
  withController
} from "renderer/controllers/Controller"
import {withDirtyDataInterceptor} from "renderer/components/DirtyDataInterceptor"

const log = getLogger(__filename)

const DialogVariants: { [variant in DialogVariant]: string } = {
  xs: "25vh",
  sm: "40vh",
  md: "55vh",
  lg: "70vh",
  xl: "85vh",
  full: "100vh"
}


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, components: {Backdrop, Dialog}} = theme,
    {primary, secondary, action} = palette

  return {
    root: [Fill, makePaddingRem(0), {}],
    backdrop: [{
      backgroundColor: Backdrop.colors.bg
    }],
    paper: [Fill, makePaddingRem(0), makeMarginRem(0), {
      border: `${rem(0.1)} solid ${action.main}`,
      borderRadius: rem(0.3),

      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    }],
    container: [FillWidth, FlexColumn, PositionAbsolute, {
      //boxShadow: `0px 0px 0.1rem 0.1rem ${action.main}`,
      bottom: 0,
      left: 0,
      right: 0
    }],
    ...Object.entries(DialogVariants).reduce((classes, [variant, height]) => {
      classes[`containerVariant${capitalize(variant)}`] = [makeHeightConstraint(height)]
      return classes
    }, {}),
    innerContainer: [Fill, FlexColumn, makePaddingRem(0), makeMarginRem(0), {
      background: Dialog.colors.contentBg,
      color: Dialog.colors.contentColor
    }],

    title: [FlexAuto, FillWidth, {
      background: Dialog.colors.titleBg,
      fontWeight: 700,
      fontSize: rem(4),
      //textTransform: "uppercase",
      color: Dialog.colors.titleColor
    }],

    content: [FlexScale, FillWidth, FlexColumn, {
      background: Dialog.colors.contentBg,
      color: Dialog.colors.contentColor
    }],

    textContent: [FlexRowCenter,FlexScale, makePaddingRem(4),{
      "& > div": [Ellipsis]
    }],

    actions: [FlexAuto, FillWidth, makePaddingRem(0), makeMarginRem(0), {
      background: Dialog.colors.actionsBg,
      color: Dialog.colors.actionsColor,
      fontSize: rem(1.6)
    }],

    actionsButtonRoot: [{
      borderRadius: 0
    }],

    actionsButtonCancelRoot: [{
      borderRadius: 0,
      background: Transparent
    }],

    actionsButtonLabel: [{
      fontSize: rem(1.4),
      fontWeight: 600
    }],

    actionsButtonCancelLabel: [{
      fontSize: rem(1.4),
      fontWeight: 500
    }]


  }
}

interface P extends IThemedProperties {

}

interface SP<T = any> {
  dialog: IDialog<T> | null
}

const selectors: Selectors<IThemedProperties, SP> = {
  dialog: currentDialogSelector
}


function toDialogElement(dialog: IDialog, props: IDialogProps, elem: DialogElement): React.ReactNode {
  if (!elem) return null
  if (isFunction(elem)) {
    const Component = elem as (props: IDialogProps) => React.ReactElement<IDialogProps>
    return <Component {...props}/>
  } else {
    return <>{elem}</>
  }
}

export default StyledComponent<P, SP>(baseStyles, selectors, {
  extraWrappers: {
    outer: [withDirtyDataInterceptor()],
    inner: [withController<P & SP>(
      props => getValue(() => props.dialog.controller),
      props => [getValue(() => props.dialog.controller)]
    )]
  }
})(function DialogContainer<T>(props: P & SP<T>): React.ReactElement<P> {
  const
    {dialog, classes} = props,
    onDialogComplete = useCallback((result?: T) => {
      if (!dialog || (dialog && dialog.deferred.isSettled())) return

      dialog.deferred.resolve(isNil(result) ? dialog.defaultResult : result)
      new UIActionFactory().removeDialog(dialog)
    }, [dialog]),
    [controller,updateController] = useController(),
    dialogProps = useMemo(() => ({
      dialogClasses: classes,
      dialog,
      onDialogComplete,
      controller,
      updateController
    }), [controller,dialog, onDialogComplete]),
    changeSet = [controller, dialog,dialogProps,getValue(() => dialog.content),getValue(() => dialog.actions),getValue(() => dialog.title)],
    content = useMemo(() => dialog && toDialogElement(dialog, dialogProps, dialog.content), changeSet),
    actions = useMemo(() => dialog && toDialogElement(dialog, dialogProps, dialog.actions), changeSet),
    title = useMemo(() => dialog && toDialogElement(dialog, dialogProps, dialog.title), changeSet),
    id = CommonElementIds.Dialog,
    containerRef = useRef<any>(null),
    {props: commandManagerProps} = useCommandManager(
      id,
      useMemo(() => builder => builder.make(),[controller]),
      containerRef
    ),
    variant = getValue(() => dialog.variant, DialogDefaults.variant)

  return <Dialog
    open={!!dialog}
    aria-labelledby="dialog-title"
    TransitionComponent={Slide}
    disableAutoFocus
    disableEnforceFocus
    disableRestoreFocus

    TransitionProps={{
      direction: "up"
    } as any}
    classes={{
      root: classes.root,
      paper: classes.paper,
      container: classNames(classes.container, {
        [classes[`containerVariant${capitalize(variant)}`]]: !!variant
      })
    }}

    BackdropProps={{
      classes: {
        root: classes.backdrop
      }
    }}
  >
    <div id={id} tabIndex={-1} className={classes.innerContainer} ref={containerRef} {...commandManagerProps} >

      {dialog && <>
        <DialogTitle
          id="dialog-title"
          disableTypography
          classes={{
            root: classes.title
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent
          classes={{
            root: classes.content
          }}
        >
          {content}
        </DialogContent>

        {actions && <DialogActions
          classes={{
            root: classes.actions
          }}
        >{actions}</DialogActions>}
      </>}

    </div>
  </Dialog>
})

