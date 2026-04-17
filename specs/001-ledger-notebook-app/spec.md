# Feature Specification: The Ledger — Digital Notebook App

**Feature Branch**: `001-ledger-notebook-app`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "a web app that can be accessed from anywhere, can be hosted on aws and allows the user to add, sort tasks and notes and photos. The app is called The Ledger and acts as a cozy leather bound notebook in an app, where users can make to do lists, reminders, mark things as done, add photos and journal, draw out ideas and flows. Basically anything that can be done in a notebook can be done here."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1)

A user opens The Ledger and creates a new page for their to-do list. They add several tasks, reorder them by dragging or sorting, check off completed tasks, and return later to see their progress. Tasks that are marked done are visually distinguished from pending ones.

**Why this priority**: Task management is the most universally relied-upon notebook function and the core value proposition. Without it, The Ledger has no foundation.

**Independent Test**: A user can create a to-do list page, add tasks, check them off, and see completed items marked — all without any other feature present.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the home screen, **When** they create a new page and add three tasks, **Then** all three tasks appear in the list in the order they were added.
2. **Given** a task list with pending tasks, **When** the user checks a task, **Then** it is visually marked as complete and moved or distinguished from unchecked tasks.
3. **Given** a list of tasks, **When** the user reorders them, **Then** the new order is saved and persists on next visit.
4. **Given** a completed task, **When** the user unchecks it, **Then** it returns to a pending state.

---

### User Story 2 — Write Journal Entries and Notes (Priority: P2)

A user opens a blank page in The Ledger and writes a free-form journal entry or note. The text is automatically saved as they type. They can return to the entry later, read it, and continue writing or editing it.

**Why this priority**: Free-form writing is the second most common notebook use case and underpins the "cozy notebook" personality of the app.

**Independent Test**: A user can open a blank page, write multi-paragraph text, leave the app, return, and read their entry intact — without any task or photo features.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a new page and type text, **Then** the content is automatically saved within 2 seconds without any manual save action.
2. **Given** a saved journal entry, **When** the user navigates away and returns to the entry, **Then** the full content is displayed exactly as written.
3. **Given** an existing entry, **When** the user edits it, **Then** the updated content is saved and replaces the previous version.
4. **Given** multiple journal entries, **When** the user views their notebook, **Then** entries are listed with titles or creation dates and can be opened individually.

---

### User Story 3 — Set Reminders and Track Completion (Priority: P3)

A user adds a due date or reminder to a task or page. At the specified time, they receive an in-app notification. They can view all upcoming reminders in one place and mark items as done once completed.

**Why this priority**: Reminders elevate the notebook from a passive record to an active productivity tool, which is essential for to-do lists to be useful.

**Independent Test**: A user can attach a reminder to a task, receive a notification at the due time, and mark the task complete — independently of photo or drawing features.

**Acceptance Scenarios**:

1. **Given** a task, **When** the user sets a due date and time, **Then** an in-app notification appears at the scheduled time.
2. **Given** multiple tasks with due dates, **When** the user opens the reminders view, **Then** all upcoming items are listed in chronological order.
3. **Given** a task with a past-due reminder, **When** the user views the task list, **Then** the overdue item is visually highlighted.
4. **Given** a completed task with a reminder, **When** the user marks it as done, **Then** the reminder is automatically dismissed.

---

### User Story 4 — Attach and View Photos (Priority: P4)

A user adds a photo to a journal entry or task page — either by uploading from their device or capturing via camera on a mobile browser. The photo is displayed inline within the page. They can view, replace, or remove the photo.

**Why this priority**: Photo support brings visual richness to the notebook, enabling recipe collections, inspiration boards, progress tracking, and more.

**Independent Test**: A user can attach a photo to a page, view it inline, and delete it — independently of drawing or reminder features.

**Acceptance Scenarios**:

