export type CollapsedNavChild = {
  title: string
  url?: string
  items?: CollapsedNavChild[]
}

export type CollapsedNavItem = {
  title: string
  url?: string
  items?: CollapsedNavChild[]
}

export function collapsedNavTooltip(item: CollapsedNavItem): string {
  const names: string[] = []
  for (const child of item.items ?? []) {
    if (child.items?.length) {
      for (const nested of child.items) names.push(nested.title)
    } else {
      names.push(child.title)
    }
  }
  return names.length ? `${item.title}: ${names.join(' · ')}` : item.title
}

export function firstNavUrl(item: CollapsedNavItem): string | undefined {
  if (item.url) return item.url
  for (const child of item.items ?? []) {
    if (child.url) return child.url
    const nested = child.items?.find((entry) => entry.url)
    if (nested?.url) return nested.url
  }
  return undefined
}
