# Requirements Document: Interactive Deployment Configuration

## Introduction

This feature adds interactive configuration to HiveMind deployments. Instead of making assumptions about user preferences, the system will analyze the repository first, then ask the user for their specific requirements (domain, ports, database preferences, etc.), and finally create a customized deployment plan based on both the analysis and user input.

## Glossary

- **HiveMind System**: The multi-agent deployment system
- **Recon Agent**: Agent that analyzes repository documentation
- **Interactive Prompter**: Component that asks users configuration questions
- **User Configuration**: User's deployment preferences (domain, ports, resources, etc.)
- **Deployment Plan**: Final plan combining analysis results and user preferences
- **What-If Mode**: Simulation mode that shows predictions without deploying

## Requirements

### Requirement 1: Repository Analysis First

**User Story:** As a user, I want the system to analyze my repository before asking questions, so that it can ask intelligent questions based on what it found.

#### Acceptance Criteria

1. WHEN a user runs the deploy command THEN the system SHALL analyze the repository first before prompting for configuration
2. WHEN the analysis completes THEN the system SHALL display a summary of what was detected (language, framework, services, ports)
3. WHEN the analysis fails THEN the system SHALL display an error and exit without prompting for configuration
4. WHEN the analysis detects specific requirements THEN the system SHALL use those as defaults in configuration prompts

### Requirement 2: Dynamic Interactive Configuration Prompts

**User Story:** As a user, I want to be asked only about relevant deployment preferences based on what was detected, so that I'm not asked unnecessary questions.

#### Acceptance Criteria

1. WHEN the analysis completes THEN the system SHALL generate questions dynamically based on detected requirements
2. WHEN the analysis detects a database THEN the system SHALL prompt for database configuration using detected type and version as defaults
3. WHEN the analysis does not detect a database THEN the system SHALL skip database configuration prompts
4. WHEN the analysis detects specific ports THEN the system SHALL use those ports as defaults in prompts
5. WHEN displaying prompts THEN the system SHALL show detected values as defaults and explain what was found

### Requirement 3: Smart Defaults

**User Story:** As a user, I want sensible defaults suggested based on the repository analysis, so that I can quickly accept good choices without typing everything.

#### Acceptance Criteria

1. WHEN the analysis detects a port THEN the system SHALL suggest that port as the default app port
2. WHEN the analysis detects a database type THEN the system SHALL suggest an appropriate version as default
3. WHEN the user specifies high traffic THEN the system SHALL suggest larger instance types
4. WHEN the user specifies a domain THEN the system SHALL default SSL to enabled
5. WHEN the environment is production THEN the system SHALL suggest Multi-AZ for databases

### Requirement 4: Configuration Validation

**User Story:** As a user, I want my configuration to be validated, so that I don't deploy with invalid or incompatible settings.

#### Acceptance Criteria

1. WHEN the user enters an invalid port number THEN the system SHALL reject it and prompt again
2. WHEN the user enters an invalid instance type THEN the system SHALL warn and suggest valid options
3. WHEN the user's configuration conflicts with analysis results THEN the system SHALL warn the user
4. WHEN the user enters invalid input THEN the system SHALL use the default value and notify the user
5. WHEN validation fails THEN the system SHALL provide clear error messages

### Requirement 5: Cost Estimation

**User Story:** As a user, I want to see estimated costs before deploying, so that I can adjust my configuration to fit my budget.

#### Acceptance Criteria

1. WHEN the user completes configuration THEN the system SHALL calculate and display estimated monthly costs
2. WHEN displaying costs THEN the system SHALL break down costs by service (EC2, RDS, data transfer)
3. WHEN the user has a budget limit THEN the system SHALL warn if estimated costs exceed the budget
4. WHEN costs exceed budget THEN the system SHALL suggest cheaper alternatives
5. WHEN in what-if mode THEN the system SHALL display cost estimates without deploying

### Requirement 6: Configuration Confirmation

**User Story:** As a user, I want to review and confirm my configuration before deployment, so that I can verify everything is correct.

#### Acceptance Criteria

1. WHEN the user completes all prompts THEN the system SHALL display a summary of the configuration
2. WHEN displaying the summary THEN the system SHALL show all key settings (domain, database, compute, security)
3. WHEN displaying the summary THEN the system SHALL show the estimated monthly cost
4. WHEN the summary is displayed THEN the system SHALL ask for final confirmation before deploying
5. WHEN the user declines confirmation THEN the system SHALL cancel the deployment

### Requirement 7: Non-Interactive Mode

**User Story:** As a DevOps engineer, I want to skip interactive prompts in CI/CD pipelines, so that deployments can run automatically.

#### Acceptance Criteria

1. WHEN the user provides the --yes flag THEN the system SHALL skip all interactive prompts
2. WHEN the user provides the --yes flag THEN the system SHALL use default values for all configuration
3. WHEN the user provides a --config file THEN the system SHALL load configuration from that file
4. WHEN using a config file THEN the system SHALL skip interactive prompts
5. WHEN in non-interactive mode THEN the system SHALL still display the configuration summary

