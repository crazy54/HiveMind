# Implementation Plan: CloudFormation Migration

## Overview

This implementation plan migrates HiveMind from direct boto3 API calls to CloudFormation-based Infrastructure as Code. The migration introduces template generation, validation with cfn-lint and cfn-guard, stack management, StackSet support for multi-region deployments, and an interactive CLI workflow where agents collaborate with users to design optimal infrastructure.

The implementation maintains backward compatibility with existing deployments while adding declarative infrastructure management capabilities.

## Tasks

- [x] 1. Set up CloudFormation validation tools and dependencies
  - Install cfn-lint and cfn-guard as project dependencies
  - Add validation tool configuration files
  - Create helper scripts for running validation
  - _Requirements: 4.1, 4.4_

- [x] 2. Implement CloudFormation Template Generator
  - [x] 2.1 Create CloudFormationTemplateGenerator class with base template structure
    - Implement __init__ with template dictionary (AWSTemplateFormatVersion, Description, Parameters, Resources, Outputs)
    - Implement to_yaml() method for YAML serialization
    - Implement save() method for file persistence
    - _Requirements: 2.1, 2.3, 2.4, 14.1, 14.2_
  
  - [x] 2.2 Implement VPC resource generation
    - Add add_vpc() method to create VPC, subnets, internet gateway, route tables
    - Generate CloudFormation parameters for CIDR blocks
    - Define outputs for VPC ID and subnet IDs
    - Apply DependsOn attributes for resource ordering
    - _Requirements: 2.2, 2.5, 7.3, 7.4_
  
  - [x] 2.3 Implement security group resource generation
    - Add add_security_group() method with ingress/egress rules
    - Support SSH, HTTP, HTTPS, and custom application ports
    - Generate parameters for configurable ports
    - Define outputs for security group IDs
    - _Requirements: 2.2, 7.5, 8.5_
  
  - [x] 2.4 Implement EC2 instance resource generation
    - Add add_ec2_instance() method with instance type, AMI, subnet, security group
    - Generate parameters for instance configuration
    - Define outputs for instance ID and IP addresses
    - Include user data for instance initialization
    - _Requirements: 2.2, 7.6, 8.2_
  
  - [x] 2.5 Implement RDS instance resource generation
    - Add add_rds_instance() method with DB type, subnet group, security group
    - Generate parameters for database configuration
    - Define outputs for database endpoint and port
    - Include secret management for credentials
    - _Requirements: 2.2, 7.7, 8.3_
  
  - [x] 2.6 Implement Application Load Balancer resource generation
    - Add add_load_balancer() method with target groups, listeners, health checks
    - Generate parameters for ALB configuration
    - Define outputs for ALB DNS name and ARN
    - _Requirements: 2.2, 7.8, 8.4_
  
  - [x] 2.7 Implement resource tagging
    - Apply deployment_id tags to all resources
    - Support custom tags via parameters
    - _Requirements: 2.6, 8.6_
  
  - [x] 2.8 Write property test for template generation
    - **Property 1: CloudFormation Template Generation**
    - **Validates: Requirements 2.1**
    - Test that generated templates contain required keys (AWSTemplateFormatVersion, Resources)
    - Use Hypothesis to generate random deployment configurations

- [x] 3. Implement Template Validation Tools
  - [x] 3.1 Create cfn-lint validation integration
    - Implement validate_with_cfn_lint() function
    - Execute cfn-lint subprocess with template file
    - Parse validation results (errors, warnings)
    - Return structured validation results
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 3.2 Create cfn-guard validation integration
    - Implement validate_with_cfn_guard() function
    - Execute cfn-guard subprocess with template and rules
    - Parse policy compliance results
    - Return structured compliance results
    - _Requirements: 4.4, 4.5_
  
  - [x] 3.3 Implement security best practices validation
    - Implement validate_security_best_practices() function
    - Check for open security group rules (0.0.0.0/0)
    - Check for unencrypted resources
    - Check for public database access
    - Return list of security warnings
    - _Requirements: 3.11, 3.12, 3.13_
  
  - [x] 3.4 Create TemplateValidationError exception class
    - Define custom exception for validation failures
    - Include validation details in exception
    - _Requirements: 4.2, 4.5, 10.6_
  
  - [x] 3.5 Write property test for validation invocation
    - **Property 2: Template Validation Invocation**
    - **Validates: Requirements 4.1**
    - Test that validation is always invoked for generated templates
  
  - [x] 3.6 Write property test for validation failure prevention
    - **Property 3: Validation Failure Prevents Deployment**
    - **Validates: Requirements 4.2**
    - Test that templates with errors do not proceed to deployment

