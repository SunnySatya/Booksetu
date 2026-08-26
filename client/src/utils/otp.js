import { api } from '../api'

export const sendOtp = async (email, purpose = 'registration') => {
  const res = await api.post('/otp/send', { email, purpose })
  return res
}

export const verifyOtp = async (email, code, purpose = 'registration') => {
  const res = await api.post('/otp/verify', { email, code, purpose })
  return res
}
