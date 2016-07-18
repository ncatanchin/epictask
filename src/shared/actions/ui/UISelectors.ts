

import {UIKey} from 'shared/Constants'
import {UIState} from 'shared/actions/ui/UIState'

export const uiStateSelector = (state) => state.get(UIKey) as UIState