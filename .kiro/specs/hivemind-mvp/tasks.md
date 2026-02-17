# Implementation Plan: HiveMind Complete MVP

## Phase 1: Fix Critical Issues (BLOCKING)

- [x] 1. Fix Randy Recon timeout issue
  - Debug why Randy Recon times out during repository analysis
  - Increase timeout configuration in agent creation
  - Add streaming responses to show progress
  - Implement retry logic with exponential backoff
  - Test with real repositories (small, medium, large)
  - _Requirements: 1.1, 1.2_

- [x] 2. Fix Strands SDK integration across all agents
  - Update `strands_randy.py` (Randy Recon) to use function call syntax
  - Update `strands_chris.py` (Chris Compiler) to use function call syntax
  - Update `strands_peter.py` (Peter Provisioner) to use function call syntax
  - Update `strands_dan.py` (Dan the Deployer) to use function call syntax
  - Update `strands_shawn.py` (Shawn the Sheriff) to use function call syntax
  - Remove all `.run()` method calls
  - Test each agent individually
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 3. Test repository cloning workflow
  - Verify repos clone to `analyzed_repos/` directory
  - Test with various repository sizes
  - Handle clone failures gracefully with error messages
  - Clean up old cloned repos after analysis
  - _Requirements: 1.1_

- [x] 4. Checkpoint - Verify agents work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4.1 Test new Workflow-based Cornelius the Conductor
  - Test `WorkflowConductor` (Cornelius) with sample repository
  - Verify automatic retry logic works
  - Test pause/resume functionality
  - Compare performance with old conductor
  - Validate workflow status tracking
  - Update CLI to use new implementation if successful
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 2: Real AWS Integration 🔴 CRITICAL

- [x] 5. Enhance DeploymentState schema
  - Add `ResourceInfo` model to `src/schemas/deployment.py`
  - Add `VerificationResult` model
  - Add `MonitoringConfig` model
  - Add new status values (VERIFYING, MONITORING_SETUP, DESTROYING, etc.)
  - Add `add_resource()` method
  - Add `get_total_cost()` method
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.1 Write property test for state persistence
  - **Property 1: Deployment State Persistence**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 6. Update Peter Provisioner for real AWS integration
  - Modify `strands_peter.py` (Peter Provisioner) to actually create VPC with boto3
  - Create public and private subnets
  - Create internet gateway and route tables
  - Launch EC2 instances with user-specified configuration
  - Create RDS databases when required
  - Configure security groups with least privilege
  - Tag all resources with DeploymentId
  - Return real resource IDs and endpoints
  - Add resource tracking with cost estimation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.1, 12.2, 12.3_

- [x] 7. Update Dan the Deployer for real deployment
  - Modify `strands_dan.py` (Dan the Deployer) to actually SSH to EC2 instances
  - Install runtime dependencies (Node.js, Python, system packages)
  - Copy build artifacts to instance
  - Configure environment variables including database connection strings
  - Start application service using systemd
  - Verify application is responding on expected port
  - Already implemented with paramiko - verified with tests
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8. Implement error recovery and rollback in Cornelius the Conductor
  - Add `_handle_failure()` method to Cornelius the Conductor
  - Add `_rollback()` method to Cornelius the Conductor
  - Detect failures at each agent stage
  - Automatically trigger cleanup on failure
  - Save state for retry capability
  - Provide clear error messages with remediation steps
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8.1 Write property test for resource cleanup on failure
  - **Property 2: Resource Cleanup on Failure**
  - **Validates: Requirements 2.1, 2.4**

- [ ] 8.2 Write property test for rollback completeness
  - **Property 7: Rollback Completeness**
  - **Validates: Requirements 2.1, 2.5**

- [ ] 9. Checkpoint - Test real AWS integration
  - Ensure all tests pass, ask the user if questions arise.


## Phase 3: Implement New Agents 🟠 Incomplete - Not Critical

