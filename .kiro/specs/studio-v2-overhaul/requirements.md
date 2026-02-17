# Requirements Document

## Introduction

This document specifies the requirements for a major evolution of the HiveMind web application's Studio page and overall UI. The overhaul encompasses six themes: (1) a complete light mode rework with production-quality contrast and readability, (2) replacing the mock chat engine with real LLM backend connections via the existing WebSocket infrastructure and API settings, (3) transforming the Studio into the primary hub with Agents, Chat, and Deployments views, (4) full adoption of Ant Design across the entire application (removing MUI), (5) user-selectable Ant Design theme presets persisted to localStorage, and (6) visual polish with glass morphism, smooth animations, premium typography, and micro-interactions. The existing Infrastructure Studio spec (`infrastructure-studio-react`) serves as the baseline — this spec builds on top of it.

## Glossary

- **Studio_Page**: The React page component at route `/studio` that serves as the primary hub for the entire HiveMind application
- **Chat_Service**: The frontend service layer that connects to real LLM backends (Amazon Bedrock, Claude API, ChatGPT API) via the existing WebSocket endpoint at `/ws/chat`
- **Chat_View**: The main chat interface within the Studio for conversing with HiveMind agents about infrastructure design, troubleshooting, and operations
- **Agents_View**: The Studio view displaying all HiveMind agents, their status, capabilities, and providing direct interaction entry points
- **Deployments_View**: The Studio view for tracking deployment history, status, logs, and managing active deployments
- **View_Switcher**: The navigation mechanism within the Studio center stage area that switches between Agents, Chat, and Deployments views
- **Theme_Engine**: The Ant Design ConfigProvider-based theming system that manages dark/light mode and color palette presets across the entire application
- **Theme_Preset**: A named color palette configuration (e.g., "Geek Blue", "Sunset Orange") that customizes Ant Design token values independently of dark/light mode
- **User_Settings_Panel**: A settings panel accessible from the Studio where users can select theme presets and configure preferences
- **Light_Theme**: The light mode color scheme with production-quality contrast ratios, readable text, and proper component styling
- **Dark_Theme**: The dark mode color scheme with the existing gold (#D4AF37) accent and dark backgrounds
- **Streaming_Response**: An LLM response delivered incrementally via the WebSocket connection, rendered token-by-token in the Chat_View
- **Agent_Card**: A visual card component displaying an agent's name, icon, role, status, and capabilities
- **Deployment_Record**: A data object representing a single deployment with its ID, status, timestamp, stack events, and outputs
- **Antd_Global_Provider**: The application-level Ant Design ConfigProvider that wraps the entire app, replacing the Studio-scoped provider and all MUI usage
- **WebSocket_Connection**: The existing WebSocket connection at `/ws/chat` managed by the `useWebSocket` hook, used for real-time agent communication
- **Message_Stream**: A sequence of partial response tokens received over the WebSocket connection during a streaming LLM response
- **Conversation_Context**: The collection of previous messages in a chat session that provides context for LLM responses
- **Log_Viewer**: The component within the Studio that displays CloudWatch log events in a scrollable, filterable, monospace-formatted view
- **Landing_Page**: The animated introduction page shown on first visit, featuring the HiveMind logo animation and interactive tutorial walkthrough
- **Tutorial_Walkthrough**: The step-by-step interactive guide that introduces users to each major Studio feature with Previous/Next/Skip navigation
- **Documentation_Section**: The FumaDocs-powered documentation hosted at `/docs` within the application, covering all Studio features and capabilities

## Requirements

### Requirement 1: Full Ant Design Adoption Across the Application

**User Story:** As a developer, I want the entire HiveMind web application to use Ant Design as the sole UI component library, so that the UI is consistent and the MUI dependency can be removed.

#### Acceptance Criteria

1. THE Antd_Global_Provider SHALL wrap the entire application (all routes) with Ant Design's ConfigProvider, replacing the Studio-scoped ConfigProvider
2. WHEN the application renders any page (Agents, Chat, Deployments, Studio), THE application SHALL use only Ant Design components for all buttons, inputs, tables, navigation, cards, modals, and layout elements
3. THE NavigationBar SHALL be reimplemented using Ant Design Menu and Layout.Header components, preserving all existing navigation links and active-state styling
4. WHEN the MUI migration is complete, THE application SHALL have zero imports from `@mui/material`, `@mui/icons-material`, `@emotion/react`, or `@emotion/styled`
5. THE application SHALL use `@ant-design/icons` for all iconography throughout the application
6. WHEN Ant Design components are used, THE application SHALL follow Ant Design's recommended patterns for form layout, spacing, and responsive behavior

### Requirement 2: Light Mode Complete Rework

**User Story:** As a user, I want the light mode to have production-quality readability with proper contrast ratios, so that I can comfortably use the application in well-lit environments.

#### Acceptance Criteria

1. WHILE in light mode, THE Light_Theme SHALL configure text colors with a minimum contrast ratio of 4.5:1 against their background surfaces for all body text
2. WHILE in light mode, THE Light_Theme SHALL use dark text (#1a1a1a or darker) on light backgrounds (#ffffff or similar) for all primary content
3. WHILE in light mode, THE Light_Theme SHALL style cards and containers with subtle borders (#e8e8e8 or similar) and light shadows instead of relying on background color differentiation alone
4. WHILE in light mode, THE Light_Theme SHALL style the NavigationBar with a light background and dark text that maintains readability
5. WHILE in light mode, THE Light_Theme SHALL style code blocks with a light gray background (#f5f5f5 or similar) and dark monospace text
6. WHILE in light mode, THE Light_Theme SHALL style chat messages with distinct visual differentiation between user and assistant messages using background tints rather than text color changes
7. WHILE in light mode, THE Light_Theme SHALL style all interactive elements (buttons, links, inputs) with visible borders or backgrounds that indicate interactivity
8. WHILE in light mode, THE Light_Theme SHALL configure the Ant Design token overrides for `colorText`, `colorTextSecondary`, `colorBgContainer`, `colorBorder`, and `colorBgLayout` to produce readable combinations
9. WHILE in light mode, THE Studio_Page SHALL replace the dark background gradient with a clean light background (#f0f2f5 or similar) and adjust the gold accent bar to remain visible against the light surface
10. IF a component uses custom inline styles or CSS that override Ant Design tokens, THEN THE component SHALL provide both dark and light mode variants that maintain readability

### Requirement 3: Real LLM Chat Backend Integration

**User Story:** As a user, I want the Studio chat to connect to real LLM providers (Amazon Bedrock, Claude API, ChatGPT API) using the API settings in the configuration panel, so that I can have meaningful conversations with HiveMind agents about infrastructure design.

#### Acceptance Criteria

1. WHEN a user sends a message in the Chat_View, THE Chat_Service SHALL transmit the message over the existing WebSocket_Connection at `/ws/chat` to the backend agent router instead of using the local mock Chat_Engine
2. WHEN the backend returns a response via the WebSocket_Connection, THE Chat_View SHALL display the agent response in the message history with the correct agent identity (name, icon)
3. WHEN the backend streams a response, THE Chat_View SHALL render tokens incrementally as a Streaming_Response, updating the assistant message in real-time
4. WHILE a Streaming_Response is in progress, THE Chat_View SHALL display a typing indicator and disable the send button to prevent concurrent messages
5. WHEN the user has configured API settings (Bedrock endpoint, Claude API key, or ChatGPT API key) in the configuration panel, THE Chat_Service SHALL include the active provider selection when sending messages so the backend can route to the correct LLM
6. IF the WebSocket_Connection is lost, THEN THE Chat_Service SHALL display a connection status indicator and attempt reconnection using the existing exponential backoff strategy in the `useWebSocket` hook
7. IF the backend returns an error response (agent unavailable, API key invalid, rate limit exceeded), THEN THE Chat_View SHALL display the error as a system message in the chat history with a distinct visual style
8. THE Chat_View SHALL maintain Conversation_Context by sending conversation history with each message so the LLM can provide contextually relevant responses
9. WHEN the user clicks "Reset Session", THE Chat_Service SHALL clear the local message history and create a new WebSocket session
10. THE Chat_Service SHALL support switching between HiveMind agents (recon, conductor, janitor) within the same chat session using the existing `switch_agent` WebSocket message type

### Requirement 4: Studio as the Primary Hub — View Switcher

**User Story:** As a user, I want the Studio to be the primary interface for the entire HiveMind application with integrated Agents, Chat, and Deployments views, so that I can access all functionality from a single cohesive workspace.

#### Acceptance Criteria

1. THE Studio_Page SHALL display a View_Switcher in the center stage area that allows navigation between Agents_View, Chat_View, and Deployments_View
2. THE View_Switcher SHALL use an Ant Design Segmented control or tab-style navigation with animated transitions between views
3. WHEN the user selects a view in the View_Switcher, THE Studio_Page SHALL render the corresponding view content in the center stage area with a smooth crossfade or slide animation
4. THE Studio_Page SHALL retain the existing Architecture, Template, and Cost sub-views as secondary views accessible within the Chat_View context (when the user is actively designing infrastructure)
5. WHEN the Studio_Page first loads, THE View_Switcher SHALL default to the Chat_View
6. THE View_Switcher SHALL display unread notification badges on views that have pending updates (e.g., a deployment status change on the Deployments_View)

### Requirement 5: Studio Hub — Agents View

**User Story:** As a user, I want to see all HiveMind agents, their status, and capabilities in the Studio, so that I can understand what agents are available and interact with them directly.

#### Acceptance Criteria

1. THE Agents_View SHALL display a grid of Agent_Card components, one for each available HiveMind agent retrieved from the `/api/agents` endpoint
2. WHEN the Agents_View loads, THE Agents_View SHALL fetch the agent list from the backend API and display each agent's name, icon, role, capabilities, and current status
3. WHEN an agent's status changes (available, busy, unavailable), THE Agent_Card SHALL update its status indicator in real-time via the WebSocket_Connection
4. WHEN the user clicks an Agent_Card, THE Studio_Page SHALL switch to the Chat_View with that agent pre-selected as the active conversation partner
5. THE Agent_Card SHALL display the agent's capabilities as tags or chips using Ant Design Tag components
6. IF the backend API is unreachable, THEN THE Agents_View SHALL display a connection error message with a retry button

### Requirement 6: Studio Hub — Deployments View

**User Story:** As a user, I want to track deployment history, status, and logs within the Studio, so that I can monitor and manage active deployments without leaving the workspace.

#### Acceptance Criteria

1. THE Deployments_View SHALL display a list of Deployment_Record items retrieved from the `/api/deployments` endpoint, sorted by timestamp (newest first)
2. WHEN a Deployment_Record is displayed, THE Deployments_View SHALL show the deployment ID, status (pending, in-progress, complete, failed), timestamp, and associated stack name
3. WHEN the user clicks a Deployment_Record, THE Deployments_View SHALL expand an inline detail panel showing stack events, outputs, and logs
4. WHILE a deployment is in-progress, THE Deployment_Record SHALL display a live progress indicator that updates via polling or WebSocket events
5. THE Deployments_View SHALL provide a "Deploy New" button that switches to the Chat_View and initiates an infrastructure design conversation
6. IF no deployments exist, THEN THE Deployments_View SHALL display an empty state message encouraging the user to start their first deployment

### Requirement 7: Ant Design Theme Presets in User Settings

**User Story:** As a user, I want to choose from theme presets (color palettes) in a settings panel and have my choice persist, so that I can personalize the application's appearance independently of dark/light mode.

#### Acceptance Criteria

1. THE User_Settings_Panel SHALL be accessible from the Studio's left icon rail or top bar via a settings icon
2. THE User_Settings_Panel SHALL display a dropdown of Theme_Preset options including: Default Gold, Geek Blue, Sunset Orange, Nature Green, Cyber Purple, and Midnight Teal
3. WHEN the user selects a Theme_Preset and clicks "Apply", THE Theme_Engine SHALL update the Ant Design ConfigProvider token values (colorPrimary, colorLink, colorInfo) to match the selected preset
4. THE Theme_Engine SHALL persist the selected Theme_Preset name to localStorage under the key `hivemind-theme-preset`
5. WHEN the application loads, THE Theme_Engine SHALL read the persisted Theme_Preset from localStorage and apply it before the first render
6. THE Theme_Preset selection SHALL be independent of the dark/light mode toggle — changing the preset SHALL update accent colors in both modes
7. WHEN a Theme_Preset is applied, THE Theme_Engine SHALL update all Ant Design components globally (buttons, links, active states, selection highlights, progress bars) to use the new primary color
8. THE User_Settings_Panel SHALL display a live preview swatch showing the primary, secondary, and accent colors of the selected preset before applying

### Requirement 8: Visual Polish — Animations and Micro-Interactions

**User Story:** As a user, I want the application to feel sleek and premium with smooth animations, glass morphism effects, and polished micro-interactions, so that the experience matches a high-end DevOps product.

#### Acceptance Criteria

1. WHEN views transition in the View_Switcher, THE Studio_Page SHALL animate the content change with a smooth crossfade or slide transition lasting 200-300ms
2. WHEN cards or interactive elements are hovered, THE element SHALL display a subtle elevation change (shadow increase) and scale transform (1.01-1.02x) with a 150ms ease transition
3. THE Chat_View message list SHALL animate new messages sliding in from the bottom with a fade-in effect
4. WHEN the chat drawer opens or closes, THE drawer SHALL animate with a slide-in/slide-out transition combined with the existing glass morphism backdrop blur
5. THE bottom dock SHALL use a frosted glass effect (backdrop-filter: blur) with subtle transparency
6. WHEN action buttons in the bottom dock are clicked, THE button SHALL display a brief ripple or pulse animation as feedback
7. THE application SHALL use a consistent font stack with Inter or system-ui as the primary font, with proper font-weight hierarchy (300 for body, 500 for labels, 700 for headings)
8. WHEN the deployment overlay appears, THE overlay SHALL fade in with a cinematic dark backdrop and resource nodes SHALL animate sequentially as they transition through creation states
9. THE application SHALL use consistent spacing based on an 8px grid system (8, 16, 24, 32, 48px) for margins, padding, and gaps
10. WHEN loading states occur, THE application SHALL display skeleton placeholders (Ant Design Skeleton) instead of blank areas or spinner-only states

### Requirement 9: Theme Engine Architecture

**User Story:** As a developer, I want the theme engine to manage dark/light mode and color presets through a single React context, so that all components receive consistent theme values without prop drilling.

#### Acceptance Criteria

1. THE Theme_Engine SHALL expose a React context providing the current ThemeMode (dark/light), the active Theme_Preset, and functions to toggle mode and change preset
2. THE Theme_Engine SHALL compute the full Ant Design theme token object by combining the mode algorithm (darkAlgorithm or defaultAlgorithm) with the active Theme_Preset color values
3. WHEN the ThemeMode changes, THE Theme_Engine SHALL persist the mode to localStorage under the key `hivemind-theme-mode`
4. WHEN the application loads, THE Theme_Engine SHALL read both `hivemind-theme-mode` and `hivemind-theme-preset` from localStorage and apply them before the first visible render
5. THE Theme_Engine SHALL define each Theme_Preset as a named object containing at minimum: colorPrimary, colorSuccess, colorWarning, colorError, and colorInfo token values
6. FOR ALL Theme_Preset objects, THE Theme_Engine SHALL produce a valid Ant Design theme configuration that can be passed to ConfigProvider without runtime errors (round-trip property)

### Requirement 10: Chat Message Serialization and Context Management

**User Story:** As a developer, I want chat messages to be serializable and conversation context to be managed consistently, so that messages can be persisted, restored, and sent to the backend reliably.

#### Acceptance Criteria

1. THE Chat_Service SHALL serialize ChatMessage objects to JSON for transmission over the WebSocket_Connection
2. THE Chat_Service SHALL deserialize incoming WebSocket response payloads into ChatMessage objects with correct role, content, timestamp, and agent identity fields
3. FOR ALL valid ChatMessage objects, serializing to JSON and then deserializing SHALL produce an equivalent ChatMessage object (round-trip property)
4. THE Chat_Service SHALL maintain an ordered array of ChatMessage objects as the Conversation_Context, appending new messages in chronological order
5. WHEN the Conversation_Context exceeds 50 messages, THE Chat_Service SHALL send only the most recent 20 messages as context with new requests to manage token limits
6. IF a ChatMessage contains special characters (unicode, code blocks, markdown), THEN THE serialization SHALL preserve the content exactly without corruption

### Requirement 11: Deployment Record Data Management

**User Story:** As a developer, I want deployment records to be fetched, parsed, and displayed consistently, so that the Deployments_View shows accurate and up-to-date information.

#### Acceptance Criteria

1. THE Deployments_View SHALL fetch deployment records from the `/api/deployments` endpoint and parse the JSON response into an array of Deployment_Record objects
2. WHEN a Deployment_Record is parsed, THE parser SHALL extract deployment_id, status, timestamp, stack_name, events, and outputs fields
3. FOR ALL Deployment_Record objects returned by the API, parsing the JSON response and then re-serializing SHALL produce equivalent JSON (round-trip property)
4. THE Deployments_View SHALL sort Deployment_Record items by timestamp in descending order (newest first)
5. IF the `/api/deployments` endpoint returns an error or empty response, THEN THE Deployments_View SHALL handle the response gracefully and display an appropriate message

### Requirement 12: Application Layout and Routing Restructure

**User Story:** As a user, I want the application routing to center on the Studio as the primary workspace, so that the Studio is the default landing page and other views are integrated within it.

#### Acceptance Criteria

1. WHEN a user navigates to `/`, THE application SHALL redirect to `/studio`
2. THE application SHALL retain direct routes for `/studio`, `/studio/agents`, `/studio/chat`, and `/studio/deployments` that deep-link to the corresponding Studio views
3. THE NavigationBar SHALL be integrated into the Studio layout as part of the top bar, replacing the separate MUI AppBar
4. WHEN the user navigates to a non-existent route, THE application SHALL redirect to `/studio`
5. THE application SHALL remove the standalone AgentGridPage, ChatPage, and DeploymentDashboardPage routes, consolidating their functionality into the Studio hub views

### Requirement 13: Responsive and Accessible Layout

**User Story:** As a user, I want the Studio layout to be responsive and accessible, so that I can use the application on different screen sizes and with assistive technologies.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Studio_Page SHALL collapse the left icon rail into a hamburger menu
2. WHEN the viewport width is below 768px, THE Chat_View drawer SHALL render as a full-screen overlay instead of a side panel
3. THE application SHALL use semantic HTML elements (nav, main, aside, header) for the Studio layout structure
4. THE application SHALL ensure all interactive elements are keyboard-navigable with visible focus indicators
5. THE application SHALL provide ARIA labels for icon-only buttons in the left icon rail and bottom dock
6. WHEN the theme changes (mode or preset), THE application SHALL maintain all accessibility requirements including contrast ratios and focus visibility

### Requirement 14: AWS Log Reader and Browser

**User Story:** As a user, I want to browse CloudWatch logs from my AWS account inside the Studio, so that I can troubleshoot deployments and monitor services without leaving the workspace.

#### Acceptance Criteria

1. THE Studio_Page SHALL include a Logs view accessible from the View_Switcher or as a panel within the Deployments_View
2. WHEN the user opens the Logs view, THE application SHALL display a log group selector populated from the user's configured AWS region and credentials
3. WHEN the user selects a log group, THE application SHALL fetch and display recent log events in a scrollable, monospace-formatted log viewer
4. THE log viewer SHALL support filtering log events by keyword or pattern using a search input
5. THE log viewer SHALL support time-range selection to narrow log events to a specific window
6. WHEN new log events arrive during real-time streaming, THE log viewer SHALL append new entries at the bottom and auto-scroll if the user is already at the bottom of the log
7. THE log viewer SHALL display each log event with its timestamp, log stream name, and message content
8. IF the AWS credentials are not configured or the API returns an error, THEN THE Logs view SHALL display a clear error message indicating the issue and linking to the API settings configuration

### Requirement 15: Real-Time Log Streaming and Deployment Animations

**User Story:** As a user, I want to stream AWS logs in real-time during deployments so that the deployment overlay shows live progress with animated resource creation driven by actual CloudFormation events.

#### Acceptance Criteria

1. WHILE a deployment is in-progress, THE Deployment overlay SHALL subscribe to real-time CloudFormation stack events via the backend
2. WHEN a CloudFormation stack event is received, THE Deployment overlay SHALL animate the corresponding resource node transitioning through its creation state (CREATE_IN_PROGRESS with pulsing amber, CREATE_COMPLETE with solid green)
3. WHEN real-time log streaming is active, THE Deployment overlay SHALL display a live log tail showing the most recent CloudFormation events as they occur
4. IF real-time streaming is unavailable (no credentials, network error), THEN THE Deployment overlay SHALL fall back to the existing simulated deployment animation sequence
5. THE backend SHALL expose a WebSocket message type or API endpoint for subscribing to CloudFormation stack events for a given deployment
6. WHEN the deployment completes (stack status reaches CREATE_COMPLETE or ROLLBACK_COMPLETE), THE streaming subscription SHALL automatically unsubscribe and THE overlay SHALL display the final status

### Requirement 16: Landing Page with Animated Introduction

**User Story:** As a user visiting hivemind.studio for the first time, I want to see an animated landing page with the HiveMind logo and an interactive tutorial walkthrough, so that I understand how to use the Studio features before diving in.

#### Acceptance Criteria

1. WHEN the application loads for the first time (no `hivemind-tutorial-completed` flag in localStorage), THE application SHALL display a Landing_Page before showing the Studio
2. THE Landing_Page SHALL display the HiveMind logo (`assets/Hivemind-Logo-TRANS.png`) with a fade-in and scale-up animation sequence lasting 1-2 seconds
3. THE Landing_Page SHALL display the tagline "Agentic-AI DevOps Studio" with a typewriter or fade-in animation following the logo animation
4. WHEN the logo animation completes, THE Landing_Page SHALL transition to an interactive tutorial walkthrough with Previous and Next navigation buttons
5. THE tutorial walkthrough SHALL guide the user through each major feature: Agents View, Chat with real LLM agents, Infrastructure Design, Deployments tracking, Log browsing, Theme customization, and Documentation
6. WHEN the user clicks "Skip Tutorial" at any point, THE Landing_Page SHALL set `hivemind-tutorial-completed` in localStorage and navigate directly to the Studio
7. WHEN the user completes the final tutorial step and clicks "Get Started", THE Landing_Page SHALL set `hivemind-tutorial-completed` in localStorage and navigate to the Studio
8. THE tutorial walkthrough SHALL use step indicators (dots or a progress bar) showing the current step and total steps
9. WHEN the user has previously completed the tutorial (`hivemind-tutorial-completed` exists in localStorage), THE application SHALL skip the Landing_Page and load the Studio directly
10. THE User_Settings_Panel SHALL include an option to reset the tutorial so the user can replay the walkthrough

### Requirement 17: Integrated Documentation with FumaDocs

**User Story:** As a user, I want comprehensive documentation hosted within the Studio application, so that I can learn about features, capabilities, and limitations without leaving the workspace.

#### Acceptance Criteria

1. THE Studio_Page SHALL include a "Docs" button in the top bar or left icon rail that navigates to the documentation section
2. THE documentation SHALL be built using FumaDocs (https://fumadocs.dev/) and integrated into the same application build
3. THE documentation SHALL be accessible at the `/docs` route within the application
4. THE documentation SHALL include sections covering: Getting Started, Agents Overview (recon, conductor, janitor), Chat Interface Usage, Infrastructure Design Workflow, Deployment Management, Log Browsing, Theme Customization, API Configuration, and Keyboard Shortcuts
5. THE documentation SHALL include a searchable index so users can find topics by keyword
6. WHEN the user clicks the "Docs" button from the Studio, THE application SHALL navigate to the `/docs` route preserving the ability to return to the Studio
7. THE documentation SHALL be styled consistently with the active Theme_Preset and dark/light mode
8. THE documentation SHALL include code examples and screenshots where applicable to illustrate features
9. WHEN new features are added to the Studio, THE documentation SHALL be updated as part of the same development workflow
