# Production-Ready HiveMind - Design Document

## Overview

This design document specifies the architecture and implementation approach for completing HiveMind's production-ready features. All infrastructure provisioning uses CloudFormation templates, with boto3 only for operations CloudFormation cannot handle (health checks, target registration, resource queries).

## Skills Reference

For detailed implementation guidance, best practices, and patterns, see [SKILLS_REFERENCE.md](./SKILLS_REFERENCE.md). This document catalogs all available skills in `~/.claude/skills` including:

- **CloudFormation & AWS:** `aws-cloud-architecture`, `aws-cloudformation`, `cloudformation` - Well-Architected patterns, IaC templates, stack management
- **Testing:** `python-testing`, `pytest`, `python-testing-patterns` - TDD, fixtures, mocking, property-based testing
- **Code Quality:** `python-expert` - Type hints, PEP 8, error handling, performance optimization
- **Agent Design:** `senior-prompt-engineer` - LLM optimization, agent orchestration, structured outputs
- **Frontend:** `frontend-design` - Distinctive UI design, animations, typography
- **Documentation:** `readme-generator` - Professional README structure, architecture diagrams

Consult these skills during design, implementation, and testing phases for production-ready patterns.

## Architecture Principles

### CloudFormation-First Approach

**All infrastructure MUST be provisioned via CloudFormation:**
- VPC, subnets, internet gateways, route tables
- EC2 instances, security groups, key pairs
- RDS instances, subnet groups
- Application Load Balancers, target groups, listeners
- CloudWatch dashboards (via CloudFormation or boto3)

**boto3 is ONLY permitted for:**
- Registering/deregistering instances with ALB target groups (not supported by CFN for existing instances)
- Waiting for target health checks (monitoring operation)
- Querying existing resources (read-only operations)
- Installing software on EC2 instances via SSH (not infrastructure)

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Conductor Agent                         │
│  - Orchestrates workflow                                     │
│  - Manages CloudFormation stacks                             │
│  - Coordinates all specialist agents                         │
└─┬───────┬───────┬───────┬───────┬───────┬───────┬──────────┘
  │       │       │       │       │       │       │
  ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
│ R │   │ C │   │ P │   │ D │   │ S │   │ Q │   │ O │
│ e │   │ o │   │ r │   │ e │   │ h │   │ A │   │ p │
│ c │   │ m │   │ o │   │ p │   │ e │   │   │   │ s │
│ o │   │ p │   │ v │   │ l │   │ r │   │   │   │   │
│ n │   │ i │   │ i │   │ o │   │ i │   │   │   │   │
│   │   │ l │   │ s │   │ y │   │ f │   │   │   │   │
│   │   │ e │   │ i │   │ e │   │ f │   │   │   │   │
│   │   │ r │   │ o │   │ r │   │   │   │   │   │   │
│   │   │   │   │ n │   │   │   │   │   │   │   │   │
│   │   │   │   │ e │   │   │   │   │   │   │   │   │
│   │   │   │   │ r │   │   │   │   │   │   │   │   │
└───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘
                  │
                  ▼
         ┌────────────────┐
         │ CloudFormation │
         │     Stack      │
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  AWS Resources │
         │ VPC, EC2, RDS  │
         │  ALB, etc.     │
         └────────────────┘
```

**New Agents:**
- **Medic**: Diagnoses failures and proposes fixes
- **QA**: Verifies deployments are working
- **Ops**: Sets up monitoring and observability
- **Janitor**: Discovers resources and manages cleanup

## Component Designs

### 1. ALB Integration with CloudFormation

**CloudFormation Template Structure:**
```yaml
Resources:
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      SecurityGroups: [!Ref ALBSecurityGroup]
      Tags:
        - Key: DeploymentId
          Value: !Ref DeploymentId
  
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
  
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

Outputs:
  ALBDNSName:
    Value: !GetAtt ApplicationLoadBalancer.DNSName
  TargetGroupArn:
    Value: !Ref TargetGroup
