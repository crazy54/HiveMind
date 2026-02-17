# HiveMind AutoDeploy - Architecture

## Overview

HiveMind AutoDeploy is a multi-agent AI system that automatically deploys applications from GitHub/GitLab repositories to AWS infrastructure. The system uses 6 specialized AI agents, each with specific responsibilities, coordinated by a central Conductor agent.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  CLI         │              │  Python API  │            │
│  │  (src/cli.py)│              │  (Direct)    │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼──────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         │
          ┌──────────────▼───────────────┐
          │   🎯 HiveMind Control Plane      │
          │   (strands_conductor.py)     │
          │                              │
          │  - Orchestrates workflow     │
          │  - Manages state             │
          │  - Handles errors            │
          │  - Coordinates agents        │
          └──────────────┬───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ 🔍 Recon      │ │ 🔨 Compiler   │ │ ☁️ Provisioner│
│               │ │               │ │               │
│ Analyzes docs │ │ Builds apps   │ │ Creates AWS   │
│ Extracts reqs │ │ Detects stack │ │ infrastructure│
└───────────────┘ └───────────────┘ └───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│ 🚀 Deployer   │                 │ 🔒 Sheriff    │
│               │                 │               │
│ Deploys apps  │                 │ Hardens       │
│ Configures    │                 │ security      │
└───────────────┘                 └───────────────┘
```

## Agent Responsibilities

### 1. 🎯 Conductor Agent
**File**: `src/agents/strands_conductor.py`

**Responsibilities**:
- Orchestrate the entire deployment workflow
- Coordinate all other agents
- Manage deployment state
- Handle errors and retries
- Provide user interface
- Generate predictions (what-if mode)

**Key Methods**:
- `deploy()` - Main deployment orchestration
- `get_status()` - Retrieve deployment status
- `retry_deployment()` - Retry failed deployments
- `_generate_predictions()` - Generate cost/resource/timeline predictions

**State Management**:
- Persists state to JSON files in `./deployments/`
- Tracks deployment progress through status enum
- Maintains logs for audit trail

### 2. 🔍 Recon Agent (NEW!)
**File**: `src/agents/strands_recon.py`

**Responsibilities**:
- Analyze repository documentation
- Extract deployment requirements
- Identify required services (databases, caches, queues)
- Find environment variables
- Detect deployment steps
- Analyze Docker configuration
- Generate recommendations

**Tools Used**:
- `read_repository_documentation` - Read README, DEPLOY, etc.
- `analyze_environment_variables` - Extract env vars
- `identify_required_services` - Detect PostgreSQL, Redis, etc.
- `extract_deployment_instructions` - Find deployment steps
- `identify_port_requirements` - Find ports
- `analyze_domain_and_ssl_requirements` - Check SSL needs
- `analyze_docker_setup` - Analyze Docker config
- `generate_deployment_plan` - Create comprehensive plan

**Output**:
- Deployment plan with all requirements
- Service list with versions
- Environment variables (required vs optional)
- Deployment steps (pre/post)
- Recommendations

### 3. 🔨 Compiler Agent
**File**: `src/agents/strands_compiler.py`

**Responsibilities**:
- Clone and analyze repository
- Detect tech stack (language, framework, runtime)
- Identify database requirements
- Build application
- Generate build artifacts
- Calculate checksums

**Tools Used**:
- `clone_repository` - Clone from GitHub/GitLab
- `analyze_repository` - Detect tech stack
- `build_application` - Build Node.js, Python, Go, etc.

**Supported Tech Stacks**:
- **Node.js**: Express, NestJS, Next.js
- **Python**: Django, FastAPI, Flask
- **Go**: Gin, Echo, Chi
- **Java**: Spring Boot
- **Rust**: Actix, Rocket

**Output**:
- Tech stack information
- Build artifact with checksum
- Build logs

### 4. ☁️ Provisioner Agent
**File**: `src/agents/strands_server_monkey.py`

**Responsibilities**:
- Provision AWS infrastructure
- Create VPC with public/private subnets
- Create security groups
- Launch EC2 instances
- Create RDS databases (if needed)
- Configure load balancers (future)

**Tools Used**:
- `create_vpc` - Create VPC with subnets, IGW, route tables
- `create_security_group` - Create security groups with rules
- `create_ec2_instance` - Launch EC2 instances
- `create_rds_instance` - Create RDS databases

**Infrastructure Created**:
- 1 VPC
- 2 Subnets (public + private)
- 1-2 Security Groups
- 1 EC2 Instance (t3.micro to t3.large)
- 0-1 RDS Instance (if database required)

**Output**:
- Infrastructure specification with IDs
- Public/private IPs
- Database endpoints and credentials

### 5. 🚀 Deployer Agent
**File**: `src/agents/strands_deployer.py`

**Responsibilities**:
- Deploy application to EC2 instance
- Install runtime (Node.js, Python, Go)
- Copy build artifacts
- Configure environment variables
- Start application service
- Verify health

**Tools Used**:
- `ssh_connect` - Connect to EC2 via SSH
- `install_runtime` - Install Node.js, Python, Go
- `copy_build_artifact` - SCP files to server
- `configure_environment` - Set env vars
- `start_service` - Start with systemd/PM2/supervisor
- `verify_health` - Check application health

**Service Managers**:
- **Node.js**: PM2
- **Python**: systemd + gunicorn/uvicorn
- **Go**: systemd

**Output**:
- Deployment configuration
- Service status
- Application port
- Health check results

### 6. 🔒 Sheriff Agent
**File**: `src/agents/strands_sheriff.py`

**Responsibilities**:
- Harden security configurations
- Review and tighten security groups
- Configure SSL/TLS certificates
- Harden operating system
- Configure firewall (UFW/iptables)
- Run vulnerability scans

**Tools Used**:
- `review_security_groups` - Audit security group rules
- `configure_ssl_certificate` - Set up SSL/TLS
- `harden_operating_system` - OS hardening (fail2ban, SSH)
- `configure_firewall` - Configure UFW/iptables
- `run_vulnerability_scan` - Scan for vulnerabilities

**Security Measures**:
- Least privilege security groups
- SSL/TLS configuration
- SSH hardening
- Firewall rules
- Fail2ban installation
- Vulnerability scanning

**Output**:
- Security configuration
- SSL status
- Firewall status
- Vulnerability scan results

## Deployment Workflow

### Standard Deployment

```
1. User initiates deployment
   ↓
