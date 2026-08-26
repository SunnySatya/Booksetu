import { api } from '../api'

export const getUsers = async () => {
  const data = await api.get('/users')
  return Array.isArray(data) ? data : (data.users || [])
}

export const deleteUserByEmailOrId = async (idOrEmail) => {
  await api.del(`/users/${idOrEmail}`)
}

export const setAdminByUser = async (id, isAdmin) => {
  return api.patch(`/users/${id}/admin`, { isAdmin })
}