```

**Target Registration (boto3):**
```python
def register_instance_with_target_group(instance_id: str, target_group_arn: str, region: str):
    """Register EC2 instance with ALB target group using boto3."""
    elbv2 = boto3.client('elbv2', region_name=region)
    
    response = elbv2.register_targets(
        TargetGroupArn=target_group_arn,
        Targets=[{'Id': instance_id, 'Port': 80}]
    )
    
    return response

def wait_for_target_healthy(target_group_arn: str, instance_id: str, region: str, timeout: int = 300):
    """Wait for target to become healthy."""
    elbv2 = boto3.client('elbv2', region_name=region)
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        response = elbv2.describe_target_health(
            TargetGroupArn=target_group_arn,
            Targets=[{'Id': instance_id}]
        )
        
        if response['TargetHealthDescriptions'][0]['TargetHealth']['State'] == 'healthy':
            return True
        
        time.sleep(10)
    
    return False
```

### 2. Rollback with CloudFormation Stack Deletion

**Rollback Workflow:**
```
1. Load deployment state
2. Check if deployment uses CloudFormation (creation_method == "cloudformation")
3. If ALB exists:
   a. Deregister instances from target groups (boto3)
   b. Wait for connection draining
4. Delete CloudFormation stack
5. Wait for stack deletion to complete (poll status)
6. If deletion fails:
   a. Attempt force deletion
   b. If still fails, provide manual cleanup instructions
7. Update deployment state to "rolled_back"
```

**Implementation:**
```python
def rollback(self, deployment_id: str) -> RollbackResult:
    """Rollback deployment by deleting CloudFormation stack."""
    state = self.load_state(deployment_id)
    
    # Deregister from ALB if exists
    if state.infrastructure and state.infrastructure.target_group_arn:
        self._deregister_from_alb(state)
    
    # Delete CloudFormation stack
    if state.is_cloudformation_deployment():
        stack_manager = StackManager(region=state.region)
        stack_manager.delete_stack(state.stack_info.stack_name)
        
        # Wait for deletion
        try:
            stack_manager.wait_for_stack(
                state.stack_info.stack_name,
                desired_status="DELETE_COMPLETE",
                timeout=1800
            )
        except Exception as e:
            # Attempt force deletion or provide manual instructions
            self._handle_deletion_failure(state, e)
    
    # Update state
    state.status = "rolled_back"
    self._persist_state(state)
    
    return RollbackResult(success=True, deployment_id=deployment_id)
```

### 3. Medic Agent for Error Recovery

**Failure Analysis:**
```python
class MedicAgent:
    """Diagnoses deployment failures and proposes fixes."""
    
    def analyze_failure(self, error: Exception, stage: str, state: DeploymentState) -> FailureAnalysis:
        """Analyze failure and identify root cause."""
        
        # Network timeout
        if isinstance(error, TimeoutError):
            return FailureAnalysis(
                root_cause="network_timeout",
                description="Operation timed out waiting for network response",
                remediation="Increase timeout or check network connectivity"
            )
        
        # Permission error
        if "AccessDenied" in str(error):
            return FailureAnalysis(
                root_cause="permission_error",
                description="AWS API call denied due to insufficient permissions",
                remediation="Add required IAM permissions to deployment role"
            )
        
        # Resource limit
        if "LimitExceeded" in str(error):
            return FailureAnalysis(
                root_cause="resource_limit",
                description="AWS service limit exceeded",
                remediation="Request quota increase or use smaller resources"
            )
        
        # Configuration error
        if isinstance(error, ValidationError):
            return FailureAnalysis(
                root_cause="configuration_error",
                description="Invalid configuration in CloudFormation template",
                remediation="Fix template validation errors"
            )
        
        return FailureAnalysis(
            root_cause="unknown",
            description=str(error),
            remediation="Review logs and retry deployment"
        )
```

### 4. QA Agent for Verification

**Verification Tools:**
```python
def test_http_endpoint(url: str, expected_status: int = 200, timeout: int = 30) -> bool:
    """Test HTTP endpoint accessibility."""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == expected_status
    except Exception as e:
        return False

