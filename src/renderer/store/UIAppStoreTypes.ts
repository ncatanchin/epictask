import UIState from "renderer/store/state/UIState"


declare global {
  interface IRootRendererState extends IRootState {
    UIState:UIState
  }

  function getRendererStoreState():IRootRendererState
}

Object.assign(global,{
  getRendererStoreState: () => getStoreState()
})

export {}
