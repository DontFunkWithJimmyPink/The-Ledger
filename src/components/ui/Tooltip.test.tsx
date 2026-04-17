import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('should not show tooltip initially', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on mouse enter', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on focus', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Focus me</button>
      </Tooltip>
    );
    await user.tab(); // Focus the button
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('should hide tooltip on blur', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Focus me</button>
      </Tooltip>
    );
    await user.tab(); // Focus the button
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.tab(); // Tab away to blur
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should render with top position by default', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Hover me'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('bottom-full');
  });

  it('should render with bottom position', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text" position="bottom">
        <button>Hover me</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Hover me'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('top-full');
  });

  it('should render with left position', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text" position="left">
        <button>Hover me</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Hover me'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('right-full');
  });

  it('should render with right position', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text" position="right">
        <button>Hover me</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Hover me'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('left-full');
  });

  it('should render children correctly', () => {
    render(
      <Tooltip content="Tooltip text">
        <div>
          <span>Complex</span> <strong>Content</strong>
        </div>
      </Tooltip>
    );
    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