- [x] 4. Checkpoint - Ensure template generation and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Stack Management Tools
  - [x] 5.1 Create StackManager class with CloudFormation client
    - Implement __init__ with boto3 CloudFormation client
    - Support region configuration
    - _Requirements: 5.1_
  
  - [x] 5.2 Implement stack creation
    - Implement create_stack() method
    - Accept stack name, template body, parameters, tags
    - Call CloudFormation CreateStack API
    - Return stack ID
    - _Requirements: 5.1, 5.8_
  
  - [x] 5.3 Implement stack update
    - Implement update_stack() method
    - Accept stack name, updated template, parameters
    - Call CloudFormation UpdateStack API
    - Return stack ID
    - _Requirements: 8.1, 8.3_
  
  - [x] 5.4 Implement stack deletion
    - Implement delete_stack() method
    - Call CloudFormation DeleteStack API
    - _Requirements: 5.3_
  
  - [x] 5.5 Implement stack status polling
    - Implement wait_for_stack() method
    - Poll DescribeStacks API until terminal state
    - Support configurable timeout
    - Return final stack description
    - _Requirements: 5.4, 5.7_
  
  - [x] 5.6 Implement stack output extraction
    - Implement get_stack_outputs() method
    - Extract outputs from stack description
    - Return dictionary mapping output keys to values
    - _Requirements: 6.1, 6.2_
  
  - [x] 5.7 Implement stack event retrieval
    - Implement get_stack_events() method
    - Call DescribeStackEvents API
    - Return list of recent events
    - _Requirements: 10.1, 10.4_
  
  - [x] 5.8 Implement real-time event streaming
    - Implement stream_stack_events() method
    - Poll events during stack operations
    - Call callback function with each new event
    - _Requirements: 3.10, 3.11_
  
  - [x] 5.9 Write property test for stack polling completeness
    - **Property 4: Stack Status Polling Completeness**
    - **Validates: Requirements 5.4**
    - Test that polling continues until terminal state
  
  - [x] 5.10 Write property test for output extraction completeness
    - **Property 5: Stack Output Extraction Completeness**
    - **Validates: Requirements 6.1**
    - Test that all stack outputs are extracted
  
  - [x] 5.11 Write unit tests for stack management
    - Test stack creation with sample template
    - Test stack update with changed template
    - Test stack deletion
    - Test error handling for failed stacks

- [x] 6. Implement StackSet Management Tools
  - [x] 6.1 Create StackSetManager class with CloudFormation client
    - Implement __init__ with boto3 CloudFormation client
    - Support region configuration
    - _Requirements: 9.1_
  
  - [x] 6.2 Implement StackSet creation
    - Implement create_stackset() method
    - Accept StackSet name, template body, parameters, tags
    - Call CloudFormation CreateStackSet API
    - Return StackSet ID
    - _Requirements: 9.1_
  
  - [x] 6.3 Implement stack instance deployment
    - Implement create_stack_instances() method
    - Accept StackSet name, accounts, regions, operation preferences
    - Call CloudFormation CreateStackInstances API
    - Return operation ID
    - _Requirements: 9.2, 9.3, 9.5_
  
  - [x] 6.4 Implement StackSet update
    - Implement update_stackset() method
    - Accept StackSet name, updated template, parameters, operation preferences
    - Call CloudFormation UpdateStackSet API
    - Support rolling updates
    - Return operation ID
    - _Requirements: 9.6, 9.7, 9.11_
  
  - [x] 6.5 Implement stack instance deletion
    - Implement delete_stack_instances() method
    - Accept StackSet name, accounts, regions
    - Call CloudFormation DeleteStackInstances API
    - Return operation ID
    - _Requirements: 9.4_
  
  - [x] 6.6 Implement StackSet deletion
    - Implement delete_stackset() method
    - Call CloudFormation DeleteStackSet API (after all instances removed)
    - _Requirements: 9.4_
  
  - [x] 6.7 Implement StackSet operation polling
    - Implement wait_for_stackset_operation() method
    - Poll DescribeStackSetOperation API until complete
    - Support configurable timeout
    - Return operation result
    - _Requirements: 9.8_
  
  - [x] 6.8 Implement stack instance output extraction
    - Implement get_stackset_instance_outputs() method
    - Extract outputs from specific stack instance
    - Return dictionary mapping output keys to values
    - _Requirements: 9.9, 11.7_
  
  - [x] 6.9 Write unit tests for StackSet management
    - Test StackSet creation
    - Test stack instance deployment across regions
    - Test StackSet updates with rolling preferences
    - Test StackSet deletion
    - Test operation status polling
    - Test error handling for failed operations

