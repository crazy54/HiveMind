# Quick Start Guide

## Testing the System

### 1. Install Dependencies

```bash
# Activate virtual environment (if not already activated)
source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Property Tests (No AWS Required!)

```bash
# Run all property-based tests (55 tests, ~30 seconds)
pytest -m property -v --hypothesis-show-statistics

# These tests:
# ✅ Require NO AWS credentials
# ✅ Require NO network access
# ✅ Run fast (< 30 seconds)
# ✅ Test all core behaviors
# ✅ Generate 100+ test cases per property
```

### 3. Run Unit Tests

```bash
# Run all tests
pytest -v

# Run specific test suites
pytest tests/test_orchestration_property.py -v
pytest tests/test_alb_integration.py -v
pytest tests/test_build_system_property.py -v

# Run with coverage
pytest --cov=src tests/
```

### 4. Test What-If Mode (Safe!)

```bash
# Simulate deployment without AWS charges
python -m src.cli deploy https://github.com/user/my-app "Test" --what-if

# Output shows:
# - Estimated monthly costs
# - Resources to be created
# - Timeline predictions
# - No actual AWS resources created!
```

## What Works Now

✅ **Core Functionality** (No AWS needed)
- Repository analysis and tech stack detection
- Build tools for Node.js, Python, Go
- State management
- Error handling
- All schemas and data models
- **55 property-based tests** ✨ NEW

✅ **With AWS Credentials**
- Real AWS resource creation (VPC, EC2, RDS, ALB)
- Application deployment via SSH
- Security hardening
- Complete rollback and cleanup
- Resource tracking and cost estimation

## Testing Without AWS

**All property tests work without AWS credentials:**

```bash
# Run property tests (no credentials needed)
pytest -m property -v

# These tests cover:
# - Orchestration logic
# - Tech stack detection
# - Build system
# - Infrastructure decisions
# - Deployment configuration
# - Security policies
# - Error handling
# - State management
```

## Testing With AWS

To test with real AWS:

```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Run full test suite
pytest -v
```

## CLI Commands

### Deploy Commands
```bash
# Simulate deployment (safe, no AWS charges)
python -m src.cli deploy https://github.com/user/app "Test" --what-if

# Real deployment
python -m src.cli deploy https://github.com/user/app "Production v1.0"

# With verbose output
python -m src.cli deploy https://github.com/user/app "Deploy" --verbose
```

### Management Commands ✨ NEW
```bash
# Check status
python -m src.cli status <deployment-id>

# Show deployment plan
python -m src.cli plan <deployment-id>

# Retry failed deployment
python -m src.cli retry <deployment-id>

# Rollback deployment (delete all resources)
python -m src.cli rollback <deployment-id>

# Destroy deployment
python -m src.cli destroy <deployment-id> --force

# Reconcile state with AWS
python -m src.cli reconcile <deployment-id>

# Find orphaned resources
python -m src.cli find-orphans
```

## Next Steps

1. ✅ Run `pytest -v` to see all tests
2. ✅ Check `TESTING_GUIDE.md` for detailed testing info
3. ✅ Review `PROJECT_COMPLETE.md` for full feature list
4. ⚠️ Configure AWS credentials for full functionality
5. ⚠️ Configure Strands/Bedrock for AI agents

## Troubleshooting

### Import Errors
```bash
pip install -r requirements.txt
```

### Strands Agent Errors
The Strands agents require:
- AWS credentials (for Bedrock)
- `strands-agents` package installed

For now, you can use the original (non-Strands) agents:
```python
from src.agents.conductor import ConductorAgent  # Works without Strands
```

### Test Failures
```bash
# Run with verbose output
pytest -v -s

