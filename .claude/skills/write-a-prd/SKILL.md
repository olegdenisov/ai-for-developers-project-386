This skill is invoked when the user wants to create a PRD. Follow the steps below strictly.

---

## Phase 1: Discovery

Display this header before starting:

```
╔════════════════════════════════════════╗
║         📋 PRD Interview Mode          ║
║   Answer questions one by one.         ║
╚════════════════════════════════════════╝
```

Ask each question **individually** using AskUserQuestion. Wait for the answer before moving to the next. Never bundle multiple questions in one message.

Show a progress label before each question: `[Question N / 8]`

**Question sequence:**

1. `[Question 1 / 8]` Опиши проблему подробно. Что не работает или чего не хватает?
2. `[Question 2 / 8]` Что существует сейчас? Какое текущее состояние системы?
3. `[Question 3 / 8]` Как выглядит успех? Что изменится для пользователя?
4. `[Question 4 / 8]` Кто пользователи / акторы этой фичи?
5. `[Question 5 / 8]` Какие фичи обязательны (must-have)?
6. `[Question 6 / 8]` Что явно выходит за рамки этого PRD?
7. `[Question 7 / 8]` Есть ли технические, временные или ресурсные ограничения?
8. `[Question 8 / 8]` Есть ли идеи по реализации или технические предпочтения?

---

## Phase 2: Codebase Exploration

After collecting answers, explore the repo silently to verify claims and understand the current state. Look for existing modules, patterns, and constraints relevant to the feature.

---

## Phase 3: Confirmation

Display a structured recap of everything learned:

```
┌─────────────────────────────────────────┐
│           📝 Interview Summary          │
├─────────────────────────────────────────┤
│ Problem   : <one line>                  │
│ Users     : <one line>                  │
│ Must-have : <bullet list>               │
│ Out of scope: <bullet list>             │
│ Constraints: <one line>                 │
└─────────────────────────────────────────┘
```

Ask: `[Confirmation]` Всё верно? Что нужно уточнить или изменить перед написанием PRD?

Wait for confirmation before proceeding.

---

## Phase 4: Write the PRD

Write the PRD to `docs/plans/prd-<name>.md` using this template:

```md
## Problem Statement

<problem from user's perspective>

## Solution

<solution from user's perspective>

## User Stories

A numbered list of user stories. Each in the format:

1. As a <actor>, I want <feature>, so that <benefit>

(Be exhaustive — cover all aspects of the feature.)

## Implementation Decisions

- Modules to build/modify
- Interface changes
- Architectural decisions
- Schema changes
- API contracts
- Key interactions

Do NOT include specific file paths or code snippets.

## Out of Scope

<what is explicitly excluded>

## Further Notes

<any additional context>
```

After writing, display:

```
✅ PRD written to docs/plans/prd-<name>.md
```