# Requirements Document

## Introduction

This feature modernizes the HiveMind user interface across three surfaces: the web GUI, the CLI, and a new live metrics panel. The web GUI is overhauled to use shadcn and MUI component libraries for a polished, modern look. The CLI is migrated from argparse to Click for a better terminal experience. An in-chat agent handoff system is added so users can switch agents mid-conversation, with the Conductor agent intelligently routing users to the right specialist. Finally, live session metrics (token usage, context window, network stats) are surfaced in both the web GUI and CLI.

## Glossary

- **Chat_Page**: The web page (`chat.html`) where users interact with agents via a WebSocket-based chat interface.
- **Agent_Selector**: A dropdown UI control in the chat page that displays all available agents and allows the user to switch the active agent.
- **Active_Agent**: The agent currently receiving messages from the user in the chat session.
- **Conductor**: The orchestration agent (id: `conductor`) that serves as the default coordinator and can detect user intent to route to specialist agents.
- **Handoff_Suggestion**: A system message displayed in the chat that recommends switching to a specific specialist agent, including confirmation buttons.
- **Agent_Router**: The backend component (`agent_router.py`) responsible for routing messages to the correct agent and detecting handoff intent.
- **Session_Manager**: The backend component (`session_manager.py`) that tracks per-agent conversation history within a user session.
- **WebSocket_Server**: The FastAPI WebSocket endpoint (`/ws/chat`) that handles real-time communication between the frontend and backend.
- **Metrics_Panel**: A UI component (web sidebar or CLI status bar) that displays live session statistics such as token counts, context window usage, and network stats.
- **Click_CLI**: The new CLI built with the Click library, replacing the current argparse-based CLI in `src/cli.py`.
- **MUI_Component**: A React/Material UI component used in the modernized web frontend.
- **shadcn_Component**: A shadcn/ui component used in the modernized web frontend.

## Requirements

### Requirement 1: Default to Conductor Agent

**User Story:** As a user, I want the chat page to default to the Conductor agent when I open it without selecting a specific agent, so that I have an intelligent coordinator to help me find the right specialist.

#### Acceptance Criteria

1. WHEN a user navigates to the Chat_Page without an `agent` query parameter, THE Chat_Page SHALL set the Active_Agent to the Conductor.
2. WHEN a user navigates to the Chat_Page with a valid `agent` query parameter, THE Chat_Page SHALL set the Active_Agent to the specified agent.
3. WHEN a user navigates to the Chat_Page with an invalid `agent` query parameter, THE Chat_Page SHALL set the Active_Agent to the Conductor and display a notification that the requested agent was not found.

### Requirement 2: Agent Selector UI Control

**User Story:** As a user, I want a dropdown in the chat interface that shows all available agents, so that I can manually switch to any agent without leaving the chat page.

#### Acceptance Criteria

1. THE Agent_Selector SHALL display the Active_Agent icon and name in its collapsed state.
2. WHEN the user opens the Agent_Selector, THE Agent_Selector SHALL display a list of all available agents with their icon, name, and role.
3. WHEN the user selects a different agent from the Agent_Selector, THE Chat_Page SHALL change the Active_Agent to the selected agent.
4. WHEN the Active_Agent changes, THE Chat_Page SHALL update the sidebar agent info, capabilities list, and page title to reflect the new Active_Agent.
5. WHEN the Active_Agent changes, THE Chat_Page SHALL send a WebSocket message of type `switch_agent` containing the new agent ID to the WebSocket_Server.

### Requirement 3: Conversation Context Preservation and Cross-Agent Briefing

**User Story:** As a user, I want my conversation history with each agent to be preserved when I switch agents, and I want the option to brief the new agent on what I discussed with other agents, so that all agents stay informed and can act on the latest context.

#### Acceptance Criteria

