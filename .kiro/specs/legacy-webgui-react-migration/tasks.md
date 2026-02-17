# Implementation Plan: Legacy WebGUI React Migration

## Overview

Migrate the legacy agent grid and deployment dashboard pages to React, add client-side routing with react-router-dom, wire Strands agents to Bedrock for real chat responses, and clean up legacy/orphaned files. Tasks are ordered so each builds on the previous, with property tests close to the code they validate.

## Tasks

- [x] 1. Install react-router-dom and add new TypeScript interfaces
  - Run `npm install react-router-dom` in `hivemind_web/web/`
  - Run `npm install -D @types/react-router-dom` if needed (check if types are bundled)
  - Add `Deployment`, `DeploymentStats`, `DeploymentsApiResponse`, and `AgentsApiResponse` interfaces to `hivemind_web/web/src/types.ts`
  - _Requirements: 2.1, 2.3, 5.1_

- [x] 2. Create utility functions and their tests
  - [x] 2.1 Create `computeDeploymentStats` in `hivemind_web/web/src/utils/deploymentStats.ts`
    - Pure function: takes `Deployment[]`, returns `DeploymentStats`
    - active = status "completed" or "deployed", failed = "failed", inProgress = "deploying" or "pending"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.2 Write property test for `computeDeploymentStats`
    - **Property 2: Deployment stats computation invariant**
    - **Validates: Requirements 2.1, 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 2.3 Create `getStatusColor` in `hivemind_web/web/src/utils/statusColor.ts`
    - Pure function: maps status string to `'success' | 'error' | 'warning'`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.4 Write property test for `getStatusColor`
    - **Property 4: Status color mapping correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 3. Create shared UI components
  - [x] 3.1 Create `StatusBadge` component in `hivemind_web/web/src/components/StatusBadge.tsx`
    - MUI `Chip` using `getStatusColor` for color prop
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Create `StatCard` component in `hivemind_web/web/src/components/StatCard.tsx`
    - MUI `Card` with icon, count (Typography variant h3), and label
    - _Requirements: 2.2_

  - [x] 3.3 Create `AgentCard` component in `hivemind_web/web/src/components/AgentCard.tsx`
    - MUI `Card` with hover elevation, gradient top border, icon, name, role, description
    - Show up to 3 capabilities with "+N more" overflow
    - onClick navigates to `/chat?agent={id}`
    - _Requirements: 1.2, 1.3, 1.6_

  - [x] 3.4 Write property test for `AgentCard` capability overflow
    - **Property 1: Agent card capability overflow display**
    - **Validates: Requirements 1.2**

  - [x] 3.5 Create `DeploymentCard` component in `hivemind_web/web/src/components/DeploymentCard.tsx`
    - MUI `Card` with deployment ID (monospace), StatusBadge, repo, description, timestamps
    - onClick navigates to `/chat?agent=conductor&deployment={id}`
    - _Requirements: 2.3, 2.4_

  - [x] 3.6 Write property test for `DeploymentCard` field completeness
    - **Property 3: Deployment card field completeness**
    - **Validates: Requirements 2.3**

  - [x] 3.7 Create `NavigationBar` component in `hivemind_web/web/src/components/NavigationBar.tsx`
    - MUI `AppBar` with gradient logo, tagline, nav links (Agents, Chat, Deployments)
    - Highlight active link using `useLocation()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create new pages
  - [x] 5.1 Create `AgentGridPage` in `hivemind_web/web/src/pages/AgentGridPage.tsx`
    - Fetch `GET /api/agents` on mount, render grid of AgentCard components
    - Handle loading, empty, and error states with retry
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 5.2 Write unit tests for `AgentGridPage`
    - Mock fetch, test loading/empty/error states
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 5.3 Create `DeploymentDashboardPage` in `hivemind_web/web/src/pages/DeploymentDashboardPage.tsx`
    - Fetch `GET /api/deployments` on mount, compute stats, render StatCards and DeploymentCards
    - Refresh button, loading/empty/error states
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7_

  - [x] 5.4 Write unit tests for `DeploymentDashboardPage`
    - Mock fetch, test loading/empty/error/refresh states
    - _Requirements: 2.1, 2.5, 2.6, 2.7_

- [x] 6. Wire up routing in App.tsx
  - [x] 6.1 Update `App.tsx` with `BrowserRouter`, `Routes`, and `NavigationBar`
    - Route `/` → AgentGridPage, `/chat` → ChatPage, `/dashboard` → DeploymentDashboardPage
    - Catch-all `*` → `Navigate to="/"`
    - _Requirements: 5.1, 5.4_

  - [x] 6.2 Update `ChatPage` to read `agent` and `deployment` query params from URL
    - Use `useSearchParams()` to read params and pass to existing logic
    - _Requirements: 5.2, 5.3_

  - [x] 6.3 Write property test for unknown route redirect
    - **Property 5: Unknown route redirect**
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Wire Strands agents to Bedrock in AgentRouter
  - [x] 8.1 Update `route_message` in `hivemind_web/agent_router.py`
    - Replace canned response with actual agent invocation for recon, conductor, janitor
    - For recon: call `agent(message)` where agent is `run_recon_agent`
    - For conductor: call `agent.process_message(message, context)` or equivalent method
    - For janitor: call `agent(message)` where agent is `run_janitor_analysis`
    - Wrap in try/except, return error response on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.2 Write property tests for agent router error handling
    - **Property 6: Agent router error handling**
    - **Property 7: Unknown agent returns unavailable**
    - **Validates: Requirements 6.4, 6.5**

- [x] 9. Checkpoint - Ensure all tests pass (frontend + backend)
  - Run `cd hivemind_web/web && npm test -- --silent` for frontend
  - Run `pytest tests/ -q` for backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Clean up legacy files and repo artifacts
  - [x] 10.1 Remove legacy web GUI files
    - Delete `hivemind_web/web/js/agents.js`, `hivemind_web/web/js/dashboard.js`, `hivemind_web/web/js/chat.js`
    - Delete `hivemind_web/web/js/` directory
    - Delete `hivemind_web/web/chat.html`, `hivemind_web/web/dashboard.html`
    - Delete `hivemind_web/web/css/style.css` and `hivemind_web/web/css/` directory
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 10.2 Remove orphaned task summary files from project root
    - Delete `TASK_11.2_COMPLETION_SUMMARY.md`, `TASK_5.3_IMPLEMENTATION_SUMMARY.md`, `TASK_7.2_VERIFICATION.md`, `TASK_8.3_SUMMARY.md`, `TASK_8.4_COMPLETION_SUMMARY.md`
    - _Requirements: 8.4_

  - [x] 10.3 Move or remove orphaned root-level test files
    - Move `test_fix_approval_workflow.py`, `test_retry_limit_tracking.py`, `test_rollback_cli.py` into `tests/` directory (or remove if duplicates exist there)
    - _Requirements: 8.5_

  - [x] 10.4 Remove stale documentation files
    - Remove `WEB_UI_README.md`, `LOGO_INTEGRATION.md`, `AWS_CREDENTIALS_SETUP.md`, `CLOUDFORMATION_VALIDATION_QUICKSTART.md` if their content is covered by `README.md`
    - _Requirements: 8.6_

  - [x] 10.5 Remove test/scratch directories
    - Remove `test-web-app/`, `test-templates/`, `hello-world-repo/`, `octocat-hello-world/`, `analyzed_repos/`, `repos/` if not required by the application
    - _Requirements: 8.7_

- [x] 11. Final checkpoint - Verify clean build and all tests pass
  - Run `cd hivemind_web/web && npm run build` to verify the React app builds
  - Run `cd hivemind_web/web && npm test -- --silent` for frontend tests
  - Run `pytest tests/ -q` for backend tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check for TS, hypothesis for Python)
- Unit tests validate specific examples and edge cases
- The backend SPA catch-all in `server.py` already supports client-side routing — no backend route changes needed
