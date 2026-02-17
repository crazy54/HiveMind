# Requirements Document: CloudFormation Migration

## Introduction

HiveMind is a Python-based AWS deployment system that currently uses direct boto3 API calls to provision infrastructure. This violates AWS best practices and creates several operational challenges including lack of drift detection, difficult rollback procedures, and no declarative infrastructure state. This specification defines the requirements for migrating HiveMind from imperative boto3 API calls to declarative CloudFormation-based Infrastructure as Code (IaC).

The migration will replace all direct boto3 infrastructure provisioning calls with CloudFormation template generation and stack management, while maintaining backward compatibility with existing deployments and preserving all current functionality.

## Glossary

- **HiveMind**: The autonomous AWS deployment system using Strands agents
- **Provisioner_Agent**: The HiveMind SysEng agent responsible for infrastructure provisioning (strands_server_monkey.py)
- **Infrastructure_Tools**: Python tools that currently use boto3 to create AWS resources (aws_infrastructure.py)
- **CloudFormation_Template**: A JSON or YAML file defining AWS infrastructure declaratively
- **Stack**: A CloudFormation stack representing a collection of AWS resources managed as a single unit
- **StackSet**: A CloudFormation StackSet that enables deployment of stacks across multiple AWS accounts and regions
- **Stack_Instance**: An individual stack deployed as part of a StackSet in a specific account and region
- **cfn-lint**: AWS CloudFormation template validation tool
- **cfn-guard**: AWS CloudFormation policy-as-code evaluation tool
- **boto3**: AWS SDK for Python
- **Deployment_State**: The DeploymentState object tracking deployment progress and resources
- **Stack_Output**: Values exported from a CloudFormation stack for use by other components

## Requirements

### Requirement 1: Eliminate Direct boto3 Infrastructure Calls

**User Story:** As a DevOps engineer, I want all infrastructure provisioning to use CloudFormation, so that I have declarative infrastructure state and can leverage CloudFormation's built-in capabilities.

#### Acceptance Criteria

1. THE Infrastructure_Tools SHALL NOT use AWS boto3 API calls to create, modify, or delete AWS resources
2. THE System SHALL create, modify, and delete all AWS resources via CloudFormation templates for tracking and auditability
3. IF AND ONLY IF CloudFormation stack deletion encounters errors AND manual resource cleanup is required to unblock stack deletion, THEN THE System MAY use boto3 API calls as a last resort
4. WHEN manual cleanup is required, THE System SHALL log the reason and resource details before using boto3
5. THE System SHALL prefer CloudFormation force delete operations over manual boto3 cleanup
6. THE System SHALL document any manual cleanup operations in Deployment_State logs

### Requirement 2: CloudFormation Template Generation

**User Story:** As a system architect, I want infrastructure defined in CloudFormation templates, so that I have version-controlled, auditable infrastructure definitions.

#### Acceptance Criteria

1. WHEN the Provisioner_Agent provisions infrastructure, THE System SHALL generate a CloudFormation template in YAML format
2. THE CloudFormation_Template SHALL define resources collaboratively determined with the user based on workload requirements
3. THE CloudFormation_Template SHALL use CloudFormation parameters for configurable values
4. THE CloudFormation_Template SHALL define outputs for resource identifiers and endpoints
5. THE CloudFormation_Template SHALL include proper DependsOn attributes for resource ordering
6. THE CloudFormation_Template SHALL apply tags to all resources using the deployment_id

### Requirement 3: Interactive CLI Workflow

**User Story:** As a deployment user, I want an interactive terminal experience for planning and deploying infrastructure, so that I can make informed choices and understand what's being created.

#### Acceptance Criteria

