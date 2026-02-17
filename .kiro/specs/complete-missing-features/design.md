# Design: Complete Missing Features

## Overview

This design focuses on completing the missing features in the HiveMind deployment system. The system already has a solid foundation with 5 specialized agents (Recon, Compiler, Provisioner, Deployer, Sheriff) orchestrated by a Conductor. We'll enhance this with ALB integration, complete rollback functionality, error recovery, new agents, and improved workflows.

## Current Architecture

### Existing Agents
1. **HiveMind SA (Recon)** - Analyzes documentation and creates deployment plans
2. **HiveMind DevOps (Compiler)** - Analyzes and builds applications
3. **HiveMind SysEng (Provisioner)** - Provisions AWS infrastructure
4. **HiveMind Release-Engineer (Deployer)** - Deploys applications
5. **HiveMind SecOps (Sheriff)** - Hardens security
6. **HiveMind Control Plane (Conductor)** - Orchestrates all agents

### Existing Infrastructure
- VPC with public/private subnets
- Security groups
- EC2 instances
- RDS databases (optional)
- SSH key management
- Resource tagging and tracking

### What's Missing
- ALB integration (tool exists but not integrated)
- Complete rollback implementation (partially done)
- Error recovery and retry logic
- New verification and monitoring agents
- Update workflow (blue-green deployment)
- Enhanced CLI commands
- Deployment reports

## 1. ALB Integration Design

### 1.1 Architecture


The ALB tool (`create_load_balancer`) already exists in `src/tools/aws_infrastructure.py`. We need to integrate it into the workflow:

**Flow:**
```
Provisioner → Creates ALB + Target Group → Returns ALB details
     ↓
Conductor → Extracts ALB info → Stores in state
     ↓
Deployer → Registers EC2 with target group → Verifies health
```

**Key Components:**
- ALB with HTTP listener (port 80)
- Target group with health checks
- EC2 instance registration
- DNS name for access

### 1.2 Detection Logic (Aggressive)

The Provisioner should create an ALB for ANY service that:
- Exposes a port for client connections
- Requires network accessibility
- Benefits from load balancing and SSL/TLS termination

**Always create ALB for:**
- Web services (HTTP/HTTPS)
- API servers (REST, GraphQL, gRPC)
- WebSocket servers
- Database proxies
- Any service with exposed ports (3000, 5000, 8000, 8080, etc.)

**Benefits:**
- SSL/TLS termination at ALB
- Zero-downtime updates (swap targets)
- Health checks and automatic failover
- Centralized access point

**Only skip ALB for:**
- Pure CLI tools with no network service
- Batch jobs that don't listen on ports
- Background workers without client connections

### 1.3 Implementation Details

**Provisioner Changes:**
- System prompt updated with ALB guidance
- Tool already available in agent's tool list
- Returns ALB ARN, DNS name, target group ARN

**Conductor Changes:**
- Extract ALB details from Provisioner results
- Store in `InfrastructureSpec`: `alb_arn`, `alb_dns_name`, `target_group_arn`
- Pass to Deployer for registration

**Deployer Changes:**
- New tool: `register_target(instance_id, target_group_arn, region)`
- Register EC2 instance after deployment
- Wait for healthy status
- Verify via ALB DNS


## 2. Complete Rollback Implementation

### 2.1 Current State

The Conductor already has a `rollback()` method that:
- Loads deployment state
- Stops application service via SSH
- Calls `destroy_deployment()` from cleanup_tools
- Updates state to ROLLED_BACK

**What's Working:**
- Basic rollback structure exists
- Resource tracking via `state.resources`
- Dependency-ordered deletion

**What's Missing:**
- ALB/target group deregistration
- Comprehensive error handling
- Partial rollback recovery
- Better logging

### 2.2 Enhanced Rollback Flow

```
1. Load deployment state
2. Validate resources exist
3. Stop application service (SSH)
4. Deregister from ALB target groups
5. Delete resources in order:
   - EC2 instances
   - RDS instances (with snapshot)
   - Load balancers
   - Security groups
   - Subnets
   - Internet gateways
   - VPC
   - SSH key pairs
6. Update state to ROLLED_BACK
7. Log completion
```

### 2.3 Implementation Details

**Resource Deletion Order:**
The `ResourceInfo` model already has `teardown_order` and `depends_on` fields. Use these for correct ordering:

