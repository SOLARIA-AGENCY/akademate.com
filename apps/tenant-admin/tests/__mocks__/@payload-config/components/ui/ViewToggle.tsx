export function ViewToggle({
  view,
  onViewChange,
}: {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}) {
  return (
    <div>
      <button type="button" aria-pressed={view === 'grid'} onClick={() => onViewChange('grid')}>
        Grid
      </button>
      <button type="button" aria-pressed={view === 'list'} onClick={() => onViewChange('list')}>
        Lista
      </button>
    </div>
  )
}
