# 🎭 HiveMind Agent Roster

The complete guide to all HiveMind deployment agents, their personalities, and responsibilities.

---

## 🎩 Orchestrator

### Cornelius the Conductor
**Role**: Master Orchestrator  
**Personality**: Distinguished, elegant, authoritative  
**File**: `src/agents/strands_conductor.py`

**Responsibilities:**
- Orchestrates all agents in correct sequence
- Manages deployment state and workflow
- Handles errors and triggers rollback
- Coordinates agent communication
- Provides deployment reports

**Key Methods:**
- `deploy()` - Execute full deployment workflow
- `update()` - Zero-downtime application updates
- `destroy()` - Clean up all resources
- `_handle_failure()` - Error recovery and rollback
- `_rollback()` - Automatic resource cleanup

---

## 👥 The Team

### 1. Randy Recon 🔍
**Role**: Repository Analysis Detective  
**Personality**: Thorough, investigative, detail-oriented  
**File**: `src/agents/strands_recon.py`

**Responsibilities:**
- Analyzes repository documentation (README, DEPLOY.md, Dockerfiles)
- Detects required services (PostgreSQL, Redis, etc.)
- Extracts environment variables and ports
- Identifies deployment requirements
- Provides analysis summary

**Tools:**
- `analyze_readme()` - Parse README files
- `detect_services()` - Identify required services
- `extract_env_vars()` - Find environment variables
- `detect_ports()` - Discover application ports

**Current Status:** ⚠️ Needs timeout fix (Task 1)

---

### 2. Chris Compiler 🔨
**Role**: Application Building Expert  
**Personality**: Methodical, precise, quality-focused  
**File**: `src/agents/strands_compiler.py`

**Responsibilities:**
- Detects tech stack (Node.js, Python, Go, etc.)
- Selects appropriate build tools
- Executes build commands
- Creates deployable artifacts
- Validates build success

**Tools:**
- `detect_tech_stack()` - Identify programming language and framework
- `select_build_tool()` - Choose npm, pip, go build, maven, etc.
- `execute_build()` - Run build commands
- `create_artifact()` - Package build output

---

### 3. Peter Provisioner 🏗️
**Role**: AWS Infrastructure Architect  
**Personality**: Organized, systematic, infrastructure-minded  
**File**: `src/agents/strands_abe.py` (will be renamed to `strands_peter.py`)

**Responsibilities:**
- Creates VPC with public/private subnets
- Provisions EC2 instances
- Creates RDS databases when needed
- Configures security groups
- Sets up load balancers
- Tags all resources with DeploymentId

**Tools:**
- `create_vpc()` - Create VPC and networking
- `launch_ec2()` - Provision compute instances
- `create_rds()` - Set up databases
- `configure_security_groups()` - Network security
- `create_load_balancer()` - Traffic distribution

**Current Status:** ⚠️ Needs real AWS integration (Task 6)

---

### 4. Dan the Deployer 🚀
**Role**: Application Deployment Specialist  
**Personality**: Action-oriented, hands-on, gets things done  
**File**: `src/agents/strands_deployer.py` (will be renamed to `strands_dan.py`)

**Responsibilities:**
- SSH to EC2 instances
- Installs runtime dependencies
- Copies build artifacts
- Configures environment variables
- Starts application services
- Verifies application is running

**Tools:**
- `ssh_connect()` - Connect to instances
- `install_dependencies()` - Set up runtime
- `copy_artifacts()` - Transfer build files
- `configure_env()` - Set environment variables
- `start_service()` - Launch application

**Current Status:** ⚠️ Needs real deployment (Task 7)

---

### 5. Shawn the Sheriff 🤠
**Role**: Security Hardening Enforcer  
**Personality**: Vigilant, security-conscious, no-nonsense  
**File**: `src/agents/strands_sheriff.py` (will be renamed to `strands_shawn.py`)

**Responsibilities:**
- Reviews and tightens security groups
- Configures SSL/TLS certificates
- Disables unnecessary services
- Updates system packages
- Runs vulnerability scans
- Applies CIS benchmarks

**Tools:**
- `review_security_groups()` - Audit network rules
- `configure_ssl()` - Set up HTTPS
- `harden_os()` - Secure operating system
- `run_vulnerability_scan()` - Security assessment
- `apply_cis_benchmarks()` - Industry standards

---

### 6. Overwatch 👁️
**Role**: Deployment Verification Guardian  
**Personality**: Thorough, diagnostic, health-focused  
**File**: `src/agents/strands_overwatch.py` (NEW)

**Responsibilities:**
- Tests HTTP/HTTPS endpoints
- Verifies database connectivity
- Checks port accessibility
- Validates SSL certificates
- Confirms application startup
- Provides diagnostic information on failures

**Tools:**
- `test_http_endpoint()` - HTTP health checks
- `test_database_connection()` - Database connectivity
- `test_port_accessibility()` - Port checks
- `validate_ssl_certificate()` - SSL validation
- `check_application_health()` - Overall health status

**Current Status:** 🆕 To be implemented (Task 10)

