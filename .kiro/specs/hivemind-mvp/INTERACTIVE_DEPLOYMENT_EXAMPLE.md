# Interactive Deployment Example

This document shows what the interactive deployment experience looks like with smart recommendations.

## Example Session

```bash
$ python -m src.cli deploy https://github.com/user/django-app "Production"

🔍 Analyzing repository...
✅ Analysis complete!

Found: Python Django application
  - Framework: Django 4.2
  - Database: PostgreSQL (version 15 detected)
  - Port: 8000 detected
  - Services: Redis 7 detected

📋 Deployment Configuration
Based on the analysis, I have some questions to customize your deployment:

🌐 Domain & Networking

  What domain will you use? (leave blank for IP only)
  > myapp.com

  I detected port 8000. Use this port? [Y/n] [8000]
  > 

  Enable SSL/HTTPS? [Y/n]
  💡 Recommendation: Strongly recommended
     - Encrypts traffic between users and your app
     - Required for passwords, payments, sensitive data
     - Free with AWS Certificate Manager
     - Modern browsers show warnings without SSL
  > Y

💾 Database

  I detected PostgreSQL 15. Use this version? [Y/n] [15]
  > 

  Database instance size? [small/medium/large] [medium]
  💡 Recommendation: medium
     - Good for production apps with moderate traffic (1K-10K users)
     - Cost: ~$25/month
     - Balanced performance and cost
  > 

  Enable Multi-AZ for high availability? [Y/n]
  💡 Recommendation: Yes for production
     - Protects against datacenter failures
     - Automatic failover if one datacenter goes down
     - Doubles database cost (~$50/month) but ensures uptime
     - Recommended for business-critical applications
  > Y

🖥️  Compute

  Expected traffic level? [low/medium/high] [medium]
  💡 Recommendation: medium
     - Good for: 100-1000 concurrent users
     - Instance type: t3.small (~$15/month)
     - Can auto-scale if traffic increases
  > medium

  Instance type preference? [t3.small]
  💡 Recommendation: t3.small
     - 2 vCPUs, 2GB RAM
     - Cost: ~$15/month
     - Good balance for most web applications
  > 

  Enable auto-scaling? [Y/n]
  💡 Recommendation: Yes for production
     - Automatically adds servers during traffic spikes
     - Saves money by reducing servers during low traffic
     - Prevents downtime from unexpected load
     - Cost: Only pay for what you use
  > Y

  Minimum instances? [1]
  > 

  Maximum instances? [3]
  💡 Recommendation: 3
     - Allows scaling to handle 3x normal traffic
     - Good for handling viral content or marketing campaigns
  > 

🔒 Security

  Enable automatic security updates? [Y/n]
  💡 Recommendation: Strongly recommended
     - Automatically installs security patches
     - Keeps your server secure without manual work
     - Updates happen during low-traffic hours
  > Y

  Restrict SSH access to your IP? [Y/n]
  💡 Recommendation: Yes
     - Only allows SSH from your current IP address
     - Prevents unauthorized access attempts
     - You can add more IPs later if needed
  > Y

📊 Configuration Summary

Domain & Networking:
  - Domain: myapp.com
  - SSL/HTTPS: Enabled (free with AWS)
  - App Port: 8000
  - Expose Port: 443 (HTTPS)

Database:
  - Type: PostgreSQL 15
  - Size: medium (db.t3.small)
  - Multi-AZ: Enabled
  - Backup: 7 days retention

Compute:
  - Instance: t3.small (2 vCPU, 2GB RAM)
  - Auto-scaling: Enabled (1-3 instances)
  - Expected traffic: Medium (100-1000 users)

Security:
  - Auto-updates: Enabled
  - SSH: Restricted to your IP
  - Firewall: Enabled
  - CloudWatch: Enabled

💰 Estimated Monthly Cost: $92.50
  - EC2 (t3.small): $15.00/month
  - RDS (db.t3.small, Multi-AZ): $50.00/month
  - Data transfer: $10.00/month
  - Load balancer: $17.50/month

🚀 Ready to deploy? [Y/n] > Y

Deploying to AWS...
✅ Deployment successful!
```

## Key Features Demonstrated

### 1. Smart Defaults
- Uses detected values (PostgreSQL 15, port 8000)
- Adjusts recommendations based on environment (production)
- Suggests appropriate sizes based on traffic

### 2. Helpful Explanations
- Explains what each option does
- Shows cost implications
- Uses simple, non-technical language
- Highlights security benefits

### 3. Cost Transparency
- Shows estimated monthly costs
- Breaks down costs by service
- Warns about cost implications (Multi-AZ doubles cost)

### 4. Guided Decision Making
- Recommends best practices
- Explains trade-offs
- Helps non-technical users make informed choices

### 5. Confirmation Before Deploy
- Shows complete configuration summary
- Displays total estimated cost
- Asks for final confirmation

## For Non-Technical Users

The recommendations help answer common questions:

**"What size database do I need?"**
→ System explains small/medium/large in terms of users, not technical specs

**"Should I enable SSL?"**
→ System explains it's required for passwords and free, making the choice obvious

**"What's Multi-AZ?"**
→ System explains it prevents downtime if a datacenter fails

**"How much will this cost?"**
→ System shows exact monthly costs before deploying

## For Technical Users

Technical users can:
- Skip recommendations by just pressing Enter (uses defaults)
- Override any recommendation
- Use `--config` file to skip all prompts
- Use `--yes` flag for fully automated deployments

## Example with Minimal Input

For users who trust the recommendations:

```bash
$ python -m src.cli deploy https://github.com/user/app "Deploy"

🔍 Analyzing repository...
✅ Found: Node.js Express app with MongoDB

📋 Deployment Configuration

  Domain? > myapp.com
  Use detected port 3000? [Y/n] > 
  Enable SSL? [Y/n] > 
  Use MongoDB 6? [Y/n] > 
  Database size? [small/medium/large] [small] > 
  Traffic level? [low/medium/high] [medium] > 
  Enable auto-scaling? [Y/n] > 

💰 Estimated: $45/month
🚀 Deploy? [Y/n] > Y

Deploying...
```

Just 7 questions, most answered with Enter!
