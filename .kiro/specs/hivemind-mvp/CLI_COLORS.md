# HiveMind CLI Color Guide

The HiveMind CLI uses color-coded output to help you quickly understand what's happening during deployments and analysis. Different colors represent different types of information, making it easier to scan logs and identify issues at a glance.

## Color Scheme

### 🔵 Light Blue - Tools
**Used for:** Tool names, file names, and technical identifiers

Examples:
- `clone_repository`
- `read_repository_documentation`
- `package.json`
- `requirements.txt`

### 🟠 Orange - Actions
**Used for:** Action verbs and active processes

Examples:
- `analyzing`
- `cloning`
- `building`
- `deploying`
- `provisioning`
- `configuring`

### 🔴 Red - Failures
**Used for:** Errors, failures, and critical issues

Examples:
- `error`
- `failed`
- `exception`
- `critical`
- `fatal`

### 🟡 Yellow - Tool Calls
**Used for:** Tool invocation messages (format: "Tool #N: action")

Examples:
- `Tool #1: clone_repository`
- `Tool #2: read_repository_documentation`
- `Tool #3: analyze_environment_variables`

### 🟢 Green - Success
**Used for:** Success messages and completion notifications

Examples:
- `✅ Analysis complete!`
- `✅ Deployment successful!`
- `✅ Build completed`

### 🔵 Cyan - Info
**Used for:** Informational headers and section titles

Examples:
- `🔍 Analyzing repository...`
- `📄 Documentation Found`
- `🗄️ Required Services`

### 🟡 Yellow - Warnings
**Used for:** Warnings and important notices

Examples:
- `🔮 WHAT-IF MODE: Simulating deployment`
- `⚠️ Missing configuration file`
- Required environment variables

## Visual Examples

### Analyze Command Output

```bash
$ python -m src.cli analyze https://github.com/user/app
```

```
🔍 Analyzing repository...                    # Cyan (Info)
Repository: https://github.com/user/app

Tool #1: clone_repository                     # Yellow (Tool Call)
Cloning repository to analyze...              # Green (Action)

Tool #2: read_repository_documentation        # Yellow (Tool Call)
Reading documentation files...                # Green (Action)

Tool #3: analyze_environment_variables        # Yellow (Tool Call)
Extracting environment variables...           # Green (Action)

✅ Analysis complete!                          # Green (Success)

📄 Documentation Found (3 files):             # Cyan (Info)
  - README.md                                 # Light Blue (Tool)
  - DEPLOY.md                                 # Light Blue (Tool)
  - docker-compose.yml                        # Light Blue (Tool)

🗄️ Required Services (2):                     # Cyan (Info)
  - PostgreSQL 14                             # Green (Action)
  - Redis 7                                   # Green (Action)

🔧 Environment Variables (5):                 # Cyan (Info)
  - DATABASE_URL (required)                   # Yellow (Warning - required)
  - REDIS_URL (required)                      # Yellow (Warning - required)
  - SECRET_KEY (required)                     # Yellow (Warning - required)
  - DEBUG (optional)                          # Light Blue (Tool - optional)
  - LOG_LEVEL (optional)                      # Light Blue (Tool - optional)

💡 Recommendations (3):                        # Cyan (Info)
  - Use managed PostgreSQL (RDS)
  - Enable SSL/TLS for production
  - Configure auto-scaling for high traffic
```

### Deploy Command Output

```bash
$ python -m src.cli deploy https://github.com/user/app "Production deployment"
```

```
🚀 Starting deployment...                     # Green (Action)
Repository: https://github.com/user/app
Description: Production deployment

Tool #1: clone_repository                     # Yellow (Tool Call)
Tool #2: analyze_repository                   # Yellow (Tool Call)
Tool #3: build_application                    # Yellow (Tool Call)
Building application...                       # Green (Action)

✅ Deployment successful!                      # Green (Success)
Deployment ID: dep_abc123xyz                  # Cyan (Info)
```

### What-If Mode Output

```bash
$ python -m src.cli deploy https://github.com/user/app "Test" --what-if
```

```
🔮 WHAT-IF MODE: Simulating deployment        # Yellow (Warning)
(no actual changes will be made)

✅ What-if analysis complete!                  # Green (Success)

💰 Predicted Monthly Costs:
  Total: $127.44/month
  EC2: $73.00/month
  RDS: $48.00/month
  Data Transfer: $6.44/month

🏗️ Resources That Would Be Created:
  VPC: 1
  Subnets: 2
  Security Groups: 2
  EC2 Instances: 1
  RDS Instances: 1
```

