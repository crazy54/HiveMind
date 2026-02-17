# Requirements Document

## Introduction

This feature migrates the remaining legacy HiveMind web GUI pages (agent grid landing page and deployment dashboard) into the existing React + TypeScript + MUI frontend. It also adds client-side routing, a navigation header, and wires the Strands agents to Amazon Bedrock so the chat produces real responses instead of placeholder text. The legacy pages at `hivemind_web/web/js/agents.js` and `hivemind_web/web/js/dashboard.js` will be replaced by React pages that match the existing `ChatPage` patterns.

## Glossary

- **Agent_Grid_Page**: The React page that displays all available HiveMind agents as interactive cards in a responsive grid layout
- **Deployment_Dashboard_Page**: The React page that displays deployment statistics and a list of recent deployments
- **Navigation_Bar**: The persistent header component with links to navigate between the Agent Grid, Chat, and Deployments pages
- **Router**: The client-side routing system using `react-router-dom` that maps URL paths to React page components
- **Agent_Card**: A clickable MUI card component displaying an agent's icon, name, role, description, and capabilities
- **Stat_Card**: An MUI card component displaying a single deployment statistic (icon, count, label)
- **Deployment_Card**: A clickable MUI card component displaying a deployment's ID, status badge, repository, description, and timestamps
- **Status_Badge**: A colored chip/label indicating deployment status (completed, failed, deploying, pending)
- **Agent_Router**: The Python backend class (`AgentRouter`) responsible for routing chat messages to Strands agents
- **Strands_Agent**: A Strands framework AI agent (recon, conductor, janitor) backed by Amazon Bedrock

## Requirements

### Requirement 1: Agent Grid Landing Page

**User Story:** As a user, I want to see all available HiveMind agents displayed as cards on the landing page, so that I can understand each agent's purpose and navigate to chat with one.

#### Acceptance Criteria

1. WHEN the Agent_Grid_Page loads, THE Agent_Grid_Page SHALL fetch the agent list from `GET /api/agents` and display each agent as an Agent_Card
2. WHEN an Agent_Card is rendered, THE Agent_Card SHALL display the agent's icon, name, role, description, and up to three capabilities with a count of remaining capabilities
3. WHEN a user clicks an Agent_Card, THE Router SHALL navigate to the Chat page with the selected agent's ID as a URL parameter
4. WHEN the agent list is empty, THE Agent_Grid_Page SHALL display a message indicating no agents are available
5. IF the `GET /api/agents` request fails, THEN THE Agent_Grid_Page SHALL display an error message and allow the user to retry
6. WHEN an Agent_Card is hovered, THE Agent_Card SHALL display a visual elevation effect and a gradient top border

### Requirement 2: Deployment Dashboard Page

**User Story:** As a user, I want to view deployment statistics and a list of recent deployments, so that I can monitor the status of my deployments at a glance.

#### Acceptance Criteria

1. WHEN the Deployment_Dashboard_Page loads, THE Deployment_Dashboard_Page SHALL fetch deployments from `GET /api/deployments` and compute statistics for total, active (completed/deployed), failed, and in-progress (deploying/pending) counts
2. WHEN statistics are computed, THE Deployment_Dashboard_Page SHALL display four Stat_Cards showing total, active, failed, and in-progress deployment counts
3. WHEN deployments are fetched, THE Deployment_Dashboard_Page SHALL display each deployment as a Deployment_Card showing deployment ID, status badge, repository URL, description, start time, and completion time
4. WHEN a user clicks a Deployment_Card, THE Router SHALL navigate to the Chat page with the conductor agent selected and the deployment ID as a URL parameter
5. WHEN the deployment list is empty, THE Deployment_Dashboard_Page SHALL display a message indicating no deployments are found
6. IF the `GET /api/deployments` request fails, THEN THE Deployment_Dashboard_Page SHALL display an error message and allow the user to retry
7. WHEN a user clicks the refresh button, THE Deployment_Dashboard_Page SHALL re-fetch deployment data and update the display

### Requirement 3: Deployment Status Badge Rendering

**User Story:** As a user, I want deployment statuses displayed as color-coded badges, so that I can quickly identify the state of each deployment.

#### Acceptance Criteria

1. THE Status_Badge SHALL render "completed" and "deployed" statuses with a green (success) color
2. THE Status_Badge SHALL render "failed" status with a red (error) color
3. THE Status_Badge SHALL render "deploying" and "pending" statuses with an amber (warning) color
4. THE Status_Badge SHALL render any unrecognized status with a default (warning) color

### Requirement 4: Navigation Bar