def test_database_connection(host: str, port: int, db_type: str, credentials: dict) -> bool:
    """Test database connectivity."""
    if db_type == "postgresql":
        import psycopg2
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=credentials['username'],
                password=credentials['password'],
                database=credentials['database'],
                connect_timeout=10
            )
            conn.close()
            return True
        except Exception:
            return False
    
    # Similar for MySQL, MongoDB, etc.
    return False

def validate_ssl_certificate(domain: str) -> bool:
    """Validate SSL certificate."""
    import ssl
    import socket
    
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                return cert is not None
    except Exception:
        return False
```

### 5. Ops Agent for Observability

**CloudWatch Dashboard Creation:**
```python
def create_cloudwatch_dashboard(deployment_id: str, resources: dict, region: str) -> str:
    """Create CloudWatch dashboard for deployment."""
    cloudwatch = boto3.client('cloudwatch', region_name=region)
    
    dashboard_body = {
        "widgets": [
            # Application metrics
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                        [".", "NetworkIn", {"stat": "Sum"}],
                        [".", "NetworkOut", {"stat": "Sum"}]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": region,
                    "title": "EC2 Metrics"
                }
            },
            # ALB metrics (if exists)
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                        [".", "RequestCount", {"stat": "Sum"}],
                        [".", "HTTPCode_Target_2XX_Count", {"stat": "Sum"}],
                        [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": region,
                    "title": "ALB Metrics"
                }
            } if resources.get('alb_arn') else None,
            # RDS metrics (if exists)
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                        [".", "ReadIOPS", {"stat": "Average"}],
                        [".", "WriteIOPS", {"stat": "Average"}]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": region,
                    "title": "RDS Metrics"
                }
            } if resources.get('db_instance_id') else None
        ]
    }
    
    # Remove None widgets
    dashboard_body['widgets'] = [w for w in dashboard_body['widgets'] if w is not None]
    
    dashboard_name = f"HiveMind-{deployment_id}"
    cloudwatch.put_dashboard(
        DashboardName=dashboard_name,
        DashboardBody=json.dumps(dashboard_body)
    )
    
    return f"https://console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name={dashboard_name}"
```

### 6. Blue-Green Deployment

**Workflow:**
```
1. Load existing deployment state
2. Verify ALB exists (required for blue-green)
3. Build new version with Compiler
4. Generate updated CloudFormation template with new EC2 instance
5. Update stack (CloudFormation creates new instance alongside old)
6. Deploy application to new instance with Deployer
7. Register new instance with ALB target group (boto3)
8. Wait for new instance to become healthy
9. Deregister old instance from target group (boto3)
10. Wait for connection draining (300 seconds)
11. Update stack to remove old instance
12. Update deployment state with new instance ID
```

**Zero-Downtime Guarantee:**
- Both instances are healthy and serving traffic during transition
- ALB automatically routes traffic to healthy targets
- Connection draining ensures in-flight requests complete
- No service interruption for end users

### 7. Test Performance Optimization

**Current Problem:**
- Tests take 12+ hours to complete
- Unacceptable for development workflow
- Blocks CI/CD pipeline

**Root Causes:**
1. Property-based tests with 100 examples each
2. Real AWS API calls in unit tests
3. Real SSH connections in tests
4. Strands agent tests making real LLM calls
5. No test parallelization
6. No separation of fast/slow tests

**Solutions:**

**1. Reduce Property Test Examples:**
```python
# pytest.ini
[pytest]
markers =
    property: Property-based tests
    fast: Fast tests (<1 second)
    slow: Slow tests (>10 seconds)
    aws: Requires AWS credentials

# Most property tests
@settings(max_examples=20, deadline=None)
def test_property():
    pass

# Critical correctness properties only
@settings(max_examples=100, deadline=None)
def test_critical_property():
    pass
```

**2. Mock Expensive Operations:**
```python
# Mock boto3 clients
@mock_aws
def test_infrastructure():
    # Uses moto for fast, local AWS simulation
    pass

# Mock SSH connections
@patch('paramiko.SSHClient')
def test_deployment(mock_ssh):
    pass

# Mock LLM responses
@patch('strands.Agent.invoke')
def test_agent(mock_invoke):
    mock_invoke.return_value = {"result": "success"}
    pass