1. Application layer (order 1): Stop services
2. Compute layer (order 2): EC2, RDS
3. Network layer (order 3): ALB, target groups
4. Security layer (order 4): Security groups
5. Network infrastructure (order 5): Subnets, IGW
6. Foundation (order 6): VPC
7. Access (order 7): SSH keys

**Error Handling:**
- Continue on "resource not found" errors
- Track which resources were deleted
- Report partial rollback status
- Preserve logs for debugging



**CLI Integration:**
The `rollback` command already exists in CLI. Enhancements needed:
- Display resources to be deleted with cost estimates
- Show confirmation prompt (unless --yes)
- Display progress during rollback
- Show summary of deleted resources

## 3. Error Recovery and Failure Handling

### 3.1 Failure Detection

**Current State:**
- Basic try-catch in Conductor's `deploy()` method
- Sets status to FAILED on exceptions
- Logs error message

**Enhancements Needed:**
- Dedicated `_handle_failure(error, stage)` method
- Wrap each agent call in try-catch
- Include remediation suggestions
- Track failure stage for retry

### 3.2 Intelligent Failure Recovery (HiveMind Medic)

**Design:**
```python
def deploy(...):
    try:
        # ... deployment stages ...
    except Exception as e:
        self._handle_failure(e, current_stage)
        
        # Call HiveMind Medic to analyze and fix
        medic_result = run_medic_agent(
            error=e,
            stage=current_stage,
            state=state
        )
        
        if medic_result.can_fix:
            # Ask user if they want to continue
            print(f"HiveMind Medic: {medic_result.diagnosis}")
            print(f"Proposed fix: {medic_result.fix_plan}")
            response = input("Continue with fix? (yes/no): ")
            
            if response == "yes":
                # Apply fix and retry
                medic_result.apply_fix()
                return self.retry_deployment(deployment_id)
        
        # If no fix or user declines, wait for user action
        print("Deployment paused. Resources left in place for debugging.")
        print("Options:")
        print("  1. Run 'hivemind retry <id>' to retry")
        print("  2. Run 'hivemind destroy <id>' to clean up")
        
        # Set timeout for auto-cleanup suggestion
        state.failure_timeout = datetime.now() + timedelta(hours=24)
        
        return DeploymentResult(success=False, ...)
```

**Key Points:**
- Failed deployments left in place by default
- HiveMind Medic analyzes failure and proposes fix
- User decides whether to continue or cleanup
- After 24 hours, suggest cleanup to user
- During cleanup, Janitor analyzes what needs fixing in template

### 3.3 Retry Capability

**Current State:**
- `retry_deployment()` method exists in Conductor
- CLI command exists

**Enhancements Needed:**
- Resume from failure point (skip completed stages)
- Increment retry count in state
- Limit maximum retries (default: 3)
- Clear previous error before retry



## 4. New Agent Implementations

### 4.1 HiveMind QA (Quality Assurance Agent)

**Purpose:** Verify deployments are working correctly

**Tools:**
- `test_http_endpoint(url, expected_status)` - Test HTTP accessibility
- `test_database_connection(host, port, db_type, credentials)` - Verify DB connectivity
- `test_port_accessibility(host, port)` - Check port is open
- `validate_ssl_certificate(domain)` - Verify SSL/TLS

**Integration:**
- Called after Sheriff in deployment workflow
- Results stored in `state.verification_results`
- Displayed in status command

**File:** `src/agents/strands_qa.py`

### 4.2 HiveMind Ops (Operations/Monitoring Agent)

**Purpose:** Set up comprehensive monitoring, tracing, and dashboards

**Tools:**
- `setup_cloudwatch_logging(instance_id, log_group)` - Configure CloudWatch logs
- `setup_xray_tracing(deployment_id, services)` - Configure AWS X-Ray tracing
- `create_cloudwatch_dashboard(deployment_id, resources)` - Create custom dashboard
- `get_recent_logs(log_group, hours)` - Retrieve logs
- `get_metrics(instance_id, metric_name, hours)` - Get CloudWatch metrics
- `get_xray_traces(deployment_id, hours)` - Retrieve X-Ray traces
- `detect_errors(logs)` - Analyze logs for errors
- `detect_anomalies(metrics)` - Identify unusual patterns
- `calculate_costs(deployment_id, days)` - Calculate actual costs