# Run specific failing test
pytest tests/test_name.py::test_function -v
```

## Summary

- ✅ **120+ tests** ready to run
- ✅ **Most tests work** without AWS (using mocks)
- ✅ **Core functionality** fully implemented
- ⚠️ **Strands agents** need AWS Bedrock access
- ⚠️ **Real deployments** need AWS credentials

**Start here**: `pytest -v` or `./run_tests.sh quick`


## CLI Commands

### Deploy
Deploy an application from a repository:
```bash
python3 src/cli.py deploy <repo-url> "<description>"
python3 src/cli.py deploy <repo-url> "<description>" --what-if  # Dry run
python3 src/cli.py deploy <repo-url> "<description>" --verbose  # Detailed output
```

### Analyze
Analyze repository without deploying (Recon agent only):
```bash
python3 src/cli.py analyze <repo-url>
python3 src/cli.py analyze <repo-url> --output analysis.json
```

### Status
Check deployment status:
```bash
python3 src/cli.py status <deployment-id>
python3 src/cli.py status <deployment-id> --verbose
python3 src/cli.py status <deployment-id> --show-plan  # For what-if deployments
```

### Plan
Show deployment plan:
```bash
python3 src/cli.py plan <deployment-id>
```

### List
List all deployments:
```bash
python3 src/cli.py list
python3 src/cli.py list --status completed
python3 src/cli.py list --limit 10
python3 src/cli.py list --verbose  # Show statistics
```

### Destroy
Tear down deployment and delete all resources:
```bash
python3 src/cli.py destroy <deployment-id>
python3 src/cli.py destroy <deployment-id> --force  # Skip confirmation
python3 src/cli.py destroy <deployment-id> --skip-snapshot  # Skip RDS backup
python3 src/cli.py destroy <deployment-id> --verbose  # Detailed output
```

### Retry
Retry a failed deployment:
```bash
python3 src/cli.py retry <deployment-id>
```

## Resource Tracking

HiveMind now tracks all AWS resources created during deployment:

- **Automatic Tracking**: Resources tracked with IDs, costs, dependencies
- **AWS Tagging**: All resources tagged with `HM-*` tags for identification
- **Safe Cleanup**: Resources deleted in correct dependency order
- **Cost Tracking**: Monthly cost estimates per deployment

See [RESOURCE_TRACKING.md](RESOURCE_TRACKING.md) for details.


## Testing SSH Key Integration

### Standalone SSH Key Test

Test SSH key generation and cleanup without a full deployment:

```bash
python3 -c "
from src.tools.ssh_keys import setup_deployment_keys, cleanup_deployment_keys

# Generate keys
print('🔑 Generating SSH keys...')
key_info = setup_deployment_keys('test-123', 'us-east-1', './deployments')
print(f'✅ Keys generated:')
print(f'   Private: {key_info[\"private_key_path\"]}')
print(f'   Public: {key_info[\"public_key_path\"]}')
print(f'   AWS: {key_info[\"aws_key_name\"]}')

# Verify files exist
import os
assert os.path.exists(key_info['private_key_path']), 'Private key not found'
assert os.path.exists(key_info['public_key_path']), 'Public key not found'
print('✅ Key files verified')

# Cleanup
print('\\n🧹 Cleaning up...')
results = cleanup_deployment_keys('test-123', 'us-east-1', './deployments')
print(f'✅ Cleanup complete')
print(f'   AWS deleted: {results[\"aws_deleted\"]}')
print(f'   Local deleted: {results[\"local_deleted\"]}')
if results['errors']:
    print(f'   Errors: {results[\"errors\"]}')
"
```

### Test Deployment with SSH Keys

Deploy a simple application and verify SSH key integration:

```bash
# Deploy with what-if mode (no SSH keys generated)
python3 src/cli.py deploy https://github.com/user/simple-app "Test deployment" --what-if

# Deploy for real (SSH keys will be generated)
python3 src/cli.py deploy https://github.com/user/simple-app "Test deployment"

# Check deployment status
python3 src/cli.py status <deployment-id>

# Verify SSH keys exist
ls -la deployments/<deployment-id>/*.pem
ls -la deployments/<deployment-id>/*.pub

# Destroy deployment (SSH keys will be cleaned up)
python3 src/cli.py destroy <deployment-id>
```

### Manual SSH Connection Test

If you have a running EC2 instance with the generated key:

```bash
# Get deployment ID from status command
DEPLOYMENT_ID="your-deployment-id"

# Get EC2 public IP from AWS console or:
aws ec2 describe-instances \
  --filters "Name=tag:DeploymentId,Values=$DEPLOYMENT_ID" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text \
  --no-cli-pager

# SSH to instance using generated key
ssh -i deployments/$DEPLOYMENT_ID/autodeploy-$DEPLOYMENT_ID.pem ec2-user@<public-ip>
```

## Next Steps

See [SSH_KEY_INTEGRATION.md](SSH_KEY_INTEGRATION.md) for complete documentation on SSH key management.