```

**3. Parallelize Tests:**
```bash
# Install pytest-xdist
pip install pytest-xdist

# Run tests in parallel
pytest -n auto  # Uses all CPU cores

# Target: 80% reduction in test time
# 12 hours → 2-3 hours with parallelization
```

**4. Separate Fast/Slow Tests:**
```bash
# Run only fast tests (for development)
pytest -m fast  # <30 seconds

# Run all tests except slow ones
pytest -m "not slow"

# Run slow tests only (for CI)
pytest -m slow
```

**5. Set Time Limits:**
```python
# pytest.ini
[pytest]
timeout = 300  # 5 minutes per test max

# Individual test timeout
@pytest.mark.timeout(60)
def test_something():
    pass
```

**Target Performance:**
- Fast tests: <30 seconds (run on every commit)
- Property tests: <2 minutes (run on every commit)
- Integration tests: <5 minutes (run on merge to main)
- Full test suite: <5 minutes total

### 8. Interactive Web GUI with Agent Selection

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Web Browser                             │
│  - Agent Selector                                            │
│  - Chat Interface                                            │
│  - Deployment Dashboard                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Flask/FastAPI Server                       │
│  - REST API endpoints                                        │
│  - WebSocket for real-time chat                             │
│  - Session management                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agent Router                               │
│  - Routes messages to selected agent                         │
│  - Maintains conversation context                            │
│  - Manages agent state                                       │
└─┬───────┬───────┬───────┬───────┬───────┬───────┬──────────┘
  │       │       │       │       │       │       │
  ▼       ▼       ▼       ▼       ▼       ▼       ▼
All HiveMind Agents (Recon, Compiler, Provisioner, etc.)
```

**Web GUI Components:**

**1. Agent Selector:**
```html
<div class="agent-selector">
  <h2>Select an Agent</h2>
  <div class="agent-grid">
    <div class="agent-card" data-agent="recon">
      <h3>🔍 Recon</h3>
      <p>Repository analysis and tech stack detection</p>
    </div>
    <div class="agent-card" data-agent="compiler">
      <h3>🔨 Compiler</h3>
      <p>Build and compile applications</p>
    </div>
    <div class="agent-card" data-agent="provisioner">
      <h3>☁️ Provisioner</h3>
      <p>CloudFormation infrastructure provisioning</p>
    </div>
    <div class="agent-card" data-agent="deployer">
      <h3>🚀 Deployer</h3>
      <p>Application deployment and configuration</p>
    </div>
    <div class="agent-card" data-agent="sheriff">
      <h3>🛡️ Sheriff</h3>
      <p>Security hardening and compliance</p>
    </div>
    <div class="agent-card" data-agent="qa">
      <h3>✅ QA</h3>
      <p>Deployment verification and testing</p>
    </div>
    <div class="agent-card" data-agent="ops">
      <h3>📊 Ops</h3>
      <p>Monitoring and observability</p>
    </div>
    <div class="agent-card" data-agent="medic">
      <h3>🏥 Medic</h3>
      <p>Error diagnosis and recovery</p>
    </div>
    <div class="agent-card" data-agent="janitor">
      <h3>🧹 Janitor</h3>
      <p>Resource cleanup and analysis</p>
    </div>
    <div class="agent-card" data-agent="conductor">
      <h3>🎭 Conductor</h3>
      <p>Orchestration and workflow management</p>
    </div>
  </div>
</div>
```