### Error Output

```bash
$ python -m src.cli deploy https://github.com/invalid/repo "Test"
```

```
🚀 Starting deployment...                     # Green (Action)

Tool #1: clone_repository                     # Yellow (Tool Call)
Error: Repository not found                   # Red (Failure)
Failed to clone repository                    # Red (Failure)

❌ Deployment failed!                          # Red (Failure)
Error: Could not access repository            # Red (Failure)
```

## Benefits of Color-Coded Output

### 1. **Quick Scanning**
Colors help you quickly scan through logs to find what you're looking for:
- Looking for errors? Scan for red text
- Want to see what tools ran? Look for yellow "Tool #N" lines
- Checking if it succeeded? Look for green checkmarks

### 2. **Context at a Glance**
The color scheme provides immediate context:
- Yellow tool calls show the sequence of operations
- Green actions show what's currently happening
- Red errors stand out immediately

### 3. **Better Debugging**
When troubleshooting:
- Red errors are immediately visible
- Yellow tool calls show where the process stopped
- Green actions show what completed successfully

### 4. **Professional Appearance**
Color-coded output makes the CLI feel modern and polished, improving the user experience.

## Testing Colors

Run the color test script to see all colors in action:

```bash
python test_colors.py
```

This will display:
- All color types with examples
- Formatted agent output with colors
- A color legend for reference

## Disabling Colors

If you need plain text output (for logging to files or CI/CD), you can disable colors by redirecting output:

```bash
# Colors will be automatically disabled when piping
python -m src.cli analyze https://github.com/user/app > output.txt

# Or use the NO_COLOR environment variable
NO_COLOR=1 python -m src.cli analyze https://github.com/user/app
```

## Implementation Details

Colors are implemented using ANSI escape codes in `src/utils/colors.py`:

- **Light Blue**: `\033[94m` - Tools and identifiers
- **Orange**: `\033[38;5;208m` - Actions and verbs (distinct from success green)
- **Red**: `\033[91m` - Errors and failures
- **Yellow**: `\033[93m` - Tool calls and warnings
- **Green**: `\033[92m` - Success messages
- **Cyan**: `\033[96m` - Info messages
- **Reset**: `\033[0m` - Return to default color

The `format_agent_output()` function automatically applies colors to agent output by detecting patterns:
- Tool calls: `Tool #N: action`
- Tool names: Words ending in `_tool`, `_repository`, `_documentation`
- Action verbs: Common verbs like `analyzing`, `building`, `deploying`
- Error keywords: `error`, `failed`, `exception`, `critical`

## Color Accessibility

The color scheme was chosen to be:
- **High contrast** - Easy to read on both light and dark terminals
- **Distinct** - Each color serves a unique purpose (orange vs green for actions vs success)
- **Meaningful** - Colors match common conventions (red=error, green=success, orange=action)
- **Terminal-safe** - Uses standard ANSI colors supported by all modern terminals

If you have color vision deficiency, the CLI also uses:
- Emojis for additional context (✅, ❌, 🔍, etc.)
- Clear text labels alongside colors
- Structured formatting with indentation

## Examples by Command

### `analyze` Command
- **Cyan**: Section headers (Documentation Found, Required Services)
- **Light Blue**: File names, tool names, optional variables
- **Yellow**: Tool calls, required variables
- **Green**: Actions, service names
- **Red**: Errors

### `deploy` Command
- **Yellow**: What-if mode warning
- **Green**: Deployment actions, success messages
- **Cyan**: Deployment ID, info sections
- **Red**: Deployment failures

### `status` Command
- **Cyan**: Status headers, deployment ID
- **Green**: Status values, active processes
- **Yellow**: What-if mode indicator
- **Red**: Error messages

### `plan` Command
- **Cyan**: Plan sections
- **Green**: Resource counts, timeline estimates
- **Light Blue**: Resource names

### `retry` Command
- **Green**: Retry actions, success
- **Red**: Retry failures

## Tips for Reading Colored Output

1. **Start with yellow** - Tool calls show the sequence of operations
2. **Follow the green** - Actions show progress through the workflow
3. **Watch for red** - Errors indicate where things went wrong
4. **Check cyan headers** - Section headers organize information
5. **Note light blue** - Technical details and identifiers

## Future Enhancements

Potential future improvements to the color system:
- Configurable color schemes (themes)
- Color intensity levels (dim/bright)
- More granular coloring for specific data types
- Progress bars with colors
- Syntax highlighting for code snippets
- Color-coded diff output for configuration changes