**Dashboard Components:**
The custom CloudWatch dashboard includes:
- **Application Health:** Response times, error rates, request counts
- **Infrastructure:** CPU, memory, disk, network per instance
- **Database:** Connections, queries/sec, replication lag (if RDS)
- **Load Balancer:** Target health, request count, latency
- **Errors:** Application errors, 4xx/5xx rates, failed requests
- **X-Ray Insights:** Service map, trace analysis, bottlenecks (if enabled)
- **Costs:** Daily spend, resource breakdown, cost trends
- **Custom Metrics:** Application-specific metrics from logs

**Integration:**
- Called after QA in deployment workflow
- Always creates CloudWatch dashboard (default)
- Optionally sets up X-Ray tracing (with `--xray` flag)
- Results stored in `state.monitoring_config`
- Dashboard URL provided to user
- Used by `status --show-logs`, `--show-metrics`, `--show-costs`, `--show-traces`

**File:** `src/agents/strands_ops.py`

### 4.3 HiveMind Medic (Failure Recovery Agent)

**Purpose:** Diagnose and fix deployment failures

**Tools:**
- `analyze_failure(error_message, stage, state)` - Analyze what went wrong
- `suggest_fix(failure_analysis)` - Propose remediation steps
- `apply_fix(fix_plan, state)` - Attempt to fix the issue
- `validate_fix(state)` - Verify fix worked

**Integration:**
- Called automatically when deployment fails
- Analyzes error and proposes fix
- Asks user if they want to continue
- If no response after timeout, suggests cleanup

**File:** `src/agents/strands_medic.py`

### 4.4 HiveMind Janitor (Cleanup Agent)

**Purpose:** Discover and clean up resources

**Tools:**
- `discover_resources(deployment_id, region)` - Find all resources
- `calculate_cost_savings(resources)` - Estimate savings
- `create_rds_snapshot(db_instance_id)` - Backup before deletion
- `delete_resources(resources, order)` - Delete in correct order
- `verify_cleanup_complete(deployment_id)` - Confirm all gone
- `analyze_deployment_issues(state)` - Identify what needs fixing in template

**Integration:**
- Used by `destroy` command
- Used by `find-orphans` command
- Called by Medic to analyze issues before cleanup
- Can be called standalone for cleanup tasks

**File:** `src/agents/strands_janitor.py`



## 5. Enhanced Workflows

### 5.1 Update Workflow (Blue-Green Deployment - Default)

**Purpose:** Update deployments with zero downtime (90% of cases)

**Blue-Green Flow:**
```
1. Load existing deployment state
2. Build new version (Compiler)
3. Create new EC2 instance (Provisioner)
4. Deploy to new instance (Deployer)
5. Run health checks (QA)
6. Switch ALB to new instance
7. Verify traffic flowing
8. Terminate old instance
9. Update state
```

**Rolling Update Flow (10% of cases):**
Used when:
- System packages need updating
- Container runtime needs restart
- In-place updates required

```
1. Load existing deployment state
2. Build new version (Compiler)
3. Stop application on existing instance
4. Update system packages/runtime
5. Deploy new version (Deployer)
6. Start application
7. Run health checks (QA)
8. Update state
```

**Decision Logic:**
- Default: Blue-Green
- Use Rolling if: `--rolling` flag or system updates detected

**Implementation:**
```python
def update(self, deployment_id: str, version: Optional[str] = None):
    # Load existing state
    old_state = self.get_status(deployment_id)
    
    # Build new version
    compiler_result = run_compiler_agent(...)
    
    # Create new instance
    provisioner_result = run_provisioner_agent(...)
    
    # Deploy to new instance
    deployer_result = run_deployer_agent(...)
    
    # Health check
    overwatch_result = run_overwatch_agent(...)
    
    # Switch ALB
    switch_alb_target(old_instance, new_instance)
    
    # Terminate old
    terminate_instance(old_instance)
    
    return UpdateResult(...)
```

**CLI Command:**
```bash
hivemind update <deployment-id> [--version <version>]
```

### 5.2 Destroy Workflow

**Purpose:** Complete teardown with cost reporting

**Flow:**
```
1. Load deployment state
2. Discover all resources (Jerry)
3. Calculate cost savings
4. Confirm with user
5. Rollback (delete resources)
6. Update state to DESTROYED
7. Report savings
```

