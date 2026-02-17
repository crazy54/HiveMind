# HiveMind AutoDeploy - CLI Guide

## Overview

The HiveMind CLI provides a simple interface to deploy applications using 6 specialized AI agents.

**✨ New Feature:** The CLI now features **color-coded output** for better readability! See [CLI_COLORS.md](CLI_COLORS.md) for the complete color guide.

## Installation

```bash
# Activate virtual environment
source .venv/bin/activate

# Verify installation
python -m src.cli --help
```

## Quick Start

```bash
# 1. Analyze a repository (safe, fast)
python -m src.cli analyze https://github.com/user/app

# 2. Simulate deployment (safe, no AWS charges)
python -m src.cli deploy https://github.com/user/app "Test" --what-if

# 3. Real deployment (requires AWS credentials)
python -m src.cli deploy https://github.com/user/app "Production deploy"

# 4. Check status
python -m src.cli status <deployment-id>
```

## Commands

### `analyze` - Repository Analysis

Runs the Recon agent to analyze repository documentation without deploying.

**Usage:**
```bash
python -m src.cli analyze <repo-url> [description] [options]
```

**Arguments:**
- `repo-url` - GitHub/GitLab repository URL (required)
- `description` - Analysis description (optional, default: "Repository analysis")

**Options:**
- `--output`, `-o` - Save results to JSON file
- `--verbose`, `-v` - Show detailed output

**Examples:**
```bash
# Basic analysis
python -m src.cli analyze https://github.com/user/app

# With description
python -m src.cli analyze https://github.com/user/app "Analyze for deployment"

# Save to file
python -m src.cli analyze https://github.com/user/app -o analysis.json

# Verbose output
python -m src.cli analyze https://github.com/user/app --verbose
```

**Output:**
- Documentation found
- Required services (databases, caches, etc.)
- Environment variables
- Deployment steps
- Port requirements
- SSL/domain needs
- Recommendations

**Use Cases:**
- Quick repository assessment
- Pre-deployment validation
- Documentation review
- Requirements gathering

---

### `deploy` - Full Deployment

Orchestrates all 6 agents to deploy an application.

**Usage:**
```bash
python -m src.cli deploy <repo-url> <description> [options]
```

**Arguments:**
- `repo-url` - GitHub/GitLab repository URL (required)
- `description` - Deployment description (required)

**Options:**
- `--what-if` - Simulate without making changes (dry-run)
- `--verbose`, `-v` - Show detailed output and all logs
- `--region` - AWS region (default: us-east-1)
- `--state-dir` - State directory (default: ./deployments)

**Examples:**
```bash
# What-if mode (safe, no AWS charges)
python -m src.cli deploy https://github.com/user/app "Test deployment" --what-if

# Real deployment
python -m src.cli deploy https://github.com/user/app "Production v1.0"

# With verbose output
python -m src.cli deploy https://github.com/user/app "Deploy" --verbose

# Different region
python -m src.cli deploy https://github.com/user/app "Deploy" --region us-west-2

# Custom state directory
python -m src.cli deploy https://github.com/user/app "Deploy" --state-dir /path/to/states
```

**Workflow:**
1. 🔍 **Recon** - Analyzes documentation
2. 🔨 **Compiler** - Builds application
3. ☁️  **Provisioner** - Creates AWS infrastructure
4. 🚀 **Deployer** - Deploys application
5. 🔒 **Sheriff** - Hardens security
6. ✅ **Complete** - Returns deployment ID

**What-If Mode:**
- No AWS resources created
- No actual changes made
- Generates predictions:
  - Monthly cost estimates
  - Resources to be created
  - Timeline estimates
- Perfect for testing and validation

---

### `plan` - Show Deployment Plan

Shows detailed deployment plan for a deployment.

**Usage:**
```bash
python -m src.cli plan <deployment-id>
```

**Arguments:**
- `deployment-id` - Deployment ID from deploy command (required)

**Examples:**
```bash
# Show plan
python -m src.cli plan abc-123-def-456
```

**Output:**
- Tech stack detected
- Cost predictions (if what-if)
- Resources to create (if what-if)
- Timeline estimates (if what-if)
- Actual infrastructure (if deployed)
- Application configuration
- Security configuration

**Use Cases:**
- Review what-if predictions
- Verify deployment configuration
- Check infrastructure details
- Audit deployments

---

### `status` - Check Deployment Status

Shows current status and logs for a deployment.

**Usage:**
```bash
python -m src.cli status <deployment-id> [options]
```

