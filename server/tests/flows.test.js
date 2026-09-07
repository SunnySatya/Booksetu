import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import { api } from './helpers.js'

const ctx = JSON.parse(
  fs.readFileSync(new URL('./qa-context.json', import.meta.url), 'utf8'),
)
const U = ctx.users

describe('Authenticated flows (against QA database)', () => {
  describe('Cart / Wishlist per-user privacy', () => {
    test('buyer adds a cart item, seller A does not see it (server isolation)', async () => {
      const item = { title: 'QA Unique Cart Book', seller: 'QA SellerA', sellerEmail: U.sellerA.email, price: 199 }
      const add = await api('/cart', { method: 'POST', body: { item }, token: U.buyer.token })
      assert.equal(add.status, 200)
      assert.ok(add.data.some((c) => c.title === item.title))

      // seller A's cart is independent
      const sellerCart = await api('/cart', { token: U.sellerA.token })
      assert.ok(!sellerCart.data.some((c) => c.title === item.title), 'cart leaked across users!')

      // buyer cannot also be in seller B / seller B cannot see
      const sellerB = await api('/cart', { token: U.sellerB.token })
      assert.ok(!sellerB.data.some((c) => c.title === item.title))
    })

    test('cart add requires unique item (409 on duplicate)', async () => {
      const item = { title: 'QA Dup', seller: 'QA SellerA', sellerEmail: U.sellerA.email }
      await api('/cart', { method: 'POST', body: { item }, token: U.buyer.token })
      const dup = await api('/cart', { method: 'POST', body: { item }, token: U.buyer.token })
      assert.equal(dup.status, 409)
    })

    test('cart PUT requires an array', async () => {
      const r = await api('/cart', { method: 'PUT', body: { items: 'notarray' }, token: U.buyer.token })
      assert.equal(r.status, 400)
    })

    test('wishlist is per-user too', async () => {
      const item = { title: 'QA Wish Book', seller: 'QA SellerA', sellerEmail: U.sellerA.email }
      await api('/wishlist', { method: 'POST', body: { item }, token: U.buyer.token })
      const wB = await api('/wishlist', { token: U.buyer.token })
      assert.ok(wB.data.some((x) => x.title === item.title))
      const wA = await api('/wishlist', { token: U.sellerA.token })
      assert.ok(!wA.data.some((x) => x.title === item.title), 'wishlist leaked across users!')
    })

    test('cart DELETE removes only matching item', async () => {
      const a = { title: 'QA Keep', seller: 'S', sellerEmail: U.buyer.email }
      const b = { title: 'QA Remove', seller: 'S', sellerEmail: U.buyer.email }
      await api('/cart', { method: 'POST', body: { item: a }, token: U.buyer.token })
      await api('/cart', { method: 'POST', body: { item: b }, token: U.buyer.token })
      await api('/cart', { method: 'DELETE', body: { title: b.title, seller: b.seller }, token: U.buyer.token })
      const cart = await api('/cart', { token: U.buyer.token })
      assert.ok(cart.data.some((c) => c.title === a.title))
      assert.ok(!cart.data.some((c) => c.title === b.title))
    })
  })

  describe('Listings CRUD + ownership', () => {
    test('owner can create a listing and it appears in /mine', async () => {
      const r = await api('/listings', {
        method: 'POST',
        token: U.sellerA.token,
        body: { title: 'QA CRUD Book', sellerName: 'QA SellerA', category: 'Novel', location: 'delhi', lat: 28.6, lng: 77.2, price: 150, listingType: 'single', images: ['x'] },
      })
      assert.equal(r.status, 201)
      assert.equal(r.data.sellerEmail, U.sellerA.email.toLowerCase())
      const mine = await api('/listings/mine', { token: U.sellerA.token })
      assert.ok(mine.data.some((l) => l.id === r.data.id))
    })

    test('non-owner cannot patch another users listing', async () => {
      const r = await api('/listings', {
        method: 'POST', token: U.sellerB.token,
        body: { title: 'QA Protected Book', sellerName: 'B', location: 'delhi', price: 100 },
      })
      assert.equal(r.status, 201)
      const patch = await api(`/listings/${r.data.id}`, { method: 'PATCH', token: U.sellerA.token, body: { price: 999 } })
      assert.equal(patch.status, 403)
    })

    test('owner can patch own listing', async () => {
      const r = await api('/listings', {
        method: 'POST', token: U.sellerB.token,
        body: { title: 'QA Patch Book', sellerName: 'B', location: 'delhi', price: 100 },
      })
      const patch = await api(`/listings/${r.data.id}`, { method: 'PATCH', token: U.sellerB.token, body: { price: 555, title: 'QA Patched' } })
      assert.equal(patch.status, 200)
      assert.equal(patch.data.price, 555)
      assert.equal(patch.data.title, 'QA Patched')
    })

    test('non-owner cannot delete others listing; owner can', async () => {
      const r = await api('/listings', {
        method: 'POST', token: U.sellerA.token,
        body: { title: 'QA Del Book', sellerName: 'A', location: 'delhi', price: 50 },
      })
      const denied = await api(`/listings/${r.data.id}`, { method: 'DELETE', token: U.sellerB.token })
      assert.equal(denied.status, 403)
      const ok = await api(`/listings/${r.data.id}`, { method: 'DELETE', token: U.sellerA.token })
      assert.equal(ok.status, 200)
    })

    test('featured toggle is admin-only', async () => {
      const r = await api('/listings', {
        method: 'POST', token: U.sellerA.token,
        body: { title: 'QA Feature Book', sellerName: 'A', location: 'delhi', price: 10 },
      })
      const denied = await api(`/listings/${r.data.id}/featured`, { method: 'PATCH', token: U.sellerA.token, body: { days: 7 } })
      assert.equal(denied.status, 403)
      const ok = await api(`/listings/${r.data.id}/featured`, { method: 'PATCH', token: U.admin.token, body: { days: 7 } })
      assert.equal(ok.status, 200)
      assert.equal(ok.data.featured, true)
    })

    test('optional auth: malicious signature is not fatal (attachUser tolerates)', async () => {
      const r = await api('/listings?limit=2', { token: 'bad.token.here' })
      assert.equal(r.status, 200) // listings is public; bad token must not crash
    })
  })

  describe('Nearest-first sorting (OLX-style)', () => {
    test('nearby listing ranks before far listing for a Delhi user', async () => {
      // User at Delhi coords -> QA Book Near User (delhi) should come first.
      const delhiLat = 28.6139, delhiLng = 77.209
      const r = await api(`/listings?lat=${delhiLat}&lng=${delhiLng}&limit=50`)
      const titles = r.data.listings.filter((l) => /^QA Book/.test(l.title)).map((l) => l.title)
      const iNear = titles.indexOf('QA Book Near User')
      const iFar = titles.indexOf('QA Book Far Away')
      assert.ok(iNear !== -1 && iFar !== -1, `both QA books present: ${titles.join(', ')}`)
      assert.ok(iNear < iFar, `near should come first, got ${titles.join(', ')}`)
    })

    test('for a Mumbai user the Delhi book appears closer/first when sorted', async () => {
      const mumbaiLat = 19.076, mumbaiLng = 72.8777
      const r = await api(`/listings?lat=${mumbaiLat}&lng=${mumbaiLng}&limit=50`)
      const withDist = r.data.listings.filter((l) => /^QA Book/.test(l.title))
      assert.ok(withDist.length === 2)
      for (const l of withDist) assert.ok(typeof l.distance === 'number', 'distance present')
      assert.ok(withDist[0].distance <= withDist[1].distance)
    })

    test('without coords, distances are null and no crash', async () => {
      const r = await api('/listings?limit=50')
      const qa = r.data.listings.filter((l) => /^QA Book/.test(l.title))
      if (qa.length) assert.ok(qa.every((l) => l.distance === null))
      assert.equal(r.status, 200)
    })
  })

  describe('Notifications', () => {
    test('user notifications API is public for anonymous (attachUser) but filters targeted ones', async () => {
      // GET /notifications uses attachUser (optional auth): anon can read public notes.
      const anon = await api('/notifications')
      assert.equal(anon.status, 200)
      assert.ok(Array.isArray(anon.data))
      // Anonymous viewer must never see notifications targeted at a specific user.
      const targeted = anon.data.filter((n) => n.to)
      assert.equal(targeted.length, 0, 'anon must not see user-targeted notifications')
      const authed = await api('/notifications', { token: U.buyer.token })
      assert.equal(authed.status, 200)
      assert.ok(Array.isArray(authed.data))
    })

    test('non-admin cannot create notification targeting someone else', async () => {
      const r = await api('/notifications', {
        method: 'POST',
        token: U.buyer.token,
        body: { title: 'QA Nope', to: U.sellerA.email },
      })
      assert.equal(r.status, 403)
    })

    test('admin can create a public notification', async () => {
      const r = await api('/notifications', {
        method: 'POST', token: U.admin.token,
        body: { title: 'QA Admin Public', body: 'hello', kind: 'info' },
      })
      assert.equal(r.status, 201)
    })

    test('targeted notification with MIXED-CASE recipient should still reach them (case-sensitivity)', async () => {
      // Admin passes the recipient email with capital letters (as typed by user).
      // The notification GET filter uses exact-match on the lowercased JWT email,
      // so a mixed-case `to` would be missed. This documents the behavior.
      const title = `QA CaseSensitive ${Date.now()}`
      const mixed = U.sellerA.email // e.g. ...sellerA@test.booksetu
      await api('/notifications', { method: 'POST', token: U.admin.token, body: { title, to: mixed, body: 'case' } })
      const a = await api('/notifications', { token: U.sellerA.token })
      assert.ok(
        a.data.some((n) => n.title === title),
        'POTENTIAL BUG: mixed-case targeted notification not delivered to recipient (email match is case-sensitive)',
      )
    })

    test('targeted notification visible only to recipient', async () => {
      const title = `QA Private for A ${Date.now()}`
      // Emails are lowercased by the schema; target the normalized form.
      const targetA = U.sellerA.email.toLowerCase()
      await api('/notifications', { method: 'POST', token: U.admin.token, body: { title, to: targetA, body: 'only A' } })
      const a = await api('/notifications', { token: U.sellerA.token })
      assert.ok(a.data.some((n) => n.title === title), 'recipient sees targeted notification')
      const b = await api('/notifications', { token: U.sellerB.token })
      assert.ok(!b.data.some((n) => n.title === title), 'other user must NOT see targeted notification')
    })
  })

  describe('Users (admin)', () => {
    test('non-admin forbidden from /users', async () => {
      const r = await api('/users', { token: U.buyer.token })
      assert.equal(r.status, 403)
    })
    test('admin can list users', async () => {
      const r = await api('/users', { token: U.admin.token })
      assert.equal(r.status, 200)
      assert.ok(Array.isArray(r.data.users))
    })
  })

  describe('Chat privacy', () => {
    test('message requires auth', async () => {
      const r = await api('/chat/messages', { method: 'POST', body: { conversationId: 'x', from: 'buyer' } })
      assert.equal(r.status, 401)
    })
    test('reading messages in a conversation you are not in is forbidden', async () => {
      const r = await api('/chat/messages?conversationId=qa-secret-conv-nobody', { token: U.sellerB.token })
      assert.equal(r.status, 403)
    })
    test('offer without valid price rejected', async () => {
      const r = await api('/chat/messages', {
        method: 'POST',
        token: U.buyer.token,
        body: { conversationId: 'qa-conv-A', bookTitle: 'T', seller: 'S', sellerEmail: U.sellerA.email, from: 'buyer', type: 'offer', price: 0 },
      })
      assert.equal(r.status, 400)
    })
    test('buyer sends text to seller and both see the conversation', async () => {
      const conv = 'qa-flow-conv-1'
      await api('/chat/messages', {
        method: 'POST',
        token: U.buyer.token,
        body: { conversationId: conv, bookTitle: 'QA Chat Book', seller: 'QA SellerA', sellerEmail: U.sellerA.email, from: 'buyer', type: 'text', text: 'hi' },
      })
      const buyerConvs = await api('/chat/conversations', { token: U.buyer.token })
      const sellerConvs = await api('/chat/conversations', { token: U.sellerA.token })
      assert.ok(buyerConvs.data.some((c) => c.conversationId === conv))
      assert.ok(sellerConvs.data.some((c) => c.conversationId === conv))
      const msgs = await api(`/chat/messages?conversationId=${conv}`, { token: U.sellerA.token })
      assert.equal(msgs.status, 200)
      assert.ok(msgs.data.some((m) => m.from === 'buyer'))
    })
    test('third party cannot read the conversation', async () => {
      const conv = 'qa-flow-conv-1'
      const r = await api(`/chat/messages?conversationId=${conv}`, { token: U.sellerB.token })
      assert.equal(r.status, 403)
    })

    test('buyer offer creates a targeted notification for the seller', async () => {
      const conv = `qa-offer-${Date.now()}`
      const offer = await api('/chat/messages', {
        method: 'POST', token: U.buyer.token,
        body: { conversationId: conv, bookTitle: 'QA Offer Book', seller: 'QA SellerA', sellerEmail: U.sellerA.email, from: 'buyer', type: 'offer', price: 1200 },
      })
      assert.equal(offer.status, 201)
      assert.equal(offer.data.type, 'offer')
      // The seller should receive a 'Price Offer' notification targeted at them.
      const notifs = await api('/notifications', { token: U.sellerA.token })
      assert.ok(
        notifs.data.some((n) => n.kind === 'offer' && /Price Offer/i.test(n.title)),
        'seller should receive an offer notification',
      )
      // A third party must not see that targeted offer notification.
      const other = await api('/notifications', { token: U.sellerB.token })
      assert.ok(!other.data.some((n) => n.kind === 'offer' && /Price Offer/i.test(n.title)))
    })
  })

  describe('Push subscriptions', () => {
    test('vapid public key endpoint is public', async () => {
      const r = await api('/push/vapid-public-key')
      assert.equal(r.status, 200)
      assert.ok(typeof r.data.publicKey === 'string')
    })
    test('subscribe requires auth', async () => {
      const r = await api('/push/subscribe', { method: 'POST', body: { subscription: { endpoint: 'https://x/push', keys: {} } } })
      assert.equal(r.status, 401)
    })
    test('subscribe with auth stores subscription', async () => {
      const r = await api('/push/subscribe', {
        method: 'POST', token: U.buyer.token,
        body: { subscription: { endpoint: `https://fcm/${Date.now()}/push`, keys: { p256dh: 'YQ==', auth: 'YQ==' } } },
      })
      assert.equal(r.status, 200)
      assert.equal(r.data.ok, true)
    })
  })
})
