# Design Document: CloudFormation Migration

## Overview

This design specifies the migration of HiveMind from direct boto3 API calls to CloudFormation-based Infrastructure as Code. The migration introduces CloudFormation template generation, validation with cfn-lint and cfn-guard, stack management operations, StackSet support for multi-region deployments, and an interactive CLI workflow where agents collaborate with users to design optimal infrastructure.

The design maintains backward compatibility with existing deployments while adding new capabilities for declarative infrastructure management, drift detection, and automated rollback.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HiveMind CLI                             │
│  (python3 hivemind --software "repo1" "repo2")                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Interactive Dialog Layer                      │
│  - ASCII Art Display                                            │
│  - Agent Presentation                                           │
│  - User Q&A for Infrastructure Choices                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              CloudFormation Template Generator                  │
│  - Workload Analysis                                            │
│  - Service Recommendation Engine                                │
│  - Template Builder (YAML)                                      │
│  - Parameter & Output Definition                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Validation Layer                               │
│  - cfn-lint (Syntax & Best Practices)                           │
│  - cfn-guard (Policy Compliance)                                │
│  - Security Validation                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Stack Management Layer                              │
│  - Stack Operations (Create/Update/Delete)                      │
│  - StackSet Operations (Multi-Region/Multi-AZ)                 │
│  - Change Set Management                                        │
│  - Status Polling & Event Streaming                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS CloudFormation                            │
│  - Stack Provisioning                                           │
│  - Resource Management                                          │
│  - Automatic Rollback                                           │
└─────────────────────────────────────────────────────────────────┘
```


### Component Interaction Flow

1. **CLI Entry**: User provides software repos via command-line flags
2. **Interactive Planning**: Provisioner Agent engages user in dialog about infrastructure needs
3. **Template Generation**: System generates CloudFormation template based on user choices
4. **Validation**: cfn-lint and cfn-guard validate template before deployment
5. **Stack Creation**: CloudFormation stack is created with real-time event streaming
6. **Output Extraction**: Stack outputs are extracted and stored in Deployment_State
7. **Post-Deployment**: User can query infrastructure details and receive access URLs

## Components and Interfaces

### 1. CloudFormation Template Generator

**Purpose**: Generate CloudFormation templates based on workload requirements and user preferences.

**Location**: `src/tools/cfn_template_generator.py`

**Key Classes**:

```python
class CloudFormationTemplateGenerator:
    """Generates CloudFormation templates for HiveMind deployments."""
    
    def __init__(self):
        self.template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "",
            "Parameters": {},
            "Resources": {},
            "Outputs": {}
        }
    
    def add_vpc(self, deployment_id: str, cidr_block: str = "10.0.0.0/16") -> None:
        """Add VPC resources to template."""
        pass
    
    def add_security_group(self, deployment_id: str, vpc_ref: str, 
                          ingress_rules: List[Dict]) -> None:
        """Add security group resources to template."""
        pass
    
    def add_ec2_instance(self, deployment_id: str, instance_type: str,
                        subnet_ref: str, security_group_ref: str) -> None:
        """Add EC2 instance resources to template."""
        pass
    
    def add_rds_instance(self, deployment_id: str, db_type: str,
                        subnet_refs: List[str], security_group_ref: str) -> None:
        """Add RDS instance resources to template."""
        pass
    
    def add_load_balancer(self, deployment_id: str, vpc_ref: str,
                         subnet_refs: List[str], security_group_ref: str) -> None:
        """Add Application Load Balancer resources to template."""
        pass
    
    def to_yaml(self) -> str:
        """Serialize template to YAML format."""
        pass
    
    def save(self, file_path: str) -> None:
        """Save template to file."""
        pass
```


### 2. Template Validation Tools

**Purpose**: Validate CloudFormation templates using cfn-lint and cfn-guard before deployment.

**Location**: `src/tools/cfn_validation.py`

**Key Functions**:

```python
class TemplateValidationError(Exception):
    """Error during template validation."""
    pass

