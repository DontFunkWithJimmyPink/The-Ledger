import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoLightbox } from './PhotoLightbox';

describe('PhotoLightbox', () => {
  const mockOnClose = jest.fn();
  const mockSrc = 'https://example.com/photo.jpg';
  const mockAlt = 'Test photo description';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render image with correct src and alt', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockSrc);
    expect(image).toHaveAttribute('alt', mockAlt);
  });

  it('should render close button', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when image is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const image = screen.getByRole('img');
    await user.click(image);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    const { rerender } = render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Photo lightbox');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
    expect(document.body.style.overflow).toBe('unset');

    removeEventListenerSpy.mockRestore();
  });

  it('should not call onClose when Escape is pressed and lightbox is closed', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
