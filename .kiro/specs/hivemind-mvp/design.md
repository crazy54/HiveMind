# Design Document: HiveMind Complete MVP

## Overview

HiveMind is a complete multi-agent deployment system that takes a GitHub repository and deploys it to AWS with full lifecycle management. This design document covers the complete MVP including analysis, interactive configuration, deployment, verification, monitoring, updates, and cleanup.

### Key Innovations

1. **Three New Agents**: Verify, Monitor, and Cleanup agents for complete lifecycle management
2. **Real AWS Integration**: Actually creates VPC, EC2, RDS, security groups (not just simulation)
3. **Error Recovery**: Automatic cleanup on failure, retry capability, rollback support
4. **Post-Deployment Verification**: Automated health checks and connectivity tests
5. **Continuous Monitoring**: Real-time logs, metrics, and alerting via CloudWatch
6. **Zero-Downtime Updates**: Blue-green deployment for application updates
7. **Complete Cleanup**: Dependency-aware resource deletion with cost savings calculation
8. **Comprehensive Reports**: Detailed deployment reports with timeline, costs, and next steps

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (CLI)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Conductor Agent                               │
│  - Orchestrates all agents                                       │
│  - Manages deployment state                                      │
│  - Handles errors and rollback                                   │
└─┬───────┬───────┬───────┬───────┬───────┬───────┬──────────────┘
  │       │       │       │       │       │       │
  ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
│Rec│   │Com│   │Pro│   │Dep│   │She│   │Ver│   │Mon│   ┌───┐
│on │   │pil│   │vis│   │loy│   │rif│   │ify│   │ito│   │Cle│
│   │   │er │   │ion│   │er │   │f  │   │   │   │r  │   │anu│
└───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘
  │       │       │       │       │       │       │       │
  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   AWS Services  │
                    │  VPC, EC2, RDS  │
                    │  CloudWatch     │
                    └─────────────────┘
```

## Architecture

### Multi-Agent Pattern: Strands Workflow

HiveMind uses the **Strands Workflow Pattern** for orchestrating its deployment pipeline. According to the official Strands documentation, a workflow is ideal when you have:

- ✅ **Sequential Dependencies**: Each deployment stage must complete before the next begins
- ✅ **Specialized Agents**: Each agent has distinct expertise (analysis, building, provisioning, etc.)
- ✅ **Clear Execution Order**: Recon → Compile → Provision → Deploy → Secure
- ✅ **Error Recovery Needs**: Ability to retry specific stages without restarting entire deployment

**Why Workflow vs Other Patterns:**

| Pattern | Fit for HiveMind | Reason |
|---------|------------------|--------|
| **Workflow** | ✅ Perfect | Sequential stages with clear dependencies |
| **Swarm** | ❌ Not suitable | Too collaborative; we need deterministic order |
| **Graph** | ⚠️ Possible | More complex than needed for linear flow |

**Current Implementation:**
- Custom orchestration in `StrandsConductorAgent`
- Manual sequential agent calls
- Works correctly but could leverage official Workflow tool for automatic retries, parallel execution, and state persistence

**Future Enhancement:**
Consider migrating to official `strands_tools.workflow` for built-in features:
- Automatic dependency resolution
- Parallel execution where possible
- Built-in retry logic
- State persistence (pause/resume)
- Progress tracking

**Reference**: [Strands Workflow Documentation](https://strandsagents.com/latest/documentation/docs/user-guide/concepts/multi-agent/workflow/)

### Agent Responsibilities


#### 1. Randy Recon (Existing - Needs Timeout Fix)
- Analyzes repository documentation (README, DEPLOY.md, docker files)
- Detects services (PostgreSQL, Redis, etc.)
- Extracts environment variables, ports, deployment steps
- **Current Issue**: Times out during analysis - needs debugging

#### 2. Chris Compiler (Existing)
- Builds applications from source code
- Detects tech stack (Node.js, Python, Go, etc.)
- Creates build artifacts
- Validates build success

#### 3. Peter Provisioner (Existing - Needs Real AWS Integration)
- Creates VPC with public/private subnets
- Provisions EC2 instances
- Creates RDS databases when needed
- Sets up security groups
- Configures load balancers
- **Enhancement Needed**: Actually create resources, not just simulate

#### 4. Dan the Deployer (Existing - Needs Real Deployment)
- Deploys application to EC2 instances
- Configures environment variables
- Starts application services
- **Enhancement Needed**: Actually deploy, not just simulate

#### 5. Shawn the Sheriff (Existing)
- Applies security hardening
- Configures firewalls
- Scans for vulnerabilities
- Implements CIS benchmarks

#### 6. Overwatch (NEW)
- **Purpose**: Validates deployment is working correctly
- Tests HTTP/HTTPS endpoints
- Verifies database connectivity
- Checks port accessibility
- Validates SSL certificates
- Confirms application startup
- Provides diagnostic information on failures

#### 7. The All-Seeing Eye (NEW)
- **Purpose**: Tracks logs, metrics, and health continuously
- Sets up CloudWatch logging and metrics
- Streams real-time application logs
- Collects CPU, memory, disk, network metrics
- Detects and highlights errors
- Provides alerts for critical issues
- Tracks costs and uptime

#### 8. Jerry the Janitor (NEW)
- **Purpose**: Destroys deployments and cleans up resources
- Discovers all resources for a deployment
- Calculates cost savings from deletion
- Deletes resources in correct dependency order
- Creates final backups before deletion
- Verifies complete cleanup
- Detects orphaned resources


### Deployment Workflow

```
1. User runs: hivemind deploy <repo-url>
   ↓
2. Randy Recon: Analyze repository
   - Clone to analyzed_repos/
   - Extract requirements
   - Detect services, ports, env vars
   ↓
3. Interactive Configuration (if not --yes)
   - Ask dynamic questions based on analysis
   - Get user preferences (domain, database, compute)
   - Calculate cost estimates
   - Show summary and confirm
   ↓
4. Chris Compiler: Build application
   - Detect tech stack
   - Run build commands
   - Create artifacts
   ↓
5. Peter Provisioner: Create AWS infrastructure
   - Create VPC, subnets, internet gateway
   - Launch EC2 instances
   - Create RDS database (if needed)
   - Configure security groups
   - Set up load balancer
   ↓
6. Dan the Deployer: Deploy application
   - SSH to EC2 instance
   - Install runtime dependencies
   - Copy build artifacts
   - Configure environment variables
   - Start application service
   ↓
7. Shawn the Sheriff: Harden security
   - Review and tighten security groups
   - Configure SSL/TLS
   - Disable unnecessary services
   - Update system packages
   - Run vulnerability scan
   ↓
8. Overwatch: Validate deployment (NEW)
   - Test HTTP endpoints
   - Verify database connectivity
   - Check port accessibility
   - Validate SSL certificates
   - Confirm application health
   ↓
9. The All-Seeing Eye: Set up monitoring (NEW)
   - Configure CloudWatch logging
   - Set up metrics collection
   - Enable error detection
   - Configure alerts
   ↓
10. Generate Deployment Report
    - Timeline with agent durations
    - Resource inventory with costs
    - Access information (URLs, SSH)
    - Verification results
    - Next steps guide
    ↓
11. User can now:
    - Monitor: hivemind status <deployment-id>
    - Update: hivemind update <deployment-id>
    - Destroy: hivemind destroy <deployment-id>
```


## Components and Interfaces

### DeploymentState Schema (Enhanced)

```python
# src/schemas/deployment.py

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class DeploymentStatus(str, Enum):
    """Deployment status values."""
    PENDING = "pending"
    ANALYZING = "analyzing"
    CONFIGURING = "configuring"
    BUILDING = "building"
    PROVISIONING = "provisioning"
    DEPLOYING = "deploying"
    SECURING = "securing"
    VERIFYING = "verifying"
    MONITORING_SETUP = "monitoring_setup"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"
    ROLLED_BACK = "rolled_back"
    DRY_RUN = "dry_run"
    UPDATING = "updating"
    DESTROYING = "destroying"
    DESTROYED = "destroyed"

class ResourceInfo(BaseModel):
    """Information about a created AWS resource."""
    resource_type: str  # "vpc", "ec2", "rds", "security_group", etc.
    resource_id: str
    name: str
    region: str
    cost_per_month: float
    tags: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VerificationResult(BaseModel):
    """Result of deployment verification."""
    endpoint_tests: List[Dict[str, Any]] = Field(default_factory=list)
    database_connectivity: Optional[bool] = None
    port_accessibility: Dict[int, bool] = Field(default_factory=dict)
    ssl_valid: Optional[bool] = None
    application_healthy: bool = False
    diagnostics: List[str] = Field(default_factory=list)
    verified_at: Optional[datetime] = None