def validate_with_cfn_lint(template_path: str) -> Dict[str, Any]:
    """
    Validate CloudFormation template using cfn-lint.
    
    Args:
        template_path: Path to template file
        
    Returns:
        Dict with validation results:
        {
            "valid": bool,
            "errors": List[str],
            "warnings": List[str]
        }
        
    Raises:
        TemplateValidationError: If validation fails with errors
    """
    pass

def validate_with_cfn_guard(template_path: str, rules_path: str = None) -> Dict[str, Any]:
    """
    Validate CloudFormation template using cfn-guard for policy compliance.
    
    Args:
        template_path: Path to template file
        rules_path: Optional path to custom guard rules
        
    Returns:
        Dict with validation results:
        {
            "compliant": bool,
            "violations": List[Dict],
            "passed_rules": List[str]
        }
        
    Raises:
        TemplateValidationError: If policy violations detected
    """
    pass

def validate_security_best_practices(template: Dict) -> List[str]:
    """
    Validate template against security best practices.
    
    Checks for:
    - Open security group rules (0.0.0.0/0)
    - Unencrypted resources
    - Public access to databases
    - Missing IAM roles
    
    Returns:
        List of security warnings
    """
    pass
```


### 3. Stack Management Tools

**Purpose**: Manage CloudFormation stack lifecycle operations.

**Location**: `src/tools/cfn_stack_manager.py`

**Key Classes**:

```python
class StackManager:
    """Manages CloudFormation stack operations."""
    
    def __init__(self, region: str = "us-east-1"):
        self.cfn_client = boto3.client("cloudformation", region_name=region)
        self.region = region
    
    def create_stack(self, stack_name: str, template_body: str,
                    parameters: List[Dict] = None, tags: List[Dict] = None) -> str:
        """
        Create CloudFormation stack.
        
        Args:
            stack_name: Name for the stack
            template_body: CloudFormation template as string
            parameters: Optional list of parameter dicts
            tags: Optional list of tag dicts
            
        Returns:
            Stack ID
        """
        pass
    
    def update_stack(self, stack_name: str, template_body: str,
                    parameters: List[Dict] = None) -> str:
        """
        Update existing CloudFormation stack.
        
        Args:
            stack_name: Name of existing stack
            template_body: Updated template as string
            parameters: Optional updated parameters
            
        Returns:
            Stack ID
        """
        pass
    
    def delete_stack(self, stack_name: str) -> None:
        """Delete CloudFormation stack."""
        pass
    
    def wait_for_stack(self, stack_name: str, desired_status: str,
                      timeout: int = 1800) -> Dict:
        """
        Poll stack status until desired state reached.
        
        Args:
            stack_name: Stack name
            desired_status: Target status (CREATE_COMPLETE, UPDATE_COMPLETE, etc.)
            timeout: Maximum wait time in seconds
            
        Returns:
            Final stack description
        """
        pass
    
    def get_stack_outputs(self, stack_name: str) -> Dict[str, str]:
        """
        Extract stack outputs.
        
        Returns:
            Dict mapping output keys to values
        """
        pass
    
    def get_stack_events(self, stack_name: str, limit: int = 50) -> List[Dict]:
        """Get recent stack events for monitoring."""
        pass
    
    def stream_stack_events(self, stack_name: str, callback: Callable) -> None:
        """
        Stream stack events in real-time during stack operations.
        
        Args:
            stack_name: Stack name
            callback: Function to call with each event
        """
        pass
