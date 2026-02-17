# Implementation Plan: Agent Handoff UI

## Overview

This plan implements the agent handoff UI feature in incremental steps: backend handoff logic first, then WebSocket protocol extensions, then React frontend migration, CLI overhaul, and finally live metrics. Each step builds on the previous and includes testing sub-tasks.

## Tasks

- [x] 1. Implement HandoffDetector and extend Agent Router
  - [x] 1.1 Create HandoffDetector class in `hivemind_web/agent_router.py`
    - Add `EXPLICIT_KEYWORDS` dict mapping agent name/role keywords to agent IDs (e.g., "security" → "sheriff", "monitoring" → "ops")
    - Add `CAPABILITY_MAP` dict mapping capability phrases to agent IDs
    - Implement `detect_handoff(message, current_agent_id)` method that returns `HandoffResult` or `None`
    - Only detect handoff when `current_agent_id` is `conductor`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 1.2 Write property test for explicit keyword handoff detection
    - **Property 10: Explicit keyword handoff detection**
    - **Validates: Requirements 4.1**

  - [x] 1.3 Write property test for capability-based handoff detection
    - **Property 11: Capability-based handoff detection**
    - **Validates: Requirements 4.2**

  - [x] 1.4 Write property test for no-match fallback
    - **Property 13: Failed handoff falls back to Conductor response**
    - **Validates: Requirements 4.4**

- [x] 2. Extend Session Manager with cross-agent briefing
  - [x] 2.1 Add `last_interaction_at` field to `AgentSession` dataclass in `hivemind_web/session_manager.py`
    - Update `add_message` to refresh `last_interaction_at`
    - _Requirements: 3.8_

  - [x] 2.2 Implement `generate_cross_agent_summary` method on `SessionManager`
    - Accept `session_id` and `target_agent_id`
    - Collect messages from all other agent sessions that occurred after `target_agent_id`'s `last_interaction_at`
    - Return a formatted text summary or `None` if no new cross-agent activity
    - _Requirements: 3.6_

  - [x] 2.3 Write property test for per-agent session isolation
    - **Property 7: Session Manager maintains per-agent isolation**
    - **Validates: Requirements 3.4**

  - [x] 2.4 Write property test for cross-agent summary accuracy
    - **Property 8: Cross-agent briefing summary accuracy**
    - **Validates: Requirements 3.6, 3.8**

- [x] 3. Implement MetricsTracker
  - [x] 3.1 Create `hivemind_web/metrics_tracker.py` with `SessionMetrics` dataclass and `MetricsTracker` class
    - Track: `total_tokens_generated`, `context_window_used`, `context_window_capacity`, `total_messages_sent`, `total_messages_received`, `last_response_latency_ms`, `session_start_time`
    - Implement `record_message_sent`, `record_response`, `get_metrics` methods
    - _Requirements: 11.1_

  - [x] 3.2 Write property test for metrics accuracy
    - **Property 24: Metrics accuracy in responses**
    - **Validates: Requirements 11.1, 11.2**

  - [x] 3.3 Write property test for context window warning threshold
    - **Property 26: Context window warning threshold**
    - **Validates: Requirements 11.6**

- [x] 4. Checkpoint - Backend logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend WebSocket server protocol
  - [x] 5.1 Add `switch_agent` message handler in `hivemind_web/server.py`
    - Validate agent ID against `AGENT_METADATA`
    - On valid: respond with `agent_switched` message containing full agent metadata and status
    - On invalid: respond with `error` message
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Integrate HandoffDetector into the `message` handler
    - When `agent_id` is `conductor`, run `detect_handoff` on the message
    - If handoff detected: send `handoff_suggestion` message with `target_agent_id`, `target_agent_name`, `target_agent_icon`, `reason`
    - If no handoff: route to agent normally
    - Include `agent_id` and `agent_status` fields in all `response` messages
    - _Requirements: 4.3, 6.3, 6.4, 8.5_

  - [x] 5.3 Integrate MetricsTracker into the WebSocket message handler
    - Call `record_message_sent` on incoming messages
    - Call `record_response` on outgoing responses with token count and latency
    - Include `metrics` field in all `response` messages
    - _Requirements: 11.2_

  - [x] 5.4 Add `include_briefing` support to the `message` handler
    - When `include_briefing` is true, call `generate_cross_agent_summary` and prepend to the message sent to the agent
    - _Requirements: 3.6, 3.7_

  - [x] 5.5 Add agent status tracking
    - Set agent status to `busy` when processing, `available` on response, `unavailable` on load failure
    - Include `agent_status` in `response` and `agent_switched` messages
    - _Requirements: 8.2, 8.3, 8.5, 8.6_

  - [x] 5.6 Write property test for valid switch returns metadata
    - **Property 16: Valid switch_agent returns agent metadata**
    - **Validates: Requirements 6.1**

  - [x] 5.7 Write property test for invalid switch returns error
    - **Property 17: Invalid switch_agent returns error**
    - **Validates: Requirements 6.2**

  - [x] 5.8 Write property test for response message required fields
    - **Property 18: Response messages contain agent_id and agent_status**
    - **Validates: Requirements 6.3, 8.5**

  - [x] 5.9 Write property test for handoff suggestion format
    - **Property 12: Handoff detection produces valid suggestion message**
    - **Validates: Requirements 4.3, 6.4**