**Arguments:**
- `deployment-id` - Deployment ID (required)

**Options:**
- `--show-plan` - Show deployment plan (for what-if deployments)
- `--verbose`, `-v` - Show all logs

**Examples:**
```bash
# Basic status
python -m src.cli status abc-123-def-456

# With deployment plan
python -m src.cli status abc-123-def-456 --show-plan

# All logs
python -m src.cli status abc-123-def-456 --verbose
```

**Output:**
- Deployment ID
- Current status
- Repository URL
- Start/completion time
- Error messages (if any)
- Infrastructure details
- Recent logs (or all with --verbose)

---

### `retry` - Retry Failed Deployment

Retries a failed deployment from the last successful stage.

**Usage:**
```bash
python -m src.cli retry <deployment-id>
```

**Arguments:**
- `deployment-id` - Deployment ID to retry (required)

**Examples:**
```bash
# Retry deployment
python -m src.cli retry abc-123-def-456
```

**Use Cases:**
- Recover from transient failures
- Resume after fixing issues
- Retry after AWS quota increases

---

## Global Options

These options work with all commands:

- `--state-dir` - Directory for deployment state files (default: ./deployments)
- `--region` - AWS region (default: us-east-1)

**Examples:**
```bash
# Custom state directory
python -m src.cli --state-dir /path/to/states deploy <repo> "Deploy"

# Different region
python -m src.cli --region us-west-2 deploy <repo> "Deploy"
```

---

## Common Workflows

### 1. Safe Deployment Workflow

```bash
# Step 1: Analyze repository
python -m src.cli analyze https://github.com/user/app

# Step 2: Simulate deployment
python -m src.cli deploy https://github.com/user/app "Test" --what-if

# Step 3: Review predictions
python -m src.cli plan <deployment-id>

# Step 4: Real deployment
python -m src.cli deploy https://github.com/user/app "Production"

# Step 5: Monitor status
python -m src.cli status <deployment-id>
```

### 2. Quick Deployment

```bash
# Deploy directly (if confident)
python -m src.cli deploy https://github.com/user/app "Quick deploy"

# Check status
python -m src.cli status <deployment-id>
```

### 3. Analysis Only

```bash
# Just analyze, don't deploy
python -m src.cli analyze https://github.com/user/app -o analysis.json

# Review analysis
cat analysis.json | jq .
```

### 4. Troubleshooting

```bash
# Deploy with verbose output
python -m src.cli deploy <repo> "Debug" --verbose

# Check detailed status
python -m src.cli status <deployment-id> --verbose

# Retry if failed
python -m src.cli retry <deployment-id>
```

---

## Output Formats

### Success Output

```
✅ Deployment successful!
Deployment ID: abc-123-def-456

Status: COMPLETED

📦 Tech Stack:
  Language: Node.js
  Framework: Express
  Runtime: 18.x

🏗️  Infrastructure:
  Instance ID: i-1234567890abcdef0
  Public IP: 54.123.45.67
  Database: myapp.abc123.us-east-1.rds.amazonaws.com

🚀 Application:
  Port: 3000
  Service: app
  Status: running

📝 Recent Logs (last 10 of 45):
  [2025-12-08T14:00:00] 🚀 Deployment abc-123 created
  [2025-12-08T14:00:01] 🔍 HiveMind SA analyzing...
  ...
```

### What-If Output

```
✅ What-if analysis complete!
Deployment ID: abc-123-def-456

Status: DRY_RUN

💰 Predicted Monthly Costs:
  Total: $45.67/month
  EC2: $15.18/month
  RDS: $12.41/month
  Data Transfer: $10.00/month

🏗️  Resources That Would Be Created:
  VPC: 1
  Subnets: 2
  Security Groups: 1
  EC2 Instances: 1
  RDS Instances: 1

⏱️  Estimated Timeline:
  Total: 13-27 minutes
```

### Error Output

```
❌ Deployment failed!
Error: Failed to provision infrastructure: AWS quota exceeded

📝 Recent Logs:
  [2025-12-08T14:00:00] 🚀 Deployment started
  [2025-12-08T14:00:30] ❌ Provisioner failed: Quota exceeded
```

---

## Exit Codes

- `0` - Success
- `1` - Error (deployment failed, invalid input, etc.)

**Usage in scripts:**
```bash
#!/bin/bash

# Deploy and check exit code
if python -m src.cli deploy <repo> "Deploy" --what-if; then
    echo "What-if successful, proceeding..."
    python -m src.cli deploy <repo> "Deploy"
else
    echo "What-if failed, aborting"
    exit 1
fi
```