### Requirement 8: Configuration Persistence

**User Story:** As a user, I want to save my configuration for reuse, so that I can deploy similar applications with the same settings.

#### Acceptance Criteria

1. WHEN the user provides the --save-config flag THEN the system SHALL save the configuration to a JSON file
2. WHEN saving configuration THEN the system SHALL include all user preferences and settings
3. WHEN the user provides the --config flag THEN the system SHALL load configuration from the specified file
4. WHEN loading configuration THEN the system SHALL validate the configuration file format
5. WHEN loading configuration fails THEN the system SHALL display an error and fall back to interactive mode

### Requirement 9: Integration with Agents

**User Story:** As a system architect, I want user configuration to flow through all agents, so that the deployment matches user preferences.

#### Acceptance Criteria

1. WHEN the user configuration is complete THEN the system SHALL pass it to the Conductor agent
2. WHEN the Provisioner agent creates resources THEN it SHALL use user-specified instance types and database settings
3. WHEN the Deployer agent configures the application THEN it SHALL use user-specified ports and domain settings
4. WHEN the Sheriff agent applies security THEN it SHALL use user-specified security preferences
5. WHEN agents use configuration THEN they SHALL log which settings are being applied

### Requirement 10: Color-Coded Output

**User Story:** As a user, I want the interactive prompts to use colors, so that I can easily distinguish questions, defaults, and warnings.

#### Acceptance Criteria

1. WHEN displaying section headers THEN the system SHALL use cyan color
2. WHEN displaying questions THEN the system SHALL use standard terminal color
3. WHEN displaying defaults THEN the system SHALL use light blue color
4. WHEN displaying warnings THEN the system SHALL use yellow color
5. WHEN displaying errors THEN the system SHALL use red color

### Requirement 11: Gap Filling

**User Story:** As a user, I want the system to identify missing information and ask for it, so that the deployment has everything it needs.

#### Acceptance Criteria

1. WHEN the analysis cannot determine a required setting THEN the system SHALL prompt the user for that information
2. WHEN the user's configuration is incomplete THEN the system SHALL identify missing required fields
3. WHEN required information is missing THEN the system SHALL prompt for it before proceeding
4. WHEN optional information is missing THEN the system SHALL use sensible defaults
5. WHEN all required information is collected THEN the system SHALL proceed with deployment

### Requirement 12: Analysis-Driven Question Generation

**User Story:** As a user, I want the system to only ask me about things it detected in my repository, so that I'm not confused by irrelevant questions.

#### Acceptance Criteria

1. WHEN the analysis detects PostgreSQL THEN the system SHALL ask PostgreSQL-specific questions and skip MySQL/MongoDB questions
2. WHEN the analysis detects multiple services THEN the system SHALL ask about each detected service
3. WHEN the analysis detects a specific configuration THEN the system SHALL use that as the default and ask for confirmation
4. WHEN the analysis cannot determine a required value THEN the system SHALL ask the user to provide it
5. WHEN the analysis finds complete information THEN the system SHALL minimize questions and show what was detected

### Requirement 13: Environment-Specific Prompts

**User Story:** As a user, I want different questions for development vs production deployments, so that I'm not asked about production features in development.

#### Acceptance Criteria

1. WHEN the environment is development THEN the system SHALL skip Multi-AZ and WAF prompts
2. WHEN the environment is production THEN the system SHALL prompt for high-availability options
3. WHEN the environment is staging THEN the system SHALL use medium-tier defaults
4. WHEN the user specifies an environment THEN the system SHALL adjust all prompts accordingly
5. WHEN no environment is specified THEN the system SHALL default to production and prompt accordingly

### Requirement 14: Intelligent Recommendations

**User Story:** As a non-technical user, I want the system to suggest good default answers with explanations, so that I can make informed decisions without deep technical knowledge.

#### Acceptance Criteria

1. WHEN displaying a question THEN the system SHALL provide a recommended answer with explanation
2. WHEN the recommendation involves cost THEN the system SHALL show estimated monthly cost
3. WHEN the recommendation involves security THEN the system SHALL explain the security benefit
4. WHEN the recommendation involves performance THEN the system SHALL explain the performance impact
5. WHEN displaying recommendations THEN the system SHALL use simple, non-technical language

### Requirement 15: Question Relevance

**User Story:** As a user, I want to only answer questions that are relevant to my specific application, so that the configuration process is quick and focused.

#### Acceptance Criteria

1. WHEN no database is detected THEN the system SHALL not ask any database-related questions
2. WHEN no Redis is detected THEN the system SHALL not ask Redis-related questions
3. WHEN a port is detected THEN the system SHALL ask "Use port X?" instead of "What port?"
4. WHEN SSL is mentioned in documentation THEN the system SHALL default SSL to enabled
5. WHEN the analysis is complete THEN the system SHALL only ask about gaps that couldn't be determined
