# Interactive Deployment Configuration

## Overview

Instead of just analyzing a repository and deploying with defaults, HiveMind should **ask the user for their preferences** before deployment. This allows the system to create a customized deployment plan that matches the user's specific needs.

## The Problem

Currently, the deployment flow is:
1. User runs: `python -m src.cli deploy <repo> "Deploy"`
2. System analyzes repo and makes assumptions
3. System deploys with default settings
4. User might get something they didn't want

**Issues:**
- Port conflicts (app uses 3000, but user wants 80)
- Wrong domain (deploys without SSL, but user needs HTTPS)
- Over/under-provisioned (user needs small instance, gets large)
- Missing customization (user wants specific database version)

## The Solution

Add an **interactive configuration step** that asks users for their preferences:

```bash
$ python -m src.cli deploy https://github.com/user/app "Production"

🔍 Analyzing repository...
✅ Analysis complete! Found: Node.js Express app

📋 Deployment Configuration
Let me ask you a few questions to customize your deployment:

🌐 Domain & Networking
  1. What domain will you use? (leave blank for IP only)
     > myapp.example.com
  
  2. Do you need SSL/HTTPS? [Y/n]
     > Y
  
  3. What port should the app listen on? [default: 3000]
     > 80

💾 Database
  4. The app requires PostgreSQL. What version? [default: 14]
     > 15
  
  5. Database instance size? [small/medium/large] [default: small]
     > medium

🖥️  Compute
  6. Expected traffic? [low/medium/high] [default: medium]
     > high
  
  7. Instance type preference? [default: t3.medium]
     > t3.large

🔒 Security
  8. Enable automatic security updates? [Y/n]
     > Y
  
  9. Restrict SSH access to your IP? [Y/n]
     > Y

📊 Reviewing your configuration...
✅ Configuration complete!

💰 Estimated monthly cost: $156.80
  - EC2 (t3.large): $60.00
  - RDS (db.t3.medium): $85.00
  - Data transfer: $11.80

🚀 Ready to deploy? [Y/n]
> Y

Deploying...
```

## Implementation Design

### 1. Configuration Schema

```python
# src/schemas/user_config.py

from pydantic import BaseModel, Field
from typing import Optional, Literal

class DomainConfig(BaseModel):
    """Domain and networking configuration."""
    domain: Optional[str] = None
    enable_ssl: bool = True
    app_port: int = 3000
    expose_port: int = 80
    enable_cdn: bool = False

class DatabaseConfig(BaseModel):
    """Database configuration."""
    version: Optional[str] = None
    instance_size: Literal["small", "medium", "large"] = "small"
    backup_retention_days: int = 7
    multi_az: bool = False

class ComputeConfig(BaseModel):
    """Compute resource configuration."""
    expected_traffic: Literal["low", "medium", "high"] = "medium"
    instance_type: Optional[str] = None
    auto_scaling: bool = False
    min_instances: int = 1
    max_instances: int = 3

class SecurityConfig(BaseModel):
    """Security configuration."""
    auto_updates: bool = True
    restrict_ssh: bool = True
    enable_waf: bool = False
    enable_cloudwatch: bool = True

class UserDeploymentConfig(BaseModel):
    """Complete user deployment configuration."""
    domain: DomainConfig = Field(default_factory=DomainConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    compute: ComputeConfig = Field(default_factory=ComputeConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    
    # User preferences
    environment: Literal["development", "staging", "production"] = "production"
    region: str = "us-east-1"
    budget_limit: Optional[float] = None  # Monthly budget in USD
```

### 2. Interactive Prompter