1. WHEN the Active_Agent changes, THE Chat_Page SHALL store the current chat messages for the previous agent in a local message cache keyed by agent ID.
2. WHEN the Active_Agent changes to an agent with existing cached messages, THE Chat_Page SHALL restore and display those cached messages in the chat area.
3. WHEN the Active_Agent changes to an agent with no cached messages, THE Chat_Page SHALL display a welcome message for that agent.
4. THE Session_Manager SHALL maintain separate conversation histories per agent within the same user session.
5. WHEN the user switches back to a previously visited agent, THE Chat_Page SHALL display a prompt offering to brief the agent on recent conversations with other agents or to continue where they left off.
6. WHEN the user chooses to brief the agent, THE Session_Manager SHALL generate a summary of messages exchanged with other agents since the user last spoke with the current agent and prepend that summary to the next message sent to the Agent_Router.
7. WHEN the user chooses to continue without briefing, THE Chat_Page SHALL resume the conversation with the current agent without injecting cross-agent context.
8. THE Session_Manager SHALL track a per-agent timestamp of the last interaction so that cross-agent summaries only include messages that occurred after that timestamp.

### Requirement 4: Intelligent Handoff Detection

**User Story:** As a user, I want the Conductor agent to detect when I need a specialist and suggest the right agent, so that I get routed to the correct expert without needing to know which agent does what.

#### Acceptance Criteria

1. WHEN the Active_Agent is the Conductor and the user sends a message containing an explicit agent reference (e.g., "talk to security", "switch to deployer"), THE Agent_Router SHALL detect the handoff intent and return a handoff suggestion with the target agent ID.
2. WHEN the Active_Agent is the Conductor and the user sends a message describing a task that matches a specialist agent's capabilities (e.g., "I need to set up monitoring"), THE Agent_Router SHALL detect the handoff intent and return a handoff suggestion with the target agent ID.
3. WHEN the Agent_Router detects a handoff intent, THE WebSocket_Server SHALL send a response of type `handoff_suggestion` containing the target agent ID, agent name, and a reason for the suggestion.
4. IF the Agent_Router fails to determine a matching agent for a handoff request, THEN THE WebSocket_Server SHALL respond with a normal message from the Conductor explaining available agents and their capabilities.

### Requirement 5: Handoff Suggestion UI

**User Story:** As a user, I want to see a clear suggestion when the system recommends switching agents, so that I can confirm or decline the handoff.

#### Acceptance Criteria

1. WHEN the Chat_Page receives a `handoff_suggestion` message, THE Chat_Page SHALL display a Handoff_Suggestion message in the chat area containing the target agent icon, name, and reason.
2. THE Handoff_Suggestion SHALL include an "Accept" button and a "Stay" button.
3. WHEN the user clicks the "Accept" button on a Handoff_Suggestion, THE Chat_Page SHALL switch the Active_Agent to the suggested agent.
4. WHEN the user clicks the "Stay" button on a Handoff_Suggestion, THE Chat_Page SHALL keep the current Active_Agent and dismiss the suggestion.
5. WHEN a Handoff_Suggestion is accepted, THE Chat_Page SHALL add a system message to the chat indicating the agent switch (e.g., "Switched to Sheriff Agent 🛡️").

### Requirement 6: WebSocket Protocol Extension

**User Story:** As a developer, I want the WebSocket protocol to support agent switching and handoff messages, so that the frontend and backend can coordinate agent transitions.

#### Acceptance Criteria

1. WHEN the WebSocket_Server receives a `switch_agent` message with a valid agent ID, THE WebSocket_Server SHALL update the session's active agent and respond with an `agent_switched` message containing the new agent metadata.
2. WHEN the WebSocket_Server receives a `switch_agent` message with an invalid agent ID, THE WebSocket_Server SHALL respond with an `error` message indicating the agent was not found.
3. THE WebSocket_Server SHALL include an `agent_id` field in all `response` messages to identify which agent generated the response.
4. WHEN the Agent_Router returns a handoff suggestion, THE WebSocket_Server SHALL send a `handoff_suggestion` message type to the client containing `target_agent_id`, `target_agent_name`, `target_agent_icon`, and `reason` fields.

### Requirement 7: Visual Feedback for Agent Transitions

**User Story:** As a user, I want clear visual feedback when the active agent changes, so that I always know which agent I am talking to.

#### Acceptance Criteria

1. WHEN the Active_Agent changes, THE Chat_Page SHALL display a system message divider in the chat area showing the new agent's icon and name.
2. WHEN the Active_Agent changes, THE Agent_Selector SHALL update its displayed value with a brief highlight animation.
3. WHEN agent messages are displayed in the chat, THE Chat_Page SHALL use the Active_Agent's icon as the message avatar.

