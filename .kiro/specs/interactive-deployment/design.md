# Design Document: Interactive Deployment Configuration

## Overview

This design implements an interactive configuration system that prompts users for deployment preferences after analyzing their repository. The system combines repository analysis with user input to create customized deployment plans.

## Architecture

### High-Level Flow

```
User runs deploy command
    ↓
1. Analyze Repository (Recon Agent)
    ↓
2. Display Analysis Summary
    ↓
3. Interactive Configuration Prompts
    ↓
4. Validate Configuration
    ↓
5. Calculate Cost Estimate
    ↓
6. Display Summary & Confirm
    ↓
7. Deploy with User Config
```

### Components

1. **UserDeploymentConfig** - Pydantic model for user preferences
2. **InteractivePrompter** - Handles user interaction and prompts
3. **ConfigValidator** - Validates user input
4. **CostEstimator** - Calculates deployment costs
5. **Updated CLI** - Orchestrates the flow
6. **Agent Integration** - Passes config to all agents

## Data Models

### UserDeploymentConfig Schema

```python
# src/schemas/user_config.py

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, List

class DomainConfig(BaseModel):
    """Domain and networking configuration."""
    domain: Optional[str] = None
    enable_ssl: bool = True
    app_port: int = 3000
    expose_port: int = 80
    enable_cdn: bool = False
    
    @validator('app_port', 'expose_port')
    def validate_port(cls, v):
        if not 1 <= v <= 65535:
            raise ValueError('Port must be between 1 and 65535')
        return v


class DatabaseConfig(BaseModel):
    """Database configuration."""
    version: Optional[str] = None
    instance_size: Literal["small", "medium", "large"] = "small"
    backup_retention_days: int = 7
    multi_az: bool = False
    storage_gb: int = 20
    
    @validator('backup_retention_days')
    def validate_retention(cls, v):
        if not 1 <= v <= 35:
            raise ValueError('Retention must be between 1 and 35 days')
        return v

class ComputeConfig(BaseModel):
    """Compute resource configuration."""
    expected_traffic: Literal["low", "medium", "high"] = "medium"
    instance_type: Optional[str] = None
    auto_scaling: bool = False
    min_instances: int = 1
    max_instances: int = 3
    
    @validator('min_instances', 'max_instances')
    def validate_instances(cls, v):
        if v < 1:
            raise ValueError('Must have at least 1 instance')
        return v
    
    @validator('max_instances')
    def validate_max_greater_than_min(cls, v, values):
        if 'min_instances' in values and v < values['min_instances']:
            raise ValueError('max_instances must be >= min_instances')
        return v

class SecurityConfig(BaseModel):
    """Security configuration."""
    auto_updates: bool = True
    restrict_ssh: bool = True
    enable_waf: bool = False
    enable_cloudwatch: bool = True
    allowed_ssh_ips: List[str] = Field(default_factory=list)

class UserDeploymentConfig(BaseModel):
    """Complete user deployment configuration."""
    domain: DomainConfig = Field(default_factory=DomainConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    compute: ComputeConfig = Field(default_factory=ComputeConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    
    environment: Literal["development", "staging", "production"] = "production"
    region: str = "us-east-1"
    budget_limit: Optional[float] = None
    
    def to_json_file(self, filepath: str):
        """Save configuration to JSON file."""
        with open(filepath, 'w') as f:
            f.write(self.model_dump_json(indent=2))
    
    @classmethod
    def from_json_file(cls, filepath: str):
        """Load configuration from JSON file."""
        with open(filepath, 'r') as f:
            return cls.model_validate_json(f.read())
```


## Dynamic Question Generation

The key innovation is that **questions are generated dynamically based on analysis results**, not from a fixed template.

### Analysis-Driven Questions

