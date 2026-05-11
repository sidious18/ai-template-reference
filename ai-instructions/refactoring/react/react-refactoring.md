# React Refactoring

## Extract Sub-components > 30 Lines to Named Files

**Problem:** Components grow as features are added. Inline sub-components defined in the
same file make the file unreadable and slow to edit. AI struggles with large files —
reading accuracy drops and edits become error-prone.

**Rule:** Any inline sub-component longer than **30 lines** must be extracted into a named
file in a subfolder adjacent to the parent.

### Before (violation — 46-line component defined inline)

```tsx
// DesignTokensForm.tsx — before (210 lines total)
function ColorTokenValue({ value, onChange }) {
  // 46 lines inline — violation
  const isEditing = useContext(EditingContext);
  const hex = extractHex(value);
  if (!isEditing) return <div>...view...</div>;
  return (
    <div>
      <input type="color" />
      <input type="text" />
    </div>
  );
}
```

### After (extracted to named file)

```tsx
// FormEditor/ColorTokenValue.tsx — new file
export function ColorTokenValue({ value, onChange }) {
  const isEditing = useContext(EditingContext);
  const hex = extractHex(value);
  if (!isEditing) return <div>...view...</div>;
  return <div><input type="color"/><input type="text"/></div>;
}

// DesignTokensForm.tsx — after (~160 lines)
import { ColorTokenValue } from './ColorTokenValue';
```

### Naming Convention

```
Parent:    features/FormEditor/DesignTokensForm.tsx
Extracted: features/FormEditor/DesignTokensForm/ColorTokenValue.tsx
  — or —
Extracted: features/FormEditor/ColorTokenValue.tsx  (if reused within the feature)
```

---

## No JSX Ternary Component-Selectors in Render Body

**Problem:** Patterns like `{isEditing ? <EditPanel /> : <ViewPanel />}` directly in JSX
make it impossible to know what will render without reading the entire return statement.
Chained ternaries compound this.

**Rule:** Component-selecting conditions must be resolved **before the `return`** — either
as an early return (for full component switches) or as a named `const` (for simple swaps).

### Before (violation — chained ternaries in JSX body)

```tsx
return (
  <aside>
    {isSidebarCollapsed ? (
      <div><Button><ChevronRight /></Button></div>
    ) : (
      <>
        <div>...header...</div>
        <div>
          {!activeDocument ? (
            <div>No document loaded</div>
          ) : treeData.length === 0 ? (
            <div>Building tree...</div>
          ) : (
            <div role="tree">{filteredTree.map(...)}</div>
          )}
        </div>
      </>
    )}
  </aside>
);
```

### After — option A: early return (for full component switch)

```tsx
if (isSidebarCollapsed) {
  return (
    <aside>
      <Button><ChevronRight /></Button>
    </aside>
  );
}

return (
  <aside>
    <div>...header...</div>
    <SidebarTreeContent
      hasDocument={!!activeDocument}
      treeData={treeData}
      filteredTree={filteredTree}
    />
  </aside>
);

// SidebarTreeContent.tsx — each state has an early return
if (!hasDocument) return <div>No document loaded</div>;
if (treeData.length === 0) return <div>Building tree...</div>;
if (filteredTree.length === 0) return <div>No results</div>;
return <div role="tree">{filteredTree.map(...)}</div>;
```

### After — option B: `const` before `return` (for simple inline swap)

```tsx
const valueField = token.category === 'color'
  ? <ColorTokenValue value={token.value} ... />
  : <Input ... />;
return <div key={index}>{valueField}</div>;
```

---

## Controller Hook Extraction

**Problem:** Page/widget components accumulate inline handlers with branching logic.
Components with 8+ inline `async` handlers are untestable and unmaintainable.
The handlers embed business logic directly in the render component.

**Rule:** When a component has **more than 3 handlers**, or **any handler with branching
logic**, extract all handlers to a dedicated `use[ComponentName]Controller` hook.

### Before (violation — 8 inline async handlers with branching)

```tsx
// EditorPage.tsx — before (155 lines)
useGlobalKeyboardShortcuts({
  onOpen: async () => {
    const result = await openFileDialog();
    if (result.success) success('...');
    else if (result.error && result.error !== 'File selection cancelled')
      error(result.error);
  },
  onSave: async () => {
    if (!activeDocument) { error('No active document'); return; }
    const result = await saveFile();
    if (result.success) success('Saved');
    else error(result.error ?? 'Save failed');
  },
  // ...5 more inline handlers
});
```

### After (controller hook)

```tsx
// useEditorPageController.ts — new file (~110 lines)
export function useEditorPageController() {
  const [showNewModal, setShowNewModal] = useState(false);

  const handleOpen = async () => {
    const result = await openAny({ ... });
    if (result.success) success('...');
    else if (result.error !== 'File selection cancelled') error(result.error);
  };
  // all handlers with logic here...
  return { showNewModal, setShowNewModal, handleOpen, handleSave, handleCloseTab, ... };
}

// EditorPage.tsx — after (~80 lines)
const { handleOpen, handleSave, handleCloseTab, ... } = useEditorPageController();

useGlobalKeyboardShortcuts({
  onOpen: handleOpen,
  onSave: handleSave,
  onCloseTab: handleCloseTab,
});
```

### Benefits

- Controller hook is fully unit-testable without rendering
- Component becomes a pure layout descriptor
- Logic is readable without scanning JSX
- Handler names appear in stack traces

---

## Refactoring Checklist

- Inline sub-components over 30 lines were extracted
- Component-selecting ternaries were removed from the return body
- Branching handlers were moved to a controller hook
- Parent file is smaller and easier to scan
- Tests were updated where new files or hooks matter
