# Requirements Document

## Introduction

This document specifies the requirements for porting the existing Streamlit-based "HiveMind Infrastructure Design Studio" (`hivemind_web.py`) to a new React page within the existing HiveMind React application (`hivemind_web/web/`). The new page uses Ant Design (antd) as its UI component library, scoped exclusively to the Studio page via `ConfigProvider`, while the rest of the app retains MUI. The Studio provides a two-panel layout with a mock chat interface for infrastructure design conversations and a tabbed infrastructure visualization panel, plus configuration controls, cost estimation, CloudFormation template generation, and a simulated deployment flow. The page also supports API connection settings for Amazon Bedrock and other LLM providers, a drag-and-drop architecture diagram that syncs to the template, live cost estimation across all views, a global loading overlay to prevent UI interaction during updates, and a dark/light theme toggle.

## Glossary

- **Studio_Page**: The new React page component at route `/studio` that hosts the entire Infrastructure Design Studio UI
- **Configuration_Panel**: The left sidebar/drawer containing repository URL, deployment ID, AWS region, priority sliders, and API connection settings
- **Chat_Panel**: The left column area displaying the mock conversation between the user and the HiveMind agents
- **Infrastructure_Panel**: The right column area with tabbed views for Architecture, Template, and Cost Estimate
- **Architecture_Tab**: The tab displaying an interactive visual diagram of AWS resources and a resource checklist
- **Template_Tab**: The tab displaying the generated CloudFormation YAML template with validate and download actions
- **Cost_Tab**: The tab displaying monthly cost estimates and a per-resource cost breakdown table
- **Action_Bar**: The bottom row of four action buttons: Generate Template, Validate, Deploy to AWS, View Deployments
- **Deployment_Progress_Section**: The animated progress display that appears during a simulated deployment
- **Infrastructure_Config**: The state object tracking which AWS resources are enabled and their configuration (VPC, EC2, RDS, ALB, instance type, DB engine)
- **Chat_Engine**: The TypeScript function that generates mock agent responses based on keyword matching of user input
- **Deployment_Simulation**: The animated mock deployment sequence showing CloudFormation stack creation events and outputs
- **Antd_Theme_Provider**: The Ant Design `ConfigProvider` wrapper that applies the dark or light theme with gold (#D4AF37) accent tokens, scoped only to the Studio page
- **Cost_Calculator**: The pure utility function that computes monthly cost estimates from an Infrastructure_Config
- **Template_Generator**: The pure utility function that produces a CloudFormation YAML string from an Infrastructure_Config
- **Deployment_ID_Generator**: The utility function that produces a random deployment ID in the format `deploy-{8 random alphanumeric chars}`
- **Loading_Overlay**: A full-page overlay with an "Updating..." animation that blocks all user interaction while the UI is re-rendering after a state change
- **Theme_Toggle**: A dark/light mode toggle control in the upper-right corner of the Studio page
- **API_Settings**: The section within the Configuration_Panel for configuring connections to Amazon Bedrock, Claude, ChatGPT, and other LLM provider endpoints

## Requirements

### Requirement 1: Studio Page Routing and Navigation Integration

**User Story:** As a user, I want to access the Infrastructure Studio from the main navigation, so that I can reach the design tool alongside existing pages.

#### Acceptance Criteria

1. WHEN a user navigates to `/studio`, THE Studio_Page SHALL render the full Infrastructure Design Studio layout
2. THE NavigationBar SHALL include a "Studio" link that navigates to `/studio`
3. WHEN the user is on the `/studio` route, THE NavigationBar SHALL visually indicate the Studio link as active
4. THE Antd_Theme_Provider SHALL wrap only the Studio_Page and its child components, leaving all other routes using MUI unchanged

### Requirement 2: Configuration Panel

**User Story:** As a user, I want to configure deployment settings, API connections, and design priorities in a sidebar panel, so that I can fully set up the application before designing infrastructure.

#### Acceptance Criteria

1. THE Configuration_Panel SHALL display a text input for Repository URL with placeholder text `https://github.com/user/repo`
2. THE Configuration_Panel SHALL display a text input for Deployment ID pre-populated with a generated value in the format `deploy-{8 random alphanumeric chars}`
3. WHEN the user clicks the randomize (🎲) button next to the Deployment ID input, THE Deployment_ID_Generator SHALL produce a new random ID and update the input field
4. THE Configuration_Panel SHALL display a dropdown for AWS Region containing exactly 27 regions: us-east-1, us-east-2, us-west-1, us-west-2, af-south-1, ap-east-1, ap-south-1, ap-south-2, ap-northeast-1, ap-northeast-2, ap-northeast-3, ap-southeast-1, ap-southeast-2, ap-southeast-3, ap-southeast-4, ca-central-1, eu-central-1, eu-central-2, eu-west-1, eu-west-2, eu-west-3, eu-south-1, eu-south-2, eu-north-1, me-south-1, me-central-1, sa-east-1
5. THE Configuration_Panel SHALL display four sliders for priorities: Security (0-10, default 8), Cost Optimization (0-10, default 5), Performance (0-10, default 7), High Availability (0-10, default 6)
6. THE Configuration_Panel SHALL display an API Settings section with input fields for Amazon Bedrock endpoint URL, Amazon Bedrock model ID, Claude API key, ChatGPT API key, and a dropdown to select the active LLM provider
7. THE Configuration_Panel SHALL display a "Reset Session" button
8. WHEN the user clicks "Reset Session", THE Studio_Page SHALL reset all state to initial defaults: clear chat messages, reset Infrastructure_Config to defaults (vpc: true, ec2: true, rds: true, alb: true, instance_type: t3.small, db_engine: postgres), reset deployment stage to planning, regenerate the Deployment ID, and clear API settings fields

### Requirement 3: Chat Panel

**User Story:** As a user, I want to converse with a mock HiveMind SysEng agent (or any of the agents to fix or change something) in a chat interface, so that I can iteratively design my infrastructure through natural language.

#### Acceptance Criteria

1. THE Chat_Panel SHALL display a scrollable message history with distinct visual styling for user messages and assistant messages
2. WHEN the Chat_Panel first renders with no prior messages, THE Chat_Engine SHALL display an initial greeting message from the assistant asking about the application type
3. THE Chat_Panel SHALL display the HiveMind logo icon (`assets/HM-Logo_only.png`) as the avatar for assistant messages
4. WHEN the user submits a message via the chat input, THE Chat_Panel SHALL append the user message to the history, invoke the Chat_Engine, and append the assistant response
5. WHEN the user submits a message containing "web" or "api" (case-insensitive), THE Chat_Engine SHALL set vpc, ec2, and alb to true in Infrastructure_Config and return a response recommending VPC, EC2, and ALB, then ask about database needs
6. WHEN the user submits "yes" and the previous assistant message mentioned "database", THE Chat_Engine SHALL set rds to true in Infrastructure_Config and return a response confirming RDS addition and asking about instance type
7. WHEN the user submits a message containing a valid instance type string (t3.micro, t3.small, t3.medium, or t3.large), THE Chat_Engine SHALL update the instance_type in Infrastructure_Config and return a response confirming the complete infrastructure design
8. WHEN the user submits "no" and the previous assistant message mentioned "database", THE Chat_Engine SHALL return a response confirming the design without RDS
9. WHEN the user submits a message that matches none of the above patterns, THE Chat_Engine SHALL return a generic help response listing available topics

### Requirement 4: Infrastructure Architecture Tab

**User Story:** As a user, I want to see an interactive visual diagram and resource list of my designed infrastructure, so that I can understand the architecture at a glance and make changes directly on the diagram.

#### Acceptance Criteria

1. THE Architecture_Tab SHALL display an interactive visual representation of the enabled AWS resources (VPC, EC2, RDS, ALB) showing their topology and relationships
2. THE Architecture_Tab SHALL display a resource checklist showing each enabled resource with a checkmark icon, the resource name, and relevant configuration details (instance type for EC2, DB engine for RDS)
3. WHEN the Infrastructure_Config changes from any source (chat, drag-and-drop, or reset), THE Architecture_Tab SHALL update the diagram and resource list to reflect the current configuration
4. WHEN no resources are enabled in Infrastructure_Config, THE Architecture_Tab SHALL display an informational message prompting the user to start chatting
5. THE Architecture_Tab SHALL display a live cost estimation summary that updates whenever the Infrastructure_Config changes
6. WHILE an infrastructure action (deployment, validation) is in progress, THE Architecture_Tab SHALL display an animation or indicator showing the current action status

### Requirement 5: Infrastructure Template Tab

**User Story:** As a user, I want to view, validate, and download a CloudFormation template for my infrastructure, so that I can review and use the generated IaC artifact.

#### Acceptance Criteria

1. THE Template_Tab SHALL display the CloudFormation YAML template generated by the Template_Generator in a code block with monospace font
2. THE Template_Generator SHALL produce a valid YAML string containing AWSTemplateFormatVersion, Description, Parameters (InstanceType with AllowedValues), Resources (VPC, PublicSubnet1, ApplicationInstance), and Outputs (VpcId) sections, parameterized by the current Infrastructure_Config instance_type
3. WHEN the user clicks "Validate Template", THE Template_Tab SHALL display a simulated success message indicating the template is valid
4. WHEN the user clicks "Download Template", THE Template_Tab SHALL trigger a browser file download of the YAML content with filename `{deployment_id}-template.yaml`
5. WHEN the Infrastructure_Config changes via the Architecture_Tab diagram interaction, THE Template_Tab SHALL regenerate and display the updated CloudFormation template

### Requirement 6: Infrastructure Cost Estimate Tab

**User Story:** As a user, I want to see estimated monthly costs for my infrastructure that update live regardless of where I make changes, so that I can understand the financial impact of my design choices.

#### Acceptance Criteria

1. THE Cost_Tab SHALL display the total estimated monthly cost as a prominent metric value
2. THE Cost_Tab SHALL display a breakdown table listing each enabled resource and its individual monthly cost
3. THE Cost_Calculator SHALL compute costs using these rates: VPC=$0.00, EC2 t3.micro=$7.59, EC2 t3.small=$15.18, EC2 t3.medium=$30.37, EC2 t3.large=$60.74, RDS db.t3.micro=$12.41, RDS Storage (20GB)=$2.30, ALB base=$16.20, ALB Capacity Units=$5.84
4. THE Cost_Calculator SHALL return a total that equals the sum of all individual resource costs for the given Infrastructure_Config
5. WHEN the Infrastructure_Config changes from any source (chat, diagram interaction, or reset), THE Cost_Tab SHALL recalculate and display updated cost values
6. THE Cost_Tab SHALL display a caption noting that costs are estimates based on us-east-1 pricing

### Requirement 7: Action Bar and Navigation

**User Story:** As a user, I want a sleek, easy-to-navigate menu that contains links to all Studio actions and the broader web app, so that I can trigger template generation, validation, deployment, and navigate to other pages.

#### Acceptance Criteria

1. THE Action_Bar SHALL display four buttons in a horizontal row: "Generate Template" (🎨), "Validate" (🔍), "Deploy to AWS" (🚀, primary style), and "View Deployments" (📊)
2. WHEN the user clicks "Generate Template", THE Studio_Page SHALL add an assistant message to the chat confirming template generation
3. WHEN the user clicks "Validate", THE Studio_Page SHALL add an assistant message to the chat reporting validation results (no errors, all policies passed, security score)
4. WHEN the user clicks "Deploy to AWS", THE Studio_Page SHALL transition the deployment stage to "deploying" and add an assistant message announcing the deployment start with the stack name
5. WHEN the user clicks "View Deployments", THE Studio_Page SHALL display a notification indicating the deployment dashboard is coming soon

### Requirement 8: Loading Overlay for UI Updates

**User Story:** As a user, I want the UI to show an "Updating..." animation and block interaction during complex re-renders, so that the web app does not crash or produce inconsistent state during critical updates.

#### Acceptance Criteria

1. WHEN any action triggers a state change that causes a complex UI re-render (deployment start, template generation, infrastructure config change via chat), THE Loading_Overlay SHALL appear covering the entire Studio page
2. WHILE the Loading_Overlay is visible, THE Studio_Page SHALL prevent all user clicks, keyboard input, and scroll interactions
3. THE Loading_Overlay SHALL display a spinning animation and the text "Updating..."
4. WHEN the UI re-render completes, THE Loading_Overlay SHALL disappear and restore normal user interaction

### Requirement 9: Deployment Simulation

**User Story:** As a user, I want to see an animated deployment progress when I deploy with accurate timing, so that I can experience a realistic deployment flow and know how much longer to wait.

#### Acceptance Criteria

1. WHILE the deployment stage is "deploying", THE Deployment_Progress_Section SHALL be visible and display a progress bar and status text
2. THE Deployment_Simulation SHALL animate through these events in sequence: CREATE_IN_PROGRESS VPC (10%), CREATE_COMPLETE VPC (20%), CREATE_IN_PROGRESS InternetGateway (30%), CREATE_COMPLETE InternetGateway (40%), CREATE_IN_PROGRESS PublicSubnet1 (50%), CREATE_COMPLETE PublicSubnet1 (60%), CREATE_IN_PROGRESS ApplicationInstance (70%), CREATE_COMPLETE ApplicationInstance (85%), CREATE_COMPLETE Stack (100%)
3. WHEN the Deployment_Simulation completes, THE Deployment_Progress_Section SHALL display a success message and show mock stack outputs (VpcId, SubnetId, InstanceId, PublicIp, ALB DNS)
4. WHEN the Deployment_Simulation completes, THE Studio_Page SHALL display a confetti or celebration animation
5. WHEN the deployment stage is not "deploying", THE Deployment_Progress_Section SHALL be hidden

### Requirement 10: Dark Theme with Gold Accents and Light Theme Toggle

**User Story:** As a user, I want the Studio page to default to a dark theme with gold accents matching the HiveMind brand, with the option to switch to a light theme via a toggle icon, so that I can choose my preferred visual mode.

#### Acceptance Criteria

1. THE Antd_Theme_Provider SHALL configure Ant Design's `darkAlgorithm` with the primary color token set to #D4AF37 (gold) as the default theme
2. THE Studio_Page SHALL display a Theme_Toggle icon in the upper-right corner that switches between dark and light modes
3. WHEN the user clicks the Theme_Toggle, THE Antd_Theme_Provider SHALL switch between `darkAlgorithm` and `defaultAlgorithm` while retaining the #D4AF37 primary color
4. WHILE in dark mode, THE Studio_Page SHALL use a background gradient of `linear-gradient(135deg, #0a0a0a, #1a1a1a)`
5. THE Studio_Page SHALL display a 4px top accent bar with gradient from #000000 to #D4AF37
6. WHILE in dark mode, THE Studio_Page SHALL style cards and containers with #1a1a1a background and #2a2a2a borders
7. WHILE in dark mode, THE Studio_Page SHALL style body text as #a0a0a0 and header text as #e0e0e0
8. THE Studio_Page SHALL style buttons with a gold-to-black gradient background and #D4AF37 border
9. WHILE in dark mode, THE Studio_Page SHALL style chat messages with dark gradient backgrounds and hover elevation effects
10. WHILE in dark mode, THE Studio_Page SHALL style code blocks with #0f0f0f background and gold-colored inline code text
11. WHILE in dark mode, THE Studio_Page SHALL use a dark-themed scrollbar with #1a1a1a track and #2a2a2a thumb

### Requirement 11: Infrastructure State Management

**User Story:** As a developer, I want the infrastructure configuration to be managed via React state, so that all panels stay synchronized when the config changes from any source.

#### Acceptance Criteria

1. THE Studio_Page SHALL manage Infrastructure_Config using React state (useState or useReducer) with the interface: `{ vpc: boolean, ec2: boolean, rds: boolean, alb: boolean, instance_type: 't3.micro' | 't3.small' | 't3.medium' | 't3.large', db_engine: 'postgres' | 'mysql' }`
2. THE Studio_Page SHALL initialize Infrastructure_Config with defaults: vpc=true, ec2=true, rds=true, alb=true, instance_type='t3.small', db_engine='postgres'
3. WHEN the Chat_Engine modifies Infrastructure_Config, THE Architecture_Tab, Template_Tab, and Cost_Tab SHALL all reflect the updated configuration
4. WHEN the user modifies the architecture diagram via drag-and-drop or interaction, THE Infrastructure_Config SHALL update and THE Template_Tab and Cost_Tab SHALL reflect the change
5. WHEN the user clicks "Reset Session", THE Infrastructure_Config SHALL return to its default values

### Requirement 12: Header and Branding

**User Story:** As a user, I want to see the HiveMind branding prominently on the Studio page, so that the page feels like part of the HiveMind product.

#### Acceptance Criteria

1. THE Studio_Page SHALL display the HiveMind transparent logo (`assets/Hivemind-Logo-TRANS.png`) as a centered header image with a gold drop-shadow glow effect
2. THE Studio_Page SHALL display the subtitle "Agentic-AI DevOps Studio" below the logo in #a0a0a0 color at 1.5rem font size
3. THE Chat_Panel header SHALL include the HiveMind logo icon (`assets/HM-Logo_only.png`) next to the text "Chat with HiveMind SysEng"
4. THE Infrastructure_Panel header SHALL include the HiveMind logo icon next to the text "Infrastructure Design"

### Requirement 13: Template Generator Serialization

**User Story:** As a developer, I want the CloudFormation template generator to produce consistent YAML output from a given config, so that the template is deterministic and testable.

#### Acceptance Criteria

1. THE Template_Generator SHALL accept an Infrastructure_Config object and return a YAML string
2. THE Template_Generator SHALL include the instance_type from Infrastructure_Config in the Parameters.InstanceType.Default field
3. FOR ALL valid Infrastructure_Config objects, generating a template and then parsing the YAML back SHALL produce an object containing the same InstanceType default value (round-trip property)

### Requirement 14: Cost Calculator Correctness

**User Story:** As a developer, I want the cost calculator to produce accurate and consistent results, so that users see correct pricing information.

#### Acceptance Criteria

1. THE Cost_Calculator SHALL accept an Infrastructure_Config object and return a numeric total monthly cost
2. THE Cost_Calculator SHALL return a total that equals the sum of all individual resource costs returned by the breakdown function for the same Infrastructure_Config
3. FOR ALL valid Infrastructure_Config objects, THE Cost_Calculator SHALL return a non-negative number
4. THE Cost_Calculator SHALL return $0.00 when all resource flags (vpc, ec2, rds, alb) are set to false

### Requirement 15: Deployment ID Generator

**User Story:** As a developer, I want the deployment ID generator to produce valid, unique-looking IDs, so that each session has a distinct identifier.

#### Acceptance Criteria

1. THE Deployment_ID_Generator SHALL return a string matching the pattern `deploy-{8 alphanumeric characters}`
2. FOR ALL generated IDs, THE Deployment_ID_Generator output SHALL match the regex `^deploy-[a-z0-9]{8}$`
3. THE Deployment_ID_Generator SHALL use lowercase letters and digits only in the random suffix
