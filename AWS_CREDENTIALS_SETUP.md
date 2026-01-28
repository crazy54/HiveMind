# AWS Credentials Setup for Testing

## Overview

For end-to-end testing, AWS credentials are required even in What-If mode for API validation and cost estimation.

## Setup Instructions

### Option 1: Environment Variables (Recommended for Testing)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your AWS credentials:
   ```bash
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   ```

3. Verify credentials are loaded:
   ```bash
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('AWS Key:', os.getenv('AWS_ACCESS_KEY_ID')[:10] + '...')"
   ```

### Option 2: AWS CLI Profile

If you have AWS CLI configured with profiles:

```bash
export AWS_PROFILE=your-profile-name
```

Or modify the agent code to use a specific profile.

### Option 3: IAM Role (For EC2/ECS)

If running on AWS infrastructure, use IAM roles instead of access keys.

## Required Permissions

For What-If mode testing, minimal permissions are needed:
- `sts:GetCallerIdentity` (verify credentials)
- `pricing:GetProducts` (cost estimation)
- `ec2:DescribeRegions` (region validation)

For full testing (after bug fixes):
- Full deployment permissions will be needed
- See TESTING_GUIDE.md for complete permission list

## Security Notes

- **Never commit `.env` file to git** (already in .gitignore)
- Use temporary credentials when possible
- Rotate access keys regularly
- Use least privilege principle
- Consider using AWS SSO for better security

## Verification

Test that credentials work:

```bash
# Using AWS CLI
aws sts get-caller-identity --no-cli-pager

# Using Python
python -c "import boto3; print(boto3.client('sts').get_caller_identity())"
```

## What-If Mode

In What-If mode:
- No actual AWS resources are created
- Credentials are used only for validation
- Cost estimates are calculated
- Infrastructure plans are generated
- Safe to run without production access

## Troubleshooting

### Credentials Not Found
- Check `.env` file exists and has correct values
- Verify environment variables are loaded
- Check AWS CLI configuration (`~/.aws/credentials`)

### Permission Denied
- Verify IAM user has required permissions
- Check if MFA is required
- Verify credentials are not expired

### Region Issues
- Ensure `AWS_REGION` is set correctly
- Some services are region-specific
- Default region is `us-east-1`

## Ready for Testing

Once credentials are configured:
1. Verify with `aws sts get-caller-identity`
2. Run test scenario 1 (Randy Recon)
3. Monitor for credential-related errors
4. Document any issues in BUG_TRACKING.md