- [ ] 7. Checkpoint - Ensure stack management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 8. Implement Interactive CLI Components
  - [x] 8.1 Create ASCII logo display function
    - Implement display_ascii_logo() function
    - Display HiveMind ASCII art and welcome message
    - _Requirements: 3.2_
  
  - [x] 8.2 Create agent presentation function
    - Implement present_agent() function
    - Display agent name and role in terminal
    - _Requirements: 3.4_
  
  - [x] 8.3 Create user question function
    - Implement ask_user_question() function
    - Support optional answer choices
    - Support default values
    - Return user's response
    - _Requirements: 3.5_
  
  - [x] 8.4 Create service comparison display function
    - Implement display_service_comparison() function
    - Display table of AWS services with pros, cons, cost
    - _Requirements: 3.3_
  
  - [x] 8.5 Create choice confirmation function
    - Implement confirm_choice() function
    - Ask yes/no questions
    - Return boolean response
    - _Requirements: 3.15_
  
  - [x] 8.6 Create validation results display function
    - Implement display_validation_results() function
    - Display cfn-lint and cfn-guard results
    - Format errors and warnings clearly
    - _Requirements: 3.8_
  
  - [x] 8.7 Create CloudFormation event streaming function
    - Implement stream_cfn_events_to_terminal() function
    - Use CFN-MON code for real-time event display
    - Stream events during stack operations
    - _Requirements: 3.10, 3.11_
  
  - [x] 8.8 Create deployment summary display function
    - Implement display_deployment_summary() function
    - Display all CloudFormation parameters and resources
    - Show stack outputs and access URLs
    - _Requirements: 3.12, 3.15_
  
  - [x] 8.9 Create interactive infrastructure Q&A function
    - Implement interactive_infrastructure_qa() function
    - Allow user to ask questions about deployed infrastructure
    - Provide explanations and access instructions
    - _Requirements: 3.13, 3.14_
  
  - [x] 8.10 Write unit tests for CLI components
    - Test ASCII logo display
    - Test agent presentation
    - Test user question flow
    - Test validation result display
    - Test deployment summary display

- [x] 9. Update Provisioner Agent for CloudFormation
  - [x] 9.1 Update Provisioner Agent system prompt
    - Replace boto3-focused prompt with CloudFormation-first approach
    - Add interactive planning instructions
    - Add service recommendation guidance
    - Add security validation requirements
    - _Requirements: 1.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_
  
  - [x] 9.2 Replace boto3 infrastructure tools with CloudFormation tools
    - Remove direct boto3 infrastructure creation tools
    - Add generate_cloudformation_template tool
    - Add validate_template tool
    - Add create_stack tool
    - Add update_stack tool
    - Add delete_stack tool
    - Add create_stackset tool
    - Add update_stackset tool
    - Add delete_stackset tool
    - Add get_stack_outputs tool
    - _Requirements: 1.1, 1.2_
  
  - [x] 9.3 Implement interactive template configuration workflow
    - Agent asks about user goals (security, speed, cost, HA)
    - Agent recommends services based on goals
    - Agent explains trade-offs between options
    - Agent discusses logging, monitoring, backup, HA, security
    - Agent validates choices against security best practices
    - Agent refuses dangerous configurations
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_
  
  - [x] 9.4 Write integration tests for Provisioner Agent
    - Test interactive planning workflow
    - Test template generation from user dialog
    - Test validation integration
    - Test stack deployment workflow