**CLI Command:**
```bash
hivemind destroy <deployment-id> [--force]
```



## 6. CLI Enhancements

### 6.1 Observability Features

#### 6.1.1 AWS X-Ray Tracing (Optional)

**Flag:** `--xray`

**Purpose:** Enable distributed tracing for detailed request analysis

**What X-Ray Provides:**
- End-to-end request tracing across services
- Service dependency maps
- Latency analysis per service/operation
- Error and fault detection
- Performance bottleneck identification
- User behavior patterns
- API call tracking

**Implementation:**
- Install X-Ray daemon on EC2 instances
- Configure application to send traces
- Set up X-Ray service integration
- Create X-Ray insights and analytics
- Add X-Ray section to CloudWatch dashboard

**Use Cases:**
- Understanding user behavior and usage patterns
- Identifying performance bottlenecks
- Debugging distributed system issues
- Optimizing API response times
- Tracking feature usage

**Example:**
```bash
# Deploy with X-Ray tracing
hivemind deploy https://github.com/user/app "Production" --xray

# View traces
hivemind status <id> --show-traces
```

#### 6.1.2 CloudWatch Dashboard (Always Created)

**Purpose:** Comprehensive monitoring dashboard for every deployment

**Dashboard Sections:**

1. **Application Overview**
   - Service status (healthy/unhealthy)
   - Request rate (requests/minute)
   - Average response time
   - Error rate (%)
   - Active connections

2. **Infrastructure Metrics**
   - EC2 CPU utilization (per instance)
   - Memory usage (per instance)
   - Disk I/O and space
   - Network in/out
   - Instance status checks

3. **Load Balancer Metrics** (if ALB)
   - Target health count
   - Request count by target
   - Response time (p50, p90, p99)
   - HTTP 2xx/4xx/5xx counts
   - Active connection count

4. **Database Metrics** (if RDS)
   - Database connections
   - Read/write IOPS
   - CPU and memory
   - Replication lag (if replicas)
   - Storage space

5. **Application Logs**
   - Recent error logs
   - Warning count
   - Log volume over time
   - Error patterns

6. **X-Ray Insights** (if enabled)
   - Service map visualization
   - Trace count
   - Average trace duration
   - Error and fault rates
   - Top endpoints by latency

7. **Cost Tracking**
   - Daily cost trend
   - Cost by resource type
   - Month-to-date total
   - Projected monthly cost

8. **Alarms and Alerts**
   - Active alarms
   - Alarm history
   - Threshold violations

**Dashboard Features:**
- Auto-refresh every 1 minute
- Time range selector (1h, 6h, 24h, 7d, 30d)
- Drill-down to detailed metrics
- Export to PDF/PNG
- Share via URL
- Custom metric widgets

**Access:**
```bash
# Get dashboard URL
hivemind status <id> --show-dashboard

# Open dashboard in browser
hivemind dashboard <id>
```

**Dashboard URL Format:**
`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=HiveMind-<deployment-id>`

### 6.2 Stage 1 Deployment (Cost-Optimized Testing)

**Purpose:** Deploy minimal infrastructure for testing and log analysis

**Flag:** `--stage-1` or `--minimal`

**Behavior:**
- Single EC2 instance (no redundancy)
- Single RDS instance (no read replicas, no Multi-AZ)
- No backup resources
- Enhanced logging enabled and collected
- CloudWatch logs configured automatically
- Cost-optimized instance types (t3.micro/small)

**Example:**
```bash
# Full production deployment
hivemind deploy https://github.com/user/app "Production" 

# Stage 1 testing deployment
hivemind deploy https://github.com/user/app "Testing" --stage-1
```

**Stage 1 vs Production:**

| Resource | Production | Stage 1 |
|----------|-----------|---------|
| EC2 Instances | Multiple (ALB targets) | Single instance |
| RDS Database | Multi-AZ, read replicas | Single instance, no replicas |
| Backups | Automated snapshots | Manual only |
| Secrets Servers | Dedicated instances | Shared with app |
| ALB | Yes (for HA) | Yes (for SSL/monitoring) |
| CloudWatch | Basic | Enhanced (detailed logs) |
| Dashboard | Yes (full metrics) | Yes (full metrics) |
| X-Ray | Optional | Optional |
| Cost | ~$50-200/month | ~$15-30/month |

