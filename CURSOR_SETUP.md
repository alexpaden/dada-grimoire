# Cursor Markdown Preview Setup

This repo includes a safe, workspace-local Cursor/VS Code setup in `.vscode/`.
Students can copy that folder into another project without changing global editor
settings.

## What This Does

- Recommends Cursor's built-in Markdown preview support:
  `vscode.markdown-language-features`.
- Recommends Cursor's built-in Markdown math support:
  `vscode.markdown-math`.
- Enables Markdown validation and preview/editor scroll sync for this workspace.
- Keeps personal editor files ignored by git.

## What This Does Not Do

- It does not install third-party Markdown preview extensions.
- It does not change global Cursor settings.
- It does not bypass Cursor workspace trust or enable unsafe preview behavior.

## If Preview Still Fails

If Cursor shows `command 'markdown.showPreview' not found`, the built-in Markdown
extension is disabled in that Cursor profile.

1. Open Extensions with `Cmd+Shift+X`.
2. Search for `@builtin markdown`.
3. Enable **Markdown Language Features**.
4. Run **Developer: Reload Window**.
5. Open a `.md` file and press `Cmd+Shift+V` for preview, or `Cmd+K V` for
   preview to the side.

## Copy To Another Project

Copy only this folder:

```text
.vscode/
  extensions.json
  settings.json
```

Do not copy `.env`, `ADMIN/`, local logs, or other machine-specific files.