```


### 4. StackSet Management Tools

**Purpose**: Manage CloudFormation StackSets for multi-region/multi-AZ deployments.

**Location**: `src/tools/cfn_stackset_manager.py`

**Key Classes**:

```python
class StackSetManager:
    """Manages CloudFormation StackSet operations."""
    
    def __init__(self, region: str = "us-east-1"):
        self.cfn_client = boto3.client("cloudformation", region_name=region)
        self.region = region
    
    def create_stackset(self, stackset_name: str, template_body: str,
                       parameters: List[Dict] = None, tags: List[Dict] = None) -> str:
        """Create CloudFormation StackSet."""
        pass
    
    def create_stack_instances(self, stackset_name: str, accounts: List[str],
                              regions: List[str], operation_preferences: Dict = None) -> str:
        """
        Deploy stack instances across accounts and regions.
        
        Args:
            stackset_name: StackSet name
            accounts: List of AWS account IDs
            regions: List of AWS regions
            operation_preferences: Optional preferences for rolling updates
            
        Returns:
            Operation ID
        """
        pass
    
    def update_stackset(self, stackset_name: str, template_body: str,
                       parameters: List[Dict] = None,
                       operation_preferences: Dict = None) -> str:
        """
        Update StackSet and all instances.
        
        Args:
            stackset_name: StackSet name
            template_body: Updated template
            parameters: Updated parameters
            operation_preferences: Rolling update preferences
            
        Returns:
            Operation ID
        """
        pass
    
    def delete_stack_instances(self, stackset_name: str, accounts: List[str],
                              regions: List[str]) -> str:
        """Delete stack instances from StackSet."""
        pass
    
    def delete_stackset(self, stackset_name: str) -> None:
        """Delete StackSet (after all instances removed)."""
        pass
    
    def wait_for_stackset_operation(self, stackset_name: str, operation_id: str,
                                   timeout: int = 3600) -> Dict:
        """Poll StackSet operation until complete."""
        pass
    
    def get_stackset_instance_outputs(self, stackset_name: str,
                                     account: str, region: str) -> Dict[str, str]:
        """Extract outputs from specific stack instance."""
        pass
```


### 5. Interactive CLI Components

**Purpose**: Provide interactive terminal experience for infrastructure planning.

**Location**: `src/cli_interactive.py`

**Key Functions**:

```python
def display_ascii_logo() -> None:
    """Display HiveMind ASCII art logo and welcome message."""
    pass

def present_agent(agent_name: str, agent_role: str) -> None:
    """Display agent introduction in terminal."""
    pass

def ask_user_question(question: str, options: List[str] = None,
                     default: str = None) -> str:
    """
    Ask user a question and get response.
    
    Args:
        question: Question to ask
        options: Optional list of valid responses
        default: Optional default value
        
    Returns:
        User's response
    """
    pass

def display_service_comparison(services: List[Dict]) -> None:
    """
    Display comparison table of AWS services with trade-offs.
    
    Args:
        services: List of service dicts with name, pros, cons, cost
    """
    pass

def confirm_choice(message: str) -> bool:
    """Ask user to confirm a choice (yes/no)."""
    pass

def display_validation_results(results: Dict) -> None:
    """Display cfn-lint and cfn-guard validation results."""
    pass

def stream_cfn_events_to_terminal(stack_name: str, region: str) -> None:
    """
    Stream CloudFormation events to terminal in real-time.
    Uses CFN-MON code for event display.
    
    Args:
        stack_name: Stack name to monitor
        region: AWS region
    """
    # PLACEHOLDER: CFN-MON CODE ADD
    # This will use existing working code to stream CFN events
    pass

def display_deployment_summary(stack_outputs: Dict, resources: List[Dict]) -> None:
    """Display deployment summary with all resources and outputs."""
    pass

def interactive_infrastructure_qa(deployment_state: DeploymentState) -> None:
    """
    Allow user to ask questions about deployed infrastructure.
    
    Args:
        deployment_state: Current deployment state with all resources
    """
    pass
```


### 6. Updated Provisioner Agent

**Purpose**: Refactor Provisioner Agent to use CloudFormation instead of boto3.

**Location**: `src/agents/strands_server_monkey.py` (updated)

**Changes**:

```python
# Updated system prompt
PROVISIONER_SYSTEM_PROMPT = """You are HiveMind SysEng, an intelligent AWS infrastructure provisioning agent.

Your core responsibilities:
1. Engage users in conversation about infrastructure needs
2. Recommend AWS services based on goals (security, speed, cost, HA)
3. Generate CloudFormation templates (NOT direct boto3 calls)
4. Validate templates with cfn-lint and cfn-guard
5. Deploy infrastructure via CloudFormation stacks
6. Support StackSets for multi-region deployments

Interactive Planning Process:
1. Ask user about their goals and priorities
2. Recommend services and explain trade-offs
3. Discuss logging, monitoring, backup, HA, security options
4. Validate choices against security best practices
5. Refuse dangerous configurations (e.g., 0.0.0.0/0 on all ports)
6. Generate CloudFormation template collaboratively

Tools Available:
- generate_cloudformation_template: Create CFN template
- validate_template: Run cfn-lint and cfn-guard
- create_stack: Deploy CloudFormation stack
- create_stackset: Deploy across multiple regions
- get_stack_outputs: Extract resource identifiers

You MUST NOT use direct boto3 calls for infrastructure provisioning.
All infrastructure MUST be defined in CloudFormation templates."""