class MonitoringConfig(BaseModel):
    """Monitoring configuration."""
    cloudwatch_log_group: Optional[str] = None
    cloudwatch_metrics_namespace: Optional[str] = None
    error_alert_enabled: bool = False
    cost_alert_threshold: Optional[float] = None
    uptime_check_url: Optional[str] = None

class DeploymentState(BaseModel):
    """Complete deployment state."""
    deployment_id: str
    repo_url: str
    description: str
    status: DeploymentStatus
    
    # User configuration
    user_config: Optional[Dict[str, Any]] = None
    
    # Analysis results
    tech_stack: Optional[Dict[str, Any]] = None
    required_services: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Build artifacts
    build_artifact: Optional[Dict[str, Any]] = None
    
    # Infrastructure
    resources: List[ResourceInfo] = Field(default_factory=list)
    vpc_id: Optional[str] = None
    instance_ids: List[str] = Field(default_factory=list)
    database_endpoint: Optional[str] = None
    load_balancer_dns: Optional[str] = None
    
    # Deployment info
    app_url: Optional[str] = None
    ssh_command: Optional[str] = None
    
    # Verification
    verification: Optional[VerificationResult] = None
    
    # Monitoring
    monitoring: Optional[MonitoringConfig] = None
    
    # Logs and errors
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    error_message: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # Flags
    dry_run: bool = False
    
    def add_log(self, agent: str, message: str, level: str = "info"):
        """Add a log entry."""
        self.logs.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent,
            "message": message,
            "level": level
        })
        self.updated_at = datetime.utcnow()
    
    def add_resource(self, resource: ResourceInfo):
        """Add a created resource."""
        self.resources.append(resource)
        self.updated_at = datetime.utcnow()
    
    def get_total_cost(self) -> float:
        """Calculate total monthly cost."""
        return sum(r.cost_per_month for r in self.resources)
    
    def save(self, state_dir: str):
        """Save state to disk."""
        import os
        import json
        
        os.makedirs(f"{state_dir}/{self.deployment_id}", exist_ok=True)
        path = f"{state_dir}/{self.deployment_id}/state.json"
        
        with open(path, 'w') as f:
            f.write(self.model_dump_json(indent=2))
    
    @classmethod
    def load(cls, state_dir: str, deployment_id: str):
        """Load state from disk."""
        import json
        
        path = f"{state_dir}/{deployment_id}/state.json"
        with open(path, 'r') as f:
            return cls.model_validate_json(f.read())
```


### Verify Agent Design

```python
# src/agents/strands_verify.py

from strands import Agent
from typing import Dict, Any, List
import requests
import socket
import ssl
import psycopg2
import pymysql
from datetime import datetime

VERIFY_AGENT_PROMPT = """You are the Verify Agent for HiveMind deployment system.

Your role is to validate that a deployment is working correctly by performing comprehensive health checks.

You have access to these tools:
- test_http_endpoint: Test if an HTTP/HTTPS endpoint is accessible and returns expected status
- test_database_connection: Verify application can connect to database
- test_port_accessibility: Check if a port is accessible from outside
- validate_ssl_certificate: Check if SSL certificate is valid and not expired
- check_application_health: Verify application is running and responding

Your responsibilities:
1. Test all HTTP/HTTPS endpoints
2. Verify database connectivity if database exists
3. Check all required ports are accessible
4. Validate SSL certificates if HTTPS is enabled
5. Confirm application is healthy and responding
6. Provide diagnostic information if any check fails

When verification fails, provide specific diagnostic information:
- What failed (endpoint, database, port, etc.)
- Error messages
- Suggested remediation steps

Return a structured verification result with:
- endpoint_tests: List of endpoint test results
- database_connectivity: True/False/None
- port_accessibility: Dict of port -> accessible
- ssl_valid: True/False/None
- application_healthy: Overall health status
- diagnostics: List of diagnostic messages
"""

def create_verify_agent() -> Agent:
    """Create the Verify Agent."""
    
    def test_http_endpoint(url: str, expected_status: int = 200, timeout: int = 10) -> Dict[str, Any]:
        """
        Test if an HTTP/HTTPS endpoint is accessible.
        
        Args:
            url: The URL to test
            expected_status: Expected HTTP status code (default 200)
            timeout: Request timeout in seconds
            
        Returns:
            Dict with success, status_code, response_time, error
        """
        try:
            start = datetime.utcnow()
            response = requests.get(url, timeout=timeout, verify=True)
            end = datetime.utcnow()
            
            response_time = (end - start).total_seconds()
            success = response.status_code == expected_status
            
            return {
                "success": success,
                "url": url,
                "status_code": response.status_code,
                "response_time_seconds": response_time,
                "error": None if success else f"Expected {expected_status}, got {response.status_code}"
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "status_code": None,
                "response_time_seconds": None,
                "error": str(e)
            }
    
    def test_database_connection(db_type: str, host: str, port: int, 
                                 database: str, username: str, password: str) -> Dict[str, Any]:
        """
        Test database connectivity.
        
        Args:
            db_type: Database type (postgresql, mysql)
            host: Database host
            port: Database port
            database: Database name
            username: Database username
            password: Database password
            
        Returns:
            Dict with success, error, latency
        """
        try:
            start = datetime.utcnow()
            
            if db_type == "postgresql":
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    database=database,
                    user=username,
                    password=password,
                    connect_timeout=10
                )
                conn.close()
            elif db_type == "mysql":
                conn = pymysql.connect(
                    host=host,
                    port=port,
                    database=database,
                    user=username,
                    password=password,
                    connect_timeout=10
                )
                conn.close()
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
            
            end = datetime.utcnow()
            latency = (end - start).total_seconds()
            
            return {
                "success": True,
                "db_type": db_type,
                "latency_seconds": latency,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "db_type": db_type,
                "error": str(e)
            }
    
    def test_port_accessibility(host: str, port: int, timeout: int = 5) -> Dict[str, Any]:
        """
        Test if a port is accessible.
        
        Args:
            host: Host to test
            port: Port to test
            timeout: Connection timeout in seconds
            
        Returns:
            Dict with accessible, error
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            
            accessible = result == 0
            return {
                "accessible": accessible,
                "host": host,
                "port": port,
                "error": None if accessible else f"Port {port} not accessible"
            }
        except Exception as e:
            return {
                "accessible": False,
                "host": host,
                "port": port,
                "error": str(e)
            }
    
    def validate_ssl_certificate(hostname: str, port: int = 443) -> Dict[str, Any]:
        """
        Validate SSL certificate.
        
        Args:
            hostname: Hostname to check
            port: HTTPS port (default 443)
            
        Returns:
            Dict with valid, expires_at, issuer, error
        """
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    
                    # Check expiration
                    not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                    valid = not_after > datetime.utcnow()
                    
                    return {
                        "valid": valid,
                        "hostname": hostname,
                        "expires_at": not_after.isoformat(),
                        "issuer": cert.get('issuer'),
                        "error": None if valid else "Certificate expired"
                    }
        except Exception as e:
            return {
                "valid": False,
                "hostname": hostname,
                "error": str(e)
            }
    
    agent = Agent(
        name="verify",
        system_prompt=VERIFY_AGENT_PROMPT,
        tools=[
            test_http_endpoint,
            test_database_connection,
            test_port_accessibility,
            validate_ssl_certificate
        ]
    )
    
    return agent
```


### Monitor Agent Design

```python
# src/agents/strands_monitor.py

from strands import Agent
from typing import Dict, Any, List
import boto3
from datetime import datetime, timedelta

MONITOR_AGENT_PROMPT = """You are the Monitor Agent for HiveMind deployment system.

Your role is to set up continuous monitoring and provide real-time insights into deployment health.

You have access to these tools:
- setup_cloudwatch_logging: Configure CloudWatch log groups and streams
- setup_cloudwatch_metrics: Configure custom metrics collection
- get_recent_logs: Retrieve recent application logs
- get_metrics: Get CPU, memory, disk, network metrics
- detect_errors: Scan logs for errors and exceptions
- calculate_costs: Calculate current month-to-date AWS costs
- check_uptime: Check application uptime and availability

Your responsibilities:
1. Set up CloudWatch logging for application logs
2. Configure metrics collection (CPU, memory, disk, network)
3. Enable error detection and alerting
4. Provide real-time log streaming
5. Track costs and resource usage
6. Monitor application uptime

When displaying logs, highlight errors in red and provide context.
When showing metrics, include trends (increasing/decreasing).
When costs are high, suggest optimization opportunities.

