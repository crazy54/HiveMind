<div align="center">
  <img src="assets/Hivemind-Logo-TRANS.png" alt="HiveMind Logo" width="420" />

  <h1>HiveMind Studio</h1>
  <p><strong>Multi-agent AI platform for automated AWS infrastructure deployment</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Strands_SDK-1.0+-orange" alt="Strands" />
    <img src="https://img.shields.io/badge/Amazon_Bedrock-Claude_4-FF9900?logo=amazonaws&logoColor=white" alt="Bedrock" />
    <img src="https://img.shields.io/badge/Tests-179_passing-brightgreen" alt="Tests" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/License-Educational-lightgrey" alt="License" />
  </p>

  <p>
    <a href="#quick-start">Quick Start</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#agents">Agents</a> •
    <a href="#bedrock-authentication">Auth</a> •
    <a href="#api-reference">API</a> •
    <a href="#testing">Testing</a>
  </p>
</div>

---

HiveMind is a production-ready multi-agent AI system built with the **Strands SDK** and **Amazon Bedrock**. It ships with a full-featured **React web studio** for real-time agent chat, infrastructure deployment, CloudWatch log browsing, and deployment tracking — all in one place.

## Screenshots

<div align="center">
  <img src="assets/webapp-ss.png" alt="HiveMind Studio — main view" width="100%" />
  <p><em>HiveMind Studio — sidebar navigation, chat view, and real-time agent streaming</em></p>
</div>

<div align="center">
  <img src="assets/webapp-settings-ss.png" alt="HiveMind Studio — settings panel" width="100%" />
  <p><em>Settings panel — Bedrock auth configuration, theme presets, and style options</em></p>
</div>

---

## Features

### Multi-Agent Backend
- 10 specialized Strands agents: Recon, Conductor, Provisioner, Deployer, Sheriff, QA, Ops, Medic, Janitor, Compiler
- Real-time streaming chat via WebSocket (`stream_async`)
- Amazon Bedrock integration with Claude Sonnet 4 (default)
- Multiple auth modes: env vars, AWS profile, or explicit keys
- CloudWatch log browsing and live tailing
- CloudFormation deployment tracking with event streaming

### HiveMind Studio (Web UI)
- React 18 + Ant Design — dark/light mode, 6 color themes, 4 style presets
- 200px collapsible sidebar with grouped navigation (Navigate / Actions / Tools)
- Animated HiveMind logo with pulse glow and hover spin
- Centered settings modal with Bedrock auth configuration and live connection test
- Streaming chat with per-message agent switching
- Offline fallback mode when backend is unreachable

---

## How It Works

<details>
<summary><strong>Deployment Flow (click to expand)</strong></summary>

```
┌─────────────────────────────────────────────────────────────┐
│                     HiveMind Studio UI                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │   Chat   │  │  Agents  │  │Deployments │  │   Logs   │  │
│  └────┬─────┘  └──────────┘  └────────────┘  └──────────┘  │
│       │ WebSocket /ws/chat                                   │
└───────┼─────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                  FastAPI Backend (port 8000)               │
│                                                           │
│   set_auth ──► BedrockAuthConfig ──► boto3 session        │
│   message  ──► AgentRouter ──► Strands Agent              │
│                                    │                      │
│                              stream_async()               │
│                                    │                      │
│              stream_start ◄────────┘                      │
│              stream_chunk ◄── token by token              │
│              stream_end   ◄── metrics                     │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                   Amazon Bedrock                           │
│         Claude Sonnet 4 / Nova Pro / Claude 3.5           │
└───────────────────────────────────────────────────────────┘
```

**Step-by-step:**
1. User opens HiveMind Studio and configures Bedrock credentials in Settings
2. Frontend connects via WebSocket and sends `set_auth` with the chosen auth mode
3. User selects an agent and types a message
4. Backend routes the message to the appropriate Strands agent
5. Strands calls Bedrock via `stream_async`, streaming tokens back in real time
6. Frontend renders each chunk as it arrives — no waiting for the full response

</details>

<details>
<summary><strong>Agent Orchestration (click to expand)</strong></summary>

