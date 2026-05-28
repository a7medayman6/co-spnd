## 🚀 Frontend Build Prompt — Co-Spnd Web App

> Use this prompt after the backend is already implemented and the API contract exists at:
>
> `docs/api-contract.md`

---

### 🎯 Frontend Implementation Prompt

Build the complete frontend application for **Co-Spnd** as a **mobile-first web app** using:

* React
* Vite
* TailwindCSS

The frontend must consume the existing backend APIs defined in:

```txt
docs/api-contract.md
```

The frontend should be created inside a new folder:

```txt
co-spnd-web/
```

inside the repository root:

```txt
co-spnd/
```

---

## 1️⃣ Mandatory Reading

Before implementing anything:

* Read `docs/api-contract.md`
* Follow all endpoint contracts exactly
* Do not invent or modify APIs
* Assume the backend is already working

The frontend must adapt to the contract, not the opposite.

---

## 2️⃣ Project Structure

Create the frontend app in:

```txt
co-spnd/co-spnd-web
```

Use:

* Vite
* React
* TailwindCSS

Recommended stack:

* React Router
* Axios or Fetch API
* React Context or lightweight state management
* React Hook Form (optional)
* Recharts or lightweight chart library for analytics

Do not introduce unnecessary frameworks.

---

## 3️⃣ Application Goals

The app should feel:

* Modern
* Minimalist
* Premium
* Mobile-first
* Fast
* Clean
* Calm

The experience should resemble a modern fintech product with:

* Excellent spacing
* Strong typography
* Smooth UX
* Very low friction

---

## 4️⃣ Core Functionalities to Implement

Implement all frontend flows for:

### Authentication

* Register
* Login
* Persist auth session
* Logout

---

### User Profile

* View profile
* Edit profile

---

### Workspaces

* List workspaces
* Create workspace
* Invite users
* View workspace members

---

### Transactions

* List transactions
* Create transaction
* Edit own transaction
* Delete own transaction

Rules:

* Only transaction creators can edit/delete
* Respect backend authorization responses

---

### Analytics

Implement:

* Total spending
* Spending by category
* Spending by user

Filters:

* Monthly
* Custom date range

---

## 5️⃣ Mobile-First UX Rules (Critical)

The app is primarily designed for mobile screens.

Prioritize:

* Thumb-friendly interactions
* Responsive layouts
* Smooth scrolling
* Large tap targets
* Sticky bottom actions where useful

Desktop should still look polished.

---

## 6️⃣ UI / Design Direction

### Visual Style

Use:

* White / off-white backgrounds
* Neutral minimalist colors
* Soft shadows
* Rounded corners
* Clean cards
* Minimal borders

Avoid:

* Loud colors
* Heavy gradients
* Dashboard clutter
* Overly dark interfaces

---

### Typography

* Clean sans-serif typography
* Strong visual hierarchy
* Large headings
* Comfortable spacing

Whitespace is extremely important.

---

### Icons

Use clean outline icons consistently.

Icons should:

* Support usability
* Stay visually subtle
* Never dominate the UI

---

## 7️⃣ Onboarding Flow (Important)

Implement a short onboarding flow:

* 3–4 screens maximum
* Minimal text
* Catchy and modern
* Friendly copy
* Smooth transitions

Communicate:

1. Shared workspaces
2. Fast expense tracking
3. Useful analytics

The onboarding should feel lightweight and premium.

---

## 8️⃣ Transaction Entry Experience (Highest Priority)

The add transaction screen should feel extremely fast.

Main visible inputs:

* Amount
* Category

Optional inputs:

* Description
* Date
* Spender

Optional fields should be hidden under:

* “More”
* Expandable section
* Bottom sheet
* Or accordion

The UX should minimize friction as much as possible.

---

## 9️⃣ Routing & Structure

Implement clean routing for:

* Auth flow
* Workspace flow
* Transactions
* Analytics
* Profile

Create a maintainable folder structure.

Example:

```txt
src/
  components/
  pages/
  layouts/
  services/
  hooks/
  contexts/
  types/
  utils/
```

---

## 🔟 API Integration Rules

* Use the backend contract exactly
* Handle:

  * Loading states
  * Empty states
  * Errors
  * Unauthorized responses
  * Forbidden actions

Do not hardcode mock data.

---

## 1️⃣1️⃣ Tailwind Rules

* Use Tailwind consistently
* Extract reusable UI primitives
* Avoid duplicated utility combinations
* Keep spacing/radius scales consistent

Create reusable:

* Buttons
* Cards
* Inputs
* Modals
* Empty states
* Section headers

---

## 1️⃣2️⃣ Performance & Code Quality

* Functional components only
* Hooks-based architecture
* Avoid unnecessary rerenders
* Remove dead code immediately
* No TODO comments unless unavoidable
* Keep components focused and readable

---

## 1️⃣3️⃣ Final Deliverable

At the end:

* Ensure the frontend builds successfully
* Ensure mobile responsiveness works properly
* Ensure API integration functions correctly
* Stop after MVP completion
* Provide:

  * Folder structure summary
  * Run instructions
  * Main libraries used

Do not add extra features beyond the defined MVP.
