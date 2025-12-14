import React from 'react'

export type PillTone = 'primary' | 'secondary' | 'accent' | 'muted'

const toneClasses: Record<PillTone, string> = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  accent: 'bg-accent/15 text-accent',
  muted: 'bg-muted text-muted-foreground',
}

export type PillProps = {
  label: string
  tone?: PillTone
}

export const Pill: React.FC<PillProps> = ({ label, tone = 'primary' }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {label}
    </span>
  )
}

export const themeVariables = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  secondary: '--secondary',
  accent: '--accent',
  muted: '--muted',
  border: '--border',
  ring: '--ring',
}