2. Conductor creates deployment state
   ↓
3. 🔍 Recon analyzes documentation
   - Reads README, DEPLOY, docker files
   - Extracts requirements
   - Creates deployment plan
   ↓
4. 🔨 Compiler analyzes and builds
   - Clones repository
   - Detects tech stack
   - Builds application
   ↓
5. ☁️ Provisioner creates infrastructure
   - Creates VPC and subnets
   - Launches EC2 instance
   - Creates RDS database (if needed)
   ↓
6. 🚀 Deployer deploys application
   - Installs runtime
   - Copies artifacts
   - Configures environment
   - Starts service
   ↓
7. 🔒 Sheriff hardens security
   - Reviews security groups
   - Configures SSL
   - Hardens OS
   - Scans vulnerabilities
   ↓
8. Conductor marks deployment complete
   ↓
9. User receives deployment ID and details
```

### What-If Mode Workflow

```
1. User initiates with dry_run=True
   ↓
2. Conductor creates deployment state (dry_run=True)
   ↓
3. 🔍 Recon analyzes documentation (REAL)
   ↓
4. 🔨 Compiler analyzes repository (REAL)
   ↓
5. ☁️ Provisioner plans infrastructure (SIMULATED)
   ↓
6. 🚀 Deployer plans deployment (SIMULATED)
   ↓
7. 🔒 Sheriff plans security (SIMULATED)
   ↓
8. Conductor generates predictions
   - Cost estimates
   - Resource counts
   - Timeline estimates
   ↓
9. User receives predictions (NO AWS CHANGES)
```

## Data Flow

### Deployment State

```python
DeploymentState:
  - deployment_id: str
  - repo_url: str
  - status: DeploymentStatus
  - dry_run: bool
  
  # Agent outputs
  - tech_stack: TechStack
  - build_artifact: BuildArtifact
  - infrastructure: InfrastructureSpec
  - deployment_config: DeploymentConfig
  - security_config: SecurityConfig
  
  # Predictions (what-if mode)
  - predicted_costs: dict
  - predicted_resources: dict
  - predicted_timeline: dict
  
  # Tracking
  - logs: list[str]
  - started_at: datetime
  - completed_at: datetime
```

### Information Flow Between Agents

```
Recon → Compiler:
  - Deployment plan
  - Required services
  - Environment variables

Compiler → Provisioner:
  - Tech stack
  - Database requirements
  - Runtime version

Provisioner → Deployer:
  - Infrastructure IDs
  - Public/private IPs
  - Database endpoints

Deployer → Sheriff:
  - Deployment configuration
  - Application port
  - Service status

All Agents → Conductor:
  - Success/failure status
  - Output data
  - Error messages