- [x] 6. Checkpoint - WebSocket protocol complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Scaffold React frontend with Vite + MUI + shadcn
  - [x] 7.1 Initialize React project in `hivemind_web/web/` using Vite with TypeScript template
    - Install dependencies: `react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`
    - Install shadcn/ui dependencies and initialize
    - Configure MUI theme with existing color palette (primary: #667eea, secondary: #764ba2) and dark mode
    - Configure Vite to build to a `dist/` directory
    - Update FastAPI `server.py` to serve from the built `dist/` directory
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Create TypeScript types and interfaces
    - Define `AgentInfo`, `ChatMessage`, `HandoffSuggestion`, `SessionMetrics`, `ChatState` interfaces
    - _Requirements: 9.1_

  - [x] 7.3 Create `useWebSocket` custom hook
    - Port WebSocket connection logic from `chat.js` to a React hook
    - Handle connect, message, switch_agent, set_deployment message types
    - Handle reconnection with exponential backoff
    - Return: `sendMessage`, `switchAgent`, `connected`, `sessionId`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Implement core React chat components
  - [x] 8.1 Create AgentSelector component
    - MUI `Select` with custom `MenuItem` rendering: icon, name, role, StatusIndicator dot
    - Collapsed state shows active agent icon + name
    - `onAgentChange` callback
    - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.7_

  - [x] 8.2 Create StatusIndicator component
    - Small colored dot: green (`available`), amber (`busy`), red (`unavailable`)
    - Accept `status` prop
    - _Requirements: 8.1, 8.7_

  - [x] 8.3 Create ChatArea component with message rendering
    - Render list of `ChatMessage` objects
    - User messages aligned right with gradient background
    - Agent messages aligned left with agent icon avatar
    - System messages (agent switch dividers) centered
    - Auto-scroll to bottom on new messages
    - _Requirements: 7.1, 7.3_

  - [x] 8.4 Create HandoffSuggestionCard component
    - shadcn Card displayed inline in message list
    - Shows target agent icon, name, reason
    - "Accept" (primary) and "Stay" (secondary) buttons
    - `onAccept` and `onDecline` callbacks
    - _Requirements: 5.1, 5.2_

  - [x] 8.5 Create BriefingPrompt component
    - shadcn AlertDialog shown when switching back to a previously visited agent
    - "Brief this agent" and "Continue where I left off" options
    - `onBrief` and `onContinue` callbacks
    - _Requirements: 3.5_

  - [x] 8.6 Create MetricsPanel component
    - MUI Paper in sidebar
    - Display: tokens generated (counter), context window (MUI LinearProgress), messages exchanged, latency
    - Warning indicator when context usage > 80%
    - _Requirements: 11.3, 11.4, 11.6_

  - [x] 8.7 Write property test for agent selector rendering
    - **Property 3: Agent Selector displays all agents with required fields**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 8.8 Write property test for status indicator colors
    - **Property 19: Status indicator reflects agent status**
    - **Validates: Requirements 8.1, 8.7**

  - [x] 8.9 Write property test for metrics panel display
    - **Property 25: Metrics panel displays all required fields**
    - **Validates: Requirements 11.3, 11.4**

- [x] 9. Implement ChatPage with state management and agent switching
  - [x] 9.1 Create ChatPage root component
    - Manage `ChatState` with React state/context
    - Wire AgentSelector, ChatArea, Sidebar, MetricsPanel, HandoffSuggestionCard, BriefingPrompt
    - Default active agent to `conductor` when no `agent` query param
    - Fall back to `conductor` for invalid agent param with notification
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.2 Implement message cache and agent switching logic
    - On agent switch: save current messages to `messageCache[prevAgentId]`, load `messageCache[newAgentId]`
    - Show welcome message for agents with no cached messages
    - Show BriefingPrompt when switching back to a previously visited agent
    - Send `switch_agent` WebSocket message on switch
    - Add system message divider on agent change
    - _Requirements: 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 7.1_

  - [x] 9.3 Implement handoff suggestion handling
    - On `handoff_suggestion` WebSocket message: render HandoffSuggestionCard in chat
    - Accept: switch agent, add system message
    - Decline: dismiss card, keep current agent
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 9.4 Implement agent status tracking in frontend
    - Set agent status to `busy` on message send, `available` on response
    - Update from `agent_status` field in WebSocket messages
    - Display elapsed processing time near typing indicator
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 9.5 Write property test for default agent resolution
    - **Property 1: Invalid or missing agent parameter defaults to Conductor**
    - **Property 2: Valid agent parameter resolves correctly**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 9.6 Write property test for message cache round-trip
    - **Property 6: Message cache round-trip preservation**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 9.7 Write property test for handoff accept/decline
    - **Property 14: Handoff accept switches agent**
    - **Property 15: Handoff decline preserves current agent**
    - **Validates: Requirements 5.3, 5.4, 5.5**

  - [x] 9.8 Write property test for agent status transitions
    - **Property 20: Agent status transitions during message processing**
    - **Validates: Requirements 8.2, 8.3**

- [x] 10. Checkpoint - React frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Migrate CLI to Click
  - [x] 11.1 Create `src/cli_click.py` with Click command group
    - Define `@click.group()` for `hivemind` with help text matching current argparse description
    - Migrate all existing commands: deploy, status, analyze, plan, rollback, destroy, update, upgrade, list, reconcile, find-orphans, cleanup, fix-and-retry, preserve, dashboard
    - Preserve all arguments, options, and flags with identical names and behavior
    - Use `click.style` for colored output (green=success, red=error, yellow=warning, blue=info)
    - Use `click.progressbar` for long-running operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 11.2 Implement `hivemind chat` Click command
    - `@click.option('--agent', '-a', default='conductor')` for initial agent
    - REPL loop reading user input with `click.prompt`
    - `/switch <agent_id>` command for agent switching
    - Colored agent responses
    - Compact metrics summary after each response (tokens used, context remaining)
    - _Requirements: 10.6, 11.5_

  - [x] 11.3 Update `bin/hivemind` and `bin/hm` entry points to use Click CLI
    - Point entry scripts to `src/cli_click.py:main`
    - _Requirements: 10.1_

  - [x] 11.4 Write property test for CLI command parity
    - **Property 22: CLI command parity**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 11.5 Write property test for CLI help generation
    - **Property 23: CLI help generation**
    - **Validates: Requirements 10.3**

- [x] 12. Checkpoint - CLI migration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration wiring and final polish
  - [x] 13.1 Update FastAPI server to serve React build output
    - Mount Vite `dist/` directory for static files
    - Serve `index.html` for all non-API routes (SPA routing)
    - _Requirements: 9.1_

  - [x] 13.2 Wire briefing flow end-to-end
    - Frontend BriefingPrompt → `include_briefing: true` in WebSocket message → server calls `generate_cross_agent_summary` → prepends to agent message
    - _Requirements: 3.5, 3.6, 3.7_

  - [x] 13.3 Write property test for no-briefing sends clean message
    - **Property 9: Continue without briefing injects no context**
    - **Validates: Requirements 3.7**

  - [x] 13.4 Write property test for unreachable agent status
    - **Property 21: Unreachable agent reports unavailable status**
    - **Validates: Requirements 8.6**

  - [x] 13.5 Write unit tests for edge cases
    - Empty conversation history returns welcome message (Req 3.3)
    - Handoff suggestion card renders Accept and Stay buttons (Req 5.2)
    - MUI theme color palette matches design spec (Req 9.3)
    - CLI colored output contains ANSI codes for different message types (Req 10.4)
    - `hivemind chat` command exists and accepts `--agent` (Req 10.6)
    - CLI metrics summary after agent response (Req 11.5)

- [x] 14. Final checkpoint - All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using Hypothesis (Python) and fast-check (TypeScript)
- Unit tests validate specific examples and edge cases
- The React migration (tasks 7-9) is the largest chunk — the backend work (tasks 1-6) can be validated independently first
