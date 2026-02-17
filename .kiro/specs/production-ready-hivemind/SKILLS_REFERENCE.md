# Available Skills Reference

This document catalogs all available skills in `~/.claude/skills` that can be leveraged during implementation of the Production-Ready HiveMind spec.

## Overview

Skills are specialized knowledge modules that provide expert guidance on specific topics. They contain best practices, patterns, and detailed implementation guidance.

**Total Available Skills: 10**

### CloudFormation & AWS Infrastructure (3 skills)
- `aws-cloud-architecture` - Well-Architected Framework patterns
- `aws-cloudformation` - IaC with CloudFormation templates
- `cloudformation` - Stack management and drift detection

### Testing & Quality (3 skills)
- `python-testing` - TDD, fixtures, mocking, coverage
- `pytest` - Parallel execution, markers, test organization
- `python-testing-patterns` - Property-based testing, advanced patterns

### Development & Code Quality (2 skills)
- `python-expert` - Type hints, PEP 8, error handling
- `senior-prompt-engineer` - LLM optimization, agent orchestration

### Frontend & Documentation (2 skills)
- `frontend-design` - Distinctive UI design, animations
- `readme-generator` - Professional documentation structure

## Available Skills

### 1. AWS Cloud Architecture (`aws-cloud-architecture`)

**Location:** `~/.claude/skills/aws-cloud-architecture/SKILL.md`

**Purpose:** Comprehensive AWS cloud architecture patterns following the Well-Architected Framework.

**Key Features:**
- Production VPC with public/private subnets
- Multi-AZ high availability patterns
- Application Load Balancer configuration
- RDS database setup with encryption
- S3 bucket policies and lifecycle rules
- IAM roles and policies with least privilege
- CloudWatch monitoring and alarms
- CloudTrail audit logging
- Step Functions workflows
- EventBridge rules
- Cost optimization strategies
- Disaster recovery patterns

**When to Use:**
- Designing HiveMind infrastructure architecture
- Setting up VPC with proper networking
- Configuring ALB for zero-downtime deployments
- Implementing security best practices
- Setting up monitoring and observability
- Planning disaster recovery

**Key Patterns:**
```yaml
# Production VPC with NAT Gateways
- Public subnets in multiple AZs
- Private subnets for application tier
- NAT Gateways for outbound traffic
- VPC endpoints for AWS services

# Application Load Balancer
- HTTPS listener with SSL termination
- HTTP to HTTPS redirect
- Health checks with proper thresholds
- Target groups with connection draining

# Security
- IAM roles with least privilege
- KMS encryption for data at rest
- Security groups with minimal access
- CloudTrail for audit logging
```

**Relevant for HiveMind:**
- VPC setup for EC2 instances and RDS
- ALB integration for zero-downtime deployments
- Security group configuration
- CloudWatch dashboard creation
- IAM roles for EC2 instances
- Multi-AZ deployment patterns

---

### 2. AWS CloudFormation (`aws-cloudformation`)

**Location:** `~/.claude/skills/aws-cloudformation/SKILL.md`

**Purpose:** Infrastructure as Code with CloudFormation templates and stack management.

**Key Features:**
- Template structure and syntax
- Stack creation and updates
- Change sets for preview
- Nested stacks pattern
- Stack policies for protection
- Troubleshooting failed deployments
- Best practices for IaC

**When to Use:**
- Writing CloudFormation templates
- Deploying infrastructure stacks
- Updating existing stacks safely
- Troubleshooting stack failures
- Organizing complex infrastructure

**Critical Commands:**
```bash
# Validate template
aws cloudformation validate-template --template-body file://template.yaml

# Create stack with capabilities
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yaml \
  --capabilities CAPABILITY_IAM

# Create change set (preview changes)
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-changes \
  --template-body file://template.yaml

# Execute change set
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-changes
```

**Template Structure:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Stack description'

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-12345678

Conditions:
  IsProd: !Equals [!Ref Environment, prod]

Resources:
  # AWS resources here

Outputs:
  ResourceId:
    Value: !Ref Resource
    Export:
      Name: !Sub ${Environment}-ResourceId