```python
# Example: Analysis result determines questions

analysis = {
    "required_services": [
        {"type": "postgresql", "version": "15"},
        {"type": "redis", "version": "7"}
    ],
    "ports": [8080],
    "environment_variables": {
        "DATABASE_URL": {"required": True},
        "REDIS_URL": {"required": True}
    }
}

# Questions generated:
# 1. "I detected PostgreSQL 15. Use this version?" [default: 15]
# 2. "I detected Redis 7. Use this version?" [default: 7]
# 3. "I detected port 8080. Use this port?" [default: 8080]
# 4. "Database instance size?" [small/medium/large]
# 5. "Redis instance size?" [small/medium/large]
```

### Question Generation Rules

1. **Only ask about detected requirements**
   - Database detected → Ask database questions
   - No database → Skip database questions
   - Redis detected → Ask Redis questions

2. **Use detected values as defaults**
   - Port 8080 detected → Default to 8080
   - PostgreSQL 15 detected → Default to version 15
   - SSL mentioned in docs → Default SSL to enabled

3. **Provide smart recommendations**
   - Explain why a default is recommended
   - Show cost implications of choices
   - Suggest best practices for non-technical users
   - Highlight security recommendations

4. **Ask for missing critical info**
   - No domain found → Ask "What domain?"
   - Database detected but no version → Ask "What version?"
   - Port not detected → Ask "What port?" with common default

5. **Skip irrelevant questions**
   - Development environment → Skip Multi-AZ
   - No domain → Skip SSL questions
   - No database → Skip database questions

### Smart Default Recommendations

The system provides intelligent defaults with explanations:

```python
# Example: Database size recommendation

"Database instance size? [small/medium/large]
  💡 Recommendation: small
     - Good for: Development, testing, small apps (<1000 users)
     - Cost: ~$12/month
     - Can upgrade later if needed
  
  > " 

# Example: SSL recommendation

"Enable SSL/HTTPS? [Y/n]
  💡 Recommendation: Yes (strongly recommended)
     - Encrypts traffic between users and your app
     - Required for: Credit cards, passwords, sensitive data
     - Free with AWS Certificate Manager
     - Modern browsers show warnings without SSL
  
  > "

# Example: Auto-scaling recommendation

"Enable auto-scaling? [Y/n]
  💡 Recommendation: Yes for production
     - Automatically adds servers during traffic spikes
     - Saves money by reducing servers during low traffic
     - Prevents downtime from unexpected load
     - Cost: Only pay for what you use
  
  > "
```

## Components and Interfaces

### InteractivePrompter

The prompter **dynamically generates questions based on analysis results**. It only asks about things that are relevant to the detected application.