- [ ] 10. Create Overwatch (Verification Agent)
  - Create `src/agents/strands_overwatch.py`
  - Implement `test_http_endpoint()` tool
  - Implement `test_database_connection()` tool for PostgreSQL and MySQL
  - Implement `test_port_accessibility()` tool
  - Implement `validate_ssl_certificate()` tool
  - Create agent with verification system prompt
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10.1 Write property test for verification completeness
  - **Property 3: Verification Completeness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 11. Create The All-Seeing Eye (Monitoring Agent)
  - Create `src/agents/strands_monitor.py` (The All-Seeing Eye)
  - Implement `setup_cloudwatch_logging()` tool
  - Implement `get_recent_logs()` tool
  - Implement `get_metrics()` tool for CPU, memory, disk, network
  - Implement `detect_errors()` tool
  - Implement `calculate_costs()` tool using AWS Cost Explorer
  - Create agent with monitoring system prompt
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11.1 Write property test for monitoring setup idempotency
  - **Property 6: Monitoring Setup Idempotency**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 12. Create Jerry the Janitor (Cleanup Agent)
  - Create `src/agents/strands_jerry.py` (Jerry the Janitor)
  - Implement `discover_resources()` tool to find resources by tag
  - Implement `calculate_cost_savings()` tool
  - Implement `create_database_backup()` tool for RDS snapshots
  - Implement `delete_resources()` tool with dependency-aware deletion
  - Implement `verify_cleanup()` tool
  - Create agent with cleanup system prompt
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12.1 Write property test for dependency-ordered deletion
  - **Property 5: Dependency-Ordered Deletion**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 12.2 Write property test for cost calculation accuracy
  - **Property 4: Cost Calculation Accuracy**
  - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ] 13. Checkpoint - Test new agents
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Integrate New Agents into Cornelius the Conductor 🟠 Incomplete - Not Critical

- [ ] 14. Update Cornelius the Conductor to use new agents
  - Import Overwatch, The All-Seeing Eye, and Jerry the Janitor in `strands_conductor.py`
  - Add `_run_verify()` method to Cornelius the Conductor
  - Add `_run_monitor_setup()` method to Cornelius the Conductor
  - Integrate Overwatch after Shawn the Sheriff in deploy workflow
  - Integrate The All-Seeing Eye after Overwatch in deploy workflow
  - Update deployment status enum usage
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Implement update workflow in Cornelius the Conductor
  - Add `update()` method to Cornelius the Conductor
  - Implement blue-green deployment logic
  - Build new version of application
  - Create new EC2 instance
  - Deploy to new instance
  - Run health checks with Overwatch
  - Switch load balancer to new instance
  - Terminate old instance
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16. Implement destroy workflow in Cornelius the Conductor
  - Add `destroy()` method to Cornelius the Conductor
  - Load deployment state
  - Use Jerry the Janitor to discover resources
  - Calculate and display cost savings
  - Confirm with user
  - Delete resources in dependency order
  - Verify complete cleanup
  - Update state to DESTROYED
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 17. Checkpoint - Test Cornelius the Conductor integration
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: CLI Enhancements 🟠 Incomplete - Not Critical

- [ ] 18. Enhance deploy command
  - Update `src/cli.py` deploy command
  - Add integration with Overwatch and The All-Seeing Eye
  - Display verification results after deployment
  - Show monitoring setup confirmation
  - Update success message with new commands
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 19. Enhance status command
  - Add `--show-logs` flag to display recent logs
  - Add `--show-metrics` flag to display metrics
  - Add `--show-costs` flag to display costs
  - Use The All-Seeing Eye to retrieve logs and metrics
  - Display verification status
  - Show resource health
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 20. Implement update command
  - Create `update` command in CLI
  - Accept deployment_id and optional version
  - Call Cornelius the Conductor's update()
  - Display update progress
  - Show success/failure with details
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21. Implement destroy command
  - Create `destroy` command in CLI
  - Accept deployment_id
  - Load deployment state
  - Display resources to be deleted
  - Calculate and show cost savings
  - Confirm with user (unless --yes flag)
  - Call Cornelius the Conductor's destroy()
  - Display success with cost savings
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 22. Checkpoint - Test CLI commands
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Deployment Reports ⚠️ Warning - Not Ranked

