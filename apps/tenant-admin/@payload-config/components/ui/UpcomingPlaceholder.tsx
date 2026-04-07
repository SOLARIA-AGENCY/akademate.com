'use client'

import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'
import { Card, CardContent } from './card'

interface UpcomingPlaceholderProps {
  title: string
  description: string
  icon?: LucideIcon
  features?: string[]
}

export function UpcomingPlaceholder({ title, description, icon: Icon = Construction, features }: UpcomingPlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full border-dashed border-2">
        <CardContent className="p-10 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-8 w-8 text-muted-foreground/50" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground/80 italic">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/20 px-4 py-2">
            <Construction className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Proximamente</span>
          </div>

          {features && features.length > 0 && (
            <div className="text-left space-y-2 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionalidades previstas</p>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