- [x] 10. Implement Data Models
  - [x] 10.1 Create CloudFormation template data models
    - Implement CFNParameter model
    - Implement CFNResource model
    - Implement CFNOutput model
    - Implement CloudFormationTemplate model with to_yaml() and validate_structure()
    - _Requirements: 2.1, 2.3, 2.4, 14.1_
  
  - [x] 10.2 Create stack tracking data models
    - Implement StackInfo model
    - Implement StackSetInfo model
    - _Requirements: 11.1, 11.4_
  
  - [x] 10.3 Update DeploymentState model
    - Add stack_info field
    - Add stackset_info field
    - Add template_path field
    - Add creation_method field (cloudformation or boto3)
    - Add validation_results field
    - Implement is_cloudformation_deployment() method
    - Implement get_stack_outputs() method
    - _Requirements: 6.9, 11.4, 11.5, 12.5_
  
  - [x] 10.4 Write property test for output mapping round-trip
    - **Property 6: Output to State Mapping**
    - **Validates: Requirements 6.2**
    - Test that mapping outputs to state and back preserves values
  
  - [x] 10.5 Write property test for template serialization round-trip
    - **Property 11: Template Serialization Round-Trip**
    - **Validates: Requirements 14.1**
    - Test that serializing to YAML and deserializing preserves structure

- [x] 11. Implement CLI Entry Point
  - [x] 11.1 Update CLI argument parsing
    - Add --software/-s/-S flags for repository URLs
    - Support multiple repository URLs
    - Parse URLs before starting interactive dialog
    - _Requirements: 3.1, 3.3, 3.16, 3.17_
  
  - [x] 11.2 Implement CLI workflow orchestration
    - Display ASCII logo on startup
    - Present Provisioner Agent
    - Start interactive planning dialog
    - Generate CloudFormation template incrementally
    - Validate template with cfn-lint and cfn-guard
    - Display validation results and work with user to correct errors
    - Enter provisioning mode when template approved
    - Stream CloudFormation events during deployment
    - Display deployment summary with all resources
    - Enable interactive Q&A about deployed infrastructure
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_
  
  - [x] 11.3 Write integration test for end-to-end CLI flow
    - Test command-line argument parsing
    - Test interactive workflow from start to finish
    - Test validation and deployment

- [x] 12. Checkpoint - Ensure CLI and agent integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement Error Handling
  - [x] 13.1 Implement validation error handling
    - Handle cfn-lint errors with detailed messages
    - Handle cfn-guard policy violations with remediation guidance
    - Handle security validation errors with explanations
    - _Requirements: 10.5, 10.6_
  
  - [x] 13.2 Implement stack operation error handling
    - Extract failure reasons from CloudFormation events
    - Display actionable error messages
    - Mark deployment as FAILED in state
    - Rely on CloudFormation automatic rollback
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 13.3 Implement StackSet operation error handling
    - Report which stack instances failed and why
    - Support partial rollback of failed instances
    - _Requirements: 10.8, 10.9_
  
  - [x] 13.4 Implement API throttling handling
    - Implement exponential backoff for throttled requests
    - Start with 1 second delay, double on each retry
    - Maximum 5 retries before failing
    - Log throttling events
    - _Requirements: 10.7_
  
  - [x] 13.5 Implement timeout handling
    - Set default timeouts (30 min for stacks, 60 min for StackSets)
    - Allow configurable timeouts
    - Continue polling in background if timeout reached
    - Report timeout with current status
    - _Requirements: 5.8_
  
  - [x] 13.6 Write property test for automatic rollback preservation
    - **Property 8: Automatic Rollback Preservation**
    - **Validates: Requirements 10.3**
    - Test that system doesn't interfere with CloudFormation rollback
  
  - [x] 13.7 Write unit tests for error handling
    - Test validation error handling
    - Test stack failure handling
    - Test StackSet failure handling
    - Test API throttling with exponential backoff
    - Test timeout handling