Return structured monitoring data with:
- logs: Recent log entries
- metrics: Current resource usage
- errors: Detected errors with context
- costs: Current month-to-date costs
- uptime: Availability percentage
"""

def create_monitor_agent() -> Agent:
    """Create the Monitor Agent."""
    
    def setup_cloudwatch_logging(deployment_id: str, instance_id: str, region: str) -> Dict[str, Any]:
        """
        Set up CloudWatch logging.
        
        Args:
            deployment_id: Deployment ID
            instance_id: EC2 instance ID
            region: AWS region
            
        Returns:
            Dict with log_group, log_stream, success
        """
        try:
            logs_client = boto3.client('logs', region_name=region)
            
            log_group = f"/hivemind/{deployment_id}"
            log_stream = f"{instance_id}/application"
            
            # Create log group
            try:
                logs_client.create_log_group(logGroupName=log_group)
            except logs_client.exceptions.ResourceAlreadyExistsException:
                pass
            
            # Create log stream
            try:
                logs_client.create_log_stream(
                    logGroupName=log_group,
                    logStreamName=log_stream
                )
            except logs_client.exceptions.ResourceAlreadyExistsException:
                pass
            
            return {
                "success": True,
                "log_group": log_group,
                "log_stream": log_stream,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_recent_logs(log_group: str, log_stream: str, region: str, 
                       lines: int = 50) -> Dict[str, Any]:
        """
        Get recent application logs.
        
        Args:
            log_group: CloudWatch log group
            log_stream: CloudWatch log stream
            region: AWS region
            lines: Number of lines to retrieve
            
        Returns:
            Dict with logs, error
        """
        try:
            logs_client = boto3.client('logs', region_name=region)
            
            response = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=log_stream,
                limit=lines,
                startFromHead=False
            )
            
            logs = [
                {
                    "timestamp": datetime.fromtimestamp(event['timestamp'] / 1000).isoformat(),
                    "message": event['message']
                }
                for event in response['events']
            ]
            
            return {
                "success": True,
                "logs": logs,
                "count": len(logs),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "logs": [],
                "error": str(e)
            }
    
    def get_metrics(instance_id: str, region: str, period_minutes: int = 5) -> Dict[str, Any]:
        """
        Get instance metrics.
        
        Args:
            instance_id: EC2 instance ID
            region: AWS region
            period_minutes: Time period for metrics
            
        Returns:
            Dict with cpu, memory, disk, network metrics
        """
        try:
            cloudwatch = boto3.client('cloudwatch', region_name=region)
            
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=period_minutes)
            
            # Get CPU utilization
            cpu_response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Average']
            )
            
            cpu_avg = cpu_response['Datapoints'][0]['Average'] if cpu_response['Datapoints'] else 0
            
            return {
                "success": True,
                "instance_id": instance_id,
                "cpu_percent": round(cpu_avg, 2),
                "memory_percent": None,  # Requires CloudWatch agent
                "disk_percent": None,    # Requires CloudWatch agent
                "network_in_mb": None,   # Requires CloudWatch agent
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def detect_errors(logs: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Detect errors in logs.
        
        Args:
            logs: List of log entries
            
        Returns:
            Dict with errors, error_count
        """
        error_keywords = ['error', 'exception', 'failed', 'fatal', 'critical']
        
        errors = []
        for log in logs:
            message = log['message'].lower()
            if any(keyword in message for keyword in error_keywords):
                errors.append({
                    "timestamp": log['timestamp'],
                    "message": log['message'],
                    "severity": "error"
                })
        
        return {
            "errors": errors,
            "error_count": len(errors),
            "total_logs": len(logs)
        }
    
    def calculate_costs(deployment_id: str, region: str) -> Dict[str, Any]:
        """
        Calculate current month-to-date costs.
        
        Args:
            deployment_id: Deployment ID
            region: AWS region
            
        Returns:
            Dict with total_cost, breakdown by service
        """
        try:
            ce_client = boto3.client('ce', region_name='us-east-1')  # Cost Explorer is global
            
            start_date = datetime.utcnow().replace(day=1).strftime('%Y-%m-%d')
            end_date = datetime.utcnow().strftime('%Y-%m-%d')
            
            response = ce_client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity='MONTHLY',
                Metrics=['UnblendedCost'],
                Filter={
                    'Tags': {
                        'Key': 'DeploymentId',
                        'Values': [deployment_id]
                    }
                },
                GroupBy=[
                    {'Type': 'SERVICE', 'Key': 'SERVICE'}
                ]
            )
            
            breakdown = {}
            total = 0
            
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    service = group['Keys'][0]
                    cost = float(group['Metrics']['UnblendedCost']['Amount'])
                    breakdown[service] = cost
                    total += cost
            
            return {
                "success": True,
                "total_cost": round(total, 2),
                "breakdown": breakdown,
                "period": f"{start_date} to {end_date}",
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    agent = Agent(
        name="monitor",
        system_prompt=MONITOR_AGENT_PROMPT,
        tools=[
            setup_cloudwatch_logging,
            get_recent_logs,
            get_metrics,
            detect_errors,
            calculate_costs
        ]
    )
    
    return agent
```


### Cleanup Agent Design

```python
# src/agents/strands_cleanup.py

from strands import Agent
from typing import Dict, Any, List
import boto3
from datetime import datetime

CLEANUP_AGENT_PROMPT = """You are the Cleanup Agent for HiveMind deployment system.

Your role is to safely destroy deployments and clean up all AWS resources.

You have access to these tools:
- discover_resources: Find all AWS resources for a deployment
- calculate_cost_savings: Calculate monthly cost savings from deletion
- create_database_backup: Create final RDS snapshot before deletion
- delete_resources: Delete resources in correct dependency order
- verify_cleanup: Verify all resources are deleted

Your responsibilities:
1. Discover all resources associated with a deployment
2. Calculate cost savings from deletion
3. Create final backups before deleting databases
4. Delete resources in correct dependency order (avoid dependency errors)
5. Verify complete cleanup
6. Detect and report orphaned resources

Deletion order (to avoid dependency errors):
1. Load balancers
2. EC2 instances
3. RDS databases (after backup)
4. Security groups
5. Subnets
6. Internet gateways
7. VPCs

Always confirm with user before deleting production resources.
Provide clear feedback on what's being deleted and cost savings.

Return structured cleanup result with:
- resources_deleted: List of deleted resources
- cost_savings_monthly: Monthly cost savings
- backups_created: List of backups
- orphaned_resources: Resources that couldn't be deleted
- cleanup_complete: True if all resources deleted
"""

def create_cleanup_agent() -> Agent:
    """Create the Cleanup Agent."""
    
    def discover_resources(deployment_id: str, region: str) -> Dict[str, Any]:
        """
        Discover all AWS resources for a deployment.
        
        Args:
            deployment_id: Deployment ID
            region: AWS region
            
        Returns:
            Dict with resources by type
        """
        try:
            ec2 = boto3.client('ec2', region_name=region)
            rds = boto3.client('rds', region_name=region)
            elbv2 = boto3.client('elbv2', region_name=region)
            
            resources = {
                "load_balancers": [],
                "instances": [],
                "databases": [],
                "security_groups": [],
                "subnets": [],
                "internet_gateways": [],
                "vpcs": []
            }
            
            # Find resources by tag
            tag_filter = [{'Name': 'tag:DeploymentId', 'Values': [deployment_id]}]
            
            # EC2 instances
            instances = ec2.describe_instances(Filters=tag_filter)
            for reservation in instances['Reservations']:
                for instance in reservation['Instances']:
                    resources["instances"].append({
                        "id": instance['InstanceId'],
                        "type": instance['InstanceType'],
                        "state": instance['State']['Name']
                    })
            
            # RDS databases
            databases = rds.describe_db_instances()
            for db in databases['DBInstances']:
                tags = rds.list_tags_for_resource(ResourceName=db['DBInstanceArn'])
                if any(tag['Key'] == 'DeploymentId' and tag['Value'] == deployment_id 
                       for tag in tags['TagList']):
                    resources["databases"].append({
                        "id": db['DBInstanceIdentifier'],
                        "engine": db['Engine'],
                        "size": db['DBInstanceClass']
                    })
            
            # Load balancers
            load_balancers = elbv2.describe_load_balancers()
            for lb in load_balancers['LoadBalancers']:
                tags = elbv2.describe_tags(ResourceArns=[lb['LoadBalancerArn']])
                if any(tag['Key'] == 'DeploymentId' and tag['Value'] == deployment_id 
                       for tag in tags['TagDescriptions'][0]['Tags']):
                    resources["load_balancers"].append({
                        "arn": lb['LoadBalancerArn'],
                        "name": lb['LoadBalancerName'],
                        "type": lb['Type']
                    })
            
            # VPCs, subnets, etc. (similar pattern)
            
            return {
                "success": True,
                "resources": resources,
                "total_count": sum(len(v) for v in resources.values()),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def calculate_cost_savings(resources: Dict[str, List]) -> Dict[str, Any]:
        """
        Calculate monthly cost savings from deletion.
        
        Args:
            resources: Dict of resources by type
            
        Returns:
            Dict with total_savings, breakdown by resource type
        """
        # Simplified pricing (actual prices vary by region)
        pricing = {
            "t3.micro": 7.59,
            "t3.small": 15.18,
            "t3.medium": 30.37,
            "db.t3.micro": 12.41,
            "db.t3.small": 24.82,
            "application": 16.20  # ALB
        }
        
        savings = {
            "instances": 0,
            "databases": 0,
            "load_balancers": 0
        }
        
        for instance in resources.get("instances", []):
            instance_type = instance.get("type", "t3.small")
            savings["instances"] += pricing.get(instance_type, 15.18)
        
        for db in resources.get("databases", []):
            db_size = db.get("size", "db.t3.small")
            savings["databases"] += pricing.get(db_size, 24.82)
        
        for lb in resources.get("load_balancers", []):
            savings["load_balancers"] += pricing["application"]
        
        total = sum(savings.values())
        
        return {
            "total_monthly_savings": round(total, 2),
            "breakdown": savings,
            "annual_savings": round(total * 12, 2)
        }
    
    def create_database_backup(db_identifier: str, region: str) -> Dict[str, Any]:
        """
        Create final RDS snapshot before deletion.
        
        Args:
            db_identifier: RDS instance identifier
            region: AWS region
            
        Returns:
            Dict with snapshot_id, success
        """
        try:
            rds = boto3.client('rds', region_name=region)
            
            snapshot_id = f"{db_identifier}-final-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
            
            response = rds.create_db_snapshot(
                DBSnapshotIdentifier=snapshot_id,
                DBInstanceIdentifier=db_identifier
            )
            
            return {
                "success": True,
                "snapshot_id": snapshot_id,
                "db_identifier": db_identifier,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_resources(resources: Dict[str, List], region: str) -> Dict[str, Any]:
        """
        Delete resources in correct dependency order.
        
        Args:
            resources: Dict of resources to delete
            region: AWS region
            
        Returns:
            Dict with deleted, failed, errors
        """
        ec2 = boto3.client('ec2', region_name=region)
        rds = boto3.client('rds', region_name=region)
        elbv2 = boto3.client('elbv2', region_name=region)
        
        deleted = []
        failed = []
        
        try:
            # 1. Delete load balancers
            for lb in resources.get("load_balancers", []):
                try:
                    elbv2.delete_load_balancer(LoadBalancerArn=lb['arn'])
                    deleted.append(f"Load Balancer: {lb['name']}")
                except Exception as e:
                    failed.append(f"Load Balancer {lb['name']}: {str(e)}")
            
            # 2. Terminate EC2 instances
            for instance in resources.get("instances", []):
                try:
                    ec2.terminate_instances(InstanceIds=[instance['id']])
                    deleted.append(f"EC2 Instance: {instance['id']}")
                except Exception as e:
                    failed.append(f"Instance {instance['id']}: {str(e)}")
            
            # 3. Delete RDS databases
            for db in resources.get("databases", []):
                try:
                    rds.delete_db_instance(
                        DBInstanceIdentifier=db['id'],
                        SkipFinalSnapshot=False,
                        FinalDBSnapshotIdentifier=f"{db['id']}-final"
                    )
                    deleted.append(f"RDS Database: {db['id']}")
                except Exception as e:
                    failed.append(f"Database {db['id']}: {str(e)}")
            
            # Continue with security groups, subnets, VPCs...
            
            return {
                "success": len(failed) == 0,
                "deleted": deleted,
                "failed": failed,
                "deleted_count": len(deleted),
                "failed_count": len(failed)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_cleanup(deployment_id: str, region: str) -> Dict[str, Any]:
        """
        Verify all resources are deleted.
        
        Args:
            deployment_id: Deployment ID
            region: AWS region
            
        Returns:
            Dict with cleanup_complete, remaining_resources
        """
        # Re-discover resources
        result = discover_resources(deployment_id, region)
        
        if not result["success"]:
            return result
        
        remaining = result["resources"]
        total_remaining = result["total_count"]
        
        return {
            "cleanup_complete": total_remaining == 0,
            "remaining_resources": remaining,
            "remaining_count": total_remaining
        }
    
    agent = Agent(
        name="cleanup",
        system_prompt=CLEANUP_AGENT_PROMPT,
        tools=[
            discover_resources,
            calculate_cost_savings,
            create_database_backup,
            delete_resources,
            verify_cleanup
        ]
    )
    
    return agent
```


## Data Models

### Enhanced Conductor Agent

The Conductor needs to be updated to:
1. Fix Strands SDK integration (use function call syntax)
2. Actually create AWS resources (not simulate)
3. Handle errors and rollback
4. Integrate new agents (Verify, Monitor, Cleanup)
5. Support update and destroy operations

```python
# src/agents/strands_conductor.py (Enhanced)

from strands import Agent
from typing import Dict, Any, Optional
from src.schemas.deployment import DeploymentState, DeploymentStatus, ResourceInfo
from src.agents.strands_recon import create_recon_agent
from src.agents.strands_compiler import create_compiler_agent
from src.agents.strands_abe import create_provisioner_agent
from src.agents.strands_deployer import create_deployer_agent
from src.agents.strands_sheriff import create_sheriff_agent
from src.agents.strands_verify import create_verify_agent
from src.agents.strands_monitor import create_monitor_agent
from src.agents.strands_cleanup import create_cleanup_agent

class StrandsConductorAgent:
    """
    Enhanced Conductor that orchestrates all agents with real AWS integration.
    """
    
    def __init__(self, state_dir: str = "deployments", region: str = "us-east-1"):
        self.state_dir = state_dir
        self.region = region
        
        # Create all agents
        self.recon = create_recon_agent()
        self.compiler = create_compiler_agent()
        self.provisioner = create_provisioner_agent()
        self.deployer = create_deployer_agent()
        self.sheriff = create_sheriff_agent()
        self.verify = create_verify_agent()
        self.monitor = create_monitor_agent()
        self.cleanup = create_cleanup_agent()
    
    def deploy(self, repo_url: str, description: str, 
               user_config: Optional[Dict[str, Any]] = None,
               dry_run: bool = False) -> Dict[str, Any]:
        """
        Execute full deployment workflow.
        
        Args:
            repo_url: GitHub repository URL
            description: Application description
            user_config: User configuration from interactive prompts
            dry_run: If True, simulate without creating resources
            
        Returns:
            Dict with success, deployment_id, state
        """
        import uuid
        
        # Create deployment state
        deployment_id = str(uuid.uuid4())[:8]
        state = DeploymentState(
            deployment_id=deployment_id,
            repo_url=repo_url,
            description=description,
            status=DeploymentStatus.PENDING,
            user_config=user_config,
            dry_run=dry_run
        )
        
        try:
            # Step 1: Recon (Analysis)
            state.status = DeploymentStatus.ANALYZING
            state.add_log("conductor", "Starting repository analysis")
            state.save(self.state_dir)
            
            recon_result = self._run_recon(state)
            if not recon_result["success"]:
                return self._handle_failure(state, "recon", recon_result["error"])
            
            # Step 2: Compiler (Build)
            state.status = DeploymentStatus.BUILDING
            state.add_log("conductor", "Building application")
            state.save(self.state_dir)
            
            compiler_result = self._run_compiler(state)
            if not compiler_result["success"]:
                return self._handle_failure(state, "compiler", compiler_result["error"])
            
            # Step 3: Provisioner (Infrastructure)
            if not dry_run:
                state.status = DeploymentStatus.PROVISIONING
                state.add_log("conductor", "Provisioning AWS infrastructure")
                state.save(self.state_dir)
                
                provisioner_result = self._run_provisioner(state)
                if not provisioner_result["success"]:
                    return self._handle_failure(state, "provisioner", provisioner_result["error"])
            
            # Step 4: Deployer (Application)
            if not dry_run:
                state.status = DeploymentStatus.DEPLOYING
                state.add_log("conductor", "Deploying application")
                state.save(self.state_dir)
                
                deployer_result = self._run_deployer(state)
                if not deployer_result["success"]:
                    return self._handle_failure(state, "deployer", deployer_result["error"])
            
            # Step 5: Sheriff (Security)
            if not dry_run:
                state.status = DeploymentStatus.SECURING
                state.add_log("conductor", "Hardening security")
                state.save(self.state_dir)
                
                sheriff_result = self._run_sheriff(state)
                if not sheriff_result["success"]:
                    return self._handle_failure(state, "sheriff", sheriff_result["error"])
            
            # Step 6: Verify (Health Checks) - NEW
            if not dry_run:
                state.status = DeploymentStatus.VERIFYING
                state.add_log("conductor", "Verifying deployment")
                state.save(self.state_dir)
                
                verify_result = self._run_verify(state)
                if not verify_result["success"]:
                    state.add_log("conductor", "Verification failed but deployment continues", "warning")
            
            # Step 7: Monitor (Setup Monitoring) - NEW
            if not dry_run:
                state.status = DeploymentStatus.MONITORING_SETUP
                state.add_log("conductor", "Setting up monitoring")
                state.save(self.state_dir)
                
                monitor_result = self._run_monitor_setup(state)
                if not monitor_result["success"]:
                    state.add_log("conductor", "Monitoring setup failed but deployment continues", "warning")
            
            # Complete
            state.status = DeploymentStatus.DRY_RUN if dry_run else DeploymentStatus.COMPLETED
            state.completed_at = datetime.utcnow()
            state.add_log("conductor", "Deployment completed successfully")
            state.save(self.state_dir)
            
            return {
                "success": True,
                "deployment_id": deployment_id,
                "state": state.model_dump()
            }
            
        except Exception as e:
            return self._handle_failure(state, "conductor", str(e))
    
    def _run_recon(self, state: DeploymentState) -> Dict[str, Any]:
        """Run Recon agent."""
        try:
            # Use function call syntax (not .run())
            message = f"Analyze repository: {state.repo_url}\nDescription: {state.description}"
            result = self.recon(message)
            
            # Parse result and update state
            state.tech_stack = result.get("tech_stack")
            state.required_services = result.get("required_services", [])
            
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _run_verify(self, state: DeploymentState) -> Dict[str, Any]:
        """Run Verify agent."""
        try:
            message = f"""Verify deployment {state.deployment_id}:
            - App URL: {state.app_url}
            - Database: {state.database_endpoint}
            - Ports: {state.user_config.get('domain', {}).get('app_port')}
            """
            
            result = self.verify(message)
            
            # Update state with verification results
            state.verification = result
            
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _handle_failure(self, state: DeploymentState, agent: str, error: str) -> Dict[str, Any]:
        """Handle deployment failure."""
        state.status = DeploymentStatus.FAILED
        state.error_message = f"{agent} failed: {error}"
        state.add_log("conductor", f"Deployment failed at {agent}: {error}", "error")
        state.save(self.state_dir)
        
        # Attempt rollback if infrastructure was created
        if state.resources:
            state.add_log("conductor", "Attempting rollback", "warning")
            self._rollback(state)
        
        return {
            "success": False,
            "deployment_id": state.deployment_id,
            "error": error,
            "state": state.model_dump()
        }
    
    def _rollback(self, state: DeploymentState):
        """Rollback deployment by cleaning up resources."""
        try:
            state.status = DeploymentStatus.ROLLING_BACK
            state.save(self.state_dir)
            
            # Use cleanup agent to delete resources
            message = f"Clean up deployment {state.deployment_id} in region {self.region}"
            result = self.cleanup(message)
            
            state.status = DeploymentStatus.ROLLED_BACK
            state.add_log("conductor", "Rollback completed")
            state.save(self.state_dir)
        except Exception as e:
            state.add_log("conductor", f"Rollback failed: {str(e)}", "error")
            state.save(self.state_dir)
    
    def update(self, deployment_id: str, new_version: Optional[str] = None) -> Dict[str, Any]:
        """
        Update existing deployment with zero downtime.
        
        Args:
            deployment_id: Existing deployment ID
            new_version: Optional new version/commit to deploy
            
        Returns:
            Dict with success, state
        """
        # Load existing state
        state = DeploymentState.load(self.state_dir, deployment_id)
        
        state.status = DeploymentStatus.UPDATING
        state.add_log("conductor", "Starting zero-downtime update")
        state.save(self.state_dir)
        
        # Blue-green deployment logic
        # 1. Build new version
        # 2. Create new EC2 instance
        # 3. Deploy to new instance
        # 4. Run health checks
        # 5. Switch load balancer to new instance
        # 6. Terminate old instance
        
        # Implementation details...
        
        return {"success": True, "deployment_id": deployment_id}
    
    def destroy(self, deployment_id: str, skip_backup: bool = False) -> Dict[str, Any]:
        """
        Destroy deployment and clean up all resources.
        
        Args:
            deployment_id: Deployment ID to destroy
            skip_backup: Skip database backup
            
        Returns:
            Dict with success, cost_savings
        """
        state = DeploymentState.load(self.state_dir, deployment_id)
        
        state.status = DeploymentStatus.DESTROYING
        state.add_log("conductor", "Starting resource cleanup")
        state.save(self.state_dir)
        
        # Use cleanup agent
        message = f"""Destroy deployment {deployment_id}:
        - Region: {self.region}
        - Skip backup: {skip_backup}
        - Resources: {len(state.resources)} resources to delete
        """
        
        result = self.cleanup(message)
        
        state.status = DeploymentStatus.DESTROYED
        state.add_log("conductor", "Deployment destroyed")
        state.save(self.state_dir)
        
        return {
            "success": True,
            "deployment_id": deployment_id,
            "cost_savings": result.get("cost_savings_monthly", 0)
        }
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Deployment State Persistence
*For any* deployment, saving the state to disk and loading it back should produce an equivalent state object
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 2: Resource Cleanup on Failure
*For any* deployment that fails after creating resources, the system should automatically attempt to clean up those resources
**Validates: Requirements 2.1, 2.4**

### Property 3: Verification Completeness
*For any* completed deployment, the Verify agent should test all detected endpoints and services
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 4: Cost Calculation Accuracy
*For any* set of AWS resources, calculating costs multiple times should produce the same result
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 5: Dependency-Ordered Deletion
*For any* cleanup operation, resources should be deleted in dependency order (load balancers before instances before VPCs)
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 6: Monitoring Setup Idempotency
*For any* deployment, setting up monitoring multiple times should not create duplicate log groups or metrics
**Validates: Requirements 5.1, 5.2**

### Property 7: Rollback Completeness
*For any* failed deployment with created resources, rollback should delete all resources that were created
**Validates: Requirements 2.1, 2.5**

### Property 8: Deployment Report Completeness
*For any* completed deployment, the report should include all required sections (timeline, resources, costs, access info, next steps)
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling

### Recon Agent Timeout
**Problem**: Recon agent currently times out during repository analysis
**Solution**:
1. Add timeout configuration to agent (increase from default)
2. Implement streaming responses to show progress
3. Add retry logic with exponential backoff
4. Break analysis into smaller chunks
5. Cache analysis results to avoid re-analyzing

### AWS API Errors
**Common Errors**:
- `InsufficientPermissions`: Missing IAM permissions
- `ResourceLimitExceeded`: Hit AWS service limits
- `InvalidParameterValue`: Invalid configuration

**Handling**:
1. Validate AWS credentials before starting
2. Check IAM permissions for required actions
3. Provide clear error messages with remediation steps
4. Suggest checking AWS console for service limits
5. Offer to retry after user fixes the issue

### Build Failures
**Common Causes**:
- Missing dependencies
- Incompatible versions
- Build script errors

**Handling**:
1. Capture full build output
2. Parse error messages for common issues
3. Suggest fixes (update dependencies, check versions)
4. Allow user to fix and retry
5. Don't create infrastructure if build fails

### Deployment Failures
**Common Causes**:
- Application won't start
- Port conflicts
- Missing environment variables
- Database connection failures

**Handling**:
1. Check application logs for errors
2. Verify environment variables are set
3. Test database connectivity
4. Provide SSH command for manual debugging
5. Offer to rollback or retry

### Verification Failures
**Common Causes**:
- Application not responding
- Database not accessible
- SSL certificate issues
- Port not open

**Handling**:
1. Provide diagnostic information (what failed, why)
2. Check security group rules
3. Verify application is running
4. Test connectivity from different locations
5. Suggest remediation steps


## Testing Strategy

### Unit Tests

**Recon Agent**:
- Test repository cloning
- Test documentation parsing
- Test service detection
- Test environment variable extraction
- Test timeout handling

**Verify Agent**:
- Test HTTP endpoint testing
- Test database connectivity checks
- Test port accessibility checks
- Test SSL certificate validation
- Test diagnostic message generation

**Monitor Agent**:
- Test CloudWatch log group creation
- Test log retrieval
- Test metrics collection
- Test error detection
- Test cost calculation

**Cleanup Agent**:
- Test resource discovery
- Test cost savings calculation
- Test backup creation
- Test deletion order
- Test cleanup verification

**Conductor**:
- Test agent orchestration
- Test error handling
- Test rollback logic
- Test state persistence
- Test update workflow
- Test destroy workflow

### Property-Based Tests

**Property 1: Deployment State Persistence**
- Generate random deployment states
- Save to disk and load back
- Verify equivalence

**Property 2: Resource Cleanup on Failure**
- Generate random resource lists
- Simulate failures at different stages
- Verify cleanup is attempted

**Property 3: Verification Completeness**
- Generate random deployment configurations
- Run verification
- Verify all endpoints/services are tested

**Property 4: Cost Calculation Accuracy**
- Generate random resource configurations
- Calculate costs multiple times
- Verify consistency

**Property 5: Dependency-Ordered Deletion**
- Generate random resource dependency graphs
- Run cleanup
- Verify deletion order respects dependencies

**Property 6: Monitoring Setup Idempotency**
- Run monitoring setup multiple times
- Verify no duplicate resources created

**Property 7: Rollback Completeness**
- Generate random partial deployments
- Trigger rollback
- Verify all created resources are deleted

**Property 8: Deployment Report Completeness**
- Generate random completed deployments
- Generate reports
- Verify all required sections present

### Integration Tests

**End-to-End Deployment**:
- Test full deployment workflow with real repository
- Verify all agents execute successfully
- Verify resources are created in AWS
- Verify application is accessible
- Verify monitoring is set up
- Clean up after test

**Error Recovery**:
- Test deployment failure at each stage
- Verify error messages are clear
- Verify rollback works correctly
- Verify state is saved correctly

**Update Workflow**:
- Deploy initial version
- Update to new version
- Verify zero downtime
- Verify old version is cleaned up

**Destroy Workflow**:
- Deploy application
- Destroy deployment
- Verify all resources are deleted
- Verify cost savings are calculated

### Testing Framework

Use **Hypothesis** for property-based testing in Python:

```python
# tests/test_deployment_properties.py

from hypothesis import given, strategies as st
from src.schemas.deployment import DeploymentState, ResourceInfo
import tempfile
import os

@given(st.builds(DeploymentState))
def test_state_persistence_round_trip(state):
    """Property 1: State persistence round-trip."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Save state
        state.save(tmpdir)
        
        # Load state
        loaded = DeploymentState.load(tmpdir, state.deployment_id)
        
        # Verify equivalence
        assert loaded.deployment_id == state.deployment_id
        assert loaded.repo_url == state.repo_url
        assert loaded.status == state.status
        assert len(loaded.resources) == len(state.resources)

@given(st.lists(st.builds(ResourceInfo)))
def test_cost_calculation_consistency(resources):
    """Property 4: Cost calculation consistency."""
    state = DeploymentState(
        deployment_id="test",
        repo_url="https://github.com/test/test",
        description="test",
        status="completed",
        resources=resources
    )
    
    # Calculate costs multiple times
    cost1 = state.get_total_cost()
    cost2 = state.get_total_cost()
    cost3 = state.get_total_cost()
    
    # Verify consistency
    assert cost1 == cost2 == cost3
```

### Manual Testing Checklist

Before release, manually test:

- [ ] Deploy a Node.js application
- [ ] Deploy a Python application
- [ ] Deploy with PostgreSQL database
- [ ] Deploy with Redis
- [ ] Test What-If mode
- [ ] Test interactive configuration
- [ ] Test --yes flag (non-interactive)
- [ ] Test --config file
- [ ] Test deployment failure and rollback
- [ ] Test update workflow
- [ ] Test destroy workflow
- [ ] Test status command
- [ ] Test monitoring (logs, metrics)
- [ ] Verify cost calculations
- [ ] Verify security hardening
- [ ] Test with invalid AWS credentials
- [ ] Test with missing IAM permissions


## CLI Integration

### Enhanced CLI Commands

```python
# src/cli.py (Enhanced)

import click
from src.agents.strands_conductor import StrandsConductorAgent
from src.schemas.deployment import DeploymentState
from src.utils.colors import info, success, failure, warning, tool, action

@click.group()
def cli():
    """HiveMind - Multi-agent deployment system."""
    pass

@cli.command()
@click.argument('repo_url')
@click.option('--description', '-d', help='Application description')
@click.option('--what-if', is_flag=True, help='Simulate deployment without creating resources')
@click.option('--yes', is_flag=True, help='Skip interactive prompts, use defaults')
@click.option('--config', type=click.Path(exists=True), help='Load configuration from file')
@click.option('--save-config', type=click.Path(), help='Save configuration to file')
@click.option('--region', default='us-east-1', help='AWS region')
@click.option('--state-dir', default='deployments', help='State directory')
@click.option('--verbose', is_flag=True, help='Show detailed logs')
def deploy(repo_url, description, what_if, yes, config, save_config, region, state_dir, verbose):
    """Deploy an application from a GitHub repository."""
    
    print(info("🚀 HiveMind Deployment System"))
    print(f"Repository: {tool(repo_url)}\n")
    
    # Create conductor
    conductor = StrandsConductorAgent(state_dir=state_dir, region=region)
    
    # Load or prompt for configuration
    user_config = None
    if config:
        from src.schemas.user_config import UserDeploymentConfig
        user_config = UserDeploymentConfig.from_json_file(config)
        print(success(f"✅ Loaded configuration from {config}"))
    elif not yes:
        # Interactive configuration (from interactive-deployment spec)
        from src.utils.interactive import InteractivePrompter
        
        # First, run analysis
        print(info("🔍 Analyzing repository..."))
        # ... analysis logic ...
        
        # Then prompt for configuration
        prompter = InteractivePrompter(analysis_result)
        user_config = prompter.prompt_all()
    
    # Save configuration if requested
    if save_config and user_config:
        user_config.to_json_file(save_config)
        print(success(f"💾 Configuration saved to {save_config}"))
    
    # Deploy
    print(info("\n📦 Starting deployment...\n"))
    
    result = conductor.deploy(
        repo_url=repo_url,
        description=description or "Application deployment",
        user_config=user_config.model_dump() if user_config else None,
        dry_run=what_if
    )
    
    if result["success"]:
        print(success("\n✅ Deployment completed successfully!"))
        print(f"\nDeployment ID: {tool(result['deployment_id'])}")
        
        if not what_if:
            state = DeploymentState(**result["state"])
            print(f"App URL: {tool(state.app_url)}")
            print(f"SSH: {tool(state.ssh_command)}")
            print(f"\nMonitor: {action(f'hivemind status {result[\"deployment_id\"]}')}") 
            print(f"Update: {action(f'hivemind update {result[\"deployment_id\"]}')}") 
            print(f"Destroy: {action(f'hivemind destroy {result[\"deployment_id\"]}')}") 
    else:
        print(failure(f"\n❌ Deployment failed: {result['error']}"))
        sys.exit(1)

@cli.command()
@click.argument('deployment_id')
@click.option('--show-logs', is_flag=True, help='Show recent logs')
@click.option('--show-metrics', is_flag=True, help='Show metrics')
@click.option('--show-costs', is_flag=True, help='Show costs')
@click.option('--region', default='us-east-1', help='AWS region')
@click.option('--state-dir', default='deployments', help='State directory')
def status(deployment_id, show_logs, show_metrics, show_costs, region, state_dir):
    """Show deployment status and health."""
    
    try:
        state = DeploymentState.load(state_dir, deployment_id)
    except FileNotFoundError:
        print(failure(f"❌ Deployment {deployment_id} not found"))
        sys.exit(1)
    
    print(info(f"📊 Deployment Status: {deployment_id}"))
    print(f"Status: {tool(state.status.value)}")
    print(f"Repository: {state.repo_url}")
    print(f"Created: {state.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    
    if state.app_url:
        print(f"App URL: {tool(state.app_url)}")
    
    if state.verification:
        print(f"\n{info('🔍 Verification:')}")
        print(f"  Healthy: {success('✅') if state.verification.application_healthy else failure('❌')}")
    
    if show_logs:
        print(f"\n{info('📝 Recent Logs:')}")
        # Use Monitor agent to get logs
        from src.agents.strands_monitor import create_monitor_agent
        monitor = create_monitor_agent()
        # ... get and display logs ...
    
    if show_metrics:
        print(f"\n{info('📈 Metrics:')}")
        # Use Monitor agent to get metrics
        # ... get and display metrics ...
    
    if show_costs:
        print(f"\n{info('💰 Costs:')}")
        total_cost = state.get_total_cost()
        print(f"  Estimated monthly: ${total_cost:.2f}")

@cli.command()
@click.argument('deployment_id')
@click.option('--version', help='New version/commit to deploy')
@click.option('--region', default='us-east-1', help='AWS region')
@click.option('--state-dir', default='deployments', help='State directory')
def update(deployment_id, version, region, state_dir):
    """Update deployment with zero downtime."""
    
    print(info(f"🔄 Updating deployment: {deployment_id}"))
    
    conductor = StrandsConductorAgent(state_dir=state_dir, region=region)
    result = conductor.update(deployment_id, new_version=version)
    
    if result["success"]:
        print(success("\n✅ Update completed successfully!"))
    else:
        print(failure(f"\n❌ Update failed: {result['error']}"))
        sys.exit(1)

@cli.command()
@click.argument('deployment_id')
@click.option('--skip-backup', is_flag=True, help='Skip database backup')
@click.option('--yes', is_flag=True, help='Skip confirmation')
@click.option('--region', default='us-east-1', help='AWS region')
@click.option('--state-dir', default='deployments', help='State directory')
def destroy(deployment_id, skip_backup, yes, region, state_dir):
    """Destroy deployment and clean up all resources."""
    
    try:
        state = DeploymentState.load(state_dir, deployment_id)
    except FileNotFoundError:
        print(failure(f"❌ Deployment {deployment_id} not found"))
        sys.exit(1)
    
    # Show what will be deleted
    print(warning(f"⚠️  This will delete the following resources:"))
    for resource in state.resources:
        print(f"  - {resource.resource_type}: {resource.name}")
    
    # Calculate cost savings
    total_cost = state.get_total_cost()
    print(f"\n💰 Monthly cost savings: ${total_cost:.2f}")
    print(f"💰 Annual cost savings: ${total_cost * 12:.2f}")
    
    # Confirm
    if not yes:
        confirm = input(f"\n{warning('Are you sure you want to destroy this deployment?')} [y/N] > ")
        if confirm.lower() not in ['y', 'yes']:
            print("Cancelled.")
            return
    
    print(info("\n🗑️  Destroying deployment..."))
    
    conductor = StrandsConductorAgent(state_dir=state_dir, region=region)
    result = conductor.destroy(deployment_id, skip_backup=skip_backup)
    
    if result["success"]:
        print(success("\n✅ Deployment destroyed successfully!"))
        print(f"💰 You'll save ${result['cost_savings']:.2f}/month")
    else:
        print(failure(f"\n❌ Destroy failed: {result['error']}"))
        sys.exit(1)

if __name__ == '__main__':
    cli()
```


## Deployment Report Generation

### Report Structure

```python
# src/utils/report_generator.py

from src.schemas.deployment import DeploymentState
from src.utils.colors import info, success, tool, action
from datetime import datetime
from typing import Dict, Any

class DeploymentReportGenerator:
    """Generate comprehensive deployment reports."""
    
    @staticmethod
    def generate_report(state: DeploymentState) -> str:
        """
        Generate a comprehensive deployment report.
        
        Args:
            state: Deployment state
            
        Returns:
            Formatted report string
        """
        report = []
        
        # Header
        report.append("=" * 80)
        report.append(f"  DEPLOYMENT REPORT: {state.deployment_id}")
        report.append("=" * 80)
        report.append("")
        
        # Summary
        report.append(info("📋 DEPLOYMENT SUMMARY"))
        report.append(f"  Status: {state.status.value}")
        report.append(f"  Repository: {state.repo_url}")
        report.append(f"  Started: {state.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        if state.completed_at:
            duration = (state.completed_at - state.created_at).total_seconds()
            report.append(f"  Duration: {int(duration // 60)}m {int(duration % 60)}s")
        report.append("")
        
        # Timeline
        report.append(info("⏱️  TIMELINE"))
        report.extend(DeploymentReportGenerator._generate_timeline(state))
        report.append("")
        
        # Resources
        report.append(info("🏗️  RESOURCES CREATED"))
        report.extend(DeploymentReportGenerator._generate_resource_list(state))
        report.append("")
        
        # Configuration
        if state.user_config:
            report.append(info("⚙️  CONFIGURATION"))
            report.extend(DeploymentReportGenerator._generate_config_summary(state))
            report.append("")
        
        # Verification
        if state.verification:
            report.append(info("✅ VERIFICATION RESULTS"))
            report.extend(DeploymentReportGenerator._generate_verification_summary(state))
            report.append("")
        
        # Access Information
        report.append(info("🔗 ACCESS INFORMATION"))
        report.extend(DeploymentReportGenerator._generate_access_info(state))
        report.append("")
        
        # Costs
        report.append(info("💰 COST BREAKDOWN"))
        report.extend(DeploymentReportGenerator._generate_cost_breakdown(state))
        report.append("")
        
        # Next Steps
        report.append(info("🎯 NEXT STEPS"))
        report.extend(DeploymentReportGenerator._generate_next_steps(state))
        report.append("")
        
        # Troubleshooting
        report.append(info("🔧 TROUBLESHOOTING"))
        report.extend(DeploymentReportGenerator._generate_troubleshooting(state))
        report.append("")
        
        report.append("=" * 80)
        
        return "\n".join(report)
    
    @staticmethod
    def _generate_timeline(state: DeploymentState) -> list:
        """Generate timeline section."""
        lines = []
        
        # Parse logs to extract agent timings
        agent_times = {}
        for log in state.logs:
            agent = log.get("agent")
            if agent and agent not in agent_times:
                agent_times[agent] = log.get("timestamp")
        
        # Display timeline
        for agent, timestamp in agent_times.items():
            lines.append(f"  ✓ {agent.title()}: {timestamp}")
        
        return lines
    
    @staticmethod
    def _generate_resource_list(state: DeploymentState) -> list:
        """Generate resource list."""
        lines = []
        
        if not state.resources:
            lines.append("  No resources created")
            return lines
        
        # Group by type
        by_type = {}
        for resource in state.resources:
            if resource.resource_type not in by_type:
                by_type[resource.resource_type] = []
            by_type[resource.resource_type].append(resource)
        
        # Display by type
        for resource_type, resources in by_type.items():
            lines.append(f"  {resource_type.upper()}:")
            for resource in resources:
                cost = f"${resource.cost_per_month:.2f}/mo"
                lines.append(f"    - {resource.name} ({resource.resource_id}) - {cost}")
        
        return lines
    
    @staticmethod
    def _generate_config_summary(state: DeploymentState) -> list:
        """Generate configuration summary."""
        lines = []
        config = state.user_config or {}
        
        if "domain" in config:
            lines.append(f"  Domain: {config['domain'].get('domain', 'N/A')}")
            lines.append(f"  SSL: {'Enabled' if config['domain'].get('enable_ssl') else 'Disabled'}")
            lines.append(f"  App Port: {config['domain'].get('app_port')}")
        
        if "compute" in config:
            lines.append(f"  Instance Type: {config['compute'].get('instance_type')}")
            lines.append(f"  Auto-scaling: {'Enabled' if config['compute'].get('auto_scaling') else 'Disabled'}")
        
        if "database" in config:
            lines.append(f"  Database: {config['database'].get('version')}")
            lines.append(f"  Multi-AZ: {'Enabled' if config['database'].get('multi_az') else 'Disabled'}")
        
        return lines
    
    @staticmethod
    def _generate_verification_summary(state: DeploymentState) -> list:
        """Generate verification summary."""
        lines = []
        verification = state.verification
        
        if verification.application_healthy:
            lines.append(f"  {success('✅ Application is healthy')}")
        else:
            lines.append(f"  {failure('❌ Application health check failed')}")
        
        if verification.endpoint_tests:
            lines.append(f"  Endpoint Tests:")
            for test in verification.endpoint_tests:
                status = success('✅') if test.get('success') else failure('❌')
                lines.append(f"    {status} {test.get('url')} - {test.get('status_code')}")
        
        if verification.database_connectivity is not None:
            status = success('✅') if verification.database_connectivity else failure('❌')
            lines.append(f"  {status} Database connectivity")
        
        return lines
    
    @staticmethod
    def _generate_access_info(state: DeploymentState) -> list:
        """Generate access information."""
        lines = []
        
        if state.app_url:
            lines.append(f"  Application URL: {tool(state.app_url)}")
        
        if state.ssh_command:
            lines.append(f"  SSH Access: {tool(state.ssh_command)}")
        
        if state.database_endpoint:
            lines.append(f"  Database: {tool(state.database_endpoint)}")
        
        if state.monitoring and state.monitoring.cloudwatch_log_group:
            lines.append(f"  Logs: CloudWatch Log Group {tool(state.monitoring.cloudwatch_log_group)}")
        
        return lines
    
    @staticmethod
    def _generate_cost_breakdown(state: DeploymentState) -> list:
        """Generate cost breakdown."""
        lines = []
        
        total = state.get_total_cost()
        lines.append(f"  Estimated Monthly Cost: ${total:.2f}")
        lines.append(f"  Estimated Annual Cost: ${total * 12:.2f}")
        lines.append("")
        lines.append("  Breakdown:")
        
        # Group by type
        by_type = {}
        for resource in state.resources:
            if resource.resource_type not in by_type:
                by_type[resource.resource_type] = 0
            by_type[resource.resource_type] += resource.cost_per_month
        
        for resource_type, cost in by_type.items():
            lines.append(f"    {resource_type}: ${cost:.2f}/mo")
        
        return lines
    
    @staticmethod
    def _generate_next_steps(state: DeploymentState) -> list:
        """Generate next steps."""
        lines = []
        
        lines.append("  Monitor your deployment:")
        lines.append(f"    {action(f'hivemind status {state.deployment_id} --show-logs')}")
        lines.append(f"    {action(f'hivemind status {state.deployment_id} --show-metrics')}")
        lines.append("")
        lines.append("  Update your application:")
        lines.append(f"    {action(f'hivemind update {state.deployment_id}')}")
        lines.append("")
        lines.append("  Scale your deployment:")
        lines.append("    - Modify instance type in AWS console")
        lines.append("    - Enable auto-scaling")
        lines.append("    - Add read replicas for database")
        lines.append("")
        lines.append("  Destroy when done:")
        lines.append(f"    {action(f'hivemind destroy {state.deployment_id}')}")
        
        return lines
    
    @staticmethod
    def _generate_troubleshooting(state: DeploymentState) -> list:
        """Generate troubleshooting section."""
        lines = []
        
        lines.append("  Common Issues:")
        lines.append("")
        lines.append("  Application not responding:")
        lines.append("    - Check logs: hivemind status <id> --show-logs")
        lines.append("    - Verify security groups allow traffic")
        lines.append("    - SSH to instance and check service status")
        lines.append("")
        lines.append("  Database connection errors:")
        lines.append("    - Verify security group allows traffic from app")
        lines.append("    - Check database endpoint in environment variables")
        lines.append("    - Verify database is running in AWS console")
        lines.append("")
        lines.append("  High costs:")
        lines.append("    - Review instance types (consider smaller sizes)")
        lines.append("    - Disable Multi-AZ for non-production")
        lines.append("    - Set up auto-scaling to reduce idle capacity")
        
        return lines
```


## Implementation Priority

### Phase 1: Fix Critical Issues (Blocking Everything)

**Priority: CRITICAL - Must be done first**

1. **Fix Recon Agent Timeout**
   - Debug why agent times out during analysis
   - Increase timeout configuration
   - Add progress indicators
   - Test with real repositories

2. **Fix Strands SDK Integration**
   - Update all agents to use function call syntax: `result = agent(message)`
   - Remove `.run()` method calls
   - Test agent execution
   - Verify agents complete successfully

3. **Test Repository Cloning**
   - Verify repos clone to `analyzed_repos/`
   - Test with various repository sizes
   - Handle clone failures gracefully

### Phase 2: Real AWS Integration (Core MVP)

**Priority: HIGH - Needed for working deployments**

4. **Update Provisioner Agent**
   - Actually create VPC, subnets, internet gateway
   - Actually launch EC2 instances
   - Actually create RDS databases
   - Actually configure security groups
   - Tag all resources with DeploymentId
   - Return real resource IDs

5. **Update Deployer Agent**
   - Actually SSH to EC2 instances
   - Actually copy build artifacts
   - Actually configure environment variables
   - Actually start application services
   - Verify application is running

6. **Implement Error Recovery**
   - Detect failures at each stage
   - Automatically trigger cleanup on failure
   - Save state for retry capability
   - Provide clear error messages

### Phase 3: New Agents (Complete Lifecycle)

**Priority: HIGH - Needed for MVP completeness**

7. **Implement Verify Agent**
   - Create agent with verification tools
   - Test HTTP endpoints
   - Verify database connectivity
   - Check port accessibility
   - Validate SSL certificates
   - Provide diagnostics on failures

8. **Implement Monitor Agent**
   - Create agent with monitoring tools
   - Set up CloudWatch logging
   - Set up metrics collection
   - Implement log retrieval
   - Implement error detection
   - Calculate costs

9. **Implement Cleanup Agent**
   - Create agent with cleanup tools
   - Discover resources by tag
   - Calculate cost savings
   - Delete in dependency order
   - Create backups before deletion
   - Verify complete cleanup

### Phase 4: Update and Destroy Operations

**Priority: MEDIUM - Important but not blocking**

10. **Implement Update Workflow**
    - Blue-green deployment logic
    - Build new version
    - Deploy to new instance
    - Run health checks
    - Switch traffic
    - Clean up old version

11. **Implement Destroy Workflow**
    - Load deployment state
    - Discover all resources
    - Show cost savings
    - Confirm with user
    - Delete resources
    - Verify cleanup

### Phase 5: Deployment Reports

**Priority: MEDIUM - Nice to have**

12. **Implement Report Generation**
    - Create ReportGenerator class
    - Generate timeline
    - List resources
    - Show costs
    - Provide access info
    - Suggest next steps
    - Add troubleshooting guide

### Phase 6: Testing and Polish

**Priority: MEDIUM - Quality assurance**

13. **Write Property-Based Tests**
    - State persistence round-trip
    - Cost calculation consistency
    - Verification completeness
    - Dependency-ordered deletion
    - Monitoring idempotency
    - Rollback completeness
    - Report completeness

14. **Write Integration Tests**
    - End-to-end deployment
    - Error recovery
    - Update workflow
    - Destroy workflow

15. **Manual Testing**
    - Test with real applications
    - Test all error scenarios
    - Test with different configurations
    - Verify AWS resources are created correctly

## Dependencies

### Python Packages

```txt
# requirements.txt additions

# AWS SDK
boto3>=1.28.0

# Database drivers for Verify agent
psycopg2-binary>=2.9.0  # PostgreSQL
pymysql>=1.1.0          # MySQL

# HTTP testing
requests>=2.31.0

# Property-based testing
hypothesis>=6.90.0

# Existing dependencies
strands-sdk>=0.1.0
click>=8.1.0
pydantic>=2.0.0
gitpython>=3.1.0
```

### AWS Permissions Required

The system needs these IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "elasticloadbalancing:*",
        "logs:*",
        "cloudwatch:*",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Considerations

1. **Credentials**: Never log AWS credentials or database passwords
2. **SSH Keys**: Store SSH keys securely, don't commit to git
3. **Database Passwords**: Generate strong passwords, store in AWS Secrets Manager
4. **Security Groups**: Use principle of least privilege
5. **SSL/TLS**: Always enable for production deployments
6. **Backups**: Always create backups before destructive operations
7. **Tagging**: Tag all resources for cost tracking and cleanup

## Performance Considerations

1. **Timeouts**: Set appropriate timeouts for long-running operations
2. **Retries**: Implement exponential backoff for AWS API calls
3. **Caching**: Cache analysis results to avoid re-analyzing
4. **Parallel Operations**: Run independent operations in parallel where possible
5. **Resource Limits**: Check AWS service limits before provisioning
6. **Cost Optimization**: Suggest right-sized instances based on requirements

## Monitoring and Observability

1. **Logging**: Log all agent actions with timestamps
2. **Metrics**: Track deployment success rate, duration, costs
3. **Alerts**: Alert on deployment failures, high costs
4. **Dashboards**: Create CloudWatch dashboards for monitoring
5. **Tracing**: Implement distributed tracing for debugging

## Documentation Requirements

1. **README**: Update with new agents and workflows
2. **CLI Guide**: Document all commands and flags
3. **Architecture**: Update architecture diagram
4. **Examples**: Provide example deployments
5. **Troubleshooting**: Document common issues and solutions
6. **API Reference**: Document agent interfaces and tools