```

**Relevant for HiveMind:**
- Provisioner agent template generation
- Stack creation and management
- Change sets for safe updates
- Nested stacks for modular infrastructure
- Stack outputs for resource references

---

### 3. CloudFormation (`cloudformation`)

**Location:** `~/.claude/skills/cloudformation/SKILL.md`

**Purpose:** AWS CloudFormation infrastructure as code for stack management.

**Key Features:**
- Core concepts (templates, stacks, change sets)
- Common patterns (VPC, Lambda, DynamoDB)
- CLI reference for all operations
- Drift detection
- Rollback handling
- Best practices for reliability

**When to Use:**
- Writing CloudFormation templates
- Managing stack lifecycle
- Detecting infrastructure drift
- Troubleshooting deployments
- Implementing IaC best practices

**Common Patterns:**
```yaml
# Lambda Function
Resources:
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt LambdaRole.Arn
      Code:
        ZipFile: |
          def handler(event, context):
              return {'statusCode': 200}

# DynamoDB Table
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
```

**Drift Detection:**
```bash
# Detect drift
aws cloudformation detect-stack-drift --stack-name my-stack

# View drifted resources
aws cloudformation describe-stack-resource-drifts --stack-name my-stack
```

**Relevant for HiveMind:**
- Template validation before deployment
- Stack event monitoring
- Drift detection for deployed infrastructure
- Rollback handling for failed updates
- Resource dependency management

---

### 4. README Generator (`readme-generator`)

**Location:** `~/.claude/skills/readme-generator/SKILL.md`

**Purpose:** Generate professional README.md files following the Deep Insight/Strands SDK style.

**Key Features:**
- Center-aligned header with logo and badges
- Progressive disclosure structure
- Visual-first approach with diagrams
- Comprehensive installation and configuration sections
- Architecture diagrams and component descriptions

**When to Use:**
- Creating or updating HiveMind's main README
- Documenting new features or components
- Creating user-facing documentation

**Relevant Sections:**
- Quick Start (2-3 steps max)
- Architecture diagrams
- Installation with multiple configuration options
- Demo sections with sample outputs

---

### 5. Frontend Design (`frontend-design`)

**Location:** `~/.claude/skills/frontend-design/SKILL.md`

**Purpose:** Create distinctive, production-grade frontend interfaces with high design quality.

**Key Features:**
- Bold aesthetic direction (avoid generic AI aesthetics)
- Typography selection (distinctive fonts)
- Color & theme cohesion
- Motion and micro-interactions
- Spatial composition and layouts

**When to Use:**
- Building the interactive web GUI
- Creating the agent selector interface
- Designing the chat interface
- Building the deployment dashboard

**Design Principles:**
- Choose extreme aesthetic direction (minimal, maximalist, retro-futuristic, etc.)
- Use distinctive fonts (avoid Inter, Roboto, Arial)
- Implement animations for effects and micro-interactions
- Create atmosphere with backgrounds and visual details

**Relevant for HiveMind:**
- Agent selector cards with visual appeal
- Real-time chat interface
- Deployment dashboard with metrics visualization
- WebSocket-based live updates

---

### 6. Python Testing (`python-testing`)

**Location:** `~/.claude/skills/python-testing/SKILL.md`

**Purpose:** Comprehensive testing strategies using pytest, TDD methodology, fixtures, mocking, and coverage.

**Key Features:**
- Test-Driven Development (TDD) cycle: Red → Green → Refactor
- 80%+ code coverage target
- Fixtures for setup/teardown
- Parametrization for multiple test cases
- Mocking external dependencies
- Async test support

**When to Use:**
- Writing unit tests for all agents
- Testing CloudFormation template generation
- Testing AWS API interactions (with mocks)
- Testing deployment workflows

**Critical Patterns:**
```python
# TDD Cycle
1. RED: Write failing test
2. GREEN: Minimal implementation
3. REFACTOR: Improve code

# Fixtures for setup/teardown
@pytest.fixture
def deployment_state():
    state = DeploymentState(...)
    yield state
    # cleanup

# Parametrization
@pytest.mark.parametrize("input,expected", [
    ("value1", "result1"),
    ("value2", "result2"),
])
def test_function(input, expected):
    assert function(input) == expected

# Mocking AWS calls
@patch('boto3.client')
def test_aws_operation(mock_boto):
    mock_boto.return_value.describe_instances.return_value = {...}