# Updated tools list
provisioner_agent = Agent(
    tools=[
        generate_cloudformation_template,
        validate_template,
        create_stack,
        update_stack,
        delete_stack,
        create_stackset,
        update_stackset,
        delete_stackset,
        get_stack_outputs,
    ],
)
```


## Data Models

### CloudFormation Template Structure

```python
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class CFNParameter(BaseModel):
    """CloudFormation parameter definition."""
    Type: str
    Default: Optional[Any] = None
    Description: Optional[str] = None
    AllowedValues: Optional[List[str]] = None

class CFNResource(BaseModel):
    """CloudFormation resource definition."""
    Type: str
    Properties: Dict[str, Any]
    DependsOn: Optional[List[str]] = None
    Metadata: Optional[Dict[str, Any]] = None

class CFNOutput(BaseModel):
    """CloudFormation output definition."""
    Value: Any
    Description: Optional[str] = None
    Export: Optional[Dict[str, str]] = None

class CloudFormationTemplate(BaseModel):
    """Complete CloudFormation template."""
    AWSTemplateFormatVersion: str = "2010-09-09"
    Description: str
    Parameters: Dict[str, CFNParameter] = {}
    Resources: Dict[str, CFNResource]
    Outputs: Dict[str, CFNOutput] = {}
    
    def to_yaml(self) -> str:
        """Serialize to YAML format."""
        pass
    
    def validate_structure(self) -> bool:
        """Validate template structure."""
        pass
```

### Stack State Tracking

```python
class StackInfo(BaseModel):
    """Information about a CloudFormation stack."""
    stack_id: str
    stack_name: str
    stack_status: str
    creation_time: datetime
    template_body: str
    parameters: List[Dict[str, str]]
    outputs: Dict[str, str]
    tags: List[Dict[str, str]]
    region: str

class StackSetInfo(BaseModel):
    """Information about a CloudFormation StackSet."""
    stackset_id: str
    stackset_name: str
    template_body: str
    parameters: List[Dict[str, str]]
    regions: List[str]
    accounts: List[str]
    instances: List[Dict[str, Any]]
```

### Updated Deployment State

```python
class DeploymentState(BaseModel):
    """Extended deployment state with CloudFormation support."""
    # Existing fields...
    deployment_id: str
    repo_url: str
    status: DeploymentStatus
    
    # New CloudFormation fields
    stack_info: Optional[StackInfo] = None
    stackset_info: Optional[StackSetInfo] = None
    template_path: Optional[str] = None
    creation_method: str = "cloudformation"  # or "boto3" for legacy
    validation_results: Optional[Dict] = None
    
    def is_cloudformation_deployment(self) -> bool:
        """Check if deployment uses CloudFormation."""
        return self.creation_method == "cloudformation"
    
    def get_stack_outputs(self) -> Dict[str, str]:
        """Get stack outputs if available."""
        if self.stack_info:
            return self.stack_info.outputs
        return {}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: CloudFormation Template Generation

*For any* infrastructure provisioning operation, the system should generate a valid CloudFormation template in YAML format that contains the required template keys (AWSTemplateFormatVersion, Resources).

**Validates: Requirements 2.1**

### Property 2: Template Validation Invocation

*For any* generated CloudFormation template, cfn-lint validation should be invoked before deployment and return validation results.

**Validates: Requirements 4.1**

### Property 3: Validation Failure Prevents Deployment

*For any* CloudFormation template that fails cfn-lint validation with errors, the deployment process should halt and not create any AWS resources.

**Validates: Requirements 4.2**

### Property 4: Stack Status Polling Completeness

*For any* CloudFormation stack operation (create, update, delete), status polling should continue until the stack reaches a terminal state (COMPLETE, FAILED, or ROLLBACK_COMPLETE).

