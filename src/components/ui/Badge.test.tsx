import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render with default leather color', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-leather-300');
  });

  it('should render with cream color', () => {
    render(<Badge color="cream">Cream</Badge>);
    const badge = screen.getByText('Cream');
    expect(badge).toHaveClass('bg-cream-200');
  });

  it('should render with ink color', () => {
    render(<Badge color="ink">Ink</Badge>);
    const badge = screen.getByText('Ink');
    expect(badge).toHaveClass('bg-ink-900');
    expect(badge).toHaveClass('text-cream-50');
  });

  it('should render with red color', () => {
    render(<Badge color="red">Red</Badge>);
    const badge = screen.getByText('Red');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('should render with green color', () => {
    render(<Badge color="green">Green</Badge>);
    const badge = screen.getByText('Green');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('should render with blue color', () => {
    render(<Badge color="blue">Blue</Badge>);
    const badge = screen.getByText('Blue');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });

  it('should render with amber color', () => {
    render(<Badge color="amber">Amber</Badge>);
    const badge = screen.getByText('Amber');
    expect(badge).toHaveClass('bg-amber-100');
    expect(badge).toHaveClass('text-amber-800');
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-badge');
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Complex</span> <strong>Badge</strong>
      </Badge>
    );
    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
  });
});