```python
# src/utils/interactive.py

from typing import Optional, List, Any
from src.schemas.user_config import UserDeploymentConfig
from src.utils.colors import info, warning, success, tool

class InteractivePrompter:
    """Interactive CLI prompter for deployment configuration."""
    
    def __init__(self, analysis_result: dict):
        """
        Initialize with repository analysis results.
        
        Args:
            analysis_result: Results from Recon agent analysis
        """
        self.analysis = analysis_result
        self.config = UserDeploymentConfig()
    
    def prompt_all(self) -> UserDeploymentConfig:
        """
        Prompt user for all configuration options.
        
        Returns:
            Complete user configuration
        """
        print(info("\n📋 Deployment Configuration"))
        print("Let me ask you a few questions to customize your deployment:\n")
        
        self._prompt_domain()
        self._prompt_database()
        self._prompt_compute()
        self._prompt_security()
        
        return self.config
    
    def _prompt_domain(self):
        """Prompt for domain and networking configuration."""
        print(info("🌐 Domain & Networking"))
        
        # Domain
        domain = self._ask(
            "What domain will you use? (leave blank for IP only)",
            default=None,
            optional=True
        )
        self.config.domain.domain = domain
        
        # SSL
        if domain:
            enable_ssl = self._ask_bool(
                "Do you need SSL/HTTPS?",
                default=True
            )
            self.config.domain.enable_ssl = enable_ssl
        
        # Port
        detected_port = self.analysis.get("ports", [3000])[0]
        app_port = self._ask_int(
            f"What port should the app listen on?",
            default=detected_port
        )
        self.config.domain.app_port = app_port
        
        # Expose port
        if domain:
            expose_port = 443 if self.config.domain.enable_ssl else 80
        else:
            expose_port = app_port
        
        self.config.domain.expose_port = expose_port
        print()
    
    def _prompt_database(self):
        """Prompt for database configuration."""
        services = self.analysis.get("required_services", [])
        db_services = [s for s in services if s["type"] in ["postgresql", "mysql", "mongodb"]]
        
        if not db_services:
            return
        
        print(info("💾 Database"))
        
        db = db_services[0]
        db_type = db["type"]
        default_version = db.get("version", "14" if db_type == "postgresql" else "8.0")
        
        # Version
        version = self._ask(
            f"The app requires {db_type.title()}. What version?",
            default=default_version
        )
        self.config.database.version = version
        
        # Instance size
        size = self._ask_choice(
            "Database instance size?",
            choices=["small", "medium", "large"],
            default="small"
        )
        self.config.database.instance_size = size
        
        # Multi-AZ for production
        if self.config.environment == "production":
            multi_az = self._ask_bool(
                "Enable Multi-AZ for high availability? (recommended for production)",
                default=True
            )
            self.config.database.multi_az = multi_az
        
        print()
    
    def _prompt_compute(self):
        """Prompt for compute configuration."""
        print(info("🖥️  Compute"))
        
        # Traffic level
        traffic = self._ask_choice(
            "Expected traffic level?",
            choices=["low", "medium", "high"],
            default="medium"
        )
        self.config.compute.expected_traffic = traffic
        
        # Instance type
        suggested_type = self._suggest_instance_type(traffic)
        instance_type = self._ask(
            f"Instance type preference?",
            default=suggested_type
        )
        self.config.compute.instance_type = instance_type
        
        # Auto-scaling
        if traffic in ["medium", "high"]:
            auto_scaling = self._ask_bool(
                "Enable auto-scaling?",
                default=traffic == "high"
            )
            self.config.compute.auto_scaling = auto_scaling
            
            if auto_scaling:
                min_instances = self._ask_int(
                    "Minimum instances?",
                    default=1
                )
                max_instances = self._ask_int(
                    "Maximum instances?",
                    default=3 if traffic == "medium" else 5
                )
                self.config.compute.min_instances = min_instances
                self.config.compute.max_instances = max_instances
        
        print()
    
    def _prompt_security(self):
        """Prompt for security configuration."""
        print(info("🔒 Security"))
        
        # Auto updates
        auto_updates = self._ask_bool(
            "Enable automatic security updates?",
            default=True
        )
        self.config.security.auto_updates = auto_updates
        
        # SSH restriction
        restrict_ssh = self._ask_bool(
            "Restrict SSH access to your IP?",
            default=True
        )
        self.config.security.restrict_ssh = restrict_ssh
        
        # WAF for production
        if self.config.environment == "production" and self.config.domain.domain:
            enable_waf = self._ask_bool(
                "Enable Web Application Firewall (WAF)?",
                default=False
            )
            self.config.security.enable_waf = enable_waf
        
        print()
    
    def _ask(self, question: str, default: Optional[str] = None, optional: bool = False) -> Optional[str]:
        """Ask a text question."""
        prompt = f"  {question}"
        if default:
            prompt += f" [default: {default}]"
        prompt += "\n  > "
        
        response = input(prompt).strip()
        
        if not response:
            return default
        
        return response if response else None
    
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
        prompt = f"  {question} [default: {default}]\n  > "
        
        response = input(prompt).strip()
        
        if not response:
            return default
        
        try:
            return int(response)
        except ValueError:
            print(warning(f"  Invalid number, using default: {default}"))
            return default
    
    def _ask_choice(self, question: str, choices: List[str], default: str) -> str:
        """Ask user to choose from options."""
        choices_str = "/".join(choices)
        prompt = f"  {question} [{choices_str}] [default: {default}]\n  > "
        
        response = input(prompt).strip().lower()
        
        if not response:
            return default
        
        if response in choices:
            return response
        
        print(warning(f"  Invalid choice, using default: {default}"))
        return default
    
    def _suggest_instance_type(self, traffic: str) -> str:
        """Suggest instance type based on traffic."""
        suggestions = {
            "low": "t3.micro",
            "medium": "t3.small",
            "high": "t3.medium"
        }
        return suggestions.get(traffic, "t3.small")
```

