/**
 * Add dev tools support for viewing Redux Store state in Chrome dev tools
 * @param enhancers
 */
export default function addDevMiddleware(enhancers):void {
  if (isDev && window.devToolsExtension) {
    if (typeof window !== 'undefined' && window.devToolsExtension) {
      enhancers.push(window.devToolsExtension())
    }
  }
}