```

## Tool Architecture

### Tool Organization

```
Core Functions (src/tools/*.py):
  - Pure Python functions
  - No Strands dependency
  - Testable independently
  - Reusable

Strands Wrappers (src/tools/*_tools.py):
  - @tool decorator
  - Strands SDK integration
  - Used by agents
  - LLM-friendly descriptions
```

### Example Tool

```python
# Core function
def create_vpc(region: str) -> dict:
    """Create VPC with subnets."""
    # Implementation
    return {"vpc_id": "vpc-123", ...}

# Strands wrapper
@tool
def create_vpc_tool(region: str) -> dict:
    """
    Create AWS VPC with public and private subnets.
    
    Args:
        region: AWS region (e.g., us-east-1)
    
    Returns:
        VPC details including vpc_id and subnet_ids
    """
    return create_vpc(region)
```

## State Management

### State Persistence

- **Location**: `./deployments/<deployment-id>.json`
- **Format**: JSON
- **Updates**: After each agent completes
- **Recovery**: Can resume from last successful stage

### State Transitions

```
PENDING → ANALYZING → BUILDING → PROVISIONING → 
DEPLOYING → SECURING → COMPLETED

Any state can transition to FAILED on error
DRY_RUN is a special status for what-if mode
```

## Error Handling

### Error Strategy

**Critical Errors** (stop deployment):
- Recon failure → Warning (continue)
- Compiler failure → Stop
- Provisioner failure → Stop
- Deployer failure → Stop

**Non-Critical Errors** (warn but continue):
- Sheriff failure → Warn

### Retry Logic

- Retries from last successful stage
- Exponential backoff for transient failures
- Maximum retry attempts configurable
- State preserved for recovery

## Security Architecture

### Credentials Management

- AWS credentials from environment or ~/.aws/credentials
- SSH keys for EC2 access
- Database passwords generated and stored securely
- No hardcoded secrets

### Network Security

- VPC with public/private subnets
- Security groups with least privilege
- Firewall rules (UFW/iptables)
- SSH hardening (key-only, fail2ban)

### Application Security

- SSL/TLS certificates
- Environment variable encryption
- OS hardening
- Vulnerability scanning

## Scalability

### Current Limitations

- Single EC2 instance per deployment
- No auto-scaling
- No load balancing (yet)
- Single region deployments

### Future Enhancements

- Multi-instance deployments
- Auto-scaling groups
- Application Load Balancers
- Multi-region support
- Blue-green deployments

## Observability

### Logging

- Structured logging with timestamps
- Agent-specific log prefixes
- Emoji indicators for visual clarity
- Full audit trail in deployment state

### Metrics (via Strands SDK)

- Agent execution time
- Tool usage statistics
- Token usage and costs
- Success/failure rates

### Monitoring

- Deployment status tracking
- Error rate monitoring
- Cost tracking
- Performance metrics

## Technology Stack

### Core Technologies

- **Language**: Python 3.10+
- **Agent Framework**: Strands SDK
- **AWS SDK**: boto3
- **Git**: GitPython
- **SSH**: paramiko
- **Testing**: pytest, hypothesis, moto
- **Validation**: Pydantic

### AWS Services

- **Compute**: EC2
- **Networking**: VPC, Subnets, Security Groups
- **Database**: RDS (PostgreSQL, MySQL)
- **Future**: ELB, Auto Scaling, CloudWatch

## Design Principles

### 1. Separation of Concerns
Each agent has a single, well-defined responsibility.

### 2. Modularity
Agents and tools are independent and reusable.

### 3. Testability
Core functions separate from Strands wrappers for easy testing.

### 4. Observability
Comprehensive logging and state tracking.

### 5. Safety
What-if mode for risk-free testing.

### 6. User-Friendly
Clear CLI, helpful error messages, good documentation.

## Performance Characteristics

### Typical Deployment Timeline

- **Recon**: 30-60 seconds
- **Compilation**: 2-5 minutes
- **Provisioning**: 3-5 minutes
- **Deployment**: 3-7 minutes
- **Security**: 5-10 minutes
- **Total**: 13-27 minutes

### What-If Mode Timeline

- **Total**: 1-2 minutes (much faster!)
- No AWS resource creation
- Only analysis and planning

### Resource Usage

- **Memory**: ~500MB during deployment
- **Disk**: ~1GB for cloned repos and artifacts
- **Network**: Depends on repository size

## Future Architecture

### Planned Enhancements

1. **Kubernetes Support**
   - Deploy to EKS
   - Helm chart generation
   - Container orchestration

2. **Multi-Region**
   - Deploy to multiple regions
   - Global load balancing
   - Disaster recovery

3. **CI/CD Integration**
   - GitHub Actions integration
   - GitLab CI integration
   - Webhook support

4. **Advanced Monitoring**
   - CloudWatch integration
   - Custom metrics
   - Alerting

5. **Cost Optimization**
   - Spot instance support
   - Reserved instance recommendations
   - Cost analysis and optimization

---

**Last Updated**: December 8, 2025
**Version**: 1.0
**Status**: Production Ready (90% complete)