### 3. Updated CLI Flow

```python
# src/cli.py - Updated deploy_command

def deploy_command(args):
    """Handle deploy command with interactive configuration."""
    
    # Step 1: Analyze repository
    print(info("🔍 Analyzing repository..."))
    analysis_result = run_recon_agent(args.repo_url, args.description)
    
    if not analysis_result["success"]:
        print(failure(f"❌ Analysis failed: {analysis_result.get('error')}"))
        sys.exit(1)
    
    print(success("✅ Analysis complete!"))
    
    # Show what was detected
    _show_analysis_summary(analysis_result)
    
    # Step 2: Interactive configuration (unless --yes flag)
    if not args.yes:
        prompter = InteractivePrompter(analysis_result)
        user_config = prompter.prompt_all()
        
        # Step 3: Show cost estimate
        print(info("📊 Reviewing your configuration..."))
        cost_estimate = calculate_cost_estimate(user_config, analysis_result)
        _show_cost_estimate(cost_estimate)
        
        # Step 4: Confirm deployment
        if not args.what_if:
            confirm = input(f"\n🚀 Ready to deploy? [Y/n] > ").strip().lower()
            if confirm and confirm not in ["y", "yes"]:
                print("Deployment cancelled.")
                sys.exit(0)
    else:
        # Use defaults
        user_config = UserDeploymentConfig()
    
    # Step 5: Deploy with user configuration
    conductor = StrandsConductorAgent(
        state_dir=args.state_dir,
        region=args.region,
    )
    
    result = conductor.deploy(
        repo_url=args.repo_url,
        description=args.description,
        user_config=user_config,  # Pass user preferences
        dry_run=args.what_if,
    )
    
    # ... rest of deployment handling
```

### 4. CLI Arguments

```python
# Add new flags
deploy_parser.add_argument(
    "--yes", "-y",
    action="store_true",
    help="Skip interactive prompts and use defaults",
)

deploy_parser.add_argument(
    "--config",
    help="Load configuration from JSON file",
)

deploy_parser.add_argument(
    "--save-config",
    help="Save configuration to JSON file for reuse",
)
```

## Benefits

### 1. **Customized Deployments**
- User gets exactly what they want
- No surprises or misconfigurations
- Tailored to specific use case