1. THE System SHALL accept software repository URLs via command-line arguments using --software or -s/-S flags
2. WHEN user executes the HiveMind CLI with repository URLs, THE System SHALL display ASCII art logo and tool name
3. THE System SHALL parse repository URLs from command-line arguments before starting interactive dialog
4. THE System SHALL present each agent in the terminal to interact with the user in real time
5. THE Provisioner_Agent SHALL ask questions about deployment of the provided software packages
6. WHILE collecting deployment requirements, THE System SHALL generate the CloudFormation_Template incrementally
7. WHEN all data is collected, THE System SHALL validate the generated template using cfn-lint
8. THE System SHALL display validation results and work with user to correct any errors
9. WHEN template is approved, THE System SHALL enter provisioning mode
10. WHILE provisioning, THE System SHALL stream CloudFormation deployment events to the terminal in real time
11. THE System SHALL use CFN-MON code to display stack creation progress and events
12. WHEN deployment completes, THE System SHALL display all CloudFormation parameters and resources in the terminal
13. THE System SHALL allow user to ask questions about any part of the deployed infrastructure
14. THE System SHALL explain how the deployed application works based on user questions
15. THE System SHALL provide URLs to deployed tools and instructions for accessing them
16. THE System SHALL support command format: python3 hivemind --software "repo_url_1" "repo_url_2" "repo_url_N"
17. THE System SHALL support short flag format: python3 hivemind -s "repo_url" or -S "repo_url"

### Requirement 4: Interactive Template Configuration

**User Story:** As a deployment user, I want to configure template options interactively with the agent, so that I get the best infrastructure choices on the first deployment.

#### Acceptance Criteria

1. WHEN generating a CloudFormation_Template, THE Provisioner_Agent SHALL engage in conversation with the user about infrastructure choices
2. THE Provisioner_Agent SHALL ask the user about their goals (security, speed, cost optimization, high availability, etc.)
3. THE Provisioner_Agent SHALL recommend AWS services based on user goals and workload requirements
4. THE Provisioner_Agent SHALL explain trade-offs between different service options (e.g., EC2 vs ECS vs Lambda, RDS vs DynamoDB)
5. THE Provisioner_Agent SHALL ask about user experience level with recommended services and adjust recommendations accordingly
6. THE Provisioner_Agent SHALL discuss logging options (CloudWatch Logs, CloudTrail, S3, etc.) and recommend best choices
7. THE Provisioner_Agent SHALL discuss monitoring options (CloudWatch metrics, alarms, dashboards, X-Ray) and recommend best choices
8. THE Provisioner_Agent SHALL discuss backup and disaster recovery options based on user requirements
9. THE Provisioner_Agent SHALL discuss high availability options (multi-AZ, multi-region, auto-scaling)
10. THE Provisioner_Agent SHALL discuss security options (encryption, network isolation, IAM roles, security groups)
11. THE Provisioner_Agent SHALL validate user choices against security best practices
12. IF user requests insecure configuration (e.g., open all ports to 0.0.0.0/0), THEN THE Provisioner_Agent SHALL refuse and explain why
13. IF user requests configuration that violates AWS best practices, THEN THE Provisioner_Agent SHALL warn and suggest alternatives
14. THE Provisioner_Agent SHALL use common sense to reject dangerous or nonsensical configurations
15. THE Provisioner_Agent SHALL incorporate agreed-upon choices into the generated CloudFormation_Template
16. THE Provisioner_Agent SHALL document all configuration choices and reasoning in Deployment_State

### Requirement 5: Template Validation Before Deployment

**User Story:** As a security engineer, I want templates validated before deployment, so that I catch errors and policy violations early.

#### Acceptance Criteria

1. WHEN a CloudFormation_Template is generated, THE System SHALL validate it using cfn-lint
2. IF cfn-lint detects errors, THEN THE System SHALL report validation errors and halt deployment
3. IF cfn-lint detects warnings, THEN THE System SHALL log warnings but continue deployment
4. WHEN a CloudFormation_Template is generated, THE System SHALL validate it using cfn-guard
5. IF cfn-guard detects policy violations, THEN THE System SHALL report violations and halt deployment
6. THE System SHALL validate templates before making any AWS API calls
7. THE System SHALL provide detailed error messages for validation failures

### Requirement 6: Stack Management Operations

**User Story:** As a deployment operator, I want to create, update, and delete CloudFormation stacks, so that I can manage infrastructure lifecycle.

#### Acceptance Criteria