```

**Relevant for HiveMind:**
- Reduce property test examples from 100 to 20
- Mock boto3 clients for fast tests
- Mock SSH connections
- Mock LLM responses
- Separate fast/slow tests with markers
- Target: <5 minutes for full test suite

---

### 7. Pytest Patterns (`pytest`)

**Location:** `~/.claude/skills/pytest/SKILL.md`

**Purpose:** Pytest-specific testing patterns and best practices.

**Key Features:**
- Basic test structure
- Fixtures and conftest.py
- Mocking with unittest.mock
- Parametrize decorator
- Test markers (slow, integration, unit)
- Async tests with pytest-asyncio

**When to Use:**
- Organizing test suites
- Creating shared fixtures
- Running specific test subsets
- Parallel test execution

**Critical Commands:**
```bash
pytest -n auto              # Parallel execution
pytest -m "not slow"        # Skip slow tests
pytest -m fast              # Run only fast tests
pytest --cov=src            # Coverage report
pytest -x                   # Stop on first failure
```

**Relevant for HiveMind:**
- Use pytest-xdist for parallel execution (12 hours → 2-3 hours)
- Mark tests: @pytest.mark.fast, @pytest.mark.slow, @pytest.mark.aws
- Create conftest.py with shared fixtures
- Mock expensive operations (AWS, SSH, LLM)

**Reference Documents:**
- `references/prowler-testing.md` - Provider-specific testing patterns

---

### 8. Python Testing Patterns (`python-testing-patterns`)

**Location:** `~/.claude/skills/python-testing-patterns/SKILL.md`

**Purpose:** Advanced Python testing patterns including property-based testing.

**Key Features:**
- AAA pattern (Arrange, Act, Assert)
- Test coverage strategies
- Test isolation
- Property-based testing with Hypothesis
- Testing async code
- Temporary files and directories

**When to Use:**
- Writing property-based tests for correctness
- Testing complex workflows
- Testing file operations
- Testing database operations

**Property-Based Testing:**
```python
from hypothesis import given, strategies as st

@given(st.text())
def test_reverse_twice_is_original(s):
    """Property: reversing twice returns original."""
    assert reverse(reverse(s)) == s

@given(st.integers(), st.integers())
def test_addition_commutative(a, b):
    """Property: addition is commutative."""
    assert a + b == b + a
