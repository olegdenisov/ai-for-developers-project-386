# Reatom v1000 State Management Guide

**What:** Framework-agnostic signal-based state manager with effect management
**Version:** v1000+ (`@reatom/core@alpha`)
**Installation:** `pnpm add @reatom/core@alpha`

**Quick Reference:**
- Source: `/tmp/reatom-v1000/packages/core/llms.md`
- Key advantage: Implicit context tracking, granular atomization, auto-cleanup

**Table of Contents:**
- [Core Primitives](#core-primitives)
- [Critical Pattern: wrap()](#critical-pattern-wrap)
- [Atomization Pattern](#atomization-pattern)
- [Async State Management](#async-state-management)
- [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
- [Client/Server Component Organization](#clientserver-component-organization)
- [Creating Molecules (Reusable Services)](#creating-molecules-reusable-services)
- [Action Molecules Pattern](#action-molecules-pattern) (includes Jotai migration steps)
- [Extensions](#extensions)
- [React Integration](#react-integration)
- [Migration from Jotai](#migration-from-jotai)
- [API Quick Reference](#api-quick-reference)

## Core Primitives

### 1. atom: Mutable State

Single piece of mutable state. Always provide a name.

```ts
const taskCount = atom(0, 'taskCount')

// Read
const value = taskCount() // -> 0

// Update using .set() method
taskCount.set(5)                    // Set to 5
taskCount.set(prev => prev + 1)     // Increment to 6
```

### 2. computed: Derived State

Lazy-evaluated derived value. Recalculates only when dependencies change and result is read.

```ts
const completedTasks = computed(() => taskCount() * 2, 'completedTasks')
const value = completedTasks() // -> 12 (if taskCount is 6)
```

### 3. action: Logic & Side Effects

Encapsulates complex operations. Use for:
- Multiple state updates
- Side effects (API calls, localStorage)
- Complex business logic

```ts
const fetchUser = action(async (userId: string) => {
  const response = await wrap(fetch(`/api/users/${userId}`))
  const data = await wrap(response.json())

  userName.set(data.name)
  userEmail.set(data.email)

  return data
}, 'fetchUser')

// Call it
fetchUser('123')
```

**When NOT to use actions:**
```ts
// ❌ BAD: Wrapping simple updates
const setTaskCount = action((value: number) => {
  taskCount.set(value)
}, 'setTaskCount')

// ✅ GOOD: Update directly
taskCount.set(10)
```

### 4. effect: Auto-Cleanup Side Effects

Reactive side effects with automatic cleanup on abort context (unmount, signal cancellation).

```ts
const pollingEffect = effect(async () => {
  console.log('Effect started')
  try {
    while (true) {
      const data = await wrap(fetchProjects())
      projectsAtom.set(data)
      await wrap(sleep(5000))
    }
  } catch (error) {
    if (isAbort(error)) {
      console.log('Effect cleaned up')
    }
  }
}, 'pollingEffect')
```

**Use effect for:**
- Reactive side effects (like computed, but with side effects)
- Automatic cleanup (WebSockets, intervals, timers)
- Component lifecycle-tied operations
- Background polling that auto-stops on unmount

**Effect lifecycle:**
```ts
// Effect runs when first accessed/subscribed
effect(async () => {
  console.log('Started')

  // Cleanup when component unmounts or effect is aborted
  return () => console.log('Cleaned up')
}, 'myEffect')
```

**Effect patterns:**

```ts
// Timer that auto-cleans
const tickerEffect = effect(async () => {
  while (true) {
    await wrap(sleep(1000))
    nowAtom.set(Date.now())
  }
}, 'tickerEffect')

// WebSocket with cleanup
const wsEffect = effect(async () => {
  const ws = new WebSocket('wss://api.example.com')

  await onEvent(ws, 'open')
  console.log('Connected')

  onEvent(ws, 'message', (event) => {
    tasksAtom.set(JSON.parse(event.data))
  })

  // Cleanup on unmount
  return () => {
    ws.close()
    console.log('Disconnected')
  }
}, 'wsEffect')
```

### 5. subscribe: React to Changes

Listen to atom/computed changes. Callback runs immediately with current value.

```ts
const unsubscribe = taskCount.subscribe((value) => {
  console.log('Task count:', value)
})

// Stop listening
unsubscribe()
```

## Reatom v1000 API Constraints

### No `ctx.get()` API

**Reatom v1000 does NOT have a `ctx.get()` or similar API to read atoms outside their implicit context.**

Atoms can only be read in two ways:
1. **Direct call inside Reatom context**: `const value = myAtom()`
2. **Subscribe from outside**: `myAtom.subscribe(value => { ... })`

```ts
// ❌ BAD: No ctx.get() API exists
const ctx = reatomContext.get()
const value = ctx.get(myAtom) // Does not exist!

// ✅ GOOD: Call atom directly in Reatom context
const myComputed = computed(() => {
  const value = myAtom() // Works inside computed/action/effect
  return value * 2
}, 'myComputed')

// ✅ GOOD: Subscribe from outside
myAtom.subscribe((value) => {
  console.log('Atom value:', value)
})
```

### Cannot Bridge Reatom to Jotai's `get()`

**You cannot read Reatom atoms from inside Jotai's `get()` function.**

```ts
// ❌ BAD: Cannot read Reatom atom in Jotai context
const { projectsFilter } = mol(ReatomMolecule) // Reatom computed atom
const jotaiAtom = atom((get) => {
  return get(projectsFilter as any) // Does not work!
})

// ✅ GOOD: Use Jotai molecule for Jotai TanStack Query integration
const { projectsFilterAtom } = mol(JotaiMolecule) // Jotai atom
const queryAtom = atomWithSuspenseQuery((get) => ({
  queryKey: ['data', get(projectsFilterAtom)],
  queryFn: async () => { /* ... */ }
}))
```

**Migration Rule:** When migrating molecules that use `atomWithQuery` or `atomWithSuspenseQuery`, keep them using Jotai atoms for their dependencies. Don't try to bridge Reatom atoms into Jotai's query atoms.

## Critical Pattern: wrap()

**ALWAYS use `wrap()` to preserve Reatom's implicit context across async boundaries.**

Context is lost across:
- `await` promises
- `.then()` callbacks
- `setTimeout`/`setInterval`
- Event handlers

```ts
// ❌ BAD: Context lost
action(async () => {
  const response = await fetch('/api/tasks')
  const data = await response.json()
  tasks.set(data) // Throws: "Missed context"
}, 'fetchBad')()

// ✅ GOOD: Wrap promises
action(async () => {
  const response = await wrap(fetch('/api/tasks'))
  const data = await wrap(response.json())
  tasks.set(data) // Works
}, 'fetchGood')()

// ✅ GOOD: Wrap entire promise chain
action(async () => {
  const data = await wrap(fetch('/api/tasks').then(r => r.json()))
  tasks.set(data) // Works
}, 'fetchGood2')()

// ✅ GOOD: Wrap callbacks
action(() => {
  fetch('/api/tasks')
    .then(r => r.json())
    .then(wrap(data => {
      tasks.set(data) // Works
    }))
}, 'fetchGood3')()

// ✅ GOOD: Wrap event handlers (React)
<button onClick={wrap(myAction)}>Click</button>
<input onChange={wrap(e => myAtom.set(e.target.value))} />
```

**Rule:** Wrap the final step that interacts with Reatom OR the callback function itself.

## Atomization Pattern

Break complex objects into granular atoms for efficient updates.

```ts
// ❌ BAD: Monolithic object
const user = atom({ id: '1', name: 'Alice', email: 'alice@example.com' })
// Update requires: user.set(prev => ({ ...prev, email: 'new@example.com' }))

// ✅ GOOD: Separate atoms
const userName = atom('Alice', 'userName')
const userEmail = atom('alice@example.com', 'userEmail')

// Compose if needed (read-only)
const user = { id: '1', name: userName, email: userEmail }

// Direct updates
userName.set('Bob')
userEmail.set('bob@example.com')
```

## Async State Management

### withAsync: Track Action States

For side effects (POST, PUT, DELETE). Tracks pending/error state.

```ts
const createTask = action(async (taskData) => {
  await wrap(api.createTask(taskData))
}, 'createTask').extend(withAsync())

createTask.ready()  // Atom<boolean>: true while running
createTask.error()  // Atom<undefined | Error>: stores error
// createTask.onFulfill() / onReject() / onSettle() available
```

### withAsyncData: Fetch Data with Auto-Cancellation

For computed atoms fetching data (GET). Includes auto-abort on dependency change.

```ts
const projectId = atom('1', 'projectId')
const projectData = computed(async () => {
  const id = projectId()
  // Auto-cancelled if projectId changes
  const response = await wrap(fetch(`/api/projects/${id}`))
  if (!response.ok) throw new Error('Fetch failed')
  return await wrap(response.json())
}, 'projectData').extend(withAsyncData())

projectData.data()   // Atom<Data | undefined>: fetched data
projectData.ready()  // Atom<boolean>: true while fetching
projectData.error()  // Atom<undefined | Error>: fetch error
```

Auto-cancellation prevents race conditions and stale data.

### withInit: Server Data Hydration

Use `withInit()` to populate atoms with server-side data on first access.

```ts
// Server provides initial data
let serverUserData: User | null = null

export function initializeUserData(user: User) {
  serverUserData = user
}

// Atom initializes from server data
const userData = atom<User | null>(null, 'userData').extend(
  withInit(() => serverUserData)
)

// First access returns server data without fetching
const user = userData() // Uses serverUserData
```

**WARNING!!! This pattern only for common data that should be available for everyone. Proper pattern WILL BE AVAILABLE LATER Pattern for page-level data:**
```ts
// page-project.reatom.ts
let serverProjectData: Project = {} as Project
let serverTaskCount: number | undefined = undefined

export function initializeProjectPage(project: Project, taskCount?: number) {
  serverProjectData = project
  serverTaskCount = taskCount
}

export const pageProjectAtom = atom<Project>({} as Project, "pageProjectAtom").extend(
  withInit(() => serverProjectData)
)

export const pageTaskCountAtom = atom<number | undefined>(undefined, "pageTaskCountAtom").extend(
  withInit(() => serverTaskCount)
)
```

**Flow:**
1. Server fetches data
2. Client-side hydrator calls `initializeProjectPage(serverData)`
3. Atoms initialize with server data on first access
4. No loading state needed for initial render

### Polling with Initial Data

Pattern: Show data immediately, poll in background without loading indicators.

```ts
const projectTasksDataAtom = computed(async () => {
  const project = projectAtom()
  if (!project) return null

  // Read refetch trigger to make this reactive
  refetchTriggerAtom()

  const response = await wrap(
    fetch(`/api/projects/${project.id}/tasks`)
  )

  if (!response.ok) throw new Error("Failed to fetch")
  return await wrap(response.json())
}, `projectTasksDataAtom`).extend(
  withAsyncData(),
  // Initialize with server data - no loading state!
  withInit(() => {
    const serverTaskCount = pageTaskCountAtom()
    if (serverTaskCount !== undefined) {
      return { count: serverTaskCount, tasks: [] }
    }
    return undefined
  })
)

// Polling effect (runs in background)
const refetchTriggerAtom = atom(0, `refetchTrigger`)

const tasksRefetchEffect = effect(async () => {
  while (true) {
    await wrap(sleep(5000))
    // Trigger refetch by incrementing counter
    refetchTriggerAtom.set(refetchTriggerAtom() + 1)
  }
}, `tasksRefetchEffect`)

// Smart loading indicator - only on initial fetch
const isLoadingTasksAtom = computed(() => {
  const ready = projectTasksDataAtom.ready()
  const data = projectTasksDataAtom.data()
  const serverTaskCount = pageTaskCountAtom()

  // If we have server data, never show loading
  if (serverTaskCount !== undefined) return false

  // Only loading on initial fetch (data is null)
  return !ready && data === null
}, `isLoadingTasksAtom`)
```

**Key points:**
- `withInit()` provides immediate data from server
- Effect polls every 5 seconds by incrementing trigger
- Loading indicator only shows when no data exists
- Refetches don't show loading (stale data stays visible)

### Custom Polling Extension

Extract polling pattern into reusable extension:

```ts
import type { Ext } from '@reatom/core'
import { effect, sleep, wrap, atom } from '@reatom/core'

export const withPolling = <T extends AtomLike>(
  intervalMs: number
): Ext<T> => {
  return (target) => {
    const refetchTrigger = atom(0, `${target.name}.refetchTrigger`)

    const pollingEffect = effect(async () => {
      while (true) {
        await wrap(sleep(intervalMs))
        refetchTrigger.set(refetchTrigger() + 1)
      }
    }, `${target.name}.pollingEffect`)

    return {
      refetchTrigger,
      pollingEffect,
    }
  }
}

// Usage
const userData = computed(async () => {
  // This computed will re-run every 5 seconds
  const response = await wrap(fetch('/api/user'))
  return await wrap(response.json())
}, 'userData').extend(
  withAsyncData(),
  withPolling(5000) // Poll every 5s
)
```

## Replacing React Query with Reatom

**React Query -> Reatom equivalents:**

```ts
// React Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  refetchInterval: 5000,
})

// Reatom equivalent
const userId = atom('1', 'userId')
const userData = computed(async () => {
  const id = userId()
  const response = await wrap(fetch(`/api/users/${id}`))
  return await wrap(response.json())
}, 'userData').extend(
  withAsyncData(),
  withPolling(5000), // Refetch every 5s
  withInit(() => serverUserData) // SSR data
)

// In component
const data = userData.data()
const isLoading = userData.ready()
const error = userData.error()
```

**Benefits over React Query:**
- Smaller bundle size
- Framework-agnostic
- Better TypeScript inference
- Granular subscriptions (only re-render on actual data changes)
- Simpler API, no query keys

**React Query features -> Reatom:**
| React Query | Reatom |
|-------------|--------|
| `useQuery` | `computed(...).extend(withAsyncData())` |
| `useMutation` | `action(...).extend(withAsync())` |
| `queryKey` dependency | Computed dependencies (automatic) |
| `refetchInterval` | `.extend(withPolling(ms))` |
| `initialData` | `.extend(withInit(() => data))` |
| `enabled` | Conditional computed |
| `onSuccess` | `.extend(withAsync()).onFulfill()` |
| `onError` | `.extend(withAsync()).onReject()` |

## Server-Side Rendering (SSR)

### Architecture Overview
### WARNING!!! This pattern only for common data that should be available for everyone. Proper pattern WILL BE AVAILABLE LATER

Reatom works seamlessly with SSR through the **page atoms pattern**:

1. **Server:** Fetches data in `async` layout/page components
2. **Hydrator:** Client component initializes atoms with server data
3. **Atoms:** Use `withInit()` to consume server data
4. **Components:** Render immediately with no loading states

### Page Atoms Pattern

**File: `page-project.reatom.ts`** (Page-specific atoms)
```ts
import { atom, withInit } from "@reatom/core"
import type { Project } from "@/types"

// Module-level storage for server data
let serverProjectData: Project = {} as Project
let serverTaskCount: number | undefined = undefined

/**
 * Initialize page atoms with server data
 * Called from hydrator before atoms are accessed
 */
export function initializeProjectPage(project: Project, taskCount?: number) {
  serverProjectData = project
  serverTaskCount = taskCount
}

/**
 * Page project atom - auto-initializes from server data
 * Non-nullable since always populated before use
 */
export const pageProjectAtom = atom<Project>({} as Project, "pageProjectAtom").extend(
  withInit(() => serverProjectData)
)

/**
 * Page task count atom - initializes from server, updates on client
 */
export const pageTaskCountAtom = atom<number | undefined>(undefined, "pageTaskCountAtom").extend(
  withInit(() => serverTaskCount)
)
```

### Server Layout (Next.js)

**File: `layout.tsx`** (Server Component)
```tsx
import { cache } from "react"
import { getApiClient } from "@/app/api-client"
import { PageProjectHydrator } from "./page-project-hydrator"

// Cached fetcher - deduplicates requests
const getProjectData = cache(async (projectId: string) => {
  const apiClient = getApiClient()
  const response = await apiClient.api.projects[":id"].$get({
    param: { id: projectId },
  })
  if (!response.ok) return null
  return response.json()
})

const getTaskCount = cache(async (projectId: string) => {
  const apiClient = getApiClient()
  const response = await apiClient.api.projects[":id"].tasks.count.$get({
    param: { id: projectId },
  })
  if (!response.ok) return undefined
  const data = await response.json()
  return data.count
})

export default async function ProjectLayout(props: Props) {
  const projectId = await extractProjectIdFromParams(props.params)

  // Fetch data in parallel on server
  const [project, taskCount] = await Promise.all([
    getProjectData(projectId),
    getTaskCount(projectId),
  ])

  if (!project) throw new Error("Project not found")

  return (
    <PageProjectHydrator project={project} taskCount={taskCount}>
      {props.children}
    </PageProjectHydrator>
  )
}
```

### Client Hydrator

**File: `page-project-hydrator.tsx`** (Client Component)
```tsx
"use client"

import { type ReactNode, useMemo } from "react"
import { initializeProjectPage } from "./page-project.reatom"
import type { Project } from "@/types"

interface Props {
  project: Project
  taskCount?: number
  children: ReactNode
}

/**
 * Hydrates page atoms with server data
 * Must be client component to call initialization
 */
export function PageProjectHydrator({ project, taskCount, children }: Props) {
  // Initialize once per project
  useMemo(() => {
    initializeProjectPage(project, taskCount)
  }, [project.id, taskCount])

  return <>{children}</>
}
```

### Using Page Atoms in Components

**Client components can access page atoms directly:**

```tsx
"use client"

import { reatomComponent } from "@reatom/react"
import { pageProjectAtom, pageTaskCountAtom } from "./page-project.reatom"

export const ProjectInfo = reatomComponent(() => {
  const project = pageProjectAtom()
  const taskCount = pageTaskCountAtom()

  // Data available immediately - no loading state!
  return (
    <div>
      <h1>{project.title}</h1>
      <p>Tasks: {taskCount ?? 0}</p>
    </div>
  )
})
```

### Page Atoms vs Regular Atoms

**Page atoms** (for SSR data):
- Store server-fetched data
- Initialize with `withInit()`
- Live at page/route level
- Non-nullable (always have data)

**Regular atoms** (for client state):
- Created in molecules/stores
- May fetch additional data
- Can reference page atoms
- May use page atoms as initial values

**Example - Molecule using page atoms:**

```ts
// project-store.reatom.ts
import { molecule, atom, computed } from '@reatom/core'
import { pageProjectAtom, pageTaskCountAtom } from './page-project.reatom'

export const ProjectMoleculeReatom = molecule((mol, scope) => {
  // Get project from page atom (or scope for reusable components)
  const scopeProject = scope(ProjectScope)
  const project = scopeProject || pageProjectAtom()

  if (!project) {
    throw new Error('Project data not initialized')
  }

  // Create local atoms from page data
  const projectAtom = atom({
    id: atom(project.id),
    title: atom(project.title),
    // ... atomize the project object
  }, `project-${project.id}`)

  // Use page task count as initial value
  const taskCountAtom = computed(() => {
    const asyncData = projectTasksDataAtom.data()
    const serverData = pageTaskCountAtom()
    // Prefer fresh data, fall back to server data
    return asyncData?.count ?? serverData ?? 0
  }, 'taskCountAtom')

  return { projectAtom, taskCountAtom }
})
```

### Reatom Context Setup

**File: `app/layout.tsx`** (Root layout)
```tsx
import { reatomContext } from '@reatom/react'
import { context } from '@reatom/core'

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        <reatomContext.Provider value={context.start()}>
          {children}
        </reatomContext.Provider>
      </body>
    </html>
  )
}
```

**IMPORTANT:** Put Reatom provider at app root, not in page layouts. This ensures:
- Single context for entire app
- Atoms persist across page navigations
- No context recreation on route changes

### SSR Best Practices

1. **Server data -> Page atoms**
   ```ts
   // Good: Page-level atoms for server data
   export const pageProjectAtom = atom(...).extend(withInit(() => serverData))
   ```

2. **Initialize before access**
   ```tsx
   // Good: Hydrator calls init before children render
   <PageProjectHydrator project={serverProject}>
     <ProjectWidget /> {/* Can access pageProjectAtom */}
   </PageProjectHydrator>
   ```

3. **Avoid loading states for SSR data**
   ```ts
   // Good: Check for server data first
   const isLoading = computed(() => {
     const serverData = pageProjectAtom()
     if (serverData) return false // Have server data!

     const asyncData = fetchedDataAtom.data()
     return !fetchedDataAtom.ready() && !asyncData
   })
   ```

4. **Polling without loading flicker**
   ```ts
   // Good: withInit + polling effect
   const data = computed(async () => {
     refetchTrigger() // Reactive to polling
     return await wrap(fetch(...))
   }).extend(
     withAsyncData(),
     withInit(() => serverData), // No initial loading!
     withPolling(5000)
   )
   ```

## Client/Server Component Organization

### Split Strategy

**Server components:** Static structure, data fetching
**Client components:** Interactivity, context consumers

### Example: Task List Widget

**Before (all client):**
```tsx
"use client" // Everything is client-side

export function TaskListWidget() {
  const project = pageProjectAtom()
  const tasks = project.tasks

  return (
    <div>
      {tasks.map(task => (
        <Card key={task.id}>
          <h3>{task.title}</h3>
          <TaskStatus task={task} />
          <CompleteButton task={task} />
        </Card>
      ))}
    </div>
  )
}
```

**After (split server/client):**

**File: `task-list-widget-server.tsx`** (Server Component)
```tsx
// No "use client" - this is a server component!
import { TaskStatusClient } from './task-status-client'
import { CompleteButtonClient } from './complete-button-client'

interface Props {
  project: Project
  taskCount?: number
}

export function TaskListWidget({ project, taskCount }: Props) {
  // Calculate on server (no context needed)
  const hasTasks = project.tasks.length > 0
  const now = Date.now()
  const overdueTasks = project.tasks.filter(
    t => new Date(t.dueDate).getTime() < now && !t.completed
  )

  return (
    <div className="flex flex-col gap-4">
      {project.tasks.map((task, index) => (
        <Card key={task.id}>
          <div className="flex justify-between">
            <h3>{task.title}</h3>
            {/* Client component for dynamic status */}
            <TaskStatusClient
              taskIndex={index}
              task={task}
              isOverdue={overdueTasks.includes(task)}
            />
          </div>

          <p>{task.description}</p>

          {/* Client component for interactivity */}
          <CompleteButtonClient
            taskIndex={index}
            taskId={task.id}
          />
        </Card>
      ))}
    </div>
  )
}
```

**File: `task-status-client.tsx`** (Client Component)
```tsx
"use client"

import { reatomComponent } from '@reatom/react'
import { useTaskStatusReatom } from '../store/hooks.reatom'
import { Skeleton } from '@ui/components'
import { TaskStatus } from '@/types'

interface Props {
  taskIndex: number
  task: Task
  isOverdue: boolean
}

export const TaskStatusClient = reatomComponent<Props>(({
  taskIndex,
  task,
  isOverdue,
}) => {
  const { lastActivityDataAtom } = useTaskStatusReatom()
  const isLoading = !lastActivityDataAtom.ready()
  const lastActivity = lastActivityDataAtom.data()

  // Only show skeleton when actually needed
  const needsActivity = task.status === TaskStatus.InProgress && isOverdue
  if (isLoading && needsActivity) {
    return <Skeleton className="h-5 w-24" />
  }

  return <StatusBadge task={task} lastActivity={lastActivity} />
})
```

**File: `complete-button-client.tsx`** (Client Component)
```tsx
"use client"

import { reatomComponent } from '@reatom/react'
import { useMolecule } from 'bunshi/react'
import { TaskMoleculeReatom } from '../store/task-store.reatom'
import { Button } from '@ui/components'

interface Props {
  taskIndex: number
  taskId: string
}

export const CompleteButtonClient = reatomComponent<Props>(({
  taskIndex,
  taskId,
}) => {
  const { completeAction, isCompleteDisabledAtom } = useMolecule(TaskMoleculeReatom)
  const isDisabled = isCompleteDisabledAtom()

  return (
    <Button
      disabled={isDisabled}
      onClick={wrap(() => completeAction(taskIndex))}
    >
      Complete
    </Button>
  )
})
```

### Split Patterns

**Pattern 1: Server shell + Client slots**
```tsx
// server-component.tsx (no "use client")
export function FolderList({ folders }: Props) {
  return (
    <div>
      <h2>Folders ({folders.length} items)</h2>
      {folders.map(folder => (
        <div key={folder.id}>
          <span>{folder.name}</span>
          {/* Client component for interactivity */}
          <DeleteButtonClient folderId={folder.id} />
        </div>
      ))}
      <CreateFolderButtonClient />
    </div>
  )
}
```

**Pattern 2: Conditional client components**
```tsx
// server-component.tsx
export function TaskPhase({ task }: Props) {
  const now = Date.now()
  const isActive = new Date(task.startDate).getTime() <= now

  return (
    <Card>
      <h3>{task.title}</h3>
      {/* Server-rendered priority */}
      <p>Priority: {task.priority}</p>

      {/* Conditional client components */}
      {isActive ? (
        <CompleteButtonClient taskId={task.id} />
      ) : (
        <ScheduleButtonClient startDate={task.startDate} />
      )}
    </Card>
  )
}
```

**Pattern 3: Data prop drilling**
```tsx
// Pass server data as props to client components
// Avoids unnecessary atom access

// server-component.tsx
export async function UserProfile({ userId }: Props) {
  const user = await fetchUser(userId) // Server fetch

  return (
    <div>
      <h1>{user.name}</h1>
      {/* Pass data as props instead of using atoms */}
      <EditButtonClient
        userId={user.id}
        userName={user.name}
      />
    </div>
  )
}

// edit-button-client.tsx
"use client"
export const EditButtonClient = reatomComponent<Props>(({
  userId,
  userName,
}) => {
  const { updateUserAction } = useMolecule(UserMolecule)

  return (
    <Button onClick={wrap(() => updateUserAction(userId, userName))}>
      Edit
    </Button>
  )
})
```

### Best Practices

1. **Maximize server components**
   - Static content, layout, structure
   - Data fetching (use `async` components)
   - SEO-critical content

2. **Minimize client components**
   - Only for: interactivity, hooks, context
   - Keep them small and focused
   - Extract static parts to server

3. **Data flow: Server -> Props -> Client**
   ```tsx
   // Good: Server fetches, props to client
   export async function Page() {
     const data = await fetchData()
     return <ClientWidget data={data} />
   }

   // Bad: Client fetches what server could have
   "use client"
   export function Page() {
     const data = useQuery(...)
     return <Widget data={data} />
   }
   ```

4. **Avoid premature "use client"**
   ```tsx
   // Bad: Entire component is client
   "use client"
   export function TaskCard({ task }) {
     return (
       <Card>
         <h3>{task.title}</h3>
         <p>{task.description}</p>
         <CompleteButton taskId={task.id} />
       </Card>
     )
   }

   // Good: Only button is client
   export function TaskCard({ task }) {
     return (
       <Card>
         <h3>{task.title}</h3>
         <p>{task.description}</p>
         <CompleteButtonClient taskId={task.id} />
       </Card>
     )
   }
   ```

5. **Use page atoms for SSR data**
   ```tsx
   // Good: Server data -> page atoms -> client
   // layout.tsx (server)
   const data = await fetchData()
   return <Hydrator data={data}>{children}</Hydrator>

   // hydrator.tsx (client)
   "use client"
   useMemo(() => initPageAtoms(data), [data])

   // component.tsx (client)
   const data = pageDataAtom() // No loading!
   ```

## Creating Molecules (Reusable Services)

Molecules are reusable state containers that encapsulate related atoms, computed values, and actions. Use the factory pattern with `create*` prefix for new molecules.

### Molecule Structure

A well-structured molecule follows this pattern:

```ts
import { molecule } from "bunshi"
import { atom, action, computed, wrap } from "@reatom/core"

// 1. Types - define interfaces at the top
interface TaskData {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
  assigneeId: string | null
}

// 2. Molecule definition
export const TaskEditorMolecule = molecule((mol) => {
  // 3. Dependencies - inject other molecules
  const { currentUserIdAtom } = mol(UserMolecule)
  const { apiClient } = mol(ApiClientMolecule)

  // 4. Core state atoms (granular, atomized)
  const taskIdAtom = atom<string | null>(null, "taskEditor.taskId")
  const titleAtom = atom("", "taskEditor.title")
  const statusAtom = atom<TaskData["status"]>("todo", "taskEditor.status")
  const assigneeIdAtom = atom<string | null>(null, "taskEditor.assigneeId")

  // 5. UI state atoms
  const isLoadingAtom = atom(false, "taskEditor.isLoading")
  const isSavingAtom = atom(false, "taskEditor.isSaving")
  const errorAtom = atom<string | null>(null, "taskEditor.error")

  // 6. Computed values (derived state)
  const isOwnTaskAtom = computed(() => {
    const currentUserId = currentUserIdAtom()
    const assigneeId = assigneeIdAtom()
    return currentUserId === assigneeId
  }, "taskEditor.isOwnTask")

  const canEditAtom = computed(() => {
    const isOwn = isOwnTaskAtom()
    const status = statusAtom()
    return isOwn && status !== "done"
  }, "taskEditor.canEdit")

  // 7. Initialize action - hydrate from server data
  const initialize = action((data: TaskData) => {
    taskIdAtom.set(data.id)
    titleAtom.set(data.title)
    statusAtom.set(data.status)
    assigneeIdAtom.set(data.assigneeId)
    errorAtom.set(null)
  }, "taskEditor.initialize")

  // 8. Mutation actions
  const updateTitle = action((title: string) => {
    titleAtom.set(title)
  }, "taskEditor.updateTitle")

  const save = action(async () => {
    const taskId = taskIdAtom()
    if (!taskId) return

    isSavingAtom.set(true)
    errorAtom.set(null)

    try {
      await wrap(apiClient.tasks.update(taskId, {
        title: titleAtom(),
        status: statusAtom(),
        assigneeId: assigneeIdAtom(),
      }))
    } catch (err) {
      errorAtom.set(err instanceof Error ? err.message : "Failed to save")
      throw err
    } finally {
      isSavingAtom.set(false)
    }
  }, "taskEditor.save")

  // 9. Cleanup action (optional)
  const cleanup = action(() => {
    taskIdAtom.set(null)
    titleAtom.set("")
    statusAtom.set("todo")
    assigneeIdAtom.set(null)
    errorAtom.set(null)
  }, "taskEditor.cleanup")

  // 10. Return organized exports
  return {
    // State
    taskIdAtom,
    titleAtom,
    statusAtom,
    assigneeIdAtom,

    // UI State
    isLoadingAtom,
    isSavingAtom,
    errorAtom,

    // Computed
    isOwnTaskAtom,
    canEditAtom,

    // Actions
    initialize,
    updateTitle,
    save,
    cleanup,
  }
})

// 11. Export types if needed externally
export type { TaskData }
```

### Molecule Categories

**1. Entity Molecules** - Core data for a domain entity

```ts
// stream-info.molecule.ts
export const StreamInfoMolecule = molecule(() => {
  // Atomized entity fields (granular updates)
  const idAtom = atom<string | null>(null, "streamInfo.id")
  const titleAtom = atom("", "streamInfo.title")
  const descriptionAtom = atom<string | null>(null, "streamInfo.description")
  const categoryAtom = atom<Category | null>(null, "streamInfo.category")

  // Initialize from server data
  const initialize = action((data: StreamEntityData) => {
    idAtom.set(data.id)
    titleAtom.set(data.title)
    descriptionAtom.set(data.description)
    categoryAtom.set(data.category)
  }, "streamInfo.initialize")

  return {
    idAtom,
    titleAtom,
    descriptionAtom,
    categoryAtom,
    initialize,
  }
})
```

**2. Feature Molecules** - Specific feature logic (likes, follows, etc.)

```ts
// stream-actions.molecule.ts
export const StreamActionsMolecule = molecule((mol) => {
  const { addressAtom } = mol(WalletMolecule)

  // Feature state
  const likeCountAtom = atom(0, "actions.likeCount")
  const isLikedAtom = atom(false, "actions.isLiked")
  const isShareModalOpenAtom = atom(false, "actions.isShareModalOpen")

  // Optimistic update pattern
  const toggleLike = action(async () => {
    const streamId = streamIdAtom()
    const userAddress = addressAtom()
    if (!streamId || !userAddress) return

    const wasLiked = isLikedAtom()

    // Optimistic update
    isLikedAtom.set(!wasLiked)
    likeCountAtom.set(prev => wasLiked ? prev - 1 : prev + 1)

    try {
      const response = await wrap(
        fetch(`/api/streams/${streamId}/likes`, {
          method: wasLiked ? "DELETE" : "POST",
          body: JSON.stringify({ userAddress }),
        })
      )

      if (!response.ok) {
        // Revert on error
        isLikedAtom.set(wasLiked)
        likeCountAtom.set(prev => wasLiked ? prev + 1 : prev - 1)
      }
    } catch {
      // Revert on error
      isLikedAtom.set(wasLiked)
      likeCountAtom.set(prev => wasLiked ? prev + 1 : prev - 1)
    }
  }, "actions.toggleLike")

  return { likeCountAtom, isLikedAtom, toggleLike, ... }
})
```

**3. Service Molecules** - Infrastructure services (wallet, API client, etc.)

```ts
// wallet-connect.molecule.ts
export const WalletConnectMolecule = molecule(() => {
  // Core state
  const addressAtom = atom<Address | null>(null, "wallet.address")
  const chainIdAtom = atom<number | null>(null, "wallet.chainId")
  const walletClientAtom = atom<WalletClient | null>(null, "wallet.client")

  // Actions
  const updateAddress = action((address: Address | null) => {
    addressAtom.set(address)
  }, "wallet.updateAddress")

  const clearWallet = action(() => {
    addressAtom.set(null)
    chainIdAtom.set(null)
    walletClientAtom.set(null)
  }, "wallet.clear")

  return {
    addressAtom,
    chainIdAtom,
    walletClientAtom,
    updateAddress,
    clearWallet,
  }
})
```

**4. Collection Molecules** - Lists with atomized items

```ts
// products.molecule.ts
export const ProductsMolecule = molecule((mol) => {
  const { addressAtom } = mol(WalletConnectMolecule)

  // Source data (URLs from server)
  const productUrlsAtom = atom<string[]>([], "products.urls")

  // Atomized products map (each product has its own atoms)
  const productsMapAtom = atom<Map<string, AtomizedProduct>>(
    new Map(),
    "products.map"
  )

  // Computed: ordered list of products
  const productsAtom = computed(() => {
    const urls = productUrlsAtom()
    const map = productsMapAtom()

    // Return products in URL order
    return urls
      .map(url => {
        const id = parseProductId(url)
        return id ? map.get(id) : null
      })
      .filter(Boolean) as AtomizedProduct[]
  }, "products.list")

  // Fetch with batch API
  const fetchProducts = action(async () => {
    const urls = productUrlsAtom()
    const itemIds = urls.map(parseProductId).filter(Boolean)

    const items = await wrap(fetchItemsBatch(itemIds))

    // Update or create atomized products
    const map = new Map(productsMapAtom())
    for (const [id, item] of items) {
      const existing = map.get(id)
      if (existing) {
        updateAtomizedProduct(existing, item)
      } else {
        map.set(id, createAtomizedProduct(item))
      }
    }
    productsMapAtom.set(map)
  }, "products.fetch")

  return { productUrlsAtom, productsAtom, fetchProducts }
})
```

### Atomization Pattern for Collections

When a collection item needs individual reactivity, atomize each field:

```ts
interface AtomizedProduct {
  // Readonly identifiers
  id: string
  url: string

  // Mutable atoms (can change)
  nameAtom: ReturnType<typeof atom<string>>
  priceAtom: ReturnType<typeof atom<number | null>>
  imageAtom: ReturnType<typeof atom<string | undefined>>

  // Computed (derived from other atoms)
  isOwnedAtom: ReturnType<typeof computed<boolean>>
}

function createAtomizedProduct(
  id: string,
  data: ProductData,
  ownerAddressAtom: ReturnType<typeof atom<string | null>>
): AtomizedProduct {
  const nameAtom = atom(data.name, `product.${id}.name`)
  const priceAtom = atom<number | null>(data.price, `product.${id}.price`)
  const imageAtom = atom<string | undefined>(data.image, `product.${id}.image`)
  const ownerAtom = atom<string | null>(data.owner, `product.${id}.owner`)

  // Computed depends on external atom
  const isOwnedAtom = computed(() => {
    const owner = ownerAtom()
    const currentAddress = ownerAddressAtom()
    if (!owner || !currentAddress) return false
    return owner.toLowerCase() === currentAddress.toLowerCase()
  }, `product.${id}.isOwned`)

  return {
    id,
    url: data.url,
    nameAtom,
    priceAtom,
    imageAtom,
    isOwnedAtom,
  }
}

// Update existing atomized product (reuses atoms)
function updateAtomizedProduct(
  existing: AtomizedProduct,
  data: ProductData
): void {
  existing.nameAtom.set(data.name)
  existing.priceAtom.set(data.price)
  existing.imageAtom.set(data.image)
}
```

### Using Molecules in Components

**Client page with multiple molecules:**

```tsx
"use client"

import { useEffect, useRef } from "react"
import { reatomComponent } from "@reatom/react"
import { useMolecule } from "bunshi/react"

export const TaskPageClient = reatomComponent(({ task }: { task: TaskData }) => {
  const initializedRef = useRef(false)

  // Get molecules
  const taskEditor = useMolecule(TaskEditorMolecule)
  const taskActions = useMolecule(TaskActionsMolecule)
  const taskComments = useMolecule(TaskCommentsMolecule)

  // Initialize all molecules once
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Initialize with server data
    taskEditor.initialize(task)
    taskActions.initialize(task.id, task.assigneeId)
    taskComments.initialize(task.id)

    // Cleanup on unmount
    return () => {
      taskEditor.cleanup()
      taskComments.cleanup()
    }
  }, [task, taskEditor, taskActions, taskComments])

  // Read atoms
  const title = taskEditor.titleAtom()
  const canEdit = taskEditor.canEditAtom()

  return (
    <div>
      <h1>{title}</h1>
      {canEdit && <EditButton onClick={() => taskEditor.updateTitle("New Title")} />}
      <TaskActionsPanel />
      <TaskCommentsPanel />
    </div>
  )
}, "TaskPageClient")
```

**Child component consuming molecule:**

```tsx
"use client"

import { reatomComponent } from "@reatom/react"
import { useMolecule } from "bunshi/react"

export const TaskActionsPanel = reatomComponent(() => {
  const { likeCountAtom, isLikedAtom, toggleLike } = useMolecule(TaskActionsMolecule)

  const likeCount = likeCountAtom()
  const isLiked = isLikedAtom()

  return (
    <Button onClick={toggleLike} variant={isLiked ? "default" : "outline"}>
      <Heart className={isLiked ? "fill-current" : ""} />
      {likeCount}
    </Button>
  )
}, "TaskActionsPanel")
```

### Molecule Best Practices

**1. Naming Conventions**
```ts
// Molecule names: *Molecule suffix
export const TaskEditorMolecule = molecule(...)

// Factory functions: create* prefix (preferred for new code)
export const createProductsEditor = (name: string) => molecule(...)

// Note: reatom* prefix was used during migration, prefer create* for new factories

// Atom names: dotted namespace
const titleAtom = atom("", "taskEditor.title")
const isLoadingAtom = atom(false, "taskEditor.isLoading")

// Action names: same namespace
const save = action(async () => {...}, "taskEditor.save")
```

**2. Granular Atomization**
```ts
// BAD: Monolithic object atom
const taskAtom = atom({ id: "", title: "", status: "todo" }, "task")
// Update requires: taskAtom.set(prev => ({ ...prev, title: "new" }))

// GOOD: Granular atoms
const taskIdAtom = atom("", "task.id")
const titleAtom = atom("", "task.title")
const statusAtom = atom<Status>("todo", "task.status")
// Direct updates: titleAtom.set("new")
```

**3. Dependency Injection via mol()**
```ts
export const TaskActionsMolecule = molecule((mol) => {
  // Inject dependencies
  const { currentUserIdAtom } = mol(UserMolecule)
  const { apiClient } = mol(ApiClientMolecule)

  // Use injected dependencies
  const isOwnerAtom = computed(() => {
    return currentUserIdAtom() === assigneeIdAtom()
  }, "isOwner")
})
```

**4. Optimistic Updates with Rollback**
```ts
const toggleLike = action(async () => {
  const wasLiked = isLikedAtom()

  // 1. Optimistic update
  isLikedAtom.set(!wasLiked)
  likeCountAtom.set(prev => wasLiked ? prev - 1 : prev + 1)

  try {
    // 2. API call
    const response = await wrap(fetch(...))

    if (!response.ok) {
      // 3a. Revert on API error
      isLikedAtom.set(wasLiked)
      likeCountAtom.set(prev => wasLiked ? prev + 1 : prev - 1)
    }
  } catch {
    // 3b. Revert on network error
    isLikedAtom.set(wasLiked)
    likeCountAtom.set(prev => wasLiked ? prev + 1 : prev - 1)
  }
}, "toggleLike")
```

**5. Polling with Guard**
```ts
const isPollingAtom = atom(false, "isPolling")

const startPolling = action(async () => {
  // Guard against multiple polling loops
  if (isPollingAtom()) return
  isPollingAtom.set(true)

  while (true) {
    await wrap(sleep(5000))
    await fetchData()
  }
}, "startPolling")
```

**6. Initialize Once Pattern**
```tsx
export const PageClient = reatomComponent(({ data }) => {
  const initializedRef = useRef(false)
  const molecule = useMolecule(MyMolecule)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    molecule.initialize(data)

    return () => molecule.cleanup()
  }, [data, molecule])
})
```

**7. Return Organized Exports**
```ts
return {
  // Group 1: Core state atoms
  idAtom,
  titleAtom,
  statusAtom,

  // Group 2: UI state
  isLoadingAtom,
  isErrorAtom,

  // Group 3: Computed values
  canEditAtom,
  isOwnerAtom,

  // Group 4: Actions
  initialize,
  save,
  cleanup,
}
```

### Common Issues and Solutions

**Issue 1: Duplicate atoms on re-render**
```ts
// BAD: Creates new atoms every render
const MyComponent = reatomComponent(() => {
  const countAtom = atom(0, "count") // New atom each render!
  return <div>{countAtom()}</div>
})

// GOOD: Atoms in molecule (created once)
const CounterMolecule = molecule(() => {
  const countAtom = atom(0, "count")
  return { countAtom }
})

const MyComponent = reatomComponent(() => {
  const { countAtom } = useMolecule(CounterMolecule)
  return <div>{countAtom()}</div>
})
```

**Issue 2: Missing wrap() in async**
```ts
// BAD: Context lost
const fetchData = action(async () => {
  const response = await fetch("/api/data")
  dataAtom.set(await response.json()) // Error: Missed context
}, "fetchData")

// GOOD: Wrap async operations
const fetchData = action(async () => {
  const response = await wrap(fetch("/api/data"))
  dataAtom.set(await wrap(response.json()))
}, "fetchData")
```

**Issue 3: Molecules not initialized**
```tsx
// BAD: Using molecule without initialization
const MyComponent = reatomComponent(() => {
  const { titleAtom } = useMolecule(TaskMolecule)
  return <div>{titleAtom()}</div> // Empty - never initialized!
})

// GOOD: Initialize in parent/page component
const PageComponent = reatomComponent(({ data }) => {
  const task = useMolecule(TaskMolecule)

  useEffect(() => {
    task.initialize(data) // Initialize with server data
  }, [])

  return <ChildComponent />
})
```

**Issue 4: Multiple polling loops**
```ts
// BAD: No guard
const startPolling = action(async () => {
  while (true) { // Multiple calls = multiple loops!
    await wrap(sleep(5000))
    await fetch()
  }
}, "startPolling")

// GOOD: Guard with flag
const isPollingAtom = atom(false, "isPolling")

const startPolling = action(async () => {
  if (isPollingAtom()) return // Guard
  isPollingAtom.set(true)

  while (true) {
    await wrap(sleep(5000))
    await fetch()
  }
}, "startPolling")
```

## Action Molecules Pattern

**Context:** Creating action molecules with `action()` + `withAsync()` extensions for complex operations.

### Architecture Overview

```ts
// Simple single-layer pattern with direct action + extensions
export const TaskActionsMoleculeReatom = molecule((mol) => {
  const { apiClient } = mol(ApiClientMolecule)

  const createTaskAction = action(
    async ({ projectId, title, description, assigneeId }) => {
      const result = await wrap(
        apiClient.tasks.create({ projectId, title, description, assigneeId })
      )

      return { ...result, projectId, title }
    },
    "createTaskAction",
  ).extend(
    withAsync(),  // Adds: .pending, .fulfilled, .rejected, .settle, onFulfill, onReject

    // onCall: Runs when action is called (before execution)
    withCallHook((values, [params]) => {
      const { projectId, title } = params

      analytics.track('TaskCreationStarted', { projectId, title })

      toast.loading('Creating task...', { duration: Infinity })
    }),
  )

  // onFulfill: Runs when action succeeds
  createTaskAction.onFulfill.extend(
    withCallHook((result) => {
      const { id, title } = result.payload

      analytics.track('TaskCreated', { taskId: id, title })

      toast.dismiss()
      toast.success(`Task "${title}" created successfully`)
    }),
  )

  // onReject: Runs when action fails
  createTaskAction.onReject.extend(
    withCallHook(({ error, params: [paramsValue] }) => {
      const { title } = paramsValue

      analytics.track('TaskCreationFailed', { title, error: error.message })

      toast.dismiss()
      toast.error(`Failed to create task: ${error.message}`)
    }),
  )

  return { createTaskAction }
})

// Usage in component (via reatomComponent)
const { createTaskAction } = useMolecule(TaskActionsMoleculeReatom)
await createTaskAction({ projectId, title, description, assigneeId })
```

### Convert Lifecycle Hooks

| Hook Name | Reatom Extension | Signature |
|-----------|------------------|-----------|
| `onMutate` / `onCall` | `withCallHook()` after action | `(values, [params]) => void` |
| `onSuccess` / `onFulfill` | `action.onFulfill.extend(withCallHook())` | `(result, [params]) => void` |
| `onError` / `onReject` | `action.onReject.extend(withCallHook())` | `({ error, params: [paramsValue] }) => void` |

### Access Params and Results

**In onCall (withCallHook after action):**
```ts
withCallHook((values, [params]) => {
  const { projectId, title, description } = params  // Action parameters
})
```

**In onFulfill:**
```ts
createTaskAction.onFulfill.extend(
  withCallHook((result, [params]) => {
    const { id, title, createdAt } = result.payload  // Return value from action
    const originalParams = params  // Original parameters
  }),
)
```

**In onReject:**
```ts
createTaskAction.onReject.extend(
  withCallHook(({ error, params: [paramsValue] }) => {
    const err = error  // Error object
    const { projectId, title } = paramsValue  // Original parameters
  }),
)
```

### Component Usage Pattern

```ts
// Use molecule directly in reatomComponent
export const CreateTaskButtonReatom = reatomComponent<{ projectId: string }>(
  ({ projectId }) => {
    const { createTaskAction } = useMolecule(TaskActionsMoleculeReatom)

    // Access async state
    const isPending = createTaskAction.pending()

    const handleCreate = async () => {
      await createTaskAction({
        projectId,
        title: 'New Task',
        description: 'Task description',
        assigneeId: getCurrentUserId(),
      })
    }

    return (
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? "Creating..." : "Create Task"}
      </button>
    )
  },
  "CreateTaskButtonReatom",
)
```

### Tracking Async State

`withAsync()` extension provides:

```ts
const createTaskAction = action(async (params) => { ... }, "createTaskAction")
  .extend(withAsync())

// State atoms (read in reatomComponent)
createTaskAction.pending()    // boolean: Is action running?
createTaskAction.fulfilled()  // boolean: Did action succeed?
createTaskAction.rejected()   // boolean: Did action fail?
createTaskAction.settled()    // boolean: Is action done (success or failure)?

// Lifecycle hooks
createTaskAction.onFulfill.extend(withCallHook((result) => { ... }))
createTaskAction.onReject.extend(withCallHook(({ error, params }) => { ... }))
```

**Example: Show loading state**
```ts
const CreateTaskButtonReatom = reatomComponent(({ projectId }) => {
  const { createTaskAction } = useMolecule(TaskActionsMoleculeReatom)

  const isPending = createTaskAction.pending()
  const isFulfilled = createTaskAction.fulfilled()
  const isRejected = createTaskAction.rejected()

  return (
    <div>
      <button disabled={isPending}>
        {isPending && "Creating..."}
        {isFulfilled && "Created!"}
        {isRejected && "Failed"}
        {!isPending && !isFulfilled && !isRejected && "Create Task"}
      </button>
    </div>
  )
}, "CreateTaskButtonReatom")
```

### Complete Example: Task CRUD Actions

```ts
import { molecule } from "bunshi"
import { action, withAsync, wrap } from "@reatom/core"
import { withCallHook } from "@reatom/core"
import { toast } from "sonner"
import { ApiClientMolecule } from "@/api/client-molecule"

export interface CreateTaskParams {
  projectId: string
  title: string
  description?: string
  assigneeId?: string
  dueDate?: Date
}

export interface UpdateTaskParams {
  taskId: string
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  assigneeId?: string
}

export const TaskActionsMoleculeReatom = molecule((mol) => {
  const { apiClient } = mol(ApiClientMolecule)

  // CREATE TASK ACTION
  const createTaskAction = action(async (params: CreateTaskParams) => {
    const result = await wrap(apiClient.tasks.create(params))
    return { ...result, ...params }
  }, "createTaskAction").extend(
    withAsync(),

    withCallHook(async (values, [params]) => {
      const { title } = params
      toast.loading(`Creating task "${title}"...`, { duration: Infinity })
    }),
  )

  createTaskAction.onFulfill.extend(
    withCallHook((result) => {
      const { title } = result.payload
      toast.dismiss()
      toast.success(`Task "${title}" created`)
    }),
  )

  createTaskAction.onReject.extend(
    withCallHook(({ error, params: [paramsValue] }) => {
      const { title } = paramsValue
      toast.dismiss()
      toast.error(`Failed to create "${title}": ${error.message}`)
    }),
  )

  // UPDATE TASK ACTION
  const updateTaskAction = action(async (params: UpdateTaskParams) => {
    const result = await wrap(apiClient.tasks.update(params.taskId, params))
    return { ...result, ...params }
  }, "updateTaskAction").extend(
    withAsync(),

    withCallHook((values, [params]) => {
      toast.loading('Updating task...', { duration: Infinity })
    }),
  )

  updateTaskAction.onFulfill.extend(
    withCallHook(() => {
      toast.dismiss()
      toast.success('Task updated')
    }),
  )

  updateTaskAction.onReject.extend(
    withCallHook(({ error }) => {
      toast.dismiss()
      toast.error(`Update failed: ${error.message}`)
    }),
  )

  // DELETE TASK ACTION
  const deleteTaskAction = action(async (taskId: string) => {
    await wrap(apiClient.tasks.delete(taskId))
    return { taskId }
  }, "deleteTaskAction").extend(
    withAsync(),

    withCallHook(() => {
      toast.loading('Deleting task...', { duration: Infinity })
    }),
  )

  deleteTaskAction.onFulfill.extend(
    withCallHook(() => {
      toast.dismiss()
      toast.success('Task deleted')
    }),
  )

  deleteTaskAction.onReject.extend(
    withCallHook(({ error }) => {
      toast.dismiss()
      toast.error(`Delete failed: ${error.message}`)
    }),
  )

  return { createTaskAction, updateTaskAction, deleteTaskAction }
})
```

### Common Patterns

#### Pattern 1: Storing State for Lifecycle Hooks

If you need to share state between onCall, onFulfill, and onReject:

```ts
export const TaskActionsMoleculeReatom = molecule((mol) => {
  // Store state outside action (closure scope)
  let originalTaskTitle: string | undefined
  let calculatedContext: EventContext | undefined

  const updateTaskAction = action(async (params) => {
    // Action execution
  }, "updateTaskAction").extend(
    withAsync(),
    withCallHook(async (values, [params]) => {
      // Calculate and store
      originalTaskTitle = params.title
      calculatedContext = buildEventContext(params)
    }),
  )

  updateTaskAction.onFulfill.extend(
    withCallHook((result) => {
      // Access stored state
      showSuccessToast(result.payload.title, originalTaskTitle)
    }),
  )

  updateTaskAction.onReject.extend(
    withCallHook(({ error, params: [paramsValue] }) => {
      // Access stored state
      showErrorToast(paramsValue.title, error, originalTaskTitle)
    }),
  )

  return { updateTaskAction }
})
```

#### Pattern 2: Multiple Actions in One Molecule

```ts
export const ProjectActionsMoleculeReatom = molecule((mol) => {
  const { apiClient } = mol(ApiClientMolecule)

  const createProjectAction = action(async (params) => { ... }, "createProjectAction")
    .extend(withAsync(), withCallHook(...))

  const archiveProjectAction = action(async (params) => { ... }, "archiveProjectAction")
    .extend(withAsync(), withCallHook(...))

  const inviteMemberAction = action(async (params) => { ... }, "inviteMemberAction")
    .extend(withAsync(), withCallHook(...))

  return { createProjectAction, archiveProjectAction, inviteMemberAction }
})
```

#### Pattern 3: Action with Validation

```ts
const createTaskAction = action(async ({ projectId, title, assigneeId }) => {
  // Validate before execution
  if (!projectId) {
    throw new Error("Project ID is required")
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Task title is required")
  }

  if (title.length > 200) {
    throw new Error("Task title must be 200 characters or less")
  }

  // Execute
  const result = await wrap(apiClient.tasks.create({ projectId, title, assigneeId }))

  return result
}, "createTaskAction").extend(withAsync(), withCallHook(...))
```

### Migration Steps (from Jotai)

#### 1. Convert Molecule Structure

**Before (Jotai):**
```ts
export const TaskTransactionMolecule = molecule((mol, scope) => {
  const apiClientAtom = scope(ApiClientScope)
  const { userIdAtom } = mol(UserMolecule)

  function createTransaction({ taskData }) {
    const mutationAtom = atomWithMutation((get) => ({ ... }))
    return { mutationAtom }
  }

  return createTransaction
})
```

**After (Reatom):**
```ts
export const TaskTransactionMoleculeReatom = molecule((mol) => {
  const { apiClient } = mol(ApiClientMoleculeReatom)

  const createTaskAction = action(async (params) => { ... }, "createTaskAction")
    .extend(withAsync(), withCallHook(...))

  return { createTaskAction }
})
```

**Key Changes:**
- Remove `scope(ApiClientScope)` -> Use `ApiClientMoleculeReatom`
- Remove nested `createTransaction()` function -> Direct action creation
- Remove `atomWithMutation` -> Use `action()` + `withAsync()`
- Remove transaction storage logic -> Actions are stateless (state tracked externally if needed)

#### 2. Convert API Call Pattern

**Before (Jotai atom):**
```ts
// API factory returns Jotai atom
const createTaskAtom = createTask(apiClientAtom)  // atom factory from API

// Later in mutationFn
const result = await get(createTaskAtom({ title, projectId, ... }))
```

**After (Reatom factory):**
```ts
// API factory returns async function
const apiClient = apiClientAtom()  // Get client
const createTask = createTaskFactory(apiClient)  // Get factory function

// Execute with wrap
const result = await wrap(createTask(taskRequest))
```

**Critical:** Always use `wrap()` for API calls to preserve Reatom context and enable proper cancellation.

#### 3. Convert Lifecycle Hooks

| Jotai Mutation Hook | Reatom Extension | Signature |
|---------------------|------------------|-----------|
| `onMutate` | `withCallHook()` after action | `(values, [params]) => void` |
| `onSuccess` | `action.onFulfill.extend(withCallHook())` | `(result, [params]) => void` |
| `onError` | `action.onReject.extend(withCallHook())` | `({ error, params: [paramsValue] }) => void` |

**Before (atomWithMutation):**
```ts
const mutationAtom = atomWithMutation((get) => ({
  onMutate: (variables: MutationVariables) => {
    toast.loading('Creating task...')
    analytics.track('TaskCreationStarted', context)
  },
  onSuccess: (result, variables) => {
    toast.dismiss()
    toast.success('Task created!')
    analytics.track('TaskCreated', context)
  },
  onError: (error, variables) => {
    toast.dismiss()
    toast.error(`Failed: ${error.message}`)
    analytics.track('TaskCreationFailed', context)
  },
  mutationFn: async (variables) => { ... },
}))
```

**After (Reatom action + extensions):**
```ts
const createTaskAction = action(
  async (params) => { /* mutationFn logic */ },
  "createTaskAction"
).extend(
  withAsync(),

  // onMutate -> withCallHook after action
  withCallHook((values, [params]) => {
    toast.loading('Creating task...')
    analytics.track('TaskCreationStarted', context)
  }),
)

// onSuccess -> onFulfill
createTaskAction.onFulfill.extend(
  withCallHook((result, [params]) => {
    toast.dismiss()
    toast.success('Task created!')
    analytics.track('TaskCreated', context)
  }),
)

// onError -> onReject
createTaskAction.onReject.extend(
  withCallHook(({ error, params: [paramsValue] }) => {
    toast.dismiss()
    toast.error(`Failed: ${error.message}`)
    analytics.track('TaskCreationFailed', context)
  }),
)
```

#### 4. Access Params and Results

**In onCall (withCallHook after action):**
```ts
withCallHook((values, [params]) => {
  const { projectId, title, assigneeId } = params  // Action parameters
})
```

**In onFulfill:**
```ts
createTaskAction.onFulfill.extend(
  withCallHook((result, [params]) => {
    const { id, title, createdAt } = result.payload  // Return value from action
    const originalParams = params  // Original parameters
  }),
)
```

**In onReject:**
```ts
createTaskAction.onReject.extend(
  withCallHook(({ error, params: [paramsValue] }) => {
    const err = error  // Error object
    const { projectId, title } = paramsValue  // Original parameters
  }),
)
```

#### 5. Component Usage Pattern

**Before (Jotai + hook):**
```ts
export function useCreateTask(projectId: string) {
  const { transactionAtom } = useMolecule(TaskTransactionMolecule, {
    withScope: [ProjectScope, projectId],
  })
  const { mutationAtom } = useAtomValue(transactionAtom)
  const { mutate, isPending } = useAtomValue(mutationAtom)

  return { mutate, isPending }
}

// In component
const { mutate, isPending } = useCreateTask(projectId)
await mutate({ title, description, assigneeId })
```

**After (Reatom + reatomComponent):**
```ts
// No custom hook needed - use molecule directly
export const CreateTaskButtonReatom = reatomComponent<{ projectId: string }>(
  ({ projectId }) => {
    const { createTaskAction } = useMolecule(TaskTransactionMoleculeReatom)

    // Access async state
    const isPending = createTaskAction.pending()

    const handleCreate = async () => {
      await createTaskAction({
        projectId,
        title: 'New Task',
        description: 'Task description',
        assigneeId: getCurrentUserId(),
      })
    }

    return (
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? "Creating..." : "Create Task"}
      </button>
    )
  },
  "CreateTaskButtonReatom",
)
```

#### 6. Tracking Async State

`withAsync()` extension provides:

```ts
const createTaskAction = action(async (params) => { ... }, "createTaskAction")
  .extend(withAsync())

// State atoms (read in reatomComponent)
createTaskAction.pending()    // boolean: Is action running?
createTaskAction.fulfilled()  // boolean: Did action succeed?
createTaskAction.rejected()   // boolean: Did action fail?
createTaskAction.settled()    // boolean: Is action done (success or failure)?

// Lifecycle hooks
createTaskAction.onFulfill.extend(withCallHook((result) => { ... }))
createTaskAction.onReject.extend(withCallHook(({ error, params }) => { ... }))
```

### API Factory Functions

**Old Pattern (Jotai atom factory):**
```ts
// api/tasks/create.ts
export function createTask(apiClientAtom: Atom<ApiClient | null>) {
  return atomFamily((request: CreateTaskRequest) =>
    atom(async (get) => {
      const client = get(apiClientAtom)
      // ... create task logic
      return result
    })
  )
}
```

**New Pattern (Reatom factory function):**
```ts
// api/tasks/create.reatom.ts
export function createTaskFactory(
  apiClient: ApiClient | null | undefined,
) {
  return async (request: CreateTaskRequest): Promise<CreateTaskResult> => {
    if (!apiClient) {
      throw new Error("API Client is not initialized")
    }

    const response = await apiClient.tasks.create(request)
    return response
  }
}
```

**Key Differences:**
- Jotai: Returns `atomFamily` -> atom that returns async function
- Reatom: Returns async function directly (no atom wrapping)
- Jotai: Uses `get(apiClientAtom)` to access client
- Reatom: Receives client directly as parameter

### Migration Checklist

For each action molecule:

- [ ] Create new `*-molecule.reatom.tsx` file
- [ ] Change molecule name: `TaskTransactionMolecule` -> `TaskTransactionMoleculeReatom`
- [ ] Replace `scope(ApiClientScope)` with `mol(ApiClientMoleculeReatom)`
- [ ] Convert API call: `get(createTaskAtom(...))` -> `wrap(createTaskFactory(apiClient)(...))`
- [ ] Replace `atomWithMutation` with `action().extend(withAsync(), withCallHook(...))`
- [ ] Convert lifecycle hooks:
  - [ ] `onMutate` -> `withCallHook()` after action
  - [ ] `onSuccess` -> `action.onFulfill.extend(withCallHook())`
  - [ ] `onError` -> `action.onReject.extend(withCallHook())`
- [ ] Update parameter access:
  - [ ] onCall: `[params]` from second argument
  - [ ] onFulfill: `result.payload` and `[params]`
  - [ ] onReject: `{ error, params: [paramsValue] }`
- [ ] Remove transaction storage logic (atomEffect, etc.)
- [ ] Return `{ actionName }` from molecule
- [ ] Add header comment documenting migration from Jotai

### Testing Action Molecules

```ts
// In component test
const { createTaskAction } = useMolecule(TaskTransactionMoleculeReatom)

// Call action
await createTaskAction({ projectId: '123', title: 'Test Task', ... })

// Check state
expect(createTaskAction.pending()).toBe(false)
expect(createTaskAction.fulfilled()).toBe(true)
expect(createTaskAction.rejected()).toBe(false)
```

## Extensions

### .actions(): Add Related Methods

```ts
const taskCount = atom(0, 'taskCount').actions((target) => ({
  increment: (amount = 1) => target.set(prev => prev + amount),
  decrement: (amount = 1) => target.set(prev => prev - amount),
  reset: () => target.set(0),
}))

taskCount.increment(5)
taskCount.reset()
```

### .extend(): Apply Extensions

```ts
const withLogger = <T extends AtomLike>(prefix: string): Ext<T, T> => {
  return withMiddleware((target) => {
    return (next, ...params) => {
      console.log(`${prefix} [${target.name}] Before:`, params)
      const result = next(...params)
      console.log(`${prefix} [${target.name}] After:`, result)
      return result
    }
  })
}

const withReset = <T extends AtomLike>(
  defaultValue: AtomState<T>,
): Ext<T> & { reset: Action } =>
  (target) => ({
    reset: action(() => target.set(defaultValue), `${target.name}.reset`),
  })

const taskCount = atom(0, 'taskCount').extend(
  withReset(0),
  withLogger('TASK_COUNT'),
)
```

## Naming Conventions

- **Always name primitives:** Use second argument (`atom(0, 'taskCount')`)
- **Descriptive names:** Regular variable names (e.g., `taskCount`, `fetchTasks`)
- **NO suffixes:** Don't use "Atom" or "Action" in names
- **Factory functions:** Prefix with `reatom*` (e.g., `reatomTimer`)

```ts
// GOOD
const taskCount = atom(0, 'taskCount')
const fetchUser = action(async () => {}, 'fetchUser')

// BAD
const taskCountAtom = atom(0, 'taskCountAtom')
const fetchUserAction = action(async () => {}, 'fetchUserAction')

// Factory pattern
const reatomTimer = (name: string) => {
  const count = atom(0, `${name}.count`)
  return { count }
}
const myTimer = reatomTimer('myTimer')
```

## React Integration

### reatomComponent: Simple Reactive Component

```tsx
const UserProfile = reatomComponent<{ className?: string }>(({ className }) => {
  const [t] = useTranslation()
  return (
    <div className={className}>
      <p>{t('name')}: {userName()}</p>
      <p>{t('email')}: {userEmail()}</p>
    </div>
  )
})
```

**IMPORTANT:** Reatom v1000 does NOT have `useAtom()` or `useAtomValue()` hooks.

**There is NO `@reatom/npm-react` package.** Do not try to import `useAtom` from it.

**Pattern:** Call atoms directly as functions inside `reatomComponent` or custom hooks:

```tsx
// GOOD: Call atoms directly inside reatomComponent
const UserProfile = reatomComponent<{ className?: string }>(({ className }) => {
  const name = userName()
  const email = userEmail()
  return (
    <div className={className}>
      <p>Name: {name}</p>
      <p>Email: {email}</p>
    </div>
  )
})

// BAD: No useAtom() or useAtomValue() in v1000
const UserProfile = reatomComponent(() => {
  const name = useAtom(userName) // Does not exist in v1000
  const email = useAtomValue(userEmail) // Does not exist in v1000
  return <div>{name}</div>
})

// BAD: Calling atoms without reatomComponent wrapper
const UserProfile = () => {
  const name = userName() // Missing context, will throw error
  return <div>{name}</div>
}
```

**Rule:** Any component or hook that calls atoms MUST be wrapped with `reatomComponent`.

### reatomFactoryComponent: Local State & Effects

Recommended pattern for components with local state. Factory creates stable atoms.

```tsx
const Timer = reatomFactoryComponent((props: { intervalMs: number }) => {
  // Factory: create local state and effects
  const count = atom(0, 'localTimerCount')

  effect(async () => {
    while(true) {
      await wrap(sleep(props.intervalMs))
      count.set(c => c + 1)
    }
  }, 'timerEffect') // Auto-cleans on unmount

  // Return render function
  return () => (
    <div>Timer ({props.intervalMs}ms): {count()}</div>
  )
}, 'Timer')
```

**NEVER create atoms inside render:** Only in factory or outside component.

## Advanced Utilities

### take: Await Next Update

Await next update of atom/action within async context. **Must use wrap()**.

```ts
const formData = atom({ value: '', error: null }, 'formData')

const submitWhenValid = action(async () => {
  while (true) {
    const data = formData()
    const error = validate(data)
    if (!error) break

    formData.set({ ...data, error })
    await wrap(take(formData)) // Wait for next change
  }
  console.log('Submitting:', formData())
}, 'submitWhenValid')
```

### onEvent: DOM/WebSocket Events

Handle events safely with abort context support.

```ts
const reatomTaskUpdates = (projectId) =>
  atom(null, `${projectId}TaskUpdatesAtom`).extend(
    withConnectHook(async (target) => {
      if (socket.readyState !== WebSocket.OPEN) {
        await onEvent(socket, 'open')
      }

      socket.send(JSON.stringify({ projectId, type: 'subscribe' }))

      onEvent(socket, 'message', (event) => {
        if (event.data.projectId === projectId) {
          target.set(JSON.parse(event.data))
        }
      })

      onEvent(socket, 'close', () => abortVar.abort('close'))
      onEvent(socket, 'error', () => abortVar.abort('error'))

      abortVar.subscribeAbort(() =>
        socket.send(JSON.stringify({ projectId, type: 'unsubscribe' }))
      )
    }),
  )
```

**Checkpoint pattern for race conditions:**

```ts
// BAD: Event might be missed
const animation = element.animate(keyframes)
const content = await wrap(api.fetchTasks())
await onEvent(animation, 'finish') // Might wait forever

// GOOD: Start listening before slow operation
const animation = element.animate(keyframes)
const animationFinished = onEvent(animation, 'finish') // Checkpoint
const content = await wrap(api.fetchTasks())
await animationFinished // Catches event even if finished during fetch
```

## Setup & Configuration

### Basic Setup

```ts
// setup.ts
import { clearStack, connectLogger } from '@reatom/core'

clearStack() // Force explicit wrap() usage (recommended)

if (import.meta.env.DEV) {
  connectLogger() // Enable debug logging
}
```

### React Setup

```tsx
// main.tsx
import { context } from '@reatom/core'
import { reatomContext } from '@reatom/react'
import ReactDOM from 'react-dom/client'
import './setup' // BEFORE app code
import { App } from './App'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <reatomContext.Provider value={context.start()}>
    <App />
  </reatomContext.Provider>,
)
```

## Migration from Jotai

| Jotai | Reatom |
|-------|--------|
| `const countAtom = atom(0)` | `const count = atom(0, 'count')` |
| `const doubled = atom(get => get(count) * 2)` | `const doubled = computed(() => count() * 2, 'doubled')` |
| `const [count, setCount] = useAtom(countAtom)` | `count()` to read, `count.set(5)` to set |
| `useSetAtom(countAtom)` | Direct updates: `count.set(5)` |
| `atomWithStorage` | `atom(...).extend(withInit(...), withChangeHook(...))` |
| `atomFamily` | Factory pattern: `reatomFoo(id)` |
| `useAtomValue(atom)` | `atom()` inside `reatomComponent` |

**Key differences:**
- **Always name atoms:** Required for debugging
- **Call atoms directly:** No hooks for read/write (inside `reatomComponent`)
- **Use `.set()` for updates:** Not function calls
- **Use `wrap()`:** Required for async operations
- **Atomization over objects:** Break complex state into granular atoms

## Atomization Helpers

Built-in helpers for common patterns:

- `reatomArray` - Array operations
- `reatomBoolean` - Boolean with toggle
- `reatomEnum` - Enum values with setters
- `reatomMap` - Map operations
- `reatomNumber` - Number with increment/decrement
- `reatomRecord` - Record operations
- `reatomSet` - Set operations
- `reatomString` - String operations
- `reatomLinkedList` - Linked list

## API Quick Reference

**Core:**
- `atom(initState, name?)` - Mutable state
- `computed(computeFn, name?)` - Derived state
- `action(effectFn, name?)` - Logic/side effects
- `effect(effectFn, name?)` - Auto-cleanup side effects
- `wrap(fn | promise)` - Preserve context (ESSENTIAL)

**Methods:**
- `.subscribe(callback)` - Listen to changes
- `.extend(extension)` - Apply extensions
- `.actions(builderFn)` - Add related actions
- `.set(value | updater)` - Update atom

**Extensions:**
- `withAsync()` - Track action states (ready, error)
- `withAsyncData()` - Track data fetching (data, ready, error, auto-cancel)
- `withInit()` - Initialize from source (e.g., SSR data, localStorage)
- `withChangeHook()` - React to changes (e.g., save to localStorage)
- `withConnectHook()` - Run on first subscription
- `withAbort()` - Auto-cancellation support
- `withMemo()` - Memoization

**Utilities:**
- `take(target, name?)` - Await next update (use `wrap(take(...))`)
- `onEvent(target, eventName, callback?)` - Handle events safely
- `connectLogger()` - Enable debug logging
- `clearStack()` - Force explicit `wrap()` usage
- `context.start(fn)` - Create isolated context
- `sleep(ms)` - Async delay (use with `wrap()`)
- `isAbort(error)` - Check if error is abort

**React:**
- `reatomComponent` - Reactive component
- `reatomFactoryComponent` - Component with local state/effects
- `reatomContext.Provider` - Context provider

## Verification References

All information sourced from: `/tmp/reatom-v1000/packages/core/llms.md`

Core concepts:
- Lines 9-120: Core primitives (atom, computed, action, effect, subscribe)
- Lines 128-227: Context preservation with wrap()
- Lines 229-262: Async state management
- Lines 264-308: Extensions
- Lines 310-377: Advanced utilities (take, onEvent)
- Lines 379-604: React integration and examples
- Lines 606-625: API reference

**Document verified:** 2025