```python
# src/utils/interactive.py

from typing import Optional, List, Dict, Any
from src.schemas.user_config import UserDeploymentConfig, DomainConfig, DatabaseConfig
from src.utils.colors import info, warning, success, tool, action

class InteractivePrompter:
    """
    Interactive CLI prompter for deployment configuration.
    
    Generates dynamic questions based on repository analysis results.
    Only asks about detected requirements and relevant configurations.
    """
    
    def __init__(self, analysis_result: Dict[str, Any]):
        self.analysis = analysis_result
        self.config = UserDeploymentConfig()
        self.questions_asked = []
    
    def prompt_all(self) -> UserDeploymentConfig:
        """
        Prompt user for configuration based on analysis.
        
        Questions are dynamically generated based on what was detected:
        - Only ask about databases if one was detected
        - Use detected values as defaults
        - Skip irrelevant questions
        """
        print(info("\n📋 Deployment Configuration"))
        print(f"Based on the analysis, I have some questions to customize your deployment:\n")
        
        # Always ask about domain/networking
        self._prompt_domain()
        
        # Only ask about database if one was detected
        if self._has_database():
            self._prompt_database()
        
        # Always ask about compute
        self._prompt_compute()
        
        # Always ask about security
        self._prompt_security()
        
        # Ask about any gaps we found
        self._prompt_gaps()
        
        return self.config
    
    def _has_database(self) -> bool:
        """Check if analysis detected a database requirement."""
        services = self.analysis.get("required_services", [])
        return any(s["type"] in ["postgresql", "mysql", "mongodb", "redis"] for s in services)
    
    def _prompt_domain(self):
        """Prompt for domain and networking."""
        print(info("🌐 Domain & Networking"))
        
        domain = self._ask_text(
            "What domain will you use? (leave blank for IP only)",
            optional=True
        )
        self.config.domain.domain = domain
        
        if domain:
            enable_ssl = self._ask_bool("Do you need SSL/HTTPS?", default=True)
            self.config.domain.enable_ssl = enable_ssl
        
        detected_port = self.analysis.get("ports", [3000])[0] if self.analysis.get("ports") else 3000
        app_port = self._ask_int("What port should the app listen on?", default=detected_port)
        self.config.domain.app_port = app_port
        
        print()
```

    
    def _prompt_database(self):
        """
        Prompt for database configuration.
        
        Uses detected database type and version as defaults.
        Only asks if database was detected in analysis.
        """
        services = self.analysis.get("required_services", [])
        db_services = [s for s in services if s["type"] in ["postgresql", "mysql", "mongodb", "redis"]]
        
        if not db_services:
            return
        
        print(info("💾 Database"))
        
        # Use detected database info
        db = db_services[0]
        db_type = db["type"]
        detected_version = db.get("version")
        
        # If version was detected, use it as default
        if detected_version:
            version = self._ask_text(
                f"I detected {db_type.title()} {detected_version}. Use this version?",
                default=detected_version
            )
        else:
            # No version detected, ask without default
            version = self._ask_text(
                f"The app requires {db_type.title()}. What version do you want?",
                default=None
            )
        
        self.config.database.version = version
        
        # Recommend size based on environment
        if self.config.environment == "production":
            recommended_size = "medium"
            recommendation = self._get_recommendation("database_size_medium", {})
        else:
            recommended_size = "small"
            recommendation = self._get_recommendation("database_size_small", {})
        
        size = self._ask_choice(
            "Database instance size?",
            choices=["small", "medium", "large"],
            default=recommended_size,
            recommendation=recommendation
        )
        self.config.database.instance_size = size
        
        if self.config.environment == "production":
            multi_az = self._ask_bool(
                "Enable Multi-AZ for high availability?",
                default=True
            )
            self.config.database.multi_az = multi_az
        
        print()
    
    def _prompt_gaps(self):
        """
        Identify and prompt for any missing required information.
        
        This is called after all standard prompts to catch anything
        the analysis couldn't determine but is needed for deployment.
        """
        gaps = []
        
        # Check for missing critical info
        if not self.config.domain.domain and not self._asked("domain"):
            gaps.append("domain")
        
        if self._has_database() and not self.config.database.version:
            gaps.append("database_version")
        
        if gaps:
            print(info("\n🔍 Additional Information Needed"))
            print("I need a few more details that weren't in the documentation:\n")
            
            for gap in gaps:
                if gap == "domain":
                    domain = self._ask_text(
                        "What domain will this be deployed to? (or leave blank for IP)",
                        optional=True
                    )
                    self.config.domain.domain = domain
                
                elif gap == "database_version":
                    version = self._ask_text(
                        "What database version should I use?",
                        default="14"
                    )
                    self.config.database.version = version
            
            print()
    
    def _asked(self, question_key: str) -> bool:
        """Check if a question was already asked."""
        return question_key in self.questions_asked
    
    def _prompt_compute(self):
        """Prompt for compute configuration."""
        print(info("🖥️  Compute"))
        
        traffic = self._ask_choice(
            "Expected traffic level?",
            choices=["low", "medium", "high"],
            default="medium"
        )
        self.config.compute.expected_traffic = traffic
        
        suggested_type = self._suggest_instance_type(traffic)
        instance_type = self._ask_text(
            "Instance type preference?",
            default=suggested_type
        )
        self.config.compute.instance_type = instance_type
        
        if traffic in ["medium", "high"]:
            auto_scaling = self._ask_bool(
                "Enable auto-scaling?",
                default=(traffic == "high")
            )
            self.config.compute.auto_scaling = auto_scaling
        
        print()
```

    
    def _prompt_security(self):
        """Prompt for security configuration."""
        print(info("🔒 Security"))
        
        auto_updates = self._ask_bool(
            "Enable automatic security updates?",
            default=True
        )
        self.config.security.auto_updates = auto_updates
        
        restrict_ssh = self._ask_bool(
            "Restrict SSH access to your IP?",
            default=True
        )
        self.config.security.restrict_ssh = restrict_ssh
        
        print()
    
    # Helper methods
    def _ask_text(self, question: str, default: Optional[str] = None, optional: bool = False) -> Optional[str]:
        """Ask a text question."""
        prompt = f"  {question}"
        if default:
            prompt += f" [{tool(str(default))}]"
        prompt += "\n  > "
        
        response = input(prompt).strip()
        return response if response else default
    
    def _ask_bool(self, question: str, default: bool = True) -> bool:
        """Ask a yes/no question."""
        default_str = "Y/n" if default else "y/N"
        prompt = f"  {question} [{default_str}]\n  > "
        
        response = input(prompt).strip().lower()
        if not response:
            return default
        return response in ["y", "yes", "true", "1"]
    
    def _ask_int(self, question: str, default: int) -> int:
        """Ask for an integer."""
        prompt = f"  {question} [{tool(str(default))}]\n  > "
        
        response = input(prompt).strip()
        if not response:
            return default
        
        try:
            return int(response)
        except ValueError:
            print(warning(f"  Invalid number, using default: {default}"))
            return default
    
    def _ask_choice(self, question: str, choices: List[str], default: str, 
                    recommendation: Optional[str] = None) -> str:
        """
        Ask user to choose from options with optional recommendation.
        
        Args:
            question: The question to ask
            choices: List of valid choices
            default: Default choice
            recommendation: Optional recommendation text to display
        """
        choices_str = "/".join(choices)
        prompt = f"  {question} [{choices_str}] [{tool(default)}]\n"
        
        if recommendation:
            print(f"  💡 {info('Recommendation:')} {recommendation}")
        
        prompt += "  > "
        
        response = input(prompt).strip().lower()
        if not response:
            return default
        if response in choices:
            return response
        
        print(warning(f"  Invalid choice, using default: {default}"))
        return default
    
    def _suggest_instance_type(self, traffic: str) -> str:
        """Suggest instance type based on traffic."""
        return {
            "low": "t3.micro",
            "medium": "t3.small",
            "high": "t3.medium"
        }.get(traffic, "t3.small")
    
    def _get_recommendation(self, question_type: str, context: Dict[str, Any]) -> Optional[str]:
        """
        Get intelligent recommendation for a question.
        
        Provides helpful explanations for non-technical users.
        """
        recommendations = {
            "database_size_small": (
                "Good for development, testing, small apps (<1000 users). "
                "Cost: ~$12/month. Can upgrade later."
            ),
            "database_size_medium": (
                "Good for production apps with moderate traffic (1K-10K users). "
                "Cost: ~$25/month. Balanced performance and cost."
            ),
            "database_size_large": (
                "Good for high-traffic production apps (10K+ users). "
                "Cost: ~$50/month. Best performance."
            ),
            "ssl_enabled": (
                "Strongly recommended. Encrypts traffic, required for passwords/payments. "
                "Free with AWS. Modern browsers show warnings without SSL."
            ),
            "auto_scaling_yes": (
                "Recommended for production. Automatically handles traffic spikes. "
                "Saves money during low traffic. Prevents downtime."
            ),
            "multi_az_yes": (
                "Recommended for production. Protects against datacenter failures. "
                "Automatic failover. Doubles database cost but ensures uptime."
            ),
            "auto_updates_yes": (
                "Strongly recommended. Automatically installs security patches. "
                "Keeps your server secure without manual work."
            ),
            "restrict_ssh_yes": (
                "Recommended. Only allows SSH from your IP address. "
                "Prevents unauthorized access attempts."
            ),
        }
        
        return recommendations.get(question_type)
```


### CostEstimator

Calculates estimated monthly costs based on configuration.

```python
# src/utils/cost_estimator.py

from typing import Dict
from src.schemas.user_config import UserDeploymentConfig

class CostEstimator:
    """Estimate AWS deployment costs."""
    
    # Pricing data (simplified, actual prices vary by region)
    EC2_PRICING = {
        "t3.micro": 0.0104,
        "t3.small": 0.0208,
        "t3.medium": 0.0416,
        "t3.large": 0.0832,
    }
    
    RDS_PRICING = {
        "small": 0.017,   # db.t3.micro
        "medium": 0.034,  # db.t3.small
        "large": 0.068,   # db.t3.medium
    }
    
    @staticmethod
    def estimate(config: UserDeploymentConfig, has_database: bool = False) -> Dict[str, any]:
        """Calculate estimated monthly costs."""
        hours_per_month = 730
        
        # EC2 costs
        instance_type = config.compute.instance_type or "t3.small"
        hourly_ec2 = CostEstimator.EC2_PRICING.get(instance_type, 0.0208)
        num_instances = config.compute.min_instances if config.compute.auto_scaling else 1
        monthly_ec2 = hourly_ec2 * hours_per_month * num_instances
        
        # RDS costs
        monthly_rds = 0
        if has_database:
            hourly_rds = CostEstimator.RDS_PRICING.get(config.database.instance_size, 0.017)
            monthly_rds = hourly_rds * hours_per_month
            if config.database.multi_az:
                monthly_rds *= 2
        
        # Data transfer (estimate)
        monthly_data_transfer = 10.0  # Simplified estimate
        
        # Total
        total_monthly = monthly_ec2 + monthly_rds + monthly_data_transfer
        
        return {
            "total_monthly": round(total_monthly, 2),
            "ec2": {
                "hourly": round(hourly_ec2, 4),
                "monthly": round(monthly_ec2, 2),
                "instances": num_instances
            },
            "rds": {
                "hourly": round(hourly_rds, 4) if has_database else 0,
                "monthly": round(monthly_rds, 2),
                "multi_az": config.database.multi_az if has_database else False
            },
            "data_transfer": {
                "monthly": monthly_data_transfer
            }
        }
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Configuration Validation
*For any* user input, if it fails validation rules (invalid port, invalid instance type), the system should reject it and use the default value
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 2: Cost Calculation Consistency
*For any* valid configuration, calculating costs multiple times should produce the same result
**Validates: Requirements 5.1, 5.2**

### Property 3: Configuration Persistence Round-Trip
*For any* valid configuration, saving to JSON and loading back should produce an equivalent configuration
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 4: Smart Defaults Based on Analysis
*For any* repository analysis that detects a port, the default app port in prompts should match the detected port
**Validates: Requirements 3.1, 3.2**

### Property 5: Environment-Specific Prompts
*For any* development environment configuration, Multi-AZ and WAF prompts should be skipped
**Validates: Requirements 12.1, 12.2**

### Property 6: Budget Validation
*For any* configuration with a budget limit, if estimated costs exceed the budget, the system should warn the user
**Validates: Requirements 5.3, 5.4**

### Property 7: Non-Interactive Mode Consistency
*For any* deployment with --yes flag, the system should use default values and skip all prompts
**Validates: Requirements 7.1, 7.2**

### Property 8: Configuration Completeness
*For any* deployment, all required configuration fields must be populated before proceeding
**Validates: Requirements 11.1, 11.2, 11.3**

## Error Handling

### Input Validation Errors
- Invalid port numbers → Use default, warn user
- Invalid instance types → Suggest valid options
- Invalid file paths → Display error, fall back to interactive mode

### Configuration File Errors
- File not found → Display error, use interactive mode
- Invalid JSON → Display error, use interactive mode
- Missing required fields → Prompt for missing fields

### Analysis Errors
- Analysis fails → Display error, exit (don't prompt)
- No services detected → Skip database prompts
- No ports detected → Use default port (3000)

## Testing Strategy

### Unit Tests
- Test each prompter method independently
- Test configuration validation
- Test cost calculation with various inputs
- Test JSON save/load round-trip
- Test smart defaults logic

### Property-Based Tests
- Property 1: Configuration validation (test with random invalid inputs)
- Property 2: Cost calculation consistency (test with random configs)
- Property 3: JSON round-trip (test with random configs)
- Property 4: Smart defaults (test with random analysis results)
- Property 5: Environment-specific prompts (test with all environments)
- Property 6: Budget validation (test with various budgets and costs)
- Property 7: Non-interactive mode (test with --yes flag)
- Property 8: Configuration completeness (test with incomplete configs)

### Integration Tests
- Test full flow: analyze → prompt → validate → estimate → deploy
- Test with real repository analysis results
- Test with config files
- Test with --yes flag
- Test with --what-if mode

## CLI Integration

### Updated deploy_command Flow

```python
def deploy_command(args):
    """Handle deploy command with interactive configuration."""
    
    # Step 1: Analyze repository
    print(info("🔍 Analyzing repository..."))
    analysis_result = run_recon_agent(args.repo_url, args.description)
    
    if not analysis_result["success"]:
        print(failure(f"❌ Analysis failed"))
        sys.exit(1)
    
    print(success("✅ Analysis complete!"))
    _show_analysis_summary(analysis_result)
    
    # Step 2: Get user configuration
    if args.config:
        # Load from file
        user_config = UserDeploymentConfig.from_json_file(args.config)
    elif args.yes:
        # Use defaults
        user_config = UserDeploymentConfig()
    else:
        # Interactive prompts
        prompter = InteractivePrompter(analysis_result)
        user_config = prompter.prompt_all()
    
    # Step 3: Calculate costs
    has_database = len(analysis_result.get("required_services", [])) > 0
    cost_estimate = CostEstimator.estimate(user_config, has_database)
    
    print(info("\n📊 Configuration Summary"))
    _show_config_summary(user_config, cost_estimate)
    
    # Step 4: Confirm (unless --yes or --what-if)
    if not args.yes and not args.what_if:
        confirm = input(f"\n🚀 Ready to deploy? [Y/n] > ").strip().lower()
        if confirm and confirm not in ["y", "yes"]:
            print("Deployment cancelled.")
            sys.exit(0)
    
    # Step 5: Save config if requested
    if args.save_config:
        user_config.to_json_file(args.save_config)
        print(success(f"💾 Configuration saved to {args.save_config}"))
    
    # Step 6: Deploy
    conductor = StrandsConductorAgent(
        state_dir=args.state_dir,
        region=args.region,
    )
    
    result = conductor.deploy(
        repo_url=args.repo_url,
        description=args.description,
        user_config=user_config,
        dry_run=args.what_if,
    )
    
    # ... handle result
```

## Agent Integration

All agents receive the user configuration and use it:

### Provisioner Agent
- Uses `config.compute.instance_type` for EC2
- Uses `config.database.*` for RDS
- Uses `config.domain.domain` for Route53

### Deployer Agent
- Uses `config.domain.app_port` for app configuration
- Uses `config.domain.expose_port` for load balancer
- Uses `config.domain.enable_ssl` for HTTPS setup

### Sheriff Agent
- Uses `config.security.auto_updates` for unattended-upgrades
- Uses `config.security.restrict_ssh` for security groups
- Uses `config.security.enable_waf` for WAF setup

## Implementation Priority

### Phase 1: Core Configuration (MVP)
1. Create UserDeploymentConfig schema
2. Build InteractivePrompter
3. Update CLI to use prompter
4. Pass config to Conductor

### Phase 2: Enhanced Features
5. Add CostEstimator
6. Add config save/load
7. Add --yes flag
8. Add validation

### Phase 3: Polish
9. Add smart defaults
10. Add environment-specific prompts
11. Add budget warnings
12. Add comprehensive tests
