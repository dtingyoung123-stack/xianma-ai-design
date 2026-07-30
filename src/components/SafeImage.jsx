"use client"

import { useState } from "react"

export default function SafeImage({ src, alt, className, style, ...props }) {
  const [error, setError] = useState(false)
  if (error) return null
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      {...props}
    />
  )
}
