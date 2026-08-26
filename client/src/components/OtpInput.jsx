import React, { useRef } from 'react'

const OtpInput = ({ value, onChange, length = 6, disabled = false }) => {
  const refs = useRef([])

  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const focusAt = (i) => {
    if (i >= 0 && i < length) refs.current[i]?.focus()
  }

  const commit = (next) => onChange(next.slice(0, length).replace(/\D/g, ''))

  const handleChange = (i, digit) => {
    const chars = digits.slice()
    chars[i] = digit.replace(/\D/g, '').slice(-1)
    commit(chars.join(''))
    if (digit) focusAt(i + 1)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        const chars = digits.slice()
        chars[i] = ''
        commit(chars.join(''))
      } else {
        focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      focusAt(i - 1)
    } else if (e.key === 'ArrowRight') {
      focusAt(i + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    commit(e.clipboardData.getData('text').replace(/\D/g, ''))
    focusAt(Math.min(length - 1, Math.max(value.length - 1, 0)))
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-11 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:bg-gray-50"
        />
      ))}
    </div>
  )
}

export default OtpInput
