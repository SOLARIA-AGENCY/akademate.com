import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MediaGallery, type MediaItem } from '../../../app/(dashboard)/contenido/medios/components/MediaGallery'

const mockItems: MediaItem[] = [
  {
    id: '1',
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    filesize: 1048576, // 1 MB exactly
    width: 1920,
    height: 1080,
    alt: 'Test image',
    url: 'https://example.com/test.jpg',
    thumbnailURL: 'https://example.com/test-thumb.jpg',
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
  },
  {
    id: '2',
    filename: 'test-image-2.png',
    mimeType: 'image/png',
    filesize: 2097152, // 2 MB exactly
    width: 800,
    height: 600,
    alt: 'Second test image',
    url: 'https://example.com/test2.png',
    thumbnailURL: 'https://example.com/test2-thumb.png',
    createdAt: '2024-12-21T10:00:00Z',
    updatedAt: '2024-12-21T10:00:00Z',
  },
]

describe('MediaGallery', () => {
  it('renders empty state when no items provided', () => {
    render(<MediaGallery items={[]} />)
    expect(screen.getByText('No hay archivos')).toBeInTheDocument()
    expect(screen.getByText('Sube tu primera imagen para empezar')).toBeInTheDocument()
  })

  it('renders skeleton loaders when loading', () => {
    const { container } = render(<MediaGallery items={[]} loading={true} />)
    const skeletons = container.querySelectorAll('[data-id="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders items in grid view by default', () => {
    render(<MediaGallery items={mockItems} />)
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('test-image-2.png')).toBeInTheDocument()
  })

  it('toggles between grid and list view', () => {
    const { container } = render(<MediaGallery items={mockItems} />)

    // Find list view button
    const buttons = container.querySelectorAll('button')
    const listButton = Array.from(buttons).find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-list')
    )

    expect(listButton).toBeTruthy()
    fireEvent.click(listButton!)

    // In list view, alt text should be visible
    expect(screen.getByText('Test image')).toBeInTheDocument()
  })

  it('displays file information correctly', () => {
    render(<MediaGallery items={mockItems} />)
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('1.0 MB')).toBeInTheDocument()
    expect(screen.getByText('1920×1080')).toBeInTheDocument()
  })

  it('displays file type badge', () => {
    render(<MediaGallery items={mockItems} />)
    expect(screen.getByText('JPG')).toBeInTheDocument()
    expect(screen.getByText('PNG')).toBeInTheDocument()
  })

  it('calls onItemClick when item is clicked', () => {
    const handleClick = vi.fn()
    render(<MediaGallery items={mockItems} onItemClick={handleClick} />)

    const firstItem = screen.getByText('test-image.jpg').closest('div')?.parentElement
    expect(firstItem).toBeTruthy()
    fireEvent.click(firstItem!)

    expect(handleClick).toHaveBeenCalledWith(mockItems[0])
  })

  it('highlights selected item', () => {
    const { container } = render(
      <MediaGallery items={mockItems} selectedId="1" />
    )

    const selectedCard = container.querySelector('[class*="ring-2 ring-primary"]')
    expect(selectedCard).toBeTruthy()
  })

  it('renders images with lazy loading', () => {
    render(<MediaGallery items={mockItems} />)
    const images = screen.getAllByRole('img')
    images.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  it('uses thumbnail URL when available', () => {
    render(<MediaGallery items={mockItems} />)
    const firstImage = screen.getAllByRole('img')[0]
    expect(firstImage).toHaveAttribute('src', mockItems[0].thumbnailURL)
  })

  it('falls back to main URL when thumbnail not available', () => {
    const itemWithoutThumb = {
      ...mockItems[0],
      thumbnailURL: undefined,
    }
    render(<MediaGallery items={[itemWithoutThumb]} />)
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', itemWithoutThumb.url)
  })

  it('displays alt text correctly', () => {
    render(<MediaGallery items={mockItems} />)
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('alt', 'Test image')
    expect(images[1]).toHaveAttribute('alt', 'Second test image')
  })

  it('formats file sizes correctly', () => {
    const itemsWithDifferentSizes: MediaItem[] = [
      { ...mockItems[0], filesize: 512 }, // 512 B
      { ...mockItems[0], id: '2', filesize: 1024 * 500 }, // 500 KB
      { ...mockItems[0], id: '3', filesize: 1024 * 1024 * 5 }, // 5 MB
    ]

    render(<MediaGallery items={itemsWithDifferentSizes} />)
    expect(screen.getByText('512 B')).toBeInTheDocument()
    expect(screen.getByText('500 KB')).toBeInTheDocument()
    expect(screen.getByText('5.0 MB')).toBeInTheDocument()
  })

  it('truncates long filenames with title attribute', () => {
    const longFilename = 'this-is-a-very-long-filename-that-should-be-truncated-in-the-ui.jpg'
    const itemWithLongName = {
      ...mockItems[0],
      filename: longFilename,
    }

    render(<MediaGallery items={[itemWithLongName]} />)
    const filenameElement = screen.getByText(longFilename)
    expect(filenameElement).toHaveClass('truncate')
    expect(filenameElement).toHaveAttribute('title', longFilename)
  })
})
