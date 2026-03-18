# UI/UX Redesign Blueprint

This blueprint translates `UI_REDESIGN_REFERENCE.md` into the app-specific IA, interaction model, and implementation standards.

## 1. UX Problem and Goal

### Existing issue
- Setup screen requires long vertical scrolling to finish all selections.
- Users must hold context of many choices at once.
- Start intent is delayed because value proposition and action are mixed in one dense surface.

### Redesign goal
- Split the experience into two clear stages:
1. Landing value proposition and motivation.
2. Guided interactive setup with progressive disclosure.

## 2. New User Journey

### Stage A: Landing Hero (`/`)
- Dark premium hero (`gradient-hero`) with concise value statement.
- Primary CTA: `Start interactive setup`.
- Secondary CTA: `Quick start preset`.
- Optional utility action: `View dashboard`.

### Stage B: Interactive Setup Wizard (same route)
- Step 1: Interview Mode (Standard vs Resume-based).
- Step 2: Topic selection.
- Step 3: Experience level.
- Step 4: Heat mode + question count.
- Step 5: Review + launch.

### Stage C: Interview Run (`/interview`)
- Uses selected preferences via query params.
- Session APIs unchanged.

### Stage D: Results and Progress
- `/result`: report/evaluation cards.
- `/dashboard`: trend and history.

## 3. Interaction Rules Applied

- Progressive disclosure replaces long-scroll decision fatigue.
- Explicit progress (`Step X of 5` + progress rail).
- Validation at step boundary (error shown inline, not globally detached).
- Persistent session summary panel to preserve context.
- Back navigation available at each step and back-to-landing escape route.

## 4. Visual System Implementation Standards

All new and refactored surfaces should use semantic tokens from `app/globals.css`.

### Core tokens
- Color: `--color-primary-dark`, `--color-primary`, `--color-accent`, `--color-surface-light`, `--color-text-primary`, `--color-text-secondary`.
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`.
- Motion: `--motion-fast`, `--motion-normal`, `--motion-slow`, `--motion-exit`.
- Spacing: 8dp scale tokens (`--space-*`).

### Utility classes
- `surface-card`: primary card shell.
- `soft-card`: muted inner surface.
- `primary-btn`: accent CTA button.
- `secondary-btn`: outlined secondary action.
- `interactive-field`: input and upload styling.
- `progress-rail` / `progress-fill`: step progress indicator.

## 5. Accessibility and Quality Bar

- Minimum target size: 44x44.
- Contrast and hierarchy based on reference palette.
- No emoji icons for structural actions.
- Reduced-motion support honored.
- Form controls have visible labels and explicit error text.

## 6. Implementation Scope Completed

- `app/layout.tsx`: streamlined app shell for the redesigned entry experience.
- `app/globals.css`: tokenized premium nature-fintech design foundation.
- `app/page.tsx`: simplified entry to redesigned flow.
- `components/InterviewSetup.tsx`: replaced single long-scroll setup with interactive multi-step wizard and landing-first flow.

## 7. Next Screen Alignment (Recommended)

To complete visual consistency, apply the same token system to:
1. `components/InterviewBox.tsx` (interview workspace shell and controls).
2. `components/InterviewReportCard.tsx` and `components/EvaluationCard.tsx`.
3. `components/DashboardClient.tsx` and chart cards.
