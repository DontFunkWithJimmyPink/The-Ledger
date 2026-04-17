import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );
    // Click the backdrop (the outer div)
    const backdrop =
      screen.getByText('Modal content').parentElement?.parentElement
        ?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );
    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('should not propagate click events from modal content to backdrop', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <button>Content button</button>
      </Modal>
    );
    const contentButton = screen.getByText('Content button');
    await user.click(contentButton);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
