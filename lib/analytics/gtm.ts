export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function gtmPageView(url: string) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  window.dataLayer.push({ event: 'pageview', page: url })
}

export function gtmEvent(eventName: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  window.dataLayer.push({ event: eventName, ...data })
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    fbq: (action: string, event: string, data?: object) => void
  }
}
