#!/bin/bash
# Quick test runner for AutoDeploy Agent System

set -e

echo "🧪 AutoDeploy Agent System - Test Runner"
echo "=========================================="
echo ""

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "⚠️  Virtual environment not activated"
    echo "Run: source .venv/bin/activate"
    exit 1
fi

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found. Installing dependencies..."
    pip install -r requirements.txt
fi

# Parse command line arguments
TEST_TYPE="${1:-all}"

case "$TEST_TYPE" in
    "all")
        echo "Running all tests..."
        pytest -v
        ;;
    "quick")
        echo "Running quick tests (unit only)..."
        pytest -m unit -q
        ;;
    "property")
        echo "Running property-based tests..."
        pytest -m property -v
        ;;
    "unit")
        echo "Running unit tests..."
        pytest -m unit -v
        ;;
    "coverage")
        echo "Running tests with coverage..."
        pytest --cov=src --cov-report=html --cov-report=term tests/
        echo ""
        echo "📊 Coverage report generated in htmlcov/index.html"
        ;;
    "fast")
        echo "Running fast tests (no slow tests)..."
        pytest -v -m "not slow" -x
        ;;
    "conductor")
        echo "Running Conductor tests..."
        pytest tests/test_conductor.py tests/test_agent_handoff.py -v
        ;;
    "compiler")
        echo "Running Compiler tests..."
        pytest tests/test_build_processes.py tests/test_build_artifact_integrity.py -v
        ;;
    "infrastructure")
        echo "Running Infrastructure tests..."
        pytest tests/test_aws_resources.py tests/test_infrastructure_idempotency.py tests/test_server_monkey.py -v
        ;;
    "deployment")
        echo "Running Deployment tests..."
        pytest tests/test_deployment_tools.py tests/test_deployment_health.py tests/test_abe.py -v
        ;;
    "security")
        echo "Running Security tests..."
        pytest tests/test_security.py tests/test_shawn.py -v
        ;;
    "cli")
        echo "Running CLI tests..."
        pytest tests/test_cli.py -v
        ;;
    "help")
        echo "Usage: ./run_tests.sh [TYPE]"
        echo ""
        echo "Types:"
        echo "  all           - Run all tests (default)"
        echo "  quick         - Run unit tests only (fast)"
        echo "  property      - Run property-based tests"
        echo "  unit          - Run unit tests"
        echo "  coverage      - Run with coverage report"
        echo "  fast          - Run fast tests, stop on first failure"
        echo "  conductor     - Run Conductor agent tests"
        echo "  compiler      - Run Compiler agent tests"
        echo "  infrastructure - Run Infrastructure tests"
        echo "  deployment    - Run Deployment tests"
        echo "  security      - Run Security tests"
        echo "  cli           - Run CLI tests"
        echo "  help          - Show this help"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh              # Run all tests"
        echo "  ./run_tests.sh quick        # Quick unit tests"
        echo "  ./run_tests.sh coverage     # With coverage"
        echo "  ./run_tests.sh conductor    # Just conductor tests"
        exit 0
        ;;
    *)
        echo "❌ Unknown test type: $TEST_TYPE"
        echo "Run './run_tests.sh help' for usage"
        exit 1
        ;;
esac

echo ""
echo "✅ Tests complete!"
