// Lightweight SEO head manager — updates <title> and meta tags per route.
// No external dependency. In an SPA this is applied client-side; combined with
// the static tags in index.html it gives good crawl coverage + social sharing.

const BASE_TITLE = 'BookSetu — Buy, Sell, Exchange & Rent Used Books Near You'

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function setSEO({ title, description }) {
  const fullTitle = title
    ? `${title} | BookSetu — Used Books Marketplace`
    : BASE_TITLE
  document.title = fullTitle
  if (description) {
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'twitter:description', description)
  }
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'twitter:title', fullTitle)
}

// Map route path -> human readable title/description (used for code-split SEO)
export const ROUTE_META = {
  '/': {
    title: 'Buy, Sell, Exchange & Rent Used Books',
    description:
      'Find affordable used textbooks, novels and study material near you. Buy, sell, exchange or rent books with local sellers.',
  },
  '/login': { title: 'Login', description: 'Login to your BookSetu account to buy and sell used books.' },
  '/signup': { title: 'Create Account', description: 'Create a free BookSetu account to buy, sell and exchange used books.' },
  '/forgot-password': { title: 'Reset Password', description: 'Reset your BookSetu account password.' },
  '/dashboard': { title: 'Your Dashboard', description: 'Manage your BookSetu listings and activity.' },
  '/listing': { title: 'Sell Your Book', description: 'List your used book on BookSetu to sell, exchange or rent it near you.' },
  '/profile': { title: 'Your Profile', description: 'Manage your BookSetu profile, listings and chats.' },
  '/cart': { title: 'Your Cart', description: 'Review the books in your BookSetu cart before pickup.' },
  '/wishlist': { title: 'Your Wishlist', description: 'Books you saved on BookSetu for later.' },
  '/admin': { title: 'Admin Dashboard', description: 'Admin tools to manage the BookSetu marketplace.' },
}
