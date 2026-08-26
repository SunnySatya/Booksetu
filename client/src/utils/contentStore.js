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

export const getCustomQuotes = async () => {
  const data = mapContent(await api.get('/content'))
  return data.quotes
}

export const saveQuotes = async (arr) => {
  await api.put('/content', { quotes: arr || [] })
  dispatchUpdate()
}