- [ ] 23. Create deployment report generator
  - Create `src/utils/report_generator.py`
  - Implement `DeploymentReportGenerator` class
  - Implement `generate_report()` method
  - Implement `_generate_timeline()` method
  - Implement `_generate_resource_list()` method
  - Implement `_generate_config_summary()` method
  - Implement `_generate_verification_summary()` method
  - Implement `_generate_access_info()` method
  - Implement `_generate_cost_breakdown()` method
  - Implement `_generate_next_steps()` method
  - Implement `_generate_troubleshooting()` method
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 23.1 Write property test for report completeness
  - **Property 8: Deployment Report Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 24. Integrate report generation into CLI
  - Add `--report` flag to status command
  - Generate and display report after successful deployment
  - Save report to `deployments/<id>/report.txt`
  - Add command to regenerate report: `hivemind report <deployment-id>`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 25. Checkpoint - Test report generation
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Error Handling and Logging 🔴 CRITICAL

- [ ] 26. Implement comprehensive error handling
  - Add error handling for AWS API errors
  - Add error handling for SSH connection failures
  - Add error handling for build failures
  - Add error handling for verification failures
  - Provide actionable error messages
  - Suggest remediation steps for common errors
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 27. Enhance logging system
  - Add structured logging with timestamps
  - Log all agent actions
  - Save logs to `deployments/<id>/logs/`
  - Add log levels (info, warning, error)
  - Implement verbose mode for detailed logs
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 28. Checkpoint - Test error handling
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Testing 🟠 Incomplete - Not Critical

- [ ] 29. Write unit tests for new agents
  - Test Overwatch tools
  - Test The All-Seeing Eye tools
  - Test Jerry the Janitor tools
  - Test Cornelius the Conductor methods
  - Test report generator
  - _Requirements: All_

- [ ] 30. Write integration tests
  - Test end-to-end deployment workflow
  - Test error recovery and rollback
  - Test update workflow
  - Test destroy workflow
  - Test with real AWS resources (use test account)
  - _Requirements: All_

- [ ] 31. Write property-based tests
  - Implement all 8 correctness properties
  - Use Hypothesis for property testing
  - Test with random inputs
  - Verify properties hold across all executions
  - _Requirements: All_

- [ ] 32. Checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Documentation ⚠️ Warning - Not Ranked

- [ ] 33. Update README
  - Document all 8 agents (including new ones)
  - Update architecture diagram
  - Add examples for all commands
  - Document What-If mode
  - Add troubleshooting section
  - _Requirements: All_

- [ ] 34. Update CLI_GUIDE
  - Document all CLI commands
  - Add examples for deploy, status, update, destroy
  - Document all flags and options
  - Add common workflows
  - _Requirements: All_

- [ ] 35. Update ARCHITECTURE
  - Document new agents (Verify, Monitor, Cleanup)
  - Update workflow diagrams
  - Document error recovery and rollback
  - Document update and destroy workflows
  - _Requirements: All_

- [ ] 36. Create deployment examples
  - Create example for Node.js app
  - Create example for Python app
  - Create example with PostgreSQL
  - Create example with Redis
  - Document expected outputs
  - _Requirements: All_

- [ ] 37. Final checkpoint - Documentation complete
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Manual Testing and Polish 🟠 Incomplete - Not Critical

- [ ] 38. Manual testing with real applications
  - Deploy a Node.js application
  - Deploy a Python application
  - Deploy with PostgreSQL database
  - Deploy with Redis
  - Test What-If mode
  - Test interactive configuration
  - Test --yes flag
  - Test --config file
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 39. Test error scenarios
  - Test deployment failure at each stage
  - Test rollback functionality
  - Test with invalid AWS credentials
  - Test with missing IAM permissions
  - Test with invalid repository URL
  - Verify error messages are clear
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 40. Test update and destroy workflows
  - Deploy application
  - Update to new version
  - Verify zero downtime
  - Destroy deployment
  - Verify all resources deleted
  - Verify cost savings calculation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 41. Performance testing
  - Measure deployment times
  - Verify under 15 minutes for simple apps
  - Verify under 25 minutes with database
  - Optimize slow operations
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 42. Final checkpoint - MVP complete
  - Ensure all tests pass, ask the user if questions arise.

