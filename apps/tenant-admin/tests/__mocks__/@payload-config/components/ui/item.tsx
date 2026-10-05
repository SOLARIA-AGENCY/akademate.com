import React from 'react'

function passthrough(
  slot: string,
  { children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
) {
  const { asChild: _asChild, ...rest } = props as React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
  return (
    <div data-slot={slot} className={className} {...rest}>
      {children}
    </div>
  )
}

export function Item(props: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean; variant?: string; size?: string }) {
  return passthrough('item', props)
}

export function ItemGroup(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-group', props)
}

export function ItemContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-content', props)
}

export function ItemTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-title', props)
}

export function ItemDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="item-description" {...props} />
}

export function ItemActions(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-actions', props)
}

export function ItemMedia(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-media', props)
}

export function ItemHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-header', props)
}

export function ItemFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return passthrough('item-footer', props)
}

export function ItemSeparator(props: React.HTMLAttributes<HTMLHRElement>) {
  return <hr data-slot="item-separator" {...props} />
}