1. **Given** a page open for editing, **When** the user selects a photo from their device, **Then** the photo is uploaded and displayed inline within the page.
2. **Given** a page with an attached photo, **When** the user opens the page, **Then** the photo is visible within the entry.
3. **Given** a photo on a page, **When** the user taps or clicks the photo, **Then** it opens in a larger view.
4. **Given** a photo on a page, **When** the user removes it, **Then** the photo is deleted and no longer displayed.

---

### User Story 5 — Draw and Sketch Ideas (Priority: P5)

A user opens a drawing canvas within a page and sketches a diagram, flow chart, or freehand illustration using touch or mouse input. The drawing is saved as part of the page and can be viewed and edited later.

**Why this priority**: Drawing and sketching are core notebook activities that differentiate The Ledger from simple text apps and fulfil the "anything you can do in a notebook" promise.

**Independent Test**: A user can open a blank canvas, draw freehand strokes, save, return, and see their drawing intact — independently of other features.

**Acceptance Scenarios**:

1. **Given** a page in edit mode, **When** the user adds a drawing canvas and draws with a finger or mouse, **Then** strokes appear in real time on the canvas.
2. **Given** a saved drawing, **When** the user revisits the page, **Then** the drawing is displayed exactly as created.
3. **Given** a drawing canvas, **When** the user selects an eraser or undo, **Then** the corresponding strokes are removed.
4. **Given** a drawing canvas, **When** the user selects a color or line width, **Then** subsequent strokes use those settings.

---

### User Story 6 — Organise, Sort, and Search Content (Priority: P6)

A user has accumulated many pages in The Ledger. They can sort pages by date, title, or type, apply labels or sections, and use a search bar to find a specific entry by keyword.

**Why this priority**: Organisation becomes critical as the notebook grows. Without it, the app becomes hard to navigate and loses utility.

**Independent Test**: A user can sort their list of pages by date and search for a page by keyword and find it — independently of photo or drawing features.

**Acceptance Scenarios**:

1. **Given** a notebook with multiple pages, **When** the user sorts by date (newest first), **Then** pages are reordered accordingly.
2. **Given** a notebook with multiple pages, **When** the user types a keyword in the search bar, **Then** only pages containing that keyword are displayed.
3. **Given** pages with assigned labels/sections, **When** the user filters by a label, **Then** only pages with that label are shown.
4. **Given** an empty search result, **When** no pages match the query, **Then** a clear "no results" message is shown.

---

### User Story 7 — Access from Any Device (Priority: P7)

A user creates entries on their laptop, then opens The Ledger on their tablet or phone and sees all their content exactly as saved. The layout adapts to the screen size without loss of functionality.

**Why this priority**: Universal access is the core "hosted anywhere" requirement and ensures the app is useful in daily life across contexts.

**Independent Test**: A user logs in on two different devices or browsers and sees identical content on both.

**Acceptance Scenarios**:

1. **Given** content created on one device, **When** the user logs in on a different device or browser, **Then** all content is present and up to date.
2. **Given** a mobile browser, **When** the user opens The Ledger, **Then** the interface is fully usable with touch input and adapts to the smaller screen.
3. **Given** a user session on one device, **When** they make a change, **Then** the change is visible on their other logged-in device within 30 seconds.

---

### Edge Cases

