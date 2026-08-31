import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export type ListingKpiItem = {
  label: string
  value: string | number
}

export function ListingKpiStrip({ items }: { items: ListingKpiItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-slot="listing-kpi-strip">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-normal text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