1. THE System SHALL create CloudFormation stacks with generated templates
2. THE System SHALL update existing CloudFormation stacks when infrastructure changes
3. THE System SHALL delete CloudFormation stacks during cleanup operations
4. THE System SHALL poll stack status until operations complete
5. WHEN stack creation fails, THE System SHALL retrieve failure reasons from CloudFormation events
6. WHEN stack update fails, THE System SHALL automatically rollback to previous state
7. THE System SHALL wait for stack operations to reach terminal states before proceeding
8. THE System SHALL handle stack creation timeouts gracefully

### Requirement 7: Stack Output Extraction

**User Story:** As a deployment agent, I want to extract stack outputs, so that I can use provisioned resource identifiers in subsequent deployment steps.

#### Acceptance Criteria

1. WHEN a Stack reaches CREATE_COMPLETE status, THE System SHALL extract all stack outputs
2. THE System SHALL map stack outputs to Deployment_State infrastructure fields
3. THE System SHALL extract VPC ID from stack outputs
4. THE System SHALL extract subnet IDs from stack outputs
5. THE System SHALL extract security group IDs from stack outputs
6. THE System SHALL extract EC2 instance ID and IP addresses from stack outputs
7. WHEN RDS is provisioned, THE System SHALL extract database endpoint and credentials from stack outputs
8. WHEN ALB is provisioned, THE System SHALL extract load balancer DNS name and ARN from stack outputs
9. THE System SHALL store extracted outputs in Deployment_State for use by other agents

### Requirement 8: Maintain Existing Functionality

**User Story:** As a HiveMind user, I want all current deployment capabilities preserved, so that the migration is transparent to me.

#### Acceptance Criteria

1. THE System SHALL provision VPCs with public and private subnets as before
2. THE System SHALL provision EC2 instances with appropriate instance types as before
3. THE System SHALL provision RDS instances when databases are required as before
4. THE System SHALL provision Application Load Balancers for web services as before
5. THE System SHALL apply security group rules for SSH, HTTP, HTTPS, and application ports as before
6. THE System SHALL tag all resources with deployment_id as before
7. THE System SHALL track resource costs in Deployment_State as before
8. THE System SHALL support all tech stacks (Node.js, Python, Go, Java, etc.) as before

### Requirement 8: Maintain Existing Functionality

**User Story:** As a HiveMind user, I want all current deployment capabilities preserved, so that the migration is transparent to me.

#### Acceptance Criteria

1. THE System SHALL provision VPCs with public and private subnets as before
2. THE System SHALL provision EC2 instances with appropriate instance types as before
3. THE System SHALL provision RDS instances when databases are required as before
4. THE System SHALL provision Application Load Balancers for web services as before
5. THE System SHALL apply security group rules for SSH, HTTP, HTTPS, and application ports as before
6. THE System SHALL tag all resources with deployment_id as before
7. THE System SHALL track resource costs in Deployment_State as before
8. THE System SHALL support all tech stacks (Node.js, Python, Go, Java, etc.) as before

### Requirement 9: Stack Update Support for Blue-Green Deployments

**User Story:** As a deployment engineer, I want to update existing stacks, so that I can perform blue-green deployments without recreating infrastructure.

#### Acceptance Criteria

1. WHEN updating infrastructure, THE System SHALL use CloudFormation stack updates instead of recreation
2. THE System SHALL detect when a stack already exists for a deployment
3. WHEN a stack exists, THE System SHALL generate an updated template with changes
4. THE System SHALL use CloudFormation change sets to preview infrastructure changes
5. THE System SHALL execute change sets to apply infrastructure updates
6. IF stack update fails, THEN THE System SHALL rely on CloudFormation automatic rollback
7. THE System SHALL preserve resource identifiers during stack updates when possible

### Requirement 9: Stack Update Support for Blue-Green Deployments

**User Story:** As a deployment engineer, I want to update existing stacks, so that I can perform blue-green deployments without recreating infrastructure.

#### Acceptance Criteria