**Validates: Requirements 5.4**

### Property 5: Stack Output Extraction Completeness

*For any* CloudFormation stack in CREATE_COMPLETE or UPDATE_COMPLETE status, all defined stack outputs should be extracted and none should be missing.

**Validates: Requirements 6.1**

### Property 6: Output to State Mapping

*For any* set of stack outputs, mapping them to Deployment_State fields and then extracting them back should preserve all output values (round-trip property).

**Validates: Requirements 6.2**

### Property 7: Change Set Creation Before Updates

*For any* stack update operation, a CloudFormation change set should be created and reviewed before the update is executed.

**Validates: Requirements 8.4**

### Property 8: Automatic Rollback Preservation

*For any* failed CloudFormation stack operation, the system should not interfere with CloudFormation's automatic rollback mechanism.

**Validates: Requirements 10.3**

### Property 9: Cost Calculation Consistency

*For any* deployment with multiple resources, the sum of individual resource costs should equal the total deployment cost.

**Validates: Requirements 11.6**

### Property 10: Creation Method Detection

*For any* AWS resource in a deployment, the system should correctly identify whether it was created via CloudFormation or boto3.

**Validates: Requirements 13.2**

### Property 11: Template Serialization Round-Trip

*For any* valid CloudFormation template object, serializing it to YAML and then deserializing it back should produce an equivalent template structure.

**Validates: Requirements 14.1**


## Error Handling

### Validation Errors

**cfn-lint Errors**:
- Capture all errors and warnings from cfn-lint
- Display errors in user-friendly format
- Halt deployment if errors detected
- Log warnings but allow deployment to continue
- Provide suggestions for fixing common errors

**cfn-guard Policy Violations**:
- Capture policy violations with rule names
- Display which policies were violated and why
- Halt deployment if violations detected
- Provide remediation guidance
- Allow custom guard rules for organization policies

**Security Validation Errors**:
- Detect insecure configurations (0.0.0.0/0 on all ports)
- Refuse dangerous configurations with explanation
- Suggest secure alternatives
- Log all security validation decisions

### Stack Operation Errors

**Stack Creation Failures**:
- Poll CloudFormation events to identify failure cause
- Extract error messages from failed resources
- Display failure reason to user
- Rely on CloudFormation automatic rollback
- Mark deployment as FAILED in state
- Store failure details for debugging

**Stack Update Failures**:
- Create change set to preview changes
- If change set creation fails, report errors
- If update fails, CloudFormation rolls back automatically
- Extract rollback reason from events
- Preserve previous working state

**Stack Deletion Failures**:
- Attempt CloudFormation stack deletion first
- If deletion fails due to resource dependencies, report details
- As last resort, allow manual boto3 cleanup with logging
- Document all manual cleanup operations
- Prefer force delete over manual cleanup

### StackSet Operation Errors

**StackSet Creation Failures**:
- Report which regions/accounts failed
- Provide failure reasons for each failed instance
- Support partial rollback of failed instances
- Allow retry of failed instances only

**StackSet Update Failures**:
- Use rolling update preferences to minimize impact
- Report progress of updates across instances
- Halt updates if failure threshold exceeded
- Support rollback of updated instances

### API Throttling

**CloudFormation API Limits**:
- Implement exponential backoff for throttled requests
- Start with 1 second delay, double on each retry
- Maximum 5 retries before failing
- Log throttling events for monitoring

### Timeout Handling

**Stack Operation Timeouts**:
- Default timeout: 30 minutes for stack create/update
- Default timeout: 60 minutes for StackSet operations
- Allow configurable timeouts per operation
- If timeout reached, continue polling in background
- Report timeout to user with current status


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary

### Unit Testing

Unit tests focus on specific scenarios and integration points:

**Template Generation Tests**:
- Test VPC template generation with specific CIDR blocks
- Test security group generation with specific ports
- Test EC2 instance template with specific instance types
- Test RDS template generation with PostgreSQL and MySQL
- Test ALB template generation with target groups
- Test template parameter definitions
- Test template output definitions

