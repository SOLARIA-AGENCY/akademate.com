import { render, screen } from '@testing-library/react';
import { MockDataBanner } from '../mock-data-banner';

describe('MockDataBanner', () => {
  it('renders default message when no message prop provided', () => {
    render(<MockDataBanner />);
    expect(screen.getByText('Mock Data')).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<MockDataBanner message="Custom Warning" />);
    expect(screen.getByText('Custom Warning')).toBeInTheDocument();
    expect(screen.queryByText('Mock Data')).not.toBeInTheDocument();
  });

  it('renders warning icon', () => {
    render(<MockDataBanner />);
    // lucide-react AlertTriangle renders as SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies amber color styling', () => {
    render(<MockDataBanner />);
    const banner = screen.getByText('Mock Data').closest('div');
    expect(banner).toHaveClass('bg-amber-500/10', 'border-amber-500/30');
  });

  it('is compact with appropriate padding', () => {
    render(<MockDataBanner />);
    const banner = screen.getByText('Mock Data').closest('div');
    expect(banner).toHaveClass('px-3', 'py-1.5');
  });
});
