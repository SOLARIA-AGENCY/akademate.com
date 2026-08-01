import { cn } from '../lib/cn'

export type PillTone = 'primary' | 'secondary' | 'accent' | 'muted'
const tones: Record<PillTone, string> = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
}

export type PillProps = { label: string; tone?: PillTone; className?: string }

export function Pill({ className, label, tone = 'primary' }: PillProps) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)}>{label}</span>
}
