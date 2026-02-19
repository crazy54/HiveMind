#!/bin/bash
# HiveMind AutoDeploy Installation Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐝 HiveMind AutoDeploy Installer${NC}"
echo "=================================="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✅ Python ${PYTHON_VERSION} found${NC}"

# Get installation directory
INSTALL_DIR="${1:-$HOME/.hivemind}"
echo -e "📁 Installation directory: ${BLUE}${INSTALL_DIR}${NC}"
echo ""

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy files
echo -e "${YELLOW}📦 Installing HiveMind...${NC}"
rsync -av --exclude='.git' --exclude='.venv' --exclude='__pycache__' \
    --exclude='HiveMind-Work' --exclude='.pytest_cache' --exclude='.hypothesis' \
    ./ "$INSTALL_DIR/"

echo -e "${GREEN}✅ Files copied${NC}"

# Create virtual environment
echo ""
echo -e "${YELLOW}🔧 Setting up Python environment...${NC}"
cd "$INSTALL_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Make bin scripts executable
chmod +x "$INSTALL_DIR/bin/hivemind"
chmod +x "$INSTALL_DIR/bin/hm"

# Detect shell and add to PATH
SHELL_NAME=$(basename "$SHELL")
SHELL_RC=""

case "$SHELL_NAME" in
    bash)
        SHELL_RC="$HOME/.bashrc"
        ;;
    zsh)
        SHELL_RC="$HOME/.zshrc"
        ;;
    fish)
        SHELL_RC="$HOME/.config/fish/config.fish"
        ;;
    *)
        SHELL_RC="$HOME/.profile"
        ;;
esac

echo ""
echo -e "${YELLOW}🔗 Adding to PATH...${NC}"

# Add to PATH if not already there
PATH_EXPORT="export PATH=\"\$PATH:$INSTALL_DIR/bin\""

if [ -f "$SHELL_RC" ]; then
    if grep -q "$INSTALL_DIR/bin" "$SHELL_RC"; then
        echo -e "${BLUE}ℹ️  Already in PATH${NC}"
    else
        echo "" >> "$SHELL_RC"
        echo "# HiveMind AutoDeploy" >> "$SHELL_RC"
        echo "$PATH_EXPORT" >> "$SHELL_RC"
        echo -e "${GREEN}✅ Added to ${SHELL_RC}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not find shell config file${NC}"
    echo -e "   Add this to your shell config manually:"
    echo -e "   ${BLUE}${PATH_EXPORT}${NC}"
fi

# Create man page directory
echo ""
echo -e "${YELLOW}📖 Installing man pages...${NC}"
MAN_DIR="$HOME/.local/share/man/man1"
mkdir -p "$MAN_DIR"

# Create man page
cat > "$MAN_DIR/hivemind.1" << 'EOF'
.TH HIVEMIND 1 "January 2026" "HiveMind 1.0" "User Commands"
.SH NAME
hivemind, hm \- Intelligent multi-agent deployment system
.SH SYNOPSIS
.B hivemind
[\fIOPTIONS\fR] \fICOMMAND\fR [\fIARGS\fR]
.br
.B hm
[\fIOPTIONS\fR] \fICOMMAND\fR [\fIARGS\fR]
.SH DESCRIPTION
HiveMind AutoDeploy is a multi-agent AI system that automatically deploys applications from source code repositories to AWS infrastructure.
.PP
The system uses 6 specialized agents:
.IP \(bu 2
HiveMind SA (Solutions Architect) - Analyzes documentation
.IP \(bu 2
HiveMind DevOps - Builds applications
.IP \(bu 2
HiveMind SysEng - Provisions AWS infrastructure
.IP \(bu 2
HiveMind Release-Engineer - Deploys applications
.IP \(bu 2
HiveMind SecOps - Hardens security
.IP \(bu 2
HiveMind Control Plane - Orchestrates all agents
.SH COMMANDS
.TP
.B deploy \fIREPO_URL\fR \fIDESCRIPTION\fR
Deploy an application from a repository
.RS
.TP
.B \-\-what-if
Simulate deployment without making changes
.TP
.B \-\-verbose, -v
Show detailed output
.RE
.TP
.B analyze \fIREPO_URL\fR
Analyze repository without deploying
.TP
.B status \fIDEPLOYMENT_ID\fR
Check deployment status
.RS
.TP
.B \-\-show-plan
Show deployment plan (for what-if deployments)
.TP
.B \-\-verbose, -v
Show detailed logs
.RE
.TP
.B plan \fIDEPLOYMENT_ID\fR
Show deployment plan
.TP
.B list
List all deployments
.RS
.TP
.B \-\-status \fISTATUS\fR
Filter by status
.TP
.B \-\-limit \fIN\fR
Limit number of results
.RE
.TP
.B retry \fIDEPLOYMENT_ID\fR
Retry a failed deployment
.TP
.B rollback \fIDEPLOYMENT_ID\fR
Rollback deployment and delete all resources
.RS
.TP
.B \-\-yes, -y
Skip confirmation prompt
.RE
.TP
.B destroy \fIDEPLOYMENT_ID\fR
Destroy deployment resources
.RS
.TP
.B \-\-force, -f
Skip confirmation
.TP
.B \-\-skip-snapshot
Skip RDS final snapshot
.RE
.TP
.B reconcile \fIDEPLOYMENT_ID\fR
Reconcile deployment state with AWS
.TP
.B find-orphans
Find orphaned HiveMind resources in AWS
.TP
.B cleanup
Clean up temporary and working files
.RS
.TP
.B \-\-backup
Create backup archive before cleaning
.TP
.B \-\-yes, -y
Skip confirmation prompt
.RE
.SH OPTIONS
.TP
.B \-\-state-dir \fIDIR\fR
Directory for deployment state files (default: ./HiveMind-Work/deployments)
.TP
.B \-\-region \fIREGION\fR
AWS region (default: us-east-1)
.SH EXAMPLES
.TP
Simulate deployment (safe, no AWS charges):
.B hivemind deploy https://github.com/user/app "Test" --what-if
.TP
Real deployment:
.B hivemind deploy https://github.com/user/app "Production v1.0"
.TP
Check status:
.B hivemind status abc123def
.TP
Rollback deployment:
.B hivemind rollback abc123def
.TP
Clean up working files with backup:
.B hivemind cleanup --backup
.SH FILES
.TP
.I ~/.hivemind/
Default installation directory
.TP
.I ./HiveMind-Work/
Working files directory (deployments, analyzed repos, etc.)
.SH SEE ALSO
Full documentation: https://github.com/yourusername/hivemind-autodeploy
.SH AUTHOR
HiveMind AutoDeploy Team
EOF

echo -e "${GREEN}✅ Man page installed${NC}"

# Installation complete
echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Restart your terminal or run: ${YELLOW}source ${SHELL_RC}${NC}"
echo -e "  2. Configure AWS credentials: ${YELLOW}aws configure${NC}"
echo -e "  3. Try it out: ${YELLOW}hivemind deploy <repo-url> \"Test\" --what-if${NC}"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo -e "  ${YELLOW}hivemind --help${NC}        Show all commands"
echo -e "  ${YELLOW}man hivemind${NC}           Read the manual"
echo -e "  ${YELLOW}hm deploy --help${NC}       Get help on deploy command"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
