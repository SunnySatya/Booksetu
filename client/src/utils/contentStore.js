import { api } from '../api'
import {
  DEFAULT_HERO_IMAGES,
} from './defaultHeroImages.js'

export { DEFAULT_HERO_IMAGES }

export const CONTENT_EVENT = 'bs_content_update'

const dispatchUpdate = () =>
  window.dispatchEvent(new CustomEvent(CONTENT_EVENT))

const mapContent = (d) => ({
  heroImages: Array.isArray(d?.heroImages) && d.heroImages.length ? d.heroImages : null,
  categoryImages: d?.categoryImages && typeof d.categoryImages === 'object' ? d.categoryImages : {},
  quotes: Array.isArray(d?.quotes) && d.quotes.length ? d.quotes : null,
})

export const getCustomHeroImages = async () => {
  const data = mapContent(await api.get('/content'))
  return data.heroImages
}

export const saveHeroImages = async (arr) => {
  await api.put('/content', { heroImages: arr || [] })
  dispatchUpdate()
}

export const getCategoryImages = async () => {
  const data = mapContent(await api.get('/content'))
  return data.categoryImages
}

export const saveCategoryImages = async (catName, arr) => {
  const current = await getCategoryImages()
  const next = { ...current }
  if (arr && arr.length > 0) {
    next[catName] = arr
  } else {
    delete next[catName]
  }
  await api.put('/content', { categoryImages: next })
  dispatchUpdate()
}

export const getCustomQuotes = async () => {
  const data = mapContent(await api.get('/content'))
  return data.quotes
}

export const saveQuotes = async (arr) => {
  await api.put('/content', { quotes: arr || [] })
  dispatchUpdate()
}
