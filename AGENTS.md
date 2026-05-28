# AGENTS.md — Co-Spnd

This repository contains the Co-Spnd project.

Co-Spnd is a minimalist shared finance application consisting of:
- A mobile-first frontend web app
- A NestJS backend API

---

# Repository Structure

```txt
co-spnd/
├── AGENTS.md
├── docs/
│   ├── api-contract.md
│   └── system-prompt.md
│
├── co-spnd-web/     # React + Vite + Tailwind frontend
│
└── co-spnd-api/     # NestJS + MongoDB backend
```

---

# Mandatory Reading Order

Before making ANY code changes:

1. Read:
   - `docs/system-prompt.md`
   - `docs/api-contract.md`

2. Treat these files as:
   - authoritative
   - global constraints
   - product requirements

Do not override or reinterpret them.

---

# Project Goals

The application must remain:
- Minimalist
- Mobile-first
- Fast
- Modern
- Clean
- Easy to maintain

The MVP is intentionally small.

Avoid feature creep.

---

# Frontend Rules

Frontend location:
```txt
co-spnd-web/
```

Frontend stack:
- React
- Vite
- TailwindCSS

Requirements:
- Mobile-first
- Responsive
- Minimal UI
- Reusable components
- Functional components only
- Hooks-based architecture

Do NOT:
- Introduce heavy frameworks
- Add unnecessary global state
- Add complex abstractions
- Hardcode backend responses

Frontend must follow:
```txt
docs/api-contract.md
```

exactly.

---

# Backend Rules

Backend location:
```txt
co-spnd-api/
```

Backend stack:
- NestJS
- MongoDB
- JWT Authentication

Requirements:
- REST API only
- DTO validation
- Workspace-scoped authorization
- Clean module separation
- Transaction ownership enforcement

Do NOT:
- Add GraphQL
- Add websocket infrastructure
- Add unnecessary services
- Add premature abstractions

Backend must match:
```txt
docs/api-contract.md
```

exactly.

---

# Forbidden Features

The following are OUT OF SCOPE:

- Notifications
- Budgets
- Savings goals
- Multi-currency workspaces
- Export functionality
- Offline mode
- AI integrations
- Advanced permissions
- Real-time synchronization

Do not implement them.

---

# UI / UX Direction

The application should feel:
- Calm
- Premium
- Minimal
- Modern

Use:
- White / off-white backgrounds
- Soft neutral colors
- Clean typography
- Consistent spacing
- Subtle shadows
- Rounded corners

Avoid:
- Loud colors
- Heavy gradients
- Dashboard clutter
- Over-animation

---

# Transaction UX Priority

The transaction creation experience is the most important UX flow.

Prioritize:
- Fast entry
- Minimal friction
- One-hand mobile usage

Main visible inputs:
- Amount
- Category

Optional fields:
- Description
- Date
- Spender

Optional fields should remain visually secondary.

---

# Engineering Principles

Always prefer:
- Simplicity
- Readability
- Maintainability
- Incremental implementation

Avoid:
- Over-engineering
- Dead code
- Unused files
- Premature optimization
- Large refactors without need

---

# Before Finishing Any Task

Always verify:
- App builds successfully
- No TypeScript errors
- No lint issues
- No unused imports/files
- Mobile responsiveness works
- API integration matches the contract

---

# Agent Behavior

When implementing features:
1. Read existing code first
2. Reuse existing patterns/components
3. Keep changes focused
4. Avoid unnecessary rewrites
5. Preserve current working behavior

Do not make unrelated changes.

---

# Final Goal

Deliver a production-quality MVP that feels:
- Simple
- Fast
- Intentional
- Trustworthy
- Pleasant to use daily

Keep the codebase lean and clean.