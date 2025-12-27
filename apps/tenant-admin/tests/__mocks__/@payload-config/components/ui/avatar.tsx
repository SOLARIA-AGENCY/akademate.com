import React from 'react'

export const Avatar = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={className} data-testid="avatar">
    {children}
  </span>
)

export const AvatarImage = ({ src, alt, className }: { src?: string; alt?: string; className?: string }) => (
  <img src={src} alt={alt} className={className} data-testid="avatar-image" />
)

export const AvatarFallback = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={className} data-testid="avatar-fallback">
    {children}
  </span>
)
