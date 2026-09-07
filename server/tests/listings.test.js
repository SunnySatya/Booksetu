import { test, describe } from 'node:test'
import assert from 'node:assert'
import { api, freshEmail } from './helpers.js'

describe('Listings', () => {
  test('public list loads', async () => {
    const r = await api('/listings?limit=5')
    assert.equal(r.status, 200)
    assert.ok(Array.isArray(r.data.listings))
    assert.equal(typeof r.data.total, 'number')
  })

  test('light=1 returns photoCount/thumb and no heavy image arrays', async () => {
    const r = await api('/listings?light=1&limit=5')
    assert.equal(r.status, 200)
    for (const l of r.data.listings) {
      assert.ok('photoCount' in l)
      assert.ok('thumb' in l)
    }
  })

  test('limit and skip are clamped', async () => {
    const big = await api('/listings?limit=99999')
    assert.equal(big.status, 200)
    assert.ok(big.data.listings.length <= 200)
    const neg = await api('/listings?skip=-50')
    assert.equal(neg.status, 200)
  })

  test('detail by id returns 404 for random id', async () => {
    const r = await api('/listings/64f0a1b2c3d4e5f6a7b8c9d0')
    assert.equal(r.status, 404)
  })

  test('create requires auth', async () => {
    const r = await api('/listings', { method: 'POST', body: { title: 'QA Book' } })
    assert.equal(r.status, 401)
  })

  test('unknown api route returns 404', async () => {
    const r = await api('/does-not-exist')
    assert.equal(r.status, 404)
  })
})
