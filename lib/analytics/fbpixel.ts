export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export function fbEvent(eventName: string, data?: object) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data)
  }
}

export function fbPageView() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView')
  }
}