**Use Cases:**
- Initial testing of application
- Log analysis to determine resource needs
- Development environments
- Cost-conscious deployments
- Proof of concept

**Upgrade Path:**
```bash
# Start with Stage 1
hivemind deploy <repo> "Testing" --stage-1

# Analyze logs and metrics
hivemind status <id> --show-logs --show-metrics

# Upgrade to production when ready
hivemind upgrade <id> --to-production
```

### 6.2 Enhanced Status Command

**Current:** Shows basic status and logs

**Enhancements:**
- `--show-logs`: Display recent logs from CloudWatch
- `--show-metrics`: Display CPU, memory, disk, network metrics
- `--show-costs`: Display actual costs from Cost Explorer
- Show verification status
- Show resource health

### 6.3 Enhanced Status Command

**Current:** Shows basic status and logs

**Enhancements:**
- `--show-logs`: Display recent logs from CloudWatch
- `--show-metrics`: Display CPU, memory, disk, network metrics
- `--show-costs`: Display actual costs from Cost Explorer
- `--show-traces`: Display X-Ray traces (if enabled)
- `--show-dashboard`: Display CloudWatch dashboard URL
- Show verification status
- Show resource health
- Show deployment stage (stage-1 vs production)
- Show monitoring configuration (X-Ray enabled, dashboard URL)

**Implementation:**
Uses HiveMind Ops agent to retrieve data from AWS.

**Examples:**
```bash
# Basic status
hivemind status <id>

# With logs
hivemind status <id> --show-logs

# With metrics
hivemind status <id> --show-metrics

# With X-Ray traces
hivemind status <id> --show-traces

# Open dashboard
hivemind dashboard <id>
```

### 6.4 Dashboard Command (NEW)

**New command:** `hivemind dashboard <deployment-id>`

**Purpose:** Open CloudWatch dashboard in browser

**Features:**
- Opens dashboard URL in default browser
- Shows dashboard URL if browser unavailable
- Works with all deployments (always have dashboard)

### 6.5 Update Command

**New command:** `hivemind update <deployment-id> [--version <version>] [--rolling]`

**Features:**
- Blue-green deployment (default)
- Rolling update (with --rolling flag)
- Zero downtime
- Progress display
- Rollback on failure

### 6.6 Upgrade Command (NEW)

**New command:** `hivemind upgrade <deployment-id> --to-production`

**Purpose:** Upgrade Stage 1 deployment to production

**Features:**
- Adds redundancy (multiple instances)
- Enables Multi-AZ for RDS
- Adds read replicas
- Enables automated backups
- Provisions dedicated secrets servers
- Maintains zero downtime during upgrade

### 6.7 Destroy Command

**Current:** Exists but uses cleanup_tools directly

**Enhancements:**
- Use Jerry the Janitor for discovery
- Show cost savings
- Require confirmation
- Display progress

## 7. Deployment Reports

### 7.1 Report Generator

**Purpose:** Generate comprehensive deployment documentation

**File:** `src/utils/report_generator.py`

**Sections:**
1. **Timeline** - Deployment stages and duration
2. **Resources** - All created resources with IDs
3. **Configuration** - Tech stack, environment, settings
4. **Verification** - Health check results
5. **Access** - URLs, IPs, connection info
6. **Costs** - Breakdown by resource type
7. **Next Steps** - What to do next
8. **Troubleshooting** - Common issues and fixes

**Format:** Markdown with terminal color support

### 7.2 CLI Integration

**Auto-generation:**
- Generate after successful deployment
- Save to `~/.hivemind/deployments/<id>/report.txt`
- Display summary in CLI

**Manual generation:**
```bash
hivemind report <deployment-id>
hivemind status <deployment-id> --report
```



## 8. Data Models and State Management

### 8.1 Schema Updates

**InfrastructureSpec** (add ALB fields):
```python
alb_arn: Optional[str] = None
alb_dns_name: Optional[str] = None
target_group_arn: Optional[str] = None
```

**DeploymentState** (add new fields):
```python
verification_results: Optional[Dict] = None
monitoring_config: Optional[Dict] = None
dashboard_url: Optional[str] = None
xray_enabled: bool = False
retry_count: int = 0
auto_cleanup_on_failure: bool = True
deployment_stage: str = "production"  # or "stage-1"
```