**User Story:** As a user, I want a persistent navigation header across all pages, so that I can easily switch between the Agents, Chat, and Deployments views.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL display the HiveMind logo with a gradient text effect and the tagline "Autonomous AWS Deployment System"
2. THE Navigation_Bar SHALL display navigation links for "Agents" (`/`), "Chat" (`/chat`), and "Deployments" (`/dashboard`)
3. WHEN the current route matches a navigation link, THE Navigation_Bar SHALL visually highlight that link as active with a gradient background
4. WHEN a user clicks a navigation link, THE Router SHALL navigate to the corresponding page without a full page reload

### Requirement 5: Client-Side Routing

**User Story:** As a user, I want URL-based navigation between pages, so that I can bookmark pages and use browser back/forward navigation.

#### Acceptance Criteria

1. THE Router SHALL map `/` to the Agent_Grid_Page, `/chat` to the Chat page, and `/dashboard` to the Deployment_Dashboard_Page
2. WHEN the URL contains a query parameter `agent`, THE Chat page SHALL pre-select the specified agent
3. WHEN the URL contains a query parameter `deployment`, THE Chat page SHALL set the deployment context for the conductor agent
4. WHEN a user navigates to an undefined route, THE Router SHALL redirect to the Agent_Grid_Page

### Requirement 6: Strands Agent Integration

**User Story:** As a user, I want the chat to produce real AI responses from Strands agents backed by Amazon Bedrock, so that I can have meaningful conversations with each agent.

#### Acceptance Criteria

1. WHEN the Agent_Router receives a message for the "recon" agent, THE Agent_Router SHALL invoke the `run_recon_agent` function with the user message and return the agent's response
2. WHEN the Agent_Router receives a message for the "conductor" agent, THE Agent_Router SHALL invoke the `WorkflowConductor` instance with the user message and optional deployment context, and return the agent's response
3. WHEN the Agent_Router receives a message for the "janitor" agent, THE Agent_Router SHALL invoke the `run_janitor_analysis` function with the user message and return the agent's response
4. IF a Strands_Agent invocation raises an exception, THEN THE Agent_Router SHALL return an error response with a descriptive message and log the exception
5. IF a Strands_Agent is not yet implemented for chat, THEN THE Agent_Router SHALL return a message indicating the agent is not available

### Requirement 7: Deployment Statistics Computation

**User Story:** As a developer, I want deployment statistics computed from the raw deployment list, so that the dashboard displays accurate counts.

#### Acceptance Criteria

1. THE Deployment_Dashboard_Page SHALL compute the total count as the length of the deployments array
2. THE Deployment_Dashboard_Page SHALL compute the active count as deployments with status "completed" or "deployed"
3. THE Deployment_Dashboard_Page SHALL compute the failed count as deployments with status "failed"
4. THE Deployment_Dashboard_Page SHALL compute the in-progress count as deployments with status "deploying" or "pending"
5. WHEN the deployments array is empty, THE Deployment_Dashboard_Page SHALL display zero for all statistics

### Requirement 8: Legacy File Cleanup

**User Story:** As a developer, I want all legacy web GUI files and orphaned repo artifacts removed after the React migration is complete, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the React migration is complete, THE Repository SHALL have the legacy files `hivemind_web/web/js/agents.js`, `hivemind_web/web/js/dashboard.js`, `hivemind_web/web/js/chat.js`, and the `hivemind_web/web/js/` directory removed
2. WHEN the React migration is complete, THE Repository SHALL have the legacy files `hivemind_web/web/chat.html` and `hivemind_web/web/dashboard.html` removed
3. WHEN the React migration is complete, THE Repository SHALL have the legacy `hivemind_web/web/css/style.css` file and the `hivemind_web/web/css/` directory removed
4. WHEN the React migration is complete, THE Repository SHALL have the orphaned task summary files (`TASK_11.2_COMPLETION_SUMMARY.md`, `TASK_5.3_IMPLEMENTATION_SUMMARY.md`, `TASK_7.2_VERIFICATION.md`, `TASK_8.3_SUMMARY.md`, `TASK_8.4_COMPLETION_SUMMARY.md`) removed from the project root
5. WHEN the React migration is complete, THE Repository SHALL have the orphaned root-level test files (`test_fix_approval_workflow.py`, `test_retry_limit_tracking.py`, `test_rollback_cli.py`) moved into the `tests/` directory or removed if duplicates exist
6. WHEN the React migration is complete, THE Repository SHALL have the stale documentation files (`WEB_UI_README.md`, `LOGO_INTEGRATION.md`, `AWS_CREDENTIALS_SETUP.md`, `CLOUDFORMATION_VALIDATION_QUICKSTART.md`) consolidated or removed if their content is covered by `README.md`
7. WHEN the React migration is complete, THE Repository SHALL have the test/scratch directories (`test-web-app/`, `test-templates/`, `hello-world-repo/`, `octocat-hello-world/`, `analyzed_repos/`, `repos/`) removed if they are not required by the application