**2. Chat Interface:**
```python
class AgentChatInterface:
    """Web interface for chatting with specific agents."""
    
    def __init__(self):
        self.agents = {
            'recon': ReconAgent(),
            'compiler': CompilerAgent(),
            'provisioner': ProvisionerAgent(),
            'deployer': DeployerAgent(),
            'sheriff': SheriffAgent(),
            'qa': QAAgent(),
            'ops': OpsAgent(),
            'medic': MedicAgent(),
            'janitor': JanitorAgent(),
            'conductor': ConductorAgent()
        }
        self.sessions = {}  # session_id -> conversation history
    
    async def handle_message(self, session_id: str, agent_name: str, 
                            message: str, deployment_id: str = None):
        """Handle user message to specific agent."""
        
        # Get or create session
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                'history': {},
                'current_deployment': deployment_id
            }
        
        # Get agent
        agent = self.agents.get(agent_name)
        if not agent:
            return {"error": f"Agent {agent_name} not found"}
        
        # Get conversation history for this agent
        if agent_name not in self.sessions[session_id]['history']:
            self.sessions[session_id]['history'][agent_name] = []
        
        history = self.sessions[session_id]['history'][agent_name]
        
        # Add user message to history
        history.append({"role": "user", "content": message})
        
        # Load deployment state if provided
        state = None
        if deployment_id:
            state = load_deployment_state(deployment_id)
        
        # Invoke agent with context
        response = await agent.chat(
            message=message,
            history=history,
            deployment_state=state
        )
        
        # Add agent response to history
        history.append({"role": "assistant", "content": response})
        
        return {
            "agent": agent_name,
            "response": response,
            "deployment_id": deployment_id
        }
```

**3. WebSocket Server:**
```python
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
import json

app = FastAPI()
chat_interface = AgentChatInterface()

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time agent chat."""
    await websocket.accept()
    session_id = str(uuid.uuid4())
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            agent_name = message_data.get('agent')
            message = message_data.get('message')
            deployment_id = message_data.get('deployment_id')
            
            # Process message with agent
            response = await chat_interface.handle_message(
                session_id=session_id,
                agent_name=agent_name,
                message=message,
                deployment_id=deployment_id
            )
            
            # Send response back to client
            await websocket.send_text(json.dumps(response))
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/api/deployments")
async def list_deployments():
    """List all deployments."""
    deployments = discover_deployments()
    return {"deployments": deployments}

@app.get("/api/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    """Get deployment details."""
    state = load_deployment_state(deployment_id)
    return state.dict()

# Serve static files (HTML, CSS, JS)
app.mount("/", StaticFiles(directory="web", html=True), name="web")
```

**4. Frontend JavaScript:**
```javascript
class HiveMindChat {
    constructor() {
        this.ws = null;
        this.currentAgent = null;
        this.currentDeployment = null;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket('ws://localhost:8000/ws/chat');
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.displayMessage(data.agent, data.response);
        };
    }
    
    selectAgent(agentName) {
        this.currentAgent = agentName;
        document.getElementById('chat-title').textContent = 
            `Chat with ${agentName}`;
        this.loadHistory(agentName);
    }
    
    sendMessage(message) {
        if (!this.currentAgent) {
            alert('Please select an agent first');
            return;
        }
        
        const data = {
            agent: this.currentAgent,
            message: message,
            deployment_id: this.currentDeployment
        };
        
        this.ws.send(JSON.stringify(data));
        this.displayMessage('user', message);
    }
    
    displayMessage(sender, content) {
        const chatBox = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = content;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    loadHistory(agentName) {
        // Load conversation history for this agent
        const chatBox = document.getElementById('chat-messages');
        chatBox.innerHTML = '';
        // Fetch and display history from session
    }
}

// Initialize chat interface
const chat = new HiveMindChat();

// Agent selection
document.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', () => {
        const agentName = card.dataset.agent;
        chat.selectAgent(agentName);
    });
});

// Send message
document.getElementById('send-button').addEventListener('click', () => {
    const input = document.getElementById('message-input');
    chat.sendMessage(input.value);
    input.value = '';
});
```

**Use Cases:**

**1. Troubleshooting with Medic:**
```
User: "My deployment failed during the provisioning stage"
Medic: "Let me analyze the failure... I see a permission error. 
        Your IAM role is missing the ec2:CreateVpc permission. 
        Would you like me to generate the required IAM policy?"
User: "Yes please"
Medic: "Here's the policy you need to add: [policy JSON]
        I can also retry the deployment once you've updated the permissions."
```

**2. Modifying Infrastructure with Provisioner:**
```
User: "Can you add a Redis cache to my deployment?"
Provisioner: "I can update your CloudFormation template to include 
              an ElastiCache Redis cluster. What instance type would you like?"
User: "cache.t3.micro"
Provisioner: "I'll update the template and apply the changes. 
              This will create a Redis cluster in your private subnet."
```