---

### 7. The All-Seeing Eye 🔮
**Role**: Continuous Monitoring Oracle  
**Personality**: Vigilant, observant, always watching  
**File**: `src/agents/strands_monitor.py` (NEW)

**Responsibilities:**
- Sets up CloudWatch logging and metrics
- Streams real-time application logs
- Collects CPU, memory, disk, network metrics
- Detects and highlights errors
- Provides alerts for critical issues
- Tracks costs and uptime

**Tools:**
- `setup_cloudwatch_logging()` - Configure logging
- `get_recent_logs()` - Retrieve logs
- `get_metrics()` - Collect performance data
- `detect_errors()` - Error detection
- `calculate_costs()` - Cost tracking
- `check_uptime()` - Availability monitoring

**Current Status:** 🆕 To be implemented (Task 11)

---

### 8. Jerry the Janitor 🧹
**Role**: Resource Cleanup and Cost-Saving Hero  
**Personality**: Efficient, thorough, leaves nothing behind  
**File**: `src/agents/strands_jerry.py` (NEW)

**Responsibilities:**
- Discovers all resources for a deployment
- Calculates cost savings from deletion
- Deletes resources in correct dependency order
- Creates final backups before deletion
- Verifies complete cleanup
- Detects orphaned resources

**Tools:**
- `discover_resources()` - Find all deployment resources
- `calculate_cost_savings()` - Estimate savings
- `create_database_backup()` - Backup before deletion
- `delete_resources()` - Dependency-aware deletion
- `verify_cleanup()` - Confirm complete removal

**Current Status:** 🆕 To be implemented (Task 12)

---

## 📊 Agent Workflow

```
User Command
     ↓
Cornelius the Conductor
     ↓
┌────┴────┬────────┬────────┬────────┬────────┬────────┬────────┐
│         │        │        │        │        │        │        │
Randy   Chris   Peter    Dan    Shawn  Over-   All-   Jerry
Recon   Compiler Provision Deployer Sheriff watch  Seeing  Janitor
                 er                           Eye
```

### Deployment Sequence:
1. **Randy Recon** - Analyze repository
2. **Interactive Config** - Get user preferences
3. **Chris Compiler** - Build application
4. **Peter Provisioner** - Create infrastructure
5. **Dan the Deployer** - Deploy application
6. **Shawn the Sheriff** - Harden security
7. **Overwatch** - Verify deployment
8. **The All-Seeing Eye** - Set up monitoring
9. **Report Generation** - Comprehensive summary

### Update Sequence:
1. **Chris Compiler** - Build new version
2. **Peter Provisioner** - Create new instance (blue-green)
3. **Dan the Deployer** - Deploy to new instance
4. **Overwatch** - Verify new version
5. **Cornelius** - Switch traffic, cleanup old

### Destroy Sequence:
1. **Jerry the Janitor** - Discover resources
2. **Jerry the Janitor** - Calculate savings
3. **Jerry the Janitor** - Create backups
4. **Jerry the Janitor** - Delete resources
5. **Jerry the Janitor** - Verify cleanup

---

## 🎯 Agent Status

| Agent | Status | Priority | Task |
|-------|--------|----------|------|
| Randy Recon | ⚠️ Needs Fix | CRITICAL | Task 1: Fix timeout |
| Chris Compiler | ✅ Working | - | - |
| Peter Provisioner | ⚠️ Needs Enhancement | HIGH | Task 6: Real AWS |
| Dan the Deployer | ⚠️ Needs Enhancement | HIGH | Task 7: Real deploy |
| Shawn the Sheriff | ✅ Working | - | - |
| Overwatch | 🆕 New | HIGH | Task 10: Implement |
| The All-Seeing Eye | 🆕 New | HIGH | Task 11: Implement |
| Jerry the Janitor | 🆕 New | HIGH | Task 12: Implement |
| Cornelius the Conductor | ⚠️ Needs Enhancement | HIGH | Task 14: Integration |

---

## 🚀 Quick Reference

### CLI Commands
```bash
# Deploy with Randy Recon's analysis
hivemind deploy <repo-url>

# Check status with The All-Seeing Eye
hivemind status <deployment-id> --show-logs --show-metrics

# Update with zero downtime
hivemind update <deployment-id>

# Cleanup with Jerry the Janitor
hivemind destroy <deployment-id>
```

### File Naming Convention
- `strands_<name>.py` - Agent implementation
- Example: `strands_randy.py`, `strands_overwatch.py`, `strands_jerry.py`

### Agent Communication
All agents communicate through:
- **DeploymentState** - Shared state object
- **Cornelius the Conductor** - Central orchestrator
- **Logs** - Aggregated by The All-Seeing Eye

---

## 📝 Notes

- All agents use the Strands SDK
- Agents are called as functions: `result = agent(message)`
- Each agent has specific tools for their domain
- Cornelius coordinates everything
- The All-Seeing Eye monitors everything
- Jerry cleans up everything

**Remember**: Randy Recon starts it, Cornelius conducts it, and Jerry finishes it! 🎭