### 2. **Cost Control**
- User sees cost estimate before deploying
- Can adjust resources to fit budget
- No unexpected AWS bills

### 3. **Better Decisions**
- System explains options
- User makes informed choices
- Recommendations based on analysis

### 4. **Reusable Configurations**
```bash
# Save config for reuse
python -m src.cli deploy <repo> "Deploy" --save-config prod-config.json

# Reuse later
python -m src.cli deploy <repo> "Deploy" --config prod-config.json
```

### 5. **CI/CD Friendly**
```bash
# Skip prompts in CI/CD
python -m src.cli deploy <repo> "Deploy" --yes --config ci-config.json
```

## Example Configurations

### Development
```json
{
  "environment": "development",
  "domain": {
    "domain": null,
    "enable_ssl": false,
    "app_port": 3000
  },
  "database": {
    "instance_size": "small",
    "multi_az": false
  },
  "compute": {
    "expected_traffic": "low",
    "instance_type": "t3.micro",
    "auto_scaling": false
  }
}
```

### Production
```json
{
  "environment": "production",
  "domain": {
    "domain": "myapp.com",
    "enable_ssl": true,
    "app_port": 3000,
    "expose_port": 443
  },
  "database": {
    "version": "15",
    "instance_size": "large",
    "multi_az": true,
    "backup_retention_days": 30
  },
  "compute": {
    "expected_traffic": "high",
    "instance_type": "t3.large",
    "auto_scaling": true,
    "min_instances": 2,
    "max_instances": 10
  },
  "security": {
    "auto_updates": true,
    "restrict_ssh": true,
    "enable_waf": true,
    "enable_cloudwatch": true
  }
}
```

## Integration with Agents

### Recon Agent
Provides analysis that informs questions:
- Detected ports → suggest app port
- Required services → ask for versions
- Documentation hints → suggest configurations

### Provisioner Agent
Uses user config to create resources:
- Domain → Route53 + ALB
- SSL → ACM certificate
- Instance type → EC2 configuration
- Multi-AZ → RDS configuration

### Deployer Agent
Uses user config for deployment:
- App port → systemd service config
- Environment → environment variables
- Auto-scaling → deployment strategy

### Sheriff Agent
Uses user config for security:
- Restrict SSH → security group rules
- Auto updates → unattended-upgrades
- WAF → AWS WAF rules

## Future Enhancements

### 1. Smart Defaults
Learn from previous deployments:
```python
# Remember user preferences
if user_deployed_similar_app_before():
    suggest_previous_config()
```

### 2. Templates
Pre-configured templates:
```bash
python -m src.cli deploy <repo> "Deploy" --template wordpress
python -m src.cli deploy <repo> "Deploy" --template django-api
python -m src.cli deploy <repo> "Deploy" --template nextjs-app
```

### 3. Validation
Validate configurations:
```python
if config.budget_limit and estimated_cost > config.budget_limit:
    print(warning(f"⚠️  Estimated cost ${estimated_cost} exceeds budget ${config.budget_limit}"))
    suggest_cheaper_options()
```

### 4. Recommendations
AI-powered recommendations:
```python
if analysis.has_static_assets and not config.domain.enable_cdn:
    print(info("💡 Tip: Enable CDN for better performance with static assets"))
```

## Implementation Priority

### Phase 1 (MVP)
- [ ] Create configuration schema
- [ ] Build interactive prompter
- [ ] Update CLI to use prompter
- [ ] Pass config to agents

### Phase 2 (Enhanced)
- [ ] Add cost estimation
- [ ] Add config save/load
- [ ] Add --yes flag for CI/CD
- [ ] Add validation

### Phase 3 (Advanced)
- [ ] Add templates
- [ ] Add smart defaults
- [ ] Add AI recommendations
- [ ] Add budget controls

## Conclusion

Interactive deployment configuration transforms HiveMind from a "one-size-fits-all" tool into a **personalized deployment assistant** that understands and respects user preferences. This makes deployments more predictable, cost-effective, and tailored to specific needs.