- What happens when a user uploads a photo that exceeds the allowed file size limit?
- How does the system behave when a user loses internet connection mid-edit?
- What happens when two browser tabs have the same page open and both make edits?
- How does the drawing canvas behave on a device that does not support touch input?
- What happens when a reminder fires but the user's browser tab is closed?
- How does the app handle very long entries or pages with many embedded photos?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow authenticated users to create, read, update, and delete pages (notebook entries).
- **FR-002**: The system MUST allow users to add one or more tasks (checklist items) to any page.
- **FR-003**: Users MUST be able to mark individual tasks as complete or incomplete.
- **FR-004**: The system MUST allow users to reorder tasks and pages via drag-and-drop or sort controls.
- **FR-005**: The system MUST auto-save all text content within 2 seconds of the user pausing input, with no manual save required.
- **FR-006**: Users MUST be able to attach one or more photos to any page by uploading from their device.
- **FR-007**: The system MUST display attached photos inline within the page.
- **FR-008**: Users MUST be able to embed a freehand drawing canvas within any page and draw using a mouse or touch input.
- **FR-009**: The system MUST save drawing canvas content as part of the page.
- **FR-010**: Users MUST be able to set a due date and optional reminder time on any task or page.
- **FR-011**: The system MUST deliver in-app notifications for due reminders while the user has the app open in a browser tab.
- **FR-012**: Users MUST be able to sort their pages by creation date, last modified date, and title.
- **FR-013**: The system MUST provide a keyword search that filters pages by their text content.
- **FR-014**: Users MUST be able to assign labels or section names to pages for grouping and filtering.
- **FR-015**: The system MUST require user authentication before granting access to any personal content.
- **FR-016**: All user content MUST be stored per-account and must not be accessible by other users.
- **FR-017**: The application MUST be accessible via a standard web browser on desktop, tablet, and mobile devices without installing native software.
- **FR-018**: The application MUST be deployable to AWS cloud infrastructure to support global access.
- **FR-019**: Uploaded photos MUST be limited to a maximum file size (default assumption: 10 MB per file) with a clear error message if exceeded.

### Key Entities

- **User**: An authenticated account holder. Owns a personal notebook. Has credentials and profile information.
- **Notebook**: The top-level container belonging to a single user, containing all their pages.
- **Page**: An individual notebook entry. Can contain any combination of text, tasks, photos, and drawings. Has a title, creation date, last-modified date, and optional labels.
- **Task**: A checklist item within a page. Has text, a completion state (done/pending), and an optional due date/reminder.
- **Reminder**: A scheduled notification associated with a task or page. Has a date-time, a status (pending/dismissed), and a link back to its parent.
- **Photo**: An image file attached to a page. Stored in the cloud and referenced by URL within the page content.
- **Drawing**: A vector or raster canvas embedded in a page. Stores stroke data or a rendered image representing the user's sketch.
- **Label**: A user-defined tag applied to one or more pages for organisational grouping.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new user can sign up, create their first page, and save content in under 2 minutes from first opening the app.
- **SC-002**: All content changes are saved automatically within 2 seconds of the user pausing input — no manual save action required.
- **SC-003**: The app is fully usable on any modern device (desktop, tablet, phone) without installing software.
- **SC-004**: A user can find any previously created page by keyword in under 10 seconds.
- **SC-005**: The app loads and becomes interactive in under 3 seconds on a standard broadband connection.
- **SC-006**: Content created on one device is visible on another device within 30 seconds of saving.
- **SC-007**: 90% of first-time users can complete core tasks (create a page, add a task, mark it done) without needing help documentation.
- **SC-008**: In-app reminders fire within 60 seconds of the scheduled time while the app is open.
- **SC-009**: The app meets WCAG 2.1 AA accessibility standards for all core screens.
- **SC-010**: Photo upload completes within 5 seconds for files up to 10 MB on a standard broadband connection.

## Assumptions

- Each user has their own private, isolated notebook; content sharing or real-time collaboration between users is out of scope for v1.
- In-app browser notifications are the primary reminder delivery mechanism; email or push notification support is deferred to a future version.
- Offline editing (accessing or editing content without internet) is out of scope for v1; users require an active internet connection.
- The app targets modern evergreen browsers (Chrome, Firefox, Safari, Edge); Internet Explorer and legacy browsers are not supported.
- A single drawing canvas per page section is sufficient for v1; multi-layer or vector-path editing tools (e.g., shape libraries) are out of scope.
- Photo storage uses a cloud object storage service accessible globally; storage costs are outside the scope of this specification.
- The "cozy leather-bound notebook" aesthetic is a design/branding concern addressed in the design system, not in functional requirements.
- No third-party integrations (e.g., calendar sync, cloud storage import) are in scope for v1.
- User authentication uses a standard email-and-password flow with account recovery; social login (OAuth2 via Google, etc.) is a v2 consideration.
- The app will be hosted on AWS; the specific AWS services used are an implementation decision not specified here.
