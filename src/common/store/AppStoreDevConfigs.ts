/**
 * Add dev tools support for viewing Redux Store state in Chrome dev tools
 * @param enhancers
 */
import {isRenderer} from "common/Process"

export default function addDevMiddleware(enhancers):void {
  if (isRenderer() && typeof window !== 'undefined' && window.devToolsExtension) {
    enhancers.push(window.devToolsExtension())
  }
}
