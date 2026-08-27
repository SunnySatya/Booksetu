import { api } from '../api'

export const CHAT_EVENT = 'bs_chat_update'

const dispatchUpdate = () =>
  window.dispatchEvent(new CustomEvent(CHAT_EVENT))

export const makeConvId = (book) =>
  encodeURIComponent(`${book.title}__${book.seller}`)

export const getMessages = async (convId) => {
  const data = await api.get(
    `/chat/messages?conversationId=${encodeURIComponent(convId)}`,
  )
  return data.map((m) => ({ ...m, id: m.id ?? m._id }))
}

export const sendMessage = async (convId, msg, meta = {}) => {
  const saved = await api.post('/chat/messages', {
    conversationId: convId,
    bookTitle: meta.bookTitle || '',
    seller: meta.seller || '',
    sellerEmail: meta.sellerEmail || '',
    ...msg,
  })
  dispatchUpdate()
  return { ...saved, id: saved.id ?? saved._id }
}

export const setOfferStatus = async (_convId, msgId, status) => {
  await api.patch(`/chat/messages/${msgId}/status`, { status })
  dispatchUpdate()
}

export const getAllConversations = async () => {
  const data = await api.get('/chat/conversations')
  return data.map((c) => ({ ...c, key: c.conversationId }))
}

export const deleteConversationByKey = async (convKey) => {
  await api.del(`/chat/conversation?key=${encodeURIComponent(convKey)}`)
  dispatchUpdate()
}

export const deleteAllConversations = async () => {
  await api.del('/chat/conversations/all')
  dispatchUpdate()
}
