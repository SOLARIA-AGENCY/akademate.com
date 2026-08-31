import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'

export function AssignEmptyButton({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="h-7 border-amber-200 bg-amber-50 px-2 text-xs text-amber-800 hover:bg-amber-100 hover:text-amber-900"
      onClick={(event) => event.stopPropagation()}
    >
      <Link href={href}>{label}</Link>
    </Button>
  )
}