**3. Checking Metrics with Ops:**
```
User: "What's my application's CPU usage?"
Ops: "Your EC2 instance is currently at 45% CPU utilization. 
      Here's the CloudWatch dashboard: [link]
      Would you like me to set up an alarm for high CPU?"
```

**4. Verifying Deployment with QA:**
```
User: "Is my application responding correctly?"
QA: "Let me run verification tests...
     ✅ HTTP endpoint responding (200 OK)
     ✅ Database connection successful
     ✅ SSL certificate valid
     All checks passed!"
```

**Implementation Files:**
```
hivemind_web/
├── server.py              # FastAPI server
├── agent_router.py        # Routes messages to agents
├── session_manager.py     # Manages user sessions
├── web/
│   ├── index.html        # Main page with agent selector
│   ├── chat.html         # Chat interface
│   ├── dashboard.html    # Deployment dashboard
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       ├── chat.js       # Chat functionality
│       └── dashboard.js  # Dashboard functionality
└── requirements-web.txt   # Web dependencies
```

## Data Models

### Updated DeploymentState

```python
@dataclass
class DeploymentState:
    # Existing fields
    deployment_id: str
    status: DeploymentStatus
    repo_url: str
    
    # CloudFormation fields
    stack_info: Optional[StackInfo]
    creation_method: str = "cloudformation"
    
    # ALB fields
    alb_dns_name: Optional[str] = None
    target_group_arn: Optional[str] = None
    
    # New agent results
    verification_results: Optional[VerificationResults] = None
    monitoring_config: Optional[MonitoringConfig] = None
    
    # Error recovery
    retry_count: int = 0
    failure_analysis: Optional[FailureAnalysis] = None
    
    # Deployment stage
    deployment_stage: str = "production"  # or "stage-1"
    xray_enabled: bool = False
```

## Testing Strategy

### Unit Tests
- Mock all AWS API calls
- Mock all SSH connections
- Mock all LLM calls
- Target: <1 second per test
- Run on every commit

### Property Tests
- 20 examples for most properties
- 100 examples for critical correctness properties
- Use Hypothesis with appropriate settings
- Target: <2 minutes total
- Run on every commit

### Integration Tests
- Use real AWS resources (test account)
- Mark with @pytest.mark.slow
- Run only on merge to main
- Target: <5 minutes total
- Automated cleanup after tests

### Performance Benchmarks
- Monitor test execution time in CI
- Fail CI if tests exceed time limits
- Track test performance over time
- Optimize slow tests continuously

## Security Considerations

- ALB terminates SSL/TLS connections
- EC2 instances only accept traffic from ALB security group
- Database in private subnet, not publicly accessible
- SSH keys generated per deployment, stored securely
- CloudFormation templates validated before deployment
- No credentials in logs or state files

## Deployment Workflow

```
1. User: hivemind deploy <repo> "description" [--stage-1] [--xray]
2. Conductor: Create deployment state
3. Recon: Analyze repository
4. Compiler: Build application
5. Provisioner: Generate CloudFormation template with ALB
6. Provisioner: Create CloudFormation stack
7. Provisioner: Wait for stack creation
8. Provisioner: Extract stack outputs (ALB DNS, target group ARN)
9. Deployer: Deploy application to EC2 instance
10. Deployer: Register instance with ALB target group (boto3)
11. Deployer: Wait for instance to become healthy
12. Sheriff: Harden security
13. QA: Verify deployment (test HTTP endpoint, database)
14. Ops: Create CloudWatch dashboard
15. Ops: Setup X-Ray (if --xray flag)
16. Conductor: Display deployment summary with ALB DNS and dashboard URL
```

## Success Criteria

- ALB integration complete and tested
- Rollback works reliably (99% success rate)
- Error recovery reduces manual intervention by 80%
- Verification catches 95% of deployment issues
- CloudWatch dashboards created for 100% of deployments
- Blue-green deployments achieve zero downtime
- Test suite completes in <5 minutes
- All property tests pass with 100 iterations (critical ones)
- Production-ready for real-world deployments
