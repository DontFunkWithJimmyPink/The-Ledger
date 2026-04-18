import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from './EditorToolbar';
import type { Editor } from '@tiptap/react';

// Define chain mock type
interface ChainMock {
  focus: jest.Mock;
  toggleBold: jest.Mock;
  toggleItalic: jest.Mock;
  toggleHeading: jest.Mock;
  toggleBulletList: jest.Mock;
  toggleTaskList: jest.Mock;
  run: jest.Mock;
}

// Define mock editor type
interface MockEditor extends Editor {
  _chainMock: ChainMock;
}

describe('EditorToolbar', () => {
  // Mock editor instance
  const createMockEditor = (
    activeStates: Record<string, boolean> = {}
  ): MockEditor => {
    const chainMock: ChainMock = {
      focus: jest.fn().mockReturnThis(),
      toggleBold: jest.fn().mockReturnThis(),
      toggleItalic: jest.fn().mockReturnThis(),
      toggleHeading: jest.fn().mockReturnThis(),
      toggleBulletList: jest.fn().mockReturnThis(),
      toggleTaskList: jest.fn().mockReturnThis(),
      run: jest.fn(),
    };

    return {
      chain: jest.fn(() => chainMock),
      isActive: jest.fn((type: string, attrs?: { level?: number }) => {
        if (attrs?.level) {
          return activeStates[`${type}-${attrs.level}`] || false;
        }
        return activeStates[type] || false;
      }),
      _chainMock: chainMock,
    } as unknown as MockEditor;
  };

  it('should render all toolbar buttons', () => {
    const editor = createMockEditor();
    render(<EditorToolbar editor={editor} />);

    expect(screen.getByLabelText('Toggle bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle heading 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle heading 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle task list')).toBeInTheDocument();
  });

  it('should return null when editor is null', () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call toggleBold when Bold button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const boldButton = screen.getByLabelText('Toggle bold');
    await user.click(boldButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleBold).toHaveBeenCalled();
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should call toggleItalic when Italic button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const italicButton = screen.getByLabelText('Toggle italic');
    await user.click(italicButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleItalic).toHaveBeenCalled();
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should call toggleHeading with level 1 when H1 button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const h1Button = screen.getByLabelText('Toggle heading 1');
    await user.click(h1Button);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleHeading).toHaveBeenCalledWith({
      level: 1,
    });
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should call toggleHeading with level 2 when H2 button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const h2Button = screen.getByLabelText('Toggle heading 2');
    await user.click(h2Button);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleHeading).toHaveBeenCalledWith({
      level: 2,
    });
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should call toggleBulletList when Bullet List button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const bulletListButton = screen.getByLabelText('Toggle bullet list');
    await user.click(bulletListButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleBulletList).toHaveBeenCalled();
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should call toggleTaskList when Task List button is clicked', async () => {
    const editor = createMockEditor();
    const user = userEvent.setup();
    render(<EditorToolbar editor={editor} />);

    const taskListButton = screen.getByLabelText('Toggle task list');
    await user.click(taskListButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainMock.focus).toHaveBeenCalled();
    expect(editor._chainMock.toggleTaskList).toHaveBeenCalled();
    expect(editor._chainMock.run).toHaveBeenCalled();
  });

  it('should highlight Bold button when bold is active', () => {
    const editor = createMockEditor({ bold: true });
    render(<EditorToolbar editor={editor} />);

    const boldButton = screen.getByLabelText('Toggle bold');
    expect(boldButton).toHaveClass('bg-cream-200');
  });

  it('should highlight Italic button when italic is active', () => {
    const editor = createMockEditor({ italic: true });
    render(<EditorToolbar editor={editor} />);

    const italicButton = screen.getByLabelText('Toggle italic');
    expect(italicButton).toHaveClass('bg-cream-200');
  });

  it('should highlight H1 button when heading level 1 is active', () => {
    const editor = createMockEditor({ 'heading-1': true });
    render(<EditorToolbar editor={editor} />);

    const h1Button = screen.getByLabelText('Toggle heading 1');
    expect(h1Button).toHaveClass('bg-cream-200');
  });

  it('should highlight H2 button when heading level 2 is active', () => {
    const editor = createMockEditor({ 'heading-2': true });
    render(<EditorToolbar editor={editor} />);

    const h2Button = screen.getByLabelText('Toggle heading 2');
    expect(h2Button).toHaveClass('bg-cream-200');
  });

  it('should highlight Bullet List button when bulletList is active', () => {
    const editor = createMockEditor({ bulletList: true });
    render(<EditorToolbar editor={editor} />);

    const bulletListButton = screen.getByLabelText('Toggle bullet list');
    expect(bulletListButton).toHaveClass('bg-cream-200');
  });

  it('should highlight Task List button when taskList is active', () => {
    const editor = createMockEditor({ taskList: true });
    render(<EditorToolbar editor={editor} />);

    const taskListButton = screen.getByLabelText('Toggle task list');
    expect(taskListButton).toHaveClass('bg-cream-200');
  });

  it('should not highlight buttons when nothing is active', () => {
    const editor = createMockEditor({});
    render(<EditorToolbar editor={editor} />);

    const boldButton = screen.getByLabelText('Toggle bold');
    const italicButton = screen.getByLabelText('Toggle italic');
    const h1Button = screen.getByLabelText('Toggle heading 1');

    expect(boldButton).not.toHaveClass('bg-cream-200');
    expect(italicButton).not.toHaveClass('bg-cream-200');
    expect(h1Button).not.toHaveClass('bg-cream-200');
  });
});