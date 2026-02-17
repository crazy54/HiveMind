# Implementation Plan: Interactive Deployment Configuration

## Phase 1: Core Configuration (MVP)

- [ ] 1. Create configuration schema
  - Create `src/schemas/user_config.py` with Pydantic models
  - Implement `DomainConfig`, `DatabaseConfig`, `ComputeConfig`, `SecurityConfig`
  - Implement `UserDeploymentConfig` with validators
  - Add `to_json_file()` and `from_json_file()` methods
  - _Requirements: 8.2, 8.3_

- [ ]* 1.1 Write property test for configuration round-trip
  - **Property 3: Configuration Persistence Round-Trip**
  - **Validates: Requirements 8.2, 8.3, 8.4**

- [ ] 2. Create interactive prompter
  - Create `src/utils/interactive.py`
  - Implement `InteractivePrompter` class
  - Implement `_prompt_domain()` method
  - Implement `_prompt_database()` method
  - Implement `_prompt_compute()` method
  - Implement `_prompt_security()` method
  - Implement helper methods: `_ask_text()`, `_ask_bool()`, `_ask_int()`, `_ask_choice()`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 2.1 Write property test for smart defaults
  - **Property 4: Smart Defaults Based on Analysis**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 3. Create cost estimator
  - Create `src/utils/cost_estimator.py`
  - Implement `CostEstimator` class with pricing data
  - Implement `estimate()` method
  - Calculate EC2, RDS, and data transfer costs
  - _Requirements: 5.1, 5.2_

- [ ]* 3.1 Write property test for cost calculation consistency
  - **Property 2: Cost Calculation Consistency**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 4. Update CLI with interactive flow
  - Update `src/cli.py` `deploy_command()`
  - Add analysis summary display
  - Add interactive prompter integration
  - Add cost estimation display
  - Add configuration summary display
  - Add confirmation prompt
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5. Checkpoint - Test basic interactive flow
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Enhanced Features

- [ ] 6. Add CLI flags for non-interactive mode
  - Add `--yes` flag to skip prompts
  - Add `--config <file>` flag to load configuration
  - Add `--save-config <file>` flag to save configuration
  - Update argument parser
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 6.1 Write property test for non-interactive mode
  - **Property 7: Non-Interactive Mode Consistency**
  - **Validates: Requirements 7.1, 7.2**

- [ ] 7. Add configuration validation
  - Implement port validation (1-65535)
  - Implement instance type validation
  - Implement retention days validation (1-35)
  - Add validation error handling
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for configuration validation
  - **Property 1: Configuration Validation**
  - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 8. Add budget validation
  - Add budget limit check in cost estimator
  - Display warning if costs exceed budget
  - Suggest cheaper alternatives
  - _Requirements: 5.3, 5.4_

- [ ]* 8.1 Write property test for budget validation
  - **Property 6: Budget Validation**
  - **Validates: Requirements 5.3, 5.4**

- [ ] 9. Checkpoint - Test enhanced features
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Smart Features

- [ ] 10. Implement smart defaults
  - Use detected port as default app port
  - Use detected database version as default
  - Suggest instance type based on traffic level
  - Default SSL to enabled when domain is provided
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Add environment-specific prompts
  - Skip Multi-AZ prompt for development
  - Skip WAF prompt for development
  - Adjust defaults based on environment
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 11.1 Write property test for environment-specific prompts
  - **Property 5: Environment-Specific Prompts**
  - **Validates: Requirements 12.1, 12.2**

- [ ] 12. Add gap filling logic
  - Identify missing required fields
  - Prompt for missing information
  - Use defaults for optional fields
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 12.1 Write property test for configuration completeness
  - **Property 8: Configuration Completeness**
  - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ] 13. Checkpoint - Test smart features
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Agent Integration

- [ ] 14. Update Conductor agent
  - Add `user_config` parameter to `deploy()` method
  - Pass configuration to all agents
  - Update state schema to include user config
  - _Requirements: 9.1_

- [ ] 15. Update Provisioner agent
  - Use `config.compute.instance_type` for EC2
  - Use `config.database.*` for RDS configuration
  - Use `config.domain.domain` for Route53
  - Log which settings are being applied
  - _Requirements: 9.2, 9.5_

- [ ] 16. Update Deployer agent
  - Use `config.domain.app_port` for app configuration
  - Use `config.domain.expose_port` for load balancer
  - Use `config.domain.enable_ssl` for HTTPS setup
  - Log which settings are being applied
  - _Requirements: 9.3, 9.5_

- [ ] 17. Update Sheriff agent
  - Use `config.security.auto_updates` for unattended-upgrades
  - Use `config.security.restrict_ssh` for security groups
  - Use `config.security.enable_waf` for WAF setup
  - Log which settings are being applied
  - _Requirements: 9.4, 9.5_

- [ ] 18. Checkpoint - Test agent integration
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Polish and Testing

- [ ] 19. Add color-coded output to prompts
  - Use cyan for section headers
  - Use light blue for defaults
  - Use yellow for warnings
  - Use red for errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 20. Create example configurations
  - Create `examples/config-development.json`
  - Create `examples/config-staging.json`
  - Create `examples/config-production.json`
  - Add documentation for each example

- [ ] 21. Update documentation
  - Update `README.md` with interactive deployment info
  - Update `CLI_GUIDE.md` with new flags and examples
  - Create `INTERACTIVE_DEPLOYMENT_GUIDE.md` with detailed usage
  - Add examples and screenshots

- [ ]* 22. Write unit tests
  - Test `InteractivePrompter` methods
  - Test `CostEstimator.estimate()`
  - Test configuration validation
  - Test JSON save/load
  - Test CLI flag handling
  - _Requirements: All_

- [ ]* 23. Write integration tests
  - Test full flow: analyze → prompt → validate → estimate → deploy
  - Test with real repository analysis results
  - Test with config files
  - Test with --yes flag
  - Test with --what-if mode
  - _Requirements: All_

- [ ] 24. Final checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.
