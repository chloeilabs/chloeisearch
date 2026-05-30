# Open Agents UI reference

Chloei Code’s shell and inbox sidebar follow layout and styling patterns from [vercel-labs/open-agents](https://github.com/vercel-labs/open-agents) (`apps/web`).

## What we adopted

| Open Agents | Chloei Code |
|-------------|-------------|
| `SidebarProvider` + 20rem inbox | `AgentsAppChrome` + `w-80` sidebar, mobile drawer |
| `InboxSidebar` session rows | `SidebarRecentRuns` with repo groups + status icons |
| `bg-sidebar-active` selection | `--sidebar-active` tokens + active row styles |
| `bg-muted/20` sidebar surface | `AppSidebar` on `bg-muted/20` |
| Sessions index empty state | `AgentsHome` “Select an agent” |
| Top chrome header + `SidebarTrigger` | `AgentsAppChrome` header with `PanelLeft` on mobile |
| `h-dvh` app frame | `AppShell` uses `h-dvh overflow-hidden` |

## Recent additions

- Chrome breadcrumbs + `RunChromeToolbar` on run/new pages

- Archive agents (`archivedAt`, `PATCH { archived }`) — hidden from sidebar; `/runs?archived=1`

- Hover preview on sidebar rows (desktop) — `sidebar-run-row.tsx`
- Sidebar hover actions: rename (`PATCH /api/agent-runs/:id`), copy link, open PR
- Repo groups auto-expand for active run / search
- Mobile sidebar closes on navigate — `agents-shell-context.tsx`
- Sign-in split panel (`SignInPanel`) — dark brand column + form column
- `⌘K` / `Ctrl+K` focuses sidebar search (`agents-app-chrome.tsx`)
- Compact run detail header with status icon row

## Compare locally

```bash
git clone --depth 1 https://github.com/vercel-labs/open-agents.git /tmp/open-agents
```

Key files:

- `apps/web/components/inbox-sidebar.tsx`
- `apps/web/app/sessions/sessions-route-shell.tsx`
- `apps/web/app/globals.css`