### Requirement 8: Agent Status Indicators

**User Story:** As a user, I want to see which agent is currently working, how long they have been active, and whether they are available, busy, or offline, so that I know when I can interact with them.

#### Acceptance Criteria

1. THE Chat_Page SHALL display a status indicator next to each agent in the Agent_Selector: green for available, amber for busy (currently processing a request), and red for unavailable.
2. WHEN an agent is processing a user message, THE Chat_Page SHALL set that agent's status indicator to busy (amber) until the response is received.
3. WHEN an agent finishes processing and returns a response, THE Chat_Page SHALL set that agent's status indicator back to available (green).
4. THE Chat_Page SHALL display the elapsed time since the Active_Agent started processing the current request, visible in the chat area near the typing indicator.
5. THE WebSocket_Server SHALL include an `agent_status` field in `response` and `agent_switched` messages with values of `available`, `busy`, or `unavailable`.
6. WHEN the WebSocket_Server cannot load or reach an agent, THE WebSocket_Server SHALL report that agent's status as `unavailable` (red).
7. THE Agent_Selector SHALL display the status indicator (green/amber/red dot) next to each agent entry in the dropdown list.

### Requirement 9: Web GUI Modernization with shadcn and MUI

**User Story:** As a user, I want a modern, polished web interface built with industry-standard component libraries, so that the HiveMind GUI feels professional and responsive.

#### Acceptance Criteria

1. THE Chat_Page SHALL use MUI_Component and shadcn_Component libraries for all UI elements including buttons, inputs, dropdowns, cards, and layout containers.
2. THE Chat_Page SHALL replace the current vanilla HTML/CSS agent grid, chat area, sidebar, and form elements with MUI and shadcn equivalents.
3. THE Chat_Page SHALL maintain the existing color palette (primary: #667eea, secondary: #764ba2) and dark mode support through MUI theme configuration.
4. THE Chat_Page SHALL remain responsive across desktop and mobile viewports using MUI's responsive grid system.
5. WHEN the web GUI loads, THE Chat_Page SHALL render all components without layout shifts or unstyled content flashes.

### Requirement 10: CLI Overhaul with Click

**User Story:** As a developer, I want the CLI rebuilt with Click for a cleaner, more consistent terminal experience with better help text and command grouping.

#### Acceptance Criteria

1. THE Click_CLI SHALL replicate all existing CLI commands (deploy, status, analyze, plan, rollback, destroy, update, upgrade, list, reconcile, find-orphans, cleanup, fix-and-retry, preserve, dashboard) as Click commands or command groups.
2. THE Click_CLI SHALL preserve all existing command-line arguments and flags with identical behavior.
3. THE Click_CLI SHALL use Click's built-in help generation for all commands and subcommands.
4. THE Click_CLI SHALL use colored terminal output (via Click's `click.style` or `click.echo`) to distinguish success messages, errors, warnings, and informational output.
5. THE Click_CLI SHALL use progress bars (via Click's `click.progressbar`) for long-running operations such as deployments and stack operations.
6. THE Click_CLI SHALL provide a `hivemind chat` command that opens an interactive terminal chat session with agent selection and switching support.

### Requirement 11: Live Session Metrics

**User Story:** As a power user, I want to see live metrics about my session including token usage, context window consumption, and network statistics, so that I can monitor resource usage in real time.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL track and expose session metrics including total tokens generated, context window tokens used, context window tokens remaining, and total messages exchanged per session.
2. WHEN the WebSocket_Server sends a response, THE WebSocket_Server SHALL include a `metrics` field containing the current session metrics snapshot.
3. THE Metrics_Panel in the Chat_Page SHALL display the following live metrics: total tokens generated this session, context window usage (used/remaining as a progress bar), total messages sent and received, and WebSocket connection latency.
4. THE Metrics_Panel SHALL update in real time as new messages are exchanged.
5. THE Click_CLI interactive chat command SHALL display a compact metrics summary after each agent response showing tokens used and context window remaining.
6. WHEN the context window usage exceeds 80 percent of capacity, THE Metrics_Panel SHALL display a visual warning indicator.