1. WHEN updating infrastructure, THE System SHALL use CloudFormation stack updates instead of recreation
2. THE System SHALL detect when a stack already exists for a deployment
3. WHEN a stack exists, THE System SHALL generate an updated template with changes
4. THE System SHALL use CloudFormation change sets to preview infrastructure changes
5. THE System SHALL execute change sets to apply infrastructure updates
6. IF stack update fails, THEN THE System SHALL rely on CloudFormation automatic rollback
7. THE System SHALL preserve resource identifiers during stack updates when possible

### Requirement 10: StackSet Support for Multi-Region and Multi-AZ Deployments

**User Story:** As a reliability engineer, I want to deploy infrastructure across multiple regions and availability zones using StackSets, so that I can achieve high availability and disaster recovery.

#### Acceptance Criteria

1. THE System SHALL support creating CloudFormation StackSets for multi-region deployments
2. WHEN high availability is required, THE System SHALL deploy Stack_Instances across multiple availability zones
3. WHEN disaster recovery is required, THE System SHALL deploy Stack_Instances across multiple AWS regions
4. THE System SHALL manage StackSet operations including create, update, and delete
5. THE System SHALL deploy all Stack_Instances within a StackSet as a coordinated operation
6. WHEN updating a StackSet, THE System SHALL update all Stack_Instances in a controlled manner
7. THE System SHALL support rolling updates across Stack_Instances to prevent downtime
8. THE System SHALL track StackSet operation status until all Stack_Instances reach terminal state
9. THE System SHALL extract outputs from all Stack_Instances in a StackSet
10. WHEN using StackSets, THE System SHALL enable blue-green deployments by updating Stack_Instances incrementally
11. THE System SHALL configure StackSet operation preferences for maximum availability during updates
12. THE System SHALL support deploying both single-stack and StackSet-based infrastructure based on requirements

### Requirement 10: StackSet Support for Multi-Region and Multi-AZ Deployments

**User Story:** As a reliability engineer, I want to deploy infrastructure across multiple regions and availability zones using StackSets, so that I can achieve high availability and disaster recovery.

#### Acceptance Criteria

1. THE System SHALL support creating CloudFormation StackSets for multi-region deployments
2. WHEN high availability is required, THE System SHALL deploy Stack_Instances across multiple availability zones
3. WHEN disaster recovery is required, THE System SHALL deploy Stack_Instances across multiple AWS regions
4. THE System SHALL manage StackSet operations including create, update, and delete
5. THE System SHALL deploy all Stack_Instances within a StackSet as a coordinated operation
6. WHEN updating a StackSet, THE System SHALL update all Stack_Instances in a controlled manner
7. THE System SHALL support rolling updates across Stack_Instances to prevent downtime
8. THE System SHALL track StackSet operation status until all Stack_Instances reach terminal state
9. THE System SHALL extract outputs from all Stack_Instances in a StackSet
10. WHEN using StackSets, THE System SHALL enable blue-green deployments by updating Stack_Instances incrementally
11. THE System SHALL configure StackSet operation preferences for maximum availability during updates
12. THE System SHALL support deploying both single-stack and StackSet-based infrastructure based on requirements

### Requirement 11: Error Handling and Rollback

**User Story:** As a system operator, I want proper error handling and rollback, so that failed deployments don't leave orphaned resources.

#### Acceptance Criteria

1. WHEN stack creation fails, THE System SHALL log CloudFormation failure events
2. WHEN stack creation fails, THE System SHALL mark deployment as FAILED in Deployment_State
3. THE System SHALL rely on CloudFormation automatic rollback for failed stack operations
4. THE System SHALL extract error messages from CloudFormation stack events
5. THE System SHALL provide actionable error messages to users
6. WHEN validation fails, THE System SHALL not create any AWS resources
7. THE System SHALL handle CloudFormation API throttling with exponential backoff
8. WHEN StackSet operations fail, THE System SHALL report which Stack_Instances failed and why
9. WHEN StackSet operations fail, THE System SHALL support partial rollback of failed Stack_Instances

### Requirement 11: Error Handling and Rollback

**User Story:** As a system operator, I want proper error handling and rollback, so that failed deployments don't leave orphaned resources.