```
User Request
     │
     ▼
 Conductor ──────────────────────────────────────────┐
     │                                               │
     ├──► Recon (analyze repo)                       │
     │         │                                     │
     │         ▼                                     │
     ├──► Compiler (build artifacts)                 │
     │         │                                     │
     │         ▼                                     │
     ├──► Provisioner (CloudFormation → AWS)         │
     │         │                                     │
     │         ▼                                     │
     ├──► Sheriff (security checks)                  │
     │         │                                     │
     │         ▼                                     │
     ├──► Deployer (deploy to EC2/ALB)               │
     │         │                                     │
     │         ▼                                     │
     ├──► QA (health checks)                         │
     │         │                                     │
     │    ┌────┴────┐                                │
     │    │ Pass?   │                                │
     │    └────┬────┘                                │
     │    No   │ Yes                                 │
     │    ▼    ▼                                     │
     │  Medic  Ops (dashboards + alerting)           │
     │  (fix)                                        │
     │                                               │
     └──► Janitor (cleanup unused resources) ◄───────┘
```

</details>

---

## Architecture

```
HiveMind/
├── hivemind_web/          # FastAPI backend
│   ├── server.py          # REST + WebSocket endpoints
│   ├── agent_router.py    # Agent registry
│   ├── bedrock_auth.py    # Multi-mode AWS auth (env/profile/keys)
│   ├── session_manager.py # WebSocket session tracking
│   └── metrics_tracker.py # Interaction metrics
├── src/
│   ├── agents/            # Strands agent definitions
│   ├── tools/             # Agent tools
│   └── schemas/           # Data models
├── HMWebApp/              # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/    # UI components
│       ├── contexts/      # ThemeContext, AuthContext
│       ├── hooks/         # useWebSocket
│       ├── pages/         # StudioPage, LandingPage, DocsLayout
│       └── services/      # chatService, logService, deploymentService
├── tests/                 # Python test suite
├── .env.example           # Environment variable template
└── requirements.txt       # Python dependencies
```

---

## Agents

| Agent | Role | Key Capabilities |
|-------|------|-----------------|
| 🔍 **Recon** | Repository Scout | Repo analysis, tech stack detection, dependency scanning, security audit |
| 🎼 **Conductor** | Infrastructure Orchestrator | Infra design, CloudFormation generation, cost estimation, deployment workflow |
| 🏗️ **Provisioner** | Infrastructure Provisioner | CloudFormation templates, EC2/RDS/ALB provisioning, Stage-1 & production modes |
| 🚀 **Deployer** | Application Deployer | App deployment, ALB target group registration, health checks |
| 🔒 **Sheriff** | Security Agent | Security group management, IAM policies, compliance enforcement |
| 🧪 **QA** | Quality Assurance | Post-deployment verification, health checks, endpoint testing |
| 📊 **Ops** | Observability | CloudWatch dashboards, X-Ray tracing, metrics and alerting setup |
| 🩺 **Medic** | Error Recovery | Failure analysis, automated fix suggestions, retry orchestration |
| 🧹 **Janitor** | Cleanup & Maintenance | Resource cleanup, cost optimization, drift detection, compliance |
| ⚙️ **Compiler** | Build Agent | Application build, dependency resolution, artifact preparation |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/hivemind.git
cd hivemind

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install strands-agents
```

### 2. Configure AWS credentials

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Three auth modes are supported — pick one:

```bash
# Option A: env vars
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# Option B: named AWS profile (leave keys blank)
# Set auth_mode = "profile" in the Studio settings UI

# Option C: configure via the Studio UI at runtime (keys never saved to disk)
```

> Make sure your IAM user/role has `bedrock:InvokeModel` permission on the Claude model you want to use.

### 3. Start the backend

```bash
uvicorn hivemind_web.server:app --reload --port 8000
```

### 4. Start the frontend

```bash
cd HMWebApp
npm install
npm run dev
# Opens at http://localhost:3000
```

### 5. Configure Bedrock in the UI

Open **Settings** (⚙️ in the top bar) → **Bedrock Connection** → choose your auth mode → **Test Connection**.

Once connected, head to **Chat** and start talking to an agent.

---

## Bedrock Authentication

The backend supports three auth modes, configurable per-session from the UI or via environment variables:

| Mode | How it works | When to use |
|------|-------------|-------------|
| `env` | boto3 default chain — env vars, `~/.aws/credentials`, instance role | CI/CD, EC2 instance roles |
| `profile` | Named profile from `~/.aws/config` | Local dev with SSO |
| `keys` | Explicit access key + secret passed at runtime (never persisted to disk) | Quick testing, cross-account |

The frontend `BedrockAuthPanel` (Settings → Bedrock Connection) lets you switch modes, pick a region, choose a model, and validate the connection with a single click.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + ,` | Open settings |
| `Escape` | Close modal / palette |