---

## Environment Variables

### AWS Configuration

```bash
# AWS credentials
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Or use AWS CLI
aws configure
```

### Deployment Configuration

```bash
# Custom state directory
export DEPLOYMENT_STATE_DIR=./deployments

# Custom region
export AWS_DEFAULT_REGION=us-west-2
```

---

## Tips & Best Practices

### 1. Always Use What-If First

```bash
# Good practice
python -m src.cli deploy <repo> "Deploy" --what-if  # Check first
python -m src.cli deploy <repo> "Deploy"            # Then deploy

# Risky
python -m src.cli deploy <repo> "Deploy"  # Deploying blind!
```

### 2. Save Analysis Results

```bash
# Save for documentation
python -m src.cli analyze <repo> -o analysis-$(date +%Y%m%d).json
```

### 3. Use Verbose Mode for Debugging

```bash
# See everything
python -m src.cli deploy <repo> "Debug" --verbose
```

### 4. Monitor Long-Running Deployments

```bash
# In one terminal
python -m src.cli deploy <repo> "Deploy"

# In another terminal
watch -n 5 'python -m src.cli status <deployment-id>'
```

### 5. Keep Deployment IDs

```bash
# Save deployment ID
DEPLOYMENT_ID=$(python -m src.cli deploy <repo> "Deploy" | grep "Deployment ID:" | cut -d: -f2 | tr -d ' ')
echo $DEPLOYMENT_ID > deployment-id.txt

# Use later
python -m src.cli status $(cat deployment-id.txt)
```

---

## Troubleshooting

### Command Not Found

```bash
# Make sure you're in the right directory
cd /path/to/autodeploy-agent

# Activate virtual environment
source .venv/bin/activate

# Try again
python -m src.cli --help
```

### AWS Credentials Error

```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### Deployment Stuck

```bash
# Check status with verbose
python -m src.cli status <deployment-id> --verbose

# If truly stuck, retry
python -m src.cli retry <deployment-id>
```

### Invalid Repository URL

```bash
# Supported formats:
https://github.com/user/repo
https://github.com/user/repo.git
https://gitlab.com/user/repo
git@github.com:user/repo.git
```

---

## Advanced Usage

### Scripting

```bash
#!/bin/bash
set -e

REPO="https://github.com/user/app"
DESC="Automated deployment"

# Analyze
echo "Analyzing repository..."
python -m src.cli analyze "$REPO" -o analysis.json

# Check if PostgreSQL is required
if grep -q "postgresql" analysis.json; then
    echo "PostgreSQL detected, proceeding..."
else
    echo "No database detected"
fi

# What-if
echo "Running what-if analysis..."
python -m src.cli deploy "$REPO" "$DESC" --what-if

# Deploy
echo "Deploying..."
python -m src.cli deploy "$REPO" "$DESC"
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: What-if analysis
        run: |
          python -m src.cli deploy ${{ github.repository }} \
            "Deploy from CI" --what-if
      
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          python -m src.cli deploy ${{ github.repository }} \
            "Deploy from CI"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Color-Coded Output

The CLI uses colors to make output easier to read and understand:

- 🔵 **Light Blue** - Tools, file names, technical identifiers
- 🟢 **Neon Green** - Actions, verbs, progress indicators
- 🔴 **Red** - Errors, failures, critical issues
- 🟡 **Yellow** - Tool calls ("Tool #N: action"), warnings
- 🔵 **Cyan** - Info headers, section titles
- 🟢 **Green** - Success messages, completions

**Example:**
```bash
$ python -m src.cli analyze https://github.com/user/app

🔍 Analyzing repository...                    # Cyan
Tool #1: clone_repository                     # Yellow
Cloning repository...                         # Green
✅ Analysis complete!                          # Green

📄 Documentation Found:                        # Cyan
  - README.md                                 # Light Blue
  - package.json                              # Light Blue
```

**Test colors:**
```bash
python test_colors.py
```

**See full color guide:** [CLI_COLORS.md](CLI_COLORS.md)

---

## See Also

- `README.md` - Project overview
- `CLI_COLORS.md` - **Color guide and examples**
- `WHAT_IF_MODE.md` - What-if mode guide
- `NEXT_STEPS.md` - Development roadmap
- `example_what_if.py` - Usage examples
- `test_colors.py` - Test color output

---

**Need help?** Run `python -m src.cli --help` for quick reference.
