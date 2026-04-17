import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('should render without label', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Username" />);
    const label = screen.getByText('Username');
    const input = screen.getByLabelText('Username');
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  it('should associate label with input using htmlFor', () => {
    render(<Input label="Email" id="email-input" />);
    const label = screen.getByText('Email');
    const input = screen.getByLabelText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('should auto-generate id from label if not provided', () => {
    render(<Input label="First Name" />);
    const input = screen.getByLabelText('First Name');
    expect(input).toHaveAttribute('id', 'first-name');
  });

  it('should display error message', () => {
    render(<Input label="Password" error="Password is required" />);
    const error = screen.getByText('Password is required');
    expect(error).toBeInTheDocument();
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('should apply error styles when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    await user.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Disabled field" disabled />);
    const input = screen.getByLabelText('Disabled field');
    expect(input).toBeDisabled();
  });

  it('should accept custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('should pass through additional HTML input attributes', () => {
    render(
      <Input
        type="email"
        placeholder="email@example.com"
        required
        maxLength={50}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'email@example.com');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('maxLength', '50');
  });
});