- [-] 14. Implement Resource Tracking and Cost Estimation
  - [x] 14.1 Implement stack resource tracking
    - Track all CloudFormation stack resources in DeploymentState
    - Store stack ARN for future operations
    - Maintain resource metadata (creation timestamps)
    - Track resource dependencies for teardown ordering
    - _Requirements: 11.1, 11.3, 11.4, 11.5_
  
  - [x] 14.2 Implement cost estimation
    - Estimate monthly costs for provisioned resources
    - Calculate total deployment cost from individual resource costs
    - Aggregate costs across StackSet instances
    - Track resources in each stack instance separately
    - _Requirements: 11.2, 11.6, 11.7, 11.8, 8.7_
  
  - [x] 14.3 Write property test for cost calculation consistency
    - **Property 9: Cost Calculation Consistency**
    - **Validates: Requirements 11.6**
    - Test that sum of individual resource costs equals total deployment cost
  
  - [x] 14.4 Write unit tests for resource tracking
    - Test stack resource tracking
    - Test cost estimation
    - Test StackSet cost aggregation

- [x] 15. Implement Backward Compatibility
  - [x] 15.1 Implement creation method detection
    - Detect whether resources were created via CloudFormation or boto3
    - Store creation method in DeploymentState
    - _Requirements: 12.2, 12.5_
  
  - [x] 15.2 Implement hybrid cleanup support
    - Support cleanup of boto3-created resources
    - Support cleanup of CloudFormation-created resources
    - Use direct boto3 deletion for boto3-created resources
    - Use stack deletion for CloudFormation-created resources
    - _Requirements: 12.1, 12.3, 12.4_
  
  - [x] 15.3 Implement migration support
    - Migrate existing deployments to CloudFormation stacks when updated
    - _Requirements: 12.6_
  
  - [x] 15.4 Update cleanup tools
    - Refactor cleanup_tools.py to use stack deletion
    - Keep boto3 cleanup as fallback for legacy deployments
    - Add manual cleanup as last resort with logging
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 15.5 Write property test for creation method detection
    - **Property 10: Creation Method Detection**
    - **Validates: Requirements 12.2**
    - Test that system correctly identifies CloudFormation vs boto3 resources
  
  - [x] 15.6 Write unit tests for backward compatibility
    - Test boto3 resource cleanup
    - Test CloudFormation resource cleanup
    - Test creation method detection
    - Test migration to CloudFormation

- [x] 16. Implement Change Set Support
  - [x] 16.1 Implement change set creation
    - Create CloudFormation change sets for stack updates
    - Preview infrastructure changes before applying
    - _Requirements: 8.4_
  
  - [x] 16.2 Implement change set execution
    - Execute change sets to apply updates
    - _Requirements: 8.5_
  
  - [x] 16.3 Implement change set display
    - Display change set details to user
    - Show what will be added, modified, or removed
    - _Requirements: 8.4_
  
  - [x] 16.4 Write property test for change set creation
    - **Property 7: Change Set Creation Before Updates**
    - **Validates: Requirements 8.4**
    - Test that change sets are created before stack updates
  
  - [x] 16.5 Write unit tests for change set support
    - Test change set creation
    - Test change set execution
    - Test change set display

- [-] 17. Final Integration and Testing
  - [x] 17.1 Run full test suite
    - Run all unit tests
    - Run all property tests with 100 iterations
    - Run all integration tests
    - _Requirements: All_
  
  - [x] 17.2 Verify all existing tests still pass
    - Ensure 52 existing tests pass with CloudFormation-based infrastructure
    - Verify ALB integration tests work with CloudFormation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 17.3 Test end-to-end deployment scenarios
    - Test simple web application deployment
    - Test database-backed application deployment
    - Test multi-region deployment with StackSets
    - Test stack updates and blue-green deployments
    - Test cleanup and resource deletion
    - _Requirements: All_
  
  - [x] 17.4 Verify zero regression in functionality
    - All infrastructure types work (VPC, EC2, RDS, ALB, Security Groups)
    - All tech stacks supported (Node.js, Python, Go, Java)
    - Resource tagging works
    - Cost tracking works
    - Deployment state tracking works
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 18. Final checkpoint - Ensure all tests pass and migration is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100 iterations minimum
- Unit tests validate specific examples and edge cases
- The migration maintains backward compatibility with existing boto3-based deployments
- All infrastructure MUST be deployed via CloudFormation stacks (no direct boto3 calls)
- Templates MUST be validated with cfn-lint and cfn-guard before deployment
- Interactive CLI workflow enables collaborative infrastructure design with users