#### Acceptance Criteria

1. WHEN stack creation fails, THE System SHALL log CloudFormation failure events
2. WHEN stack creation fails, THE System SHALL mark deployment as FAILED in Deployment_State
3. THE System SHALL rely on CloudFormation automatic rollback for failed stack operations
4. THE System SHALL extract error messages from CloudFormation stack events
5. THE System SHALL provide actionable error messages to users
6. WHEN validation fails, THE System SHALL not create any AWS resources
7. THE System SHALL handle CloudFormation API throttling with exponential backoff
8. WHEN StackSet operations fail, THE System SHALL report which Stack_Instances failed and why
9. WHEN StackSet operations fail, THE System SHALL support partial rollback of failed Stack_Instances

### Requirement 12: Resource Tracking and Cost Estimation

**User Story:** As a cost manager, I want resource tracking and cost estimates, so that I can monitor deployment expenses.

#### Acceptance Criteria

1. THE System SHALL track all CloudFormation stack resources in Deployment_State
2. THE System SHALL estimate monthly costs for provisioned resources
3. THE System SHALL track resource dependencies for proper teardown ordering
4. THE System SHALL store stack ARN in Deployment_State for future operations
5. THE System SHALL maintain resource metadata including creation timestamps
6. THE System SHALL calculate total deployment cost from individual resource costs
7. WHEN using StackSets, THE System SHALL aggregate costs across all Stack_Instances
8. WHEN using StackSets, THE System SHALL track resources in each Stack_Instance separately

### Requirement 12: Resource Tracking and Cost Estimation

**User Story:** As a cost manager, I want resource tracking and cost estimates, so that I can monitor deployment expenses.

#### Acceptance Criteria

1. THE System SHALL track all CloudFormation stack resources in Deployment_State
2. THE System SHALL estimate monthly costs for provisioned resources
3. THE System SHALL track resource dependencies for proper teardown ordering
4. THE System SHALL store stack ARN in Deployment_State for future operations
5. THE System SHALL maintain resource metadata including creation timestamps
6. THE System SHALL calculate total deployment cost from individual resource costs
7. WHEN using StackSets, THE System SHALL aggregate costs across all Stack_Instances
8. WHEN using StackSets, THE System SHALL track resources in each Stack_Instance separately

### Requirement 13: Backward Compatibility During Migration

**User Story:** As a HiveMind maintainer, I want backward compatibility during migration, so that existing deployments continue to work.

#### Acceptance Criteria

1. THE System SHALL support cleanup of resources created with old boto3 approach
2. THE System SHALL detect whether resources were created via CloudFormation or boto3
3. WHEN cleaning up boto3-created resources, THE System SHALL use direct boto3 deletion calls
4. WHEN cleaning up CloudFormation-created resources, THE System SHALL delete the stack
5. THE System SHALL store stack creation method in Deployment_State
6. THE System SHALL migrate existing deployments to CloudFormation stacks when updated

### Requirement 13: Backward Compatibility During Migration

**User Story:** As a HiveMind maintainer, I want backward compatibility during migration, so that existing deployments continue to work.

#### Acceptance Criteria

1. THE System SHALL support cleanup of resources created with old boto3 approach
2. THE System SHALL detect whether resources were created via CloudFormation or boto3
3. WHEN cleaning up boto3-created resources, THE System SHALL use direct boto3 deletion calls
4. WHEN cleaning up CloudFormation-created resources, THE System SHALL delete the stack
5. THE System SHALL store stack creation method in Deployment_State
6. THE System SHALL migrate existing deployments to CloudFormation stacks when updated

### Requirement 14: Template Serialization and Storage

**User Story:** As an infrastructure auditor, I want generated templates stored, so that I can review infrastructure definitions.

#### Acceptance Criteria

1. THE System SHALL serialize CloudFormation templates to YAML format
2. THE System SHALL store generated templates in deployment state directory
3. THE System SHALL name template files using deployment_id
4. THE System SHALL include template content in Deployment_State
5. THE System SHALL preserve template formatting for readability