**Validation Tests**:
- Test cfn-lint integration with valid templates
- Test cfn-lint integration with invalid templates
- Test cfn-guard integration with compliant templates
- Test cfn-guard integration with non-compliant templates
- Test security validation with insecure configurations
- Test validation error message formatting

**Stack Management Tests**:
- Test stack creation with sample template
- Test stack update with changed template
- Test stack deletion
- Test stack status polling
- Test stack output extraction
- Test stack event retrieval
- Test error handling for failed stacks

**StackSet Tests**:
- Test StackSet creation
- Test stack instance deployment across regions
- Test StackSet updates with rolling preferences
- Test StackSet deletion
- Test operation status polling

**CLI Integration Tests**:
- Test command-line argument parsing
- Test ASCII logo display
- Test interactive question flow
- Test validation result display
- Test deployment summary display

### Property-Based Testing

Property tests verify universal correctness properties using randomized inputs. Each property test should run minimum 100 iterations.

**Property Test Configuration**:
```python
# Using Hypothesis for Python property-based testing
from hypothesis import given, strategies as st
import hypothesis.strategies as st

# Configure minimum iterations
from hypothesis import settings
settings.register_profile("ci", max_examples=100)
settings.load_profile("ci")
```

**Property Test 1: Template Generation Validity**
```python
@given(
    deployment_id=st.text(min_size=1, max_size=50),
    instance_type=st.sampled_from(["t3.micro", "t3.small", "t3.medium"]),
    cidr_block=st.sampled_from(["10.0.0.0/16", "172.16.0.0/16"])
)
def test_template_generation_produces_valid_yaml(deployment_id, instance_type, cidr_block):
    """
    Feature: cloudformation-migration, Property 1: CloudFormation Template Generation
    
    For any infrastructure provisioning operation, the system should generate 
    a valid CloudFormation template in YAML format.
    """
    generator = CloudFormationTemplateGenerator()
    generator.add_vpc(deployment_id, cidr_block)
    generator.add_ec2_instance(deployment_id, instance_type, "subnet_ref", "sg_ref")
    
    yaml_output = generator.to_yaml()
    
    # Should be valid YAML
    template = yaml.safe_load(yaml_output)
    
    # Should have required keys
    assert "AWSTemplateFormatVersion" in template
    assert "Resources" in template
    assert len(template["Resources"]) > 0
```

**Property Test 2: Validation Always Invoked**
```python
@given(template_content=st.text(min_size=10))
def test_validation_invoked_for_all_templates(template_content):
    """
    Feature: cloudformation-migration, Property 2: Template Validation Invocation
    
    For any generated CloudFormation template, cfn-lint validation should be invoked.
    """
    with patch('subprocess.run') as mock_run:
        mock_run.return_value = MagicMock(returncode=0, stdout="[]")
        
        result = validate_with_cfn_lint(template_content)
        
        # cfn-lint should have been called
        assert mock_run.called
        assert result is not None
```

**Property Test 3: Failed Validation Prevents Deployment**
```python
@given(
    template=st.builds(CloudFormationTemplate),
    has_errors=st.booleans()
)
def test_validation_failure_prevents_deployment(template, has_errors):
    """
    Feature: cloudformation-migration, Property 3: Validation Failure Prevents Deployment
    
    For any template that fails validation with errors, deployment should not proceed.
    """
    with patch('validate_with_cfn_lint') as mock_validate:
        mock_validate.return_value = {
            "valid": not has_errors,
            "errors": ["Error 1"] if has_errors else []
        }
        
        if has_errors:
            with pytest.raises(TemplateValidationError):
                deploy_stack(template)
        else:
            # Should not raise
            deploy_stack(template)
```

