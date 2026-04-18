# Task Components

Standalone sortable task list components built with @dnd-kit for drag-and-drop reordering.

## Components

### TaskList

A container component that provides drag-and-drop sorting for task items.

**Features:**
- Vertical list sorting with @dnd-kit
- Fractional indexing for persistent sort order
- Touch-enabled with 8px activation constraint
- Keyboard navigation support
- Optimistic updates with database sync

**Props:**
- `tasks: Task[]` - Array of task objects to display
- `pageId: string` - Page ID for database updates
- `onTasksReorder?: (tasks: Task[]) => void` - Optional callback when tasks are reordered
- `children: React.ReactNode` - TaskItem components or other content

**Example:**
```tsx
import { TaskList, TaskItem } from '@/components/tasks';

function MyTaskPage({ tasks, pageId }: { tasks: Task[]; pageId: string }) {
  return (
    <TaskList tasks={tasks} pageId={pageId}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </TaskList>
  );
}
```

### TaskItem

Individual task row with checkbox, drag handle, and due date display.

**Features:**
- Checkbox with optimistic updates
- Drag handle for reordering
- Visual distinction for completed tasks (strikethrough, muted color)
- Due date display with overdue warnings
- Automatic rollback on update failures

**Props:**
- `task: Task` - Task object to display
- `onTaskUpdate?: (task: Task) => void` - Optional callback when task is updated

**Example:**
```tsx
import { TaskItem } from '@/components/tasks';

function MyTaskItem({ task }: { task: Task }) {
  return (
    <TaskItem
      task={task}
      onTaskUpdate={(updatedTask) => {
        console.log('Task updated:', updatedTask);
      }}
    />
  );
}
```

## Database Integration

Both components interact with the Supabase `tasks` table:

- **TaskList**: Updates `sort_order` field on drag-and-drop
- **TaskItem**: Updates `checked` field on checkbox toggle

Updates are optimistic with automatic rollback on errors.

## Styling

Components use the project's design tokens:
- `bg-cream-50`, `bg-cream-100` - Background colors
- `text-ink-500`, `text-ink-900` - Text colors
- `text-red-600` - Overdue warning color
- `line-through` - Completed task styling

## Touch Support

The TaskList uses `PointerSensor` with an 8px activation constraint to:
- Prevent accidental drag activation
- Support both mouse and touch input
- Allow scrolling on mobile devices

## Testing

Both components have comprehensive test coverage:
- TaskList: 6 tests covering rendering, initialization, and DnD setup
- TaskItem: 14 tests covering checkbox, styling, due dates, and error handling

Run tests with:
```bash
npm test -- src/components/tasks
```

## Future Enhancements

These components support the following planned features:
- T032: Full autosave cycle with Tiptap integration
- T046: Overdue task visual highlighting (partially implemented)
- T047: Auto-dismiss reminders on task completion
- T070: Touch input verification for cross-device support