---

## API Reference

### REST

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents` | List available agents |
| `POST` | `/api/auth/validate` | Validate Bedrock credentials |
| `GET` | `/api/deployments` | List deployments |
| `GET` | `/api/logs/groups` | List CloudWatch log groups |
| `GET` | `/api/logs/events` | Fetch log events |

### WebSocket

**`ws://host/ws/chat`** — real-time agent chat with streaming

Client sends:

```json
{ "type": "message", "agent_id": "conductor", "message": "...", "auth_config": { ... } }
{ "type": "set_auth", "auth_config": { "auth_mode": "env", "region": "us-east-1", "model_id": "..." } }
{ "type": "switch_agent", "agent_id": "recon" }
```

Server streams:

```json
{ "type": "stream_start", "message_id": "...", "agent_id": "conductor" }
{ "type": "stream_chunk", "message_id": "...", "content": "Hello" }
{ "type": "stream_end",   "message_id": "...", "metrics": { ... } }
{ "type": "auth_status",  "ok": true, "message": "Connected to Amazon Bedrock" }
```

---

## Testing

```bash
# Python backend tests
pytest -q

# Frontend tests (179 passing across 22 test files)
cd HMWebApp
npx vitest run --silent
```

The frontend test suite covers unit tests and property-based tests (fast-check) across all components, contexts, and services.

<details>
<summary><strong>Test file breakdown (click to expand)</strong></summary>

| File | Type | Coverage |
|------|------|----------|
| `ThemeContext.test.tsx` | Unit | Theme mode, preset switching |
| `ThemeContext.property.test.tsx` | Property | Token application invariants |
| `themePresets.test.ts` | Unit | Preset definitions, edge cases |
| `themePresets.property.test.ts` | Property | Preset independence properties |
| `StylePresetSelector.test.tsx` | Unit | Selector rendering |
| `UserSettingsPanel.test.tsx` | Unit | Settings panel tabs |
| `AgentsView.test.tsx` | Unit | Agent card grid |
| `ChatInput.test.tsx` | Unit | Input, send, agent select |
| `ChatMessage.test.tsx` | Unit | Message rendering |
| `ChatView.test.tsx` | Unit | Full chat flow |
| `DeploymentsView.test.tsx` | Unit | Deployment list |
| `DeploymentsView.property.test.ts` | Property | Deployment data invariants |
| `LogsView.test.tsx` | Unit | Log browsing |
| `LogsView.property.test.ts` | Property | Log event properties |
| `LogViewer.test.tsx` | Unit | Log viewer component |
| `chatService.test.ts` | Unit | WS message handling |
| `chatService.property.test.ts` | Property | Message flow properties |
| `logService.test.ts` | Unit | Log service |
| `NavigationBar.test.tsx` | Unit | Nav rendering |
| `LeftIconRail.property.test.tsx` | Property | Rail state properties |
| `LandingPage.property.test.tsx` | Property | Landing page invariants |
| `DeploymentOverlay.test.tsx` | Unit | Overlay component |

</details>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Agents | [Strands SDK](https://strandsagents.com) + Amazon Bedrock |
| LLM | Claude Sonnet 4 (default), Nova Pro/Lite, Claude 3.5 |
| Backend | FastAPI + uvicorn + WebSockets |
| Frontend | React 18 + TypeScript + Vite |
| UI | Ant Design 5 |
| AWS SDK | boto3 / botocore |
| Testing (Python) | pytest + Hypothesis |
| Testing (TS) | Vitest + fast-check + Testing Library |

---

## Requirements

- Python 3.10+
- Node.js 18+
- AWS account with Bedrock access (Claude model enabled in your region)
- `strands-agents >= 1.0.0`

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and add tests
3. Run the test suite: `pytest -q && cd HMWebApp && npx vitest run --silent`
4. Open a pull request with a clear description of what changed and why

---

## Learn More

- [Strands SDK Docs](https://strandsagents.com/latest/documentation/)
- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [Ant Design](https://ant.design/)
- [FastAPI](https://fastapi.tiangolo.com/)

---

## License

Educational / personal use. See `LICENSE`.
