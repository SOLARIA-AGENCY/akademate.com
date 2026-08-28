type IpadAppWindow = {
  Capacitor?: unknown
  navigator?: { standalone?: boolean }
  matchMedia?: (query: string) => { matches: boolean }
}

/** Real iPad app / PWA standalone. Never use viewport width. */
export function isIpadAppRuntime(win: IpadAppWindow): boolean {
  if (win.Capacitor) return true
  if (win.navigator?.standalone === true) return true
  if (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  return false
}

export function applyIpadAppFlag(doc: { documentElement: { setAttribute: (name: string, value: string) => void } }, win: IpadAppWindow): boolean {
  if (!isIpadAppRuntime(win)) return false
  doc.documentElement.setAttribute('data-ipad-app', '')
  return true
}