**New Status Values:**
```python
class DeploymentStatus(str, Enum):
    # ... existing ...
    ROLLING_BACK = "rolling_back"
    ROLLED_BACK = "rolled_back"
    ROLLBACK_FAILED = "rollback_failed"
    UPDATING = "updating"
    DESTROYED = "destroyed"
```

### 8.2 Resource Tracking

**Current:** `ResourceInfo` model with:
- resource_id, resource_type, resource_arn
- created_at, deleted_at
- cost_per_month
- tags, metadata
- teardown_order, depends_on

**Enhancements:**
- Track ALB and target group resources
- Track deregistration status
- Track health check status

## 9. Tool Implementations

### 9.1 New Deployment Tools

**File:** `src/tools/deployment_tools.py`

Add:
```python
def register_target(instance_id: str, target_group_arn: str, region: str) -> Dict
def deregister_target(instance_id: str, target_group_arn: str, region: str) -> Dict
def wait_for_target_health(target_group_arn: str, instance_id: str, region: str) -> bool
```

### 9.2 New Verification Tools

**File:** `src/tools/verification_tools.py` (new)

```python
def test_http_endpoint(url: str, expected_status: int = 200) -> Dict
def test_database_connection(host: str, port: int, db_type: str, credentials: Dict) -> Dict
def test_port_accessibility(host: str, port: int) -> Dict
def validate_ssl_certificate(domain: str) -> Dict
```

### 9.3 New Monitoring Tools

**File:** `src/tools/monitoring_tools.py` (new)

```python
def setup_cloudwatch_logging(instance_id: str, log_group: str, region: str) -> Dict
def setup_xray_tracing(deployment_id: str, services: List[str], region: str) -> Dict
def create_cloudwatch_dashboard(deployment_id: str, resources: Dict, xray_enabled: bool, region: str) -> Dict
def get_recent_logs(log_group: str, hours: int, region: str) -> List[str]
def get_metrics(instance_id: str, metric_name: str, hours: int, region: str) -> Dict
def get_xray_traces(deployment_id: str, hours: int, region: str) -> List[Dict]
def detect_errors(logs: List[str]) -> List[Dict]
def detect_anomalies(metrics: Dict) -> List[Dict]
def calculate_costs(deployment_id: str, days: int, region: str) -> Dict
def get_dashboard_url(deployment_id: str, region: str) -> str
```



### 9.4 Enhanced Cleanup Tools

**File:** `src/tools/cleanup_tools.py`

Add:
```python
def deregister_from_target_groups(instance_id: str, state: DeploymentState, region: str) -> Dict
def delete_load_balancer(alb_arn: str, region: str) -> Dict
def delete_target_group(tg_arn: str, region: str) -> Dict
def create_rds_snapshot(db_instance_id: str, region: str) -> Dict
```

## 10. Testing Strategy

### 10.1 Unit Tests

**Priority:** High

Test each new tool independently:
- Verification tools with mock HTTP/DB responses
- Monitoring tools with mock CloudWatch data
- Dashboard creation with mock AWS responses
- X-Ray setup with mock tracing data
- Cleanup tools with mock AWS responses

**Files:**
- `tests/test_verification_tools.py`
- `tests/test_monitoring_tools.py`
- `tests/test_dashboard_creation.py`
- `tests/test_xray_setup.py`
- `tests/test_alb_integration.py`

### 10.2 Integration Tests

**Priority:** Medium

Test agent workflows:
- HiveMind QA agent with real endpoints
- HiveMind Ops with CloudWatch
- HiveMind Medic with failure scenarios
- HiveMind Janitor with resource discovery

**Files:**
- `tests/test_qa_agent.py`
- `tests/test_ops_agent.py`
- `tests/test_medic_agent.py`
- `tests/test_janitor_agent.py`

### 10.3 End-to-End Tests

**Priority:** Medium

Test complete workflows:
- Deploy with ALB → Verify → Rollback
- Deploy → Failure → Medic Fix → Continue
- Deploy Stage 1 → Upgrade to Production
- Deploy → Update (Blue-Green) → Verify
- Deploy → Update (Rolling) → Verify
- Deploy → Destroy

**Files:**
- `tests/test_alb_workflow.py`
- `tests/test_medic_workflow.py`
- `tests/test_stage1_workflow.py`
- `tests/test_update_workflow.py`
- `tests/test_destroy_workflow.py`