**Property Test 4: Stack Polling Reaches Terminal State**
```python
@given(
    stack_name=st.text(min_size=1, max_size=50),
    final_status=st.sampled_from([
        "CREATE_COMPLETE", "CREATE_FAILED", 
        "UPDATE_COMPLETE", "UPDATE_FAILED",
        "ROLLBACK_COMPLETE"
    ])
)
def test_stack_polling_reaches_terminal_state(stack_name, final_status):
    """
    Feature: cloudformation-migration, Property 4: Stack Status Polling Completeness
    
    For any stack operation, polling should continue until terminal state.
    """
    manager = StackManager()
    
    with patch.object(manager.cfn_client, 'describe_stacks') as mock_describe:
        # Simulate progression to terminal state
        mock_describe.side_effect = [
            {"Stacks": [{"StackStatus": "CREATE_IN_PROGRESS"}]},
            {"Stacks": [{"StackStatus": "CREATE_IN_PROGRESS"}]},
            {"Stacks": [{"StackStatus": final_status}]}
        ]
        
        result = manager.wait_for_stack(stack_name, final_status, timeout=10)
        
        # Should reach terminal state
        assert result["Stacks"][0]["StackStatus"] == final_status
```

**Property Test 5: Output Extraction Completeness**
```python
@given(
    outputs=st.dictionaries(
        keys=st.text(min_size=1, max_size=20),
        values=st.text(min_size=1, max_size=50),
        min_size=1,
        max_size=10
    )
)
def test_all_stack_outputs_extracted(outputs):
    """
    Feature: cloudformation-migration, Property 5: Stack Output Extraction Completeness
    
    For any stack with outputs, all outputs should be extracted.
    """
    manager = StackManager()
    
    with patch.object(manager.cfn_client, 'describe_stacks') as mock_describe:
        mock_describe.return_value = {
            "Stacks": [{
                "Outputs": [
                    {"OutputKey": k, "OutputValue": v}
                    for k, v in outputs.items()
                ]
            }]
        }
        
        extracted = manager.get_stack_outputs("test-stack")
        
        # All outputs should be extracted
        assert len(extracted) == len(outputs)
        for key, value in outputs.items():
            assert extracted[key] == value
```

**Property Test 6: Output Mapping Round-Trip**
```python
@given(
    outputs=st.dictionaries(
        keys=st.sampled_from(["VpcId", "SubnetId", "InstanceId", "LoadBalancerDNS"]),
        values=st.text(min_size=1, max_size=50),
        min_size=1
    )
)
def test_output_to_state_mapping_round_trip(outputs):
    """
    Feature: cloudformation-migration, Property 6: Output to State Mapping
    
    For any stack outputs, mapping to state and back should preserve values.
    """
    state = DeploymentState(deployment_id="test", repo_url="http://example.com")
    
    # Map outputs to state
    map_outputs_to_state(state, outputs)
    
    # Extract back
    extracted = extract_outputs_from_state(state)
    
    # Should preserve all values
    for key in outputs:
        if key in extracted:
            assert extracted[key] == outputs[key]
```

**Property Test 7: Template Serialization Round-Trip**
```python
@given(template=st.builds(CloudFormationTemplate))
def test_template_serialization_round_trip(template):
    """
    Feature: cloudformation-migration, Property 11: Template Serialization Round-Trip
    
    For any template, serializing to YAML and deserializing should preserve structure.
    """
    # Serialize to YAML
    yaml_str = template.to_yaml()
    
    # Deserialize back
    deserialized = yaml.safe_load(yaml_str)
    reconstructed = CloudFormationTemplate(**deserialized)
    
    # Should be equivalent
    assert reconstructed.AWSTemplateFormatVersion == template.AWSTemplateFormatVersion
    assert reconstructed.Description == template.Description
    assert len(reconstructed.Resources) == len(template.Resources)
```

### Test Organization

```
tests/
├── unit/
│   ├── test_cfn_template_generator.py
│   ├── test_cfn_validation.py
│   ├── test_cfn_stack_manager.py
│   ├── test_cfn_stackset_manager.py
│   └── test_cli_interactive.py
├── property/
│   ├── test_template_generation_properties.py
│   ├── test_validation_properties.py
│   ├── test_stack_management_properties.py
│   └── test_output_mapping_properties.py
└── integration/
    ├── test_end_to_end_deployment.py
    └── test_interactive_cli_flow.py
```

### Test Execution

```bash
# Run all tests
pytest tests/ --silent

# Run only unit tests
pytest tests/unit/ --silent

# Run only property tests (with 100 iterations)
pytest tests/property/ --hypothesis-profile=ci --silent

# Run specific property test
pytest tests/property/test_template_generation_properties.py::test_template_generation_produces_valid_yaml --silent
```

