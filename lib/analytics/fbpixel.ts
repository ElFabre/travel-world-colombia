export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export function fbEvent(eventName: string, data?: object) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data)
  }
}

/** Evento personalizado (fbq trackCustom) — ej. FiltroDestinos. */
export function fbCustomEvent(eventName: string, data?: object) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, data)
  }
}

export function fbPageView() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView')
  }
}
