export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/register',
  VERIFY: '/verify',
  FORGOT_PASSWORD: '/forgot-password',
  NEWSLETTER: '/newsletter',
  PRODUCT: (id: string) => `/item/${id}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ONLINE: '/checkout/online-payment',
  HELP: 'https://intercom.help/myhomeetal/en?reload',
  SHOPS: '/shops',
  DEALS: '/deals',
  ORDER_CONFIRMED: '/order-confirmed',
  SEARCH: '/search',
  ACCOUNT: '/account',
  PURCHASING_HISTORY: '/account/purchasing-history',
  WALLET: '/account/my-wallet',
  NOTIFICATIONS: '/account/notifications',
  SAVED_ITEMS: '/account/saved-items',
  REFERRAL: '/account/my-referrals',
  REFERRAL2: '/referral-page',
  SECURITY: '/account/security',
  ADDRESS_BOOK: '/account/address-book',
  REVIEWS: '/account/review',
  CLOSE_ACCOUNT: '/account/close-account',
  PRIVACY: '/privacypolicy',
  TERMS: '/termsofservice',
};