## 11. Implementation Phases

### Phase 1: ALB Integration (Critical)
1. Update Provisioner system prompt
2. Update Conductor to extract ALB details
3. Add target registration to Deployer
4. Test end-to-end

**Estimated:** 1-2 days

### Phase 2: Complete Rollback (Critical)
1. Enhance rollback method
2. Add ALB deregistration
3. Improve error handling
4. Test partial rollback scenarios

**Estimated:** 1-2 days



### Phase 3: Error Recovery (Critical)
1. Add _handle_failure method
2. Implement auto-cleanup option
3. Enhance retry logic
4. Test failure scenarios

**Estimated:** 1-2 days

### Phase 4: New Agents (High Priority)
1. Create HiveMind QA agent and tools
2. Create HiveMind Ops agent and tools
   - CloudWatch dashboard creation (always)
   - X-Ray tracing setup (optional)
   - Comprehensive metrics collection
3. Create HiveMind Medic agent and tools
4. Create HiveMind Janitor agent and tools
5. Integrate into Conductor

**Estimated:** 5-6 days

### Phase 5: Enhanced Workflows (High Priority)
1. Implement Stage 1 deployment mode
2. Implement update workflow (blue-green + rolling)
3. Implement upgrade workflow (stage-1 to production)
4. Enhance destroy workflow
5. Add CLI commands
6. Test workflows

**Estimated:** 3-4 days

### Phase 6: CLI Enhancements (High Priority)
1. Implement Stage 1 flag
2. Implement X-Ray flag
3. Add dashboard command
4. Enhance status command (add --show-traces, --show-dashboard)
5. Add update command
6. Add upgrade command
7. Enhance destroy command
8. Test all commands

**Estimated:** 2-3 days

### Phase 7: Deployment Reports (Medium Priority)
1. Create report generator
2. Integrate into CLI
3. Auto-generate on success
4. Test report generation

**Estimated:** 1-2 days

### Phase 8: Testing and Polish (Medium Priority)
1. Write unit tests
2. Write integration tests
3. End-to-end testing
4. Performance optimization

**Estimated:** 2-3 days

**Total Estimated Time:** 15-23 days

## 12. Success Criteria

### Functional Requirements
- ✅ ALB created for all services with exposed ports
- ✅ Instances registered with target groups
- ✅ Complete rollback deletes all resources
- ✅ HiveMind Medic analyzes failures and proposes fixes
- ✅ User decides whether to continue or cleanup after failure
- ✅ Retry resumes from failure point
- ✅ HiveMind QA validates deployments
- ✅ HiveMind Ops sets up CloudWatch and monitoring
- ✅ CloudWatch dashboard created for every deployment
- ✅ X-Ray tracing available with --xray flag
- ✅ Dashboard includes all critical metrics and logs
- ✅ HiveMind Janitor analyzes issues during cleanup
- ✅ Update workflow uses blue-green by default
- ✅ Rolling updates available when needed
- ✅ Stage 1 deployments minimize costs for testing
- ✅ Upgrade path from Stage 1 to production
- ✅ Destroy workflow reports cost savings and issues
- ✅ Reports generated automatically

### Non-Functional Requirements
- ✅ Deployment completes in < 20 minutes
- ✅ Rollback completes in < 5 minutes
- ✅ Status commands respond in < 2 seconds
- ✅ No orphaned resources after rollback
- ✅ Clear error messages with remediation
- ✅ Comprehensive logging for debugging



## 13. Risk Mitigation

### Risk 1: ALB Health Checks Fail
**Mitigation:**
- Configurable health check path
- Fallback to root path (/)
- Timeout and retry logic
- Clear error messages

### Risk 2: Partial Rollback Leaves Resources
**Mitigation:**
- Continue on "not found" errors
- Track deletion status per resource
- Provide reconcile command
- Manual cleanup instructions

### Risk 3: Update Workflow Causes Downtime
**Mitigation:**
- Blue-green by default (90% of cases)
- Wait for new instance health checks
- Verify traffic before switching
- Keep old instance until verified
- Automatic rollback on failure
- Rolling updates for system-level changes

### Risk 4: Failed Deployments Accumulate Costs
**Mitigation:**
- HiveMind Medic analyzes and proposes fixes
- User controls whether to continue or cleanup
- 24-hour timeout suggests cleanup
- Stage 1 mode minimizes testing costs
- Easy destroy/rollback commands