```

**Relevant for HiveMind:**
- Property tests for CloudFormation template generation
- Property tests for deployment state transitions
- Property tests for rollback completeness
- Use @settings(max_examples=20) for most tests
- Use @settings(max_examples=100) for critical correctness

---

### 9. Python Expert (`python-expert`)

**Location:** `~/.claude/skills/python-expert/SKILL.md`

**Purpose:** Senior Python developer expertise for clean, efficient, well-documented code.

**Key Features:**
- Type hints and type safety
- PEP 8 style compliance
- Proper error handling
- Performance optimization
- Code review checklist

**When to Use:**
- Writing new Python code
- Reviewing code for quality
- Implementing type hints
- Optimizing performance

**Development Process:**
1. Design First (understand problem, choose data structures)
2. Type Safety (complete type hints)
3. Correctness (handle edge cases, proper error handling)
4. Performance (list comprehensions, generators)
5. Style & Documentation (PEP 8, docstrings)

**Code Review Checklist:**
- [ ] Correctness - Logic errors, edge cases
- [ ] Type Safety - Complete type hints
- [ ] Error Handling - Specific exceptions
- [ ] Performance - Inefficient loops
- [ ] Style - PEP 8 compliance
- [ ] Documentation - Docstrings
- [ ] Security - Input validation
- [ ] Testing - Test coverage

**Relevant for HiveMind:**
- All agent implementations
- CloudFormation template generation
- Deployment state management
- Error recovery logic

**Additional Resources:**
- `AGENTS.md` - Complete compilation of all rules with examples
- `rules/` directory - Deep dives into specific topics

---

### 10. Senior Prompt Engineer (`senior-prompt-engineer`)

**Location:** `~/.claude/skills/senior-prompt-engineer/SKILL.md`

**Purpose:** World-class prompt engineering for LLM optimization, agent design, and AI product development.

**Key Features:**
- Advanced prompt patterns
- Structured outputs
- Few-shot learning
- Chain-of-thought reasoning
- RAG optimization
- Agent orchestration
- LLM evaluation frameworks

**When to Use:**
- Designing agent prompts
- Optimizing LLM interactions
- Building agentic systems
- Evaluating agent performance

**Core Expertise:**
- Production patterns and architectures
- Scalable system design
- Performance optimization
- MLOps and DataOps
- Real-time processing
- Model deployment and monitoring

**Reference Documents:**
- `references/prompt_engineering_patterns.md` - Advanced patterns and best practices
- `references/agentic_system_design.md` - System design principles
- `references/llm_evaluation_frameworks.md` - Evaluation workflows

**Relevant for HiveMind:**
- Conductor agent orchestration
- Agent-to-agent communication
- Error recovery prompts (Medic agent)
- QA verification prompts
- Interactive chat interface prompts

---

## Skill Usage Guidelines

### When to Reference Skills

1. **During Design Phase:**
   - Reference architecture patterns
   - Review best practices
   - Plan testing strategy

2. **During Implementation:**
   - Follow coding standards
   - Apply design patterns
   - Implement proper error handling

3. **During Testing:**
   - Write comprehensive tests
   - Use appropriate test patterns
   - Optimize test performance

4. **During Documentation:**
   - Create professional README
   - Document architecture
   - Provide clear examples

### How to Reference Skills

Skills can be referenced in several ways:

1. **Direct File Reference:**
   ```
   See ~/.claude/skills/python-testing/SKILL.md for testing patterns
   ```

2. **Specific Section Reference:**
   ```
   Follow the TDD cycle from python-testing skill:
   1. RED: Write failing test
   2. GREEN: Minimal implementation
   3. REFACTOR: Improve code
   ```

3. **Pattern Application:**
   ```
   Apply the AAA pattern (Arrange, Act, Assert) from python-testing-patterns
   ```

4. **Reference Document:**
   ```
   See ~/.claude/skills/senior-prompt-engineer/references/agentic_system_design.md
   for agent orchestration patterns
   ```

## Skill Integration with HiveMind Spec

### CloudFormation Infrastructure (Sections 1-6)

**Primary Skills:**
- `aws-cloud-architecture` - VPC, ALB, RDS, security patterns
- `aws-cloudformation` - Template structure, stack management
- `cloudformation` - Drift detection, rollback handling

**Application:**
- VPC with public/private subnets across multiple AZs
- Application Load Balancer with HTTPS and health checks
- Security groups with least privilege access
- IAM roles for EC2 instances
- CloudFormation templates for all infrastructure
- Stack outputs for resource references
- Change sets for safe updates

### Test Performance Optimization (Section 7)

**Primary Skills:**
- `python-testing` - TDD, fixtures, mocking, coverage
- `pytest` - Parallel execution, markers, test organization
- `python-testing-patterns` - Property-based testing, test isolation

**Application:**
- Reduce property test examples: 100 → 20 (most), 100 (critical only)
- Mock expensive operations: boto3, SSH, LLM calls
- Parallelize with pytest-xdist: `pytest -n auto`
- Separate fast/slow tests: `@pytest.mark.fast`, `@pytest.mark.slow`
- Target: <5 minutes for full test suite

### Interactive Web GUI (Section 8)

**Primary Skills:**
- `frontend-design` - Distinctive UI, typography, animations
- `readme-generator` - Documentation structure

**Application:**
- Agent selector with bold aesthetic direction
- Real-time chat interface with WebSocket
- Deployment dashboard with metrics visualization
- Distinctive fonts and color schemes
- Motion and micro-interactions

### Agent Implementation

**Primary Skills:**
- `python-expert` - Clean code, type hints, error handling
- `senior-prompt-engineer` - Agent design, orchestration

**Application:**
- Type-safe agent implementations
- Proper error handling and recovery
- Agent-to-agent communication patterns
- Structured outputs and validation

### Documentation

**Primary Skills:**
- `readme-generator` - Professional README structure

**Application:**
- Main README with architecture diagrams
- Quick Start section (2-3 steps)
- Installation with multiple configuration options
- Demo sections with sample outputs

## Quick Reference

| Task | Primary Skill | Key Concepts |
|------|---------------|--------------|
| Infrastructure design | `aws-cloud-architecture` | VPC, ALB, multi-AZ, security |
| CloudFormation templates | `aws-cloudformation` | IaC, stacks, change sets |
| Stack management | `cloudformation` | Drift detection, rollback |
| Writing tests | `python-testing` | TDD, fixtures, mocking, coverage |
| Test optimization | `pytest` | Parallel execution, markers, conftest |
| Property tests | `python-testing-patterns` | Hypothesis, test isolation |
| Clean code | `python-expert` | Type hints, PEP 8, error handling |
| Agent design | `senior-prompt-engineer` | Orchestration, structured outputs |
| Web UI | `frontend-design` | Bold aesthetics, animations |
| Documentation | `readme-generator` | Progressive disclosure, architecture |

## Notes

- All skills are located in `~/.claude/skills/`
- Skills contain both main documentation and reference materials
- Reference documents provide deep dives into specific topics
- Skills should be consulted during design, implementation, and testing phases
- Skills provide production-ready patterns and best practices
