

export function Run<T = any>(fn:() => T):T {
  return fn()
}
