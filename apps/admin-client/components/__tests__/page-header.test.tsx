import { render, screen } from '@testing-library/react';
import { PageHeader } from '../page-header';

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('renders children (banner slot) when provided', () => {
    render(
      <PageHeader title="Title">
        <div data-testid="banner">Banner Content</div>
      </PageHeader>
    );
    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getByText('Banner Content')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<PageHeader title="Styled Title" description="Description" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-foreground');
  });
});