### Risk 5: Agent Failures
**Mitigation:**
- Comprehensive error handling
- Automatic cleanup on failure
- Retry capability
- Detailed logging

## 14. Future Enhancements

### Not in Scope (Future Work)
1. **Multi-region deployments** - Deploy to multiple regions
2. **Auto-scaling** - Automatic scaling based on load
3. **CI/CD integration** - GitHub Actions, GitLab CI
4. **Custom domains** - Route53 integration
5. **SSL certificates** - ACM integration
6. **Database migrations** - Automated schema updates
7. **Secrets management** - AWS Secrets Manager integration
8. **Monitoring dashboards** - CloudWatch dashboards
9. **Alerting** - SNS/email alerts
10. **Cost optimization** - Recommendations for savings

## 15. Documentation Updates

### Files to Update
1. **README.md** - Add new commands, features, and observability
2. **QUICK_START.md** - Update with ALB, X-Ray, and dashboard features
3. **TESTING_GUIDE.md** - Add new test scenarios
4. **AWS_CREDENTIALS_SETUP.md** - Add new IAM permissions (CloudWatch, X-Ray)

### New Documentation
1. **ALB_GUIDE.md** - How ALB integration works
2. **ROLLBACK_GUIDE.md** - How to rollback deployments
3. **UPDATE_GUIDE.md** - How to update deployments
4. **MONITORING_GUIDE.md** - How to use dashboards and X-Ray
5. **XRAY_GUIDE.md** - AWS X-Ray setup and usage
6. **DASHBOARD_GUIDE.md** - Understanding CloudWatch dashboards
7. **STAGE1_GUIDE.md** - Using Stage 1 mode for testing
8. **TROUBLESHOOTING.md** - Common issues and fixes

## 16. Conclusion

This design provides a comprehensive plan to complete the missing features in HiveMind. The implementation is broken into manageable phases, starting with critical features (ALB, rollback, error recovery) and progressing to enhancements (new agents, workflows, reports).

### Key Design Decisions Based on Feedback

1. **Agent Naming:** All agents follow "HiveMind [Role]" format:
   - HiveMind QA (Quality Assurance)
   - HiveMind Ops (Operations/Monitoring)
   - HiveMind Medic (Failure Recovery)
   - HiveMind Janitor (Cleanup)

2. **Aggressive ALB Strategy:** Create ALB for ANY service with exposed ports to enable SSL/TLS, zero-downtime updates, and centralized access.

3. **Intelligent Failure Recovery:** Failed deployments stay in place. HiveMind Medic analyzes the failure, proposes a fix, and asks the user if they want to continue. After 24 hours, cleanup is suggested.

4. **Blue-Green by Default:** 90% of updates use blue-green deployment. Rolling updates only for system-level changes.

5. **Stage 1 Mode:** New `--stage-1` flag deploys minimal infrastructure for cost-effective testing with enhanced logging. Upgrade path to production when ready.

6. **Comprehensive Observability:** 
   - CloudWatch dashboard created for EVERY deployment (automatic)
   - Optional X-Ray tracing with `--xray` flag
   - Dashboard includes: app health, infrastructure, database, ALB, errors, costs, X-Ray insights
   - Easy access via `hivemind dashboard <id>` command

### New Capabilities

- **4 New Agents:** QA, Ops, Medic, Janitor
- **Stage 1 Deployments:** Cost-optimized testing mode
- **Intelligent Recovery:** Medic agent fixes failures
- **Upgrade Workflow:** Stage 1 → Production
- **Comprehensive Observability:**
  - CloudWatch dashboard for every deployment (automatic)
  - Optional X-Ray distributed tracing
  - 8 dashboard sections covering all metrics
  - Easy access via CLI
- **Enhanced Monitoring:** Detailed logs and metrics
- **Better Cleanup:** Issue analysis during teardown

The design builds on the existing solid foundation and maintains consistency with the current architecture. All new features integrate seamlessly with existing components and follow established patterns.

**Next Steps:**
1. ✅ Design approved
2. Create detailed tasks.md
3. Begin Phase 1 (ALB Integration) - START TODAY
4. Iterate through phases sequentially
5. Test thoroughly at each phase
6. Update documentation as features are completed

**Timeline:** 14-22 days to complete all phases