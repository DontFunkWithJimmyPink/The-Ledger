import { render, screen } from '@testing-library/react';
import { SkeletonCanvas } from './SkeletonCanvas';

describe('SkeletonCanvas', () => {
  it('should render skeleton canvas', () => {
    render(<SkeletonCanvas />);

    const skeleton = screen.getByLabelText('Loading drawing canvas');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have pulse animation class', () => {
    render(<SkeletonCanvas />);

    const skeleton = screen.getByLabelText('Loading drawing canvas');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should have correct styling', () => {
    render(<SkeletonCanvas />);

    const skeleton = screen.getByLabelText('Loading drawing canvas');
    expect(skeleton).toHaveClass('w-full');
    expect(skeleton).toHaveClass('h-[500px]');
    expect(skeleton).toHaveClass('bg-cream-100');
    expect(skeleton).toHaveClass('rounded-lg');
    expect(skeleton).toHaveClass('border');
    expect(skeleton).toHaveClass('border-leather-300');
  });

  it('should have role="status" for accessibility', () => {
    render(<SkeletonCanvas />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have screen reader text', () => {
    render(<SkeletonCanvas />);

    const srText = screen.getByText('Loading drawing canvas...');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });
});
