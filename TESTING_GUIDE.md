# Testing Guide: Repository Cloning Tests

This guide explains the repository cloning tests in detail, covering both the code being tested and the test implementations.

## Table of Contents
1. [Overview](#overview)
2. [Code Under Test](#code-under-test)
3. [Test Structure](#test-structure)
4. [Individual Test Explanations](#individual-test-explanations)
5. [Writing Your Own Tests](#writing-your-own-tests)

## Overview

The repository cloning tests verify that HiveMind can:
- Clone Git repositories to the correct location (`analyzed_repos/`)
- Handle various repository sizes efficiently
- Gracefully handle failures (invalid URLs, timeouts)
- Clean up old cloned repositories

**Test File**: `tests/test_repository_cloning.py`  
**Code Under Test**: `src/tools/repository.py`

## Code Under Test

### The `clone_repository()` Function

Located in `src/tools/repository.py`, this is the main function being tested:

```python
def clone_repository(repo_url: str, local_path: str, timeout: int = 120) -> str:
    """
    Clone a Git repository to a local directory with timeout.
    
    Args:
        repo_url: GitHub/GitLab repository URL
        local_path: Local directory path for cloning
        timeout: Clone timeout in seconds (default: 120 = 2 minutes)
        
    Returns:
        Path to cloned repository
        
    Raises:
        RepositoryAnalysisError: If cloning fails or times out
    """
```

**Key Features**:

1. **Shallow Cloning**: Uses `git clone --depth 1` to only fetch the latest commit (faster, less disk space)
2. **Timeout Control**: Uses subprocess with timeout to prevent hanging on large repos
3. **Directory Management**: Removes existing directory before cloning (prevents conflicts)
4. **Error Handling**: Raises `RepositoryAnalysisError` with descriptive messages

**How It Works**:
```python
# 1. Create parent directory if needed
Path(local_path).parent.mkdir(parents=True, exist_ok=True)

# 2. Remove existing directory (if re-cloning)
if os.path.exists(local_path):
    shutil.rmtree(local_path)

# 3. Clone with subprocess for timeout control
subprocess.run(
    ["git", "clone", "--depth", "1", repo_url, local_path],
    capture_output=True,
    text=True,
    timeout=timeout,
    check=True
)
```

### Supporting Functions

**`analyze_repository()`**: Full analysis workflow that:
1. Clones the repository
2. Detects programming language
3. Detects framework
4. Detects runtime version
5. Detects database requirements

**Detection Functions**:
- `detect_language()`: Checks for package.json, requirements.txt, go.mod, etc.
- `detect_framework()`: Identifies Express, Flask, Django, etc.
- `detect_runtime_version()`: Extracts Node.js, Python, Go versions
- `detect_database_requirements()`: Finds PostgreSQL, MySQL, MongoDB dependencies

## Test Structure

### Test Organization

The tests are organized into three classes:


```python
class TestRepositoryCloning:
    """Tests for the core cloning functionality"""
    # 7 tests covering cloning, failures, timeouts, cleanup

class TestRepositoryAnalysis:
    """Tests for full repository analysis workflow"""
    # 3 tests covering Node.js, Python, Go analysis

class TestDirectoryStructure:
    """Tests for analyzed_repos/ directory setup"""
    # 3 tests covering directory existence, README, permissions
```

### Test Fixtures

**Fixtures** are reusable setup/teardown code that runs before/after tests.

#### `analyzed_repos_dir` Fixture
```python
@pytest.fixture
def analyzed_repos_dir():
    """Ensure analyzed_repos directory exists."""
    path = Path("analyzed_repos")
    path.mkdir(exist_ok=True)
    return path
```

**Purpose**: Creates the `analyzed_repos/` directory if it doesn't exist  
**When It Runs**: Before each test that uses it  
**Returns**: Path object pointing to `analyzed_repos/`

#### `cleanup_test_repos` Fixture
```python
@pytest.fixture
def cleanup_test_repos():
    """Clean up test repositories after tests."""
    yield  # Test runs here
    # Cleanup after test
    test_repos = [
        "analyzed_repos/test-tiny-repo",
        "analyzed_repos/test-small-repo",
        "analyzed_repos/test-medium-repo",
    ]
    for repo in test_repos:
        if os.path.exists(repo):
            shutil.rmtree(repo)
```

**Purpose**: Removes test repositories after tests complete  
**When It Runs**: After each test that uses it  
**Key Concept**: `yield` separates setup (before) from teardown (after)



## Individual Test Explanations

### Test 1: `test_clone_to_analyzed_repos_directory`

**What It Tests**: Repositories clone to the correct `analyzed_repos/` directory

```python
def test_clone_to_analyzed_repos_directory(self, analyzed_repos_dir, cleanup_test_repos):
    # Use a tiny public repo for fast testing
    repo_url = "https://github.com/octocat/Hello-World"
    local_path = "analyzed_repos/test-tiny-repo"
    
    # Clone the repository
    result_path = clone_repository(repo_url, local_path, timeout=60)
    
    # Verify it cloned to the correct location
    assert result_path == local_path
    assert os.path.exists(local_path)
    assert os.path.isdir(local_path)
    
    # Verify it's a git repository
    assert os.path.exists(os.path.join(local_path, ".git"))
    
    # Verify it has content
    assert os.path.exists(os.path.join(local_path, "README"))
```

**Step-by-Step**:
1. **Setup**: Uses `octocat/Hello-World` (tiny repo, ~1KB, clones in <5 seconds)
2. **Action**: Calls `clone_repository()` with 60-second timeout
3. **Assertions**:
   - Return value matches expected path
   - Directory exists and is a directory (not a file)
   - `.git` folder exists (proves it's a git repo)
   - `README` file exists (proves content was cloned)

**Why This Test Matters**: Verifies the most basic requirement - repos clone to the right place

**Common Issues**:
- Network problems → Test fails with timeout
- Permission issues → Directory creation fails
- Git not installed → subprocess fails



---

### Test 2: `test_clone_small_repository`

**What It Tests**: Small repositories (< 1MB) clone successfully and we can measure size

```python
def test_clone_small_repository(self, analyzed_repos_dir, cleanup_test_repos):
    # Use a small public repo
    repo_url = "https://github.com/github/gitignore"
    local_path = "analyzed_repos/test-small-repo"
    
    # Clone with reasonable timeout
    result_path = clone_repository(repo_url, local_path, timeout=60)
    
    assert os.path.exists(result_path)
    assert os.path.exists(os.path.join(result_path, ".git"))
    
    # Check directory size
    total_size = sum(
        os.path.getsize(os.path.join(dirpath, filename))
        for dirpath, _, filenames in os.walk(result_path)
        for filename in filenames
    )
    
    print(f"✅ Small repo cloned successfully")
    print(f"   Size: {total_size / 1024:.2f} KB")
```

**Step-by-Step**:
1. **Setup**: Uses `github/gitignore` (small repo with many .gitignore templates)
2. **Action**: Clone with 60-second timeout
3. **Size Calculation**:
   - `os.walk()` recursively walks all directories
   - `os.path.getsize()` gets each file's size in bytes
   - `sum()` adds them all up
   - Divide by 1024 to convert bytes → KB
4. **Assertions**: Basic checks that clone succeeded

**Learning Points**:
- **`os.walk()`**: Returns (dirpath, dirnames, filenames) for each directory
- **Generator Expression**: `for ... for ...` creates efficient iteration
- **Print Statements**: Help debug and show progress (visible with `-v` flag)

**Why This Test Matters**: Ensures we can handle typical small projects efficiently



---

### Test 3: `test_clone_with_shallow_clone`

**What It Tests**: Shallow cloning (--depth 1) is actually being used

```python
def test_clone_with_shallow_clone(self, analyzed_repos_dir, cleanup_test_repos):
    repo_url = "https://github.com/octocat/Hello-World"
    local_path = "analyzed_repos/test-medium-repo"
    
    # Clone the repository
    result_path = clone_repository(repo_url, local_path, timeout=60)
    
    # Verify it's a shallow clone by checking git log
    import subprocess
    result = subprocess.run(
        ["git", "-C", result_path, "rev-list", "--count", "HEAD"],
        capture_output=True,
        text=True
    )
    
    commit_count = int(result.stdout.strip())
    
    # Shallow clone should have very few commits
    assert commit_count <= 1, f"Expected shallow clone (1 commit), got {commit_count}"
```

**Step-by-Step**:
1. **Clone**: Standard clone operation
2. **Verification**: Run git command to count commits
   - `git -C <path>`: Run git command in specific directory
   - `rev-list --count HEAD`: Count commits from HEAD
3. **Assertion**: Should have ≤ 1 commit (shallow clone)

**Git Concepts**:
- **Shallow Clone**: Only fetches latest commit, not full history
- **Benefits**: Faster, uses less disk space
- **Trade-off**: Can't see full git history

**Why This Test Matters**: Confirms optimization is working (important for large repos)

**How to Debug**:
```bash
# Manually check commit count
cd analyzed_repos/test-medium-repo
git rev-list --count HEAD  # Should output: 1
```



---

### Test 4: `test_clone_failure_invalid_url`

**What It Tests**: Invalid repository URLs are handled gracefully with clear errors

```python
def test_clone_failure_invalid_url(self, analyzed_repos_dir):
    invalid_url = "https://github.com/nonexistent/repo-that-does-not-exist-12345"
    local_path = "analyzed_repos/test-invalid-repo"
    
    # Should raise RepositoryAnalysisError
    with pytest.raises(RepositoryAnalysisError) as exc_info:
        clone_repository(invalid_url, local_path, timeout=30)
    
    # Verify error message is informative
    error_msg = str(exc_info.value)
    assert "clone" in error_msg.lower() or "failed" in error_msg.lower()
```

**Step-by-Step**:
1. **Setup**: Use obviously fake repository URL
2. **Expectation**: Should raise `RepositoryAnalysisError`
3. **Context Manager**: `with pytest.raises(...)` catches the exception
4. **Verification**: Error message contains helpful keywords

**Testing Concepts**:

**`pytest.raises()`**: Context manager that expects an exception
```python
with pytest.raises(ValueError) as exc_info:
    int("not a number")  # This should raise ValueError

# After the block, exc_info contains exception details
print(exc_info.value)  # The actual exception object
```

**`exc_info`**: Contains exception information
- `exc_info.value`: The exception object
- `exc_info.type`: Exception class
- `exc_info.traceback`: Stack trace

**Why This Test Matters**: Users will make typos - we need helpful error messages

**Good Error Messages**:
- ✅ "Failed to clone repository: Repository not found"
- ❌ "Error 404"



---

### Test 5: `test_clone_timeout_handling`

**What It Tests**: Clone operations timeout properly instead of hanging forever

```python
def test_clone_timeout_handling(self, analyzed_repos_dir):
    # Use a large repo with very short timeout to trigger timeout
    repo_url = "https://github.com/torvalds/linux"  # Large repo
    local_path = "analyzed_repos/test-timeout-repo"
    
    # Should timeout with 1 second limit
    with pytest.raises(RepositoryAnalysisError) as exc_info:
        clone_repository(repo_url, local_path, timeout=1)
    
    error_msg = str(exc_info.value)
    assert "timeout" in error_msg.lower() or "timed out" in error_msg.lower()
    
    # Cleanup if partial clone exists
    if os.path.exists(local_path):
        shutil.rmtree(local_path)
```

**Step-by-Step**:
1. **Setup**: Use Linux kernel repo (huge, will take minutes to clone)
2. **Timeout**: Set to 1 second (guaranteed to timeout)
3. **Expectation**: Should raise error with "timeout" in message
4. **Cleanup**: Remove partial clone if it exists

**Why Timeouts Matter**:
- Prevents hanging on slow networks
- Provides feedback to users
- Allows retry logic

**Testing Strategy**:
- Use intentionally large repo
- Set unreasonably short timeout
- Guarantees timeout will occur

**Real-World Usage**:
```python
# Production code uses reasonable timeout
clone_repository(url, path, timeout=120)  # 2 minutes

# Test uses short timeout to force failure
clone_repository(url, path, timeout=1)    # 1 second
```



---

### Test 6: `test_cleanup_old_repos`

**What It Tests**: Old cloned repositories can be cleaned up manually

```python
def test_cleanup_old_repos(self, analyzed_repos_dir, cleanup_test_repos):
    # Clone a test repo
    repo_url = "https://github.com/octocat/Hello-World"
    local_path = "analyzed_repos/test-cleanup-repo"
    
    clone_repository(repo_url, local_path, timeout=60)
    assert os.path.exists(local_path)
    
    # Clean it up
    shutil.rmtree(local_path)
    assert not os.path.exists(local_path)
```

**Step-by-Step**:
1. **Clone**: Create a test repository
2. **Verify**: Confirm it exists
3. **Cleanup**: Remove with `shutil.rmtree()`
4. **Verify**: Confirm it's gone

**Python Concepts**:

**`shutil.rmtree()`**: Recursively removes directory and all contents
```python
shutil.rmtree("path/to/dir")  # Removes dir and everything inside
```

**Comparison with `os.rmdir()`**:
```python
os.rmdir("path")        # Only removes EMPTY directories
shutil.rmtree("path")   # Removes directory with all contents
```

**Why This Test Matters**: Users need to manage disk space by removing old clones

**Real-World Usage**:
```bash
# User can manually clean up
rm -rf analyzed_repos/*

# Or programmatically
import shutil
shutil.rmtree("analyzed_repos/old-repo")
```



---

### Test 7: `test_reclone_existing_directory`

**What It Tests**: Re-cloning to an existing directory removes the old one first

```python
def test_reclone_existing_directory(self, analyzed_repos_dir, cleanup_test_repos):
    repo_url = "https://github.com/octocat/Hello-World"
    local_path = "analyzed_repos/test-reclone-repo"
    
    # First clone
    clone_repository(repo_url, local_path, timeout=60)
    assert os.path.exists(local_path)
    
    # Create a marker file
    marker_file = os.path.join(local_path, "MARKER.txt")
    with open(marker_file, "w") as f:
        f.write("This should be removed")
    
    assert os.path.exists(marker_file)
    
    # Re-clone (should remove old directory first)
    clone_repository(repo_url, local_path, timeout=60)
    
    # Marker file should be gone
    assert not os.path.exists(marker_file)
    assert os.path.exists(local_path)
```

**Step-by-Step**:
1. **First Clone**: Clone repository normally
2. **Create Marker**: Add a file that shouldn't be in the repo
3. **Verify Marker**: Confirm it exists
4. **Re-clone**: Clone to same location again
5. **Verify Cleanup**: Marker file should be gone (proves old dir was removed)
6. **Verify Success**: New clone exists

**Why This Test Matters**: 
- Prevents conflicts from old files
- Ensures clean state for each clone
- Handles user retries gracefully

**Testing Pattern**: "Marker File"
```python
# Create something that shouldn't exist after operation
marker = "path/to/marker.txt"
open(marker, "w").write("test")

# Perform operation
do_something()

# Verify marker is gone (proves cleanup happened)
assert not os.path.exists(marker)
```



---

### Test 8: `test_analyze_nodejs_repository`

**What It Tests**: Full analysis workflow for Node.js repositories

```python
def test_analyze_nodejs_repository(self, analyzed_repos_dir):
    repo_url = "https://github.com/expressjs/express"
    local_path = "analyzed_repos/test-express-analysis"
    
    try:
        # Analyze the repository
        tech_stack = analyze_repository(repo_url, local_path)
        
        # Verify detection
        assert tech_stack.language == "nodejs"
        assert tech_stack.package_manager == "npm"
        assert len(tech_stack.dependencies) > 0
        
    finally:
        # Cleanup
        if os.path.exists(local_path):
            shutil.rmtree(local_path)
```

**Step-by-Step**:
1. **Analyze**: Call `analyze_repository()` (does clone + detection)
2. **Verify Language**: Should detect "nodejs" from package.json
3. **Verify Package Manager**: Should detect "npm"
4. **Verify Dependencies**: Should find dependencies in package.json
5. **Cleanup**: Always remove cloned repo (even if test fails)

**Python Concepts**:

**`try...finally`**: Ensures cleanup happens even if test fails
```python
try:
    # Test code that might fail
    result = risky_operation()
    assert result == expected
finally:
    # This ALWAYS runs, even if assertion fails
    cleanup()
```

**Why Use `finally`**: 
- Prevents leftover test data
- Keeps test environment clean
- Avoids disk space issues

**What `analyze_repository()` Does**:
1. Clones repository
2. Detects language (checks for package.json, requirements.txt, etc.)
3. Detects framework (Express, Flask, etc.)
4. Detects runtime version (Node 18.x, Python 3.11, etc.)
5. Detects database requirements (PostgreSQL, MySQL, etc.)
6. Returns `TechStack` object with all info



---

### Test 9: `test_analyze_python_repository`

**What It Tests**: Full analysis workflow for Python repositories

```python
def test_analyze_python_repository(self, analyzed_repos_dir):
    repo_url = "https://github.com/pallets/flask"
    local_path = "analyzed_repos/test-flask-analysis"
    
    try:
        tech_stack = analyze_repository(repo_url, local_path)
        
        assert tech_stack.language == "python"
        assert tech_stack.package_manager == "pip"
        
    finally:
        if os.path.exists(local_path):
            shutil.rmtree(local_path)
```

**How Language Detection Works**:

```python
def detect_language(repo_path: str) -> Optional[str]:
    repo_path_obj = Path(repo_path)
    
    # Check for Node.js
    if (repo_path_obj / "package.json").exists():
        return "nodejs"
    
    # Check for Python
    if (repo_path_obj / "requirements.txt").exists() or \
       (repo_path_obj / "setup.py").exists() or \
       (repo_path_obj / "pyproject.toml").exists():
        return "python"
    
    # Check for Go
    if (repo_path_obj / "go.mod").exists():
        return "go"
```

**Detection Strategy**:
- Look for language-specific files
- Check in order of likelihood
- Return first match

**Why This Test Matters**: Ensures we support multiple languages correctly



---

### Test 10: `test_analyze_go_repository`

**What It Tests**: Analysis for Go repositories (conditional)

```python
def test_analyze_go_repository(self, analyzed_repos_dir):
    # Use the caddy repo that's already cloned
    if os.path.exists("caddy_repo"):
        from src.tools.repository import (
            detect_language,
            detect_framework,
            detect_runtime_version,
        )
        
        language = detect_language("caddy_repo")
        framework = detect_framework("caddy_repo", language)
        runtime_version = detect_runtime_version("caddy_repo", language)
        
        assert language == "go"
        assert runtime_version is not None
    else:
        pytest.skip("Caddy repo not available for testing")
```

**Testing Concepts**:

**`pytest.skip()`**: Conditionally skip tests
```python
if not condition_met:
    pytest.skip("Reason for skipping")
```

**When to Skip Tests**:
- External resource not available
- Test requires specific environment
- Test is platform-specific

**Why This Test Is Conditional**:
- Caddy repo is large (~50MB)
- Not always cloned in test environment
- Test skips gracefully if not available

**Skip vs Fail**:
- **Skip**: Test didn't run (not a problem)
- **Fail**: Test ran but assertion failed (problem!)



---

### Test 11: `test_analyzed_repos_exists`

**What It Tests**: The `analyzed_repos/` directory exists

```python
def test_analyzed_repos_exists(self, analyzed_repos_dir):
    assert analyzed_repos_dir.exists()
    assert analyzed_repos_dir.is_dir()
```

**Path Object Methods**:
```python
path = Path("analyzed_repos")

path.exists()    # True if path exists (file or directory)
path.is_dir()    # True if path is a directory
path.is_file()   # True if path is a file
path.mkdir()     # Create directory
```

**Why This Test Matters**: Basic sanity check that directory structure is correct

---

### Test 12: `test_readme_exists`

**What It Tests**: README.md exists and has content

```python
def test_readme_exists(self, analyzed_repos_dir):
    readme = analyzed_repos_dir / "README.md"
    assert readme.exists()
    assert readme.is_file()
    
    # Verify it has content
    content = readme.read_text()
    assert len(content) > 0
    assert "Analyzed Repositories" in content
```

**Path Operations**:
```python
# Path concatenation
readme = Path("analyzed_repos") / "README.md"

# Read file content
content = readme.read_text()  # Returns string

# Write file content
readme.write_text("content")  # Writes string
```

**Why This Test Matters**: README explains directory purpose to users



---

### Test 13: `test_directory_is_writable`

**What It Tests**: We can write files to `analyzed_repos/`

```python
def test_directory_is_writable(self, analyzed_repos_dir):
    test_file = analyzed_repos_dir / "test_write.txt"
    
    try:
        test_file.write_text("test")
        assert test_file.exists()
        
        content = test_file.read_text()
        assert content == "test"
        
    finally:
        if test_file.exists():
            test_file.unlink()
```

**File Operations**:
```python
# Write file
path.write_text("content")

# Read file
content = path.read_text()

# Delete file
path.unlink()  # For files
path.rmdir()   # For empty directories
```

**Why This Test Matters**: 
- Catches permission issues early
- Ensures directory is usable
- Prevents cryptic errors later

**Common Permission Issues**:
```bash
# Fix permissions if test fails
chmod -R u+w analyzed_repos/
```



## Writing Your Own Tests

### Test Writing Checklist

When writing a new test, ask yourself:

1. **What am I testing?** (One specific behavior)
2. **What's the expected outcome?** (Clear assertion)
3. **What setup is needed?** (Fixtures, test data)
4. **What cleanup is needed?** (Remove test files)
5. **What can go wrong?** (Error cases)

### Example: Writing a New Test

Let's write a test for detecting database requirements:

```python
def test_detect_postgresql_dependency(self, analyzed_repos_dir):
    """Test that PostgreSQL dependencies are detected correctly."""
    # 1. Setup: Create a test repo with PostgreSQL dependency
    test_repo = analyzed_repos_dir / "test-postgres-repo"
    test_repo.mkdir()
    
    # Create package.json with pg dependency
    package_json = test_repo / "package.json"
    package_json.write_text(json.dumps({
        "name": "test-app",
        "dependencies": {
            "pg": "^8.0.0",
            "express": "^4.0.0"
        }
    }))
    
    try:
        # 2. Action: Detect database requirements
        requires_db, db_type = detect_database_requirements(
            str(test_repo), 
            "nodejs"
        )
        
        # 3. Assertions: Verify detection
        assert requires_db is True
        assert db_type == "postgresql"
        
    finally:
        # 4. Cleanup: Remove test repo
        if test_repo.exists():
            shutil.rmtree(test_repo)
```

**Test Structure**:
1. **Setup**: Create test data
2. **Action**: Call function being tested
3. **Assert**: Verify expected outcome
4. **Cleanup**: Remove test data



### Common Testing Patterns

#### Pattern 1: Testing Success Cases
```python
def test_successful_operation():
    result = do_something()
    assert result == expected_value
```

#### Pattern 2: Testing Error Cases
```python
def test_error_handling():
    with pytest.raises(ExpectedError):
        do_something_invalid()
```

#### Pattern 3: Testing with Fixtures
```python
@pytest.fixture
def test_data():
    # Setup
    data = create_test_data()
    yield data
    # Teardown
    cleanup_test_data(data)

def test_with_fixture(test_data):
    result = process(test_data)
    assert result.is_valid()
```

#### Pattern 4: Testing with Cleanup
```python
def test_with_cleanup():
    try:
        result = create_resource()
        assert result.exists()
    finally:
        cleanup_resource(result)
```

### Assertion Best Practices

**Good Assertions** (specific, clear):
```python
assert user.age == 25
assert len(items) == 3
assert "error" in message.lower()
assert result is not None
```

**Bad Assertions** (vague, unclear):
```python
assert user  # What are we checking?
assert items  # Empty list is falsy!
assert result  # Could be 0, [], "", etc.
```

**Assertion with Messages**:
```python
assert len(items) == 3, f"Expected 3 items, got {len(items)}"
assert user.age >= 18, f"User {user.name} is underage: {user.age}"
```



### Running Tests

#### Run All Tests
```bash
pytest tests/test_repository_cloning.py -v
```

#### Run Specific Test Class
```bash
pytest tests/test_repository_cloning.py::TestRepositoryCloning -v
```

#### Run Specific Test
```bash
pytest tests/test_repository_cloning.py::TestRepositoryCloning::test_clone_to_analyzed_repos_directory -v
```

#### Run with Output
```bash
pytest tests/test_repository_cloning.py -v -s  # -s shows print statements
```

#### Run Quietly
```bash
pytest tests/test_repository_cloning.py -q  # Minimal output
```

#### Run with Coverage
```bash
pytest tests/test_repository_cloning.py --cov=src.tools.repository
```

### Debugging Failed Tests

#### 1. Read the Error Message
```
FAILED tests/test_repository_cloning.py::test_clone_to_analyzed_repos_directory
AssertionError: assert False
```

#### 2. Run with Verbose Output
```bash
pytest tests/test_repository_cloning.py::test_clone_to_analyzed_repos_directory -v -s
```

#### 3. Add Print Statements
```python
def test_something():
    result = do_something()
    print(f"Result: {result}")  # Debug output
    assert result == expected
```

#### 4. Use pytest's Built-in Debugger
```bash
pytest tests/test_repository_cloning.py --pdb  # Drops into debugger on failure
```



### Common Testing Mistakes

#### Mistake 1: Not Cleaning Up Test Data
```python
# BAD: Leaves test files behind
def test_something():
    create_test_file("test.txt")
    assert process_file("test.txt")
    # Forgot to delete test.txt!

# GOOD: Always cleanup
def test_something():
    try:
        create_test_file("test.txt")
        assert process_file("test.txt")
    finally:
        os.remove("test.txt")
```

#### Mistake 2: Tests Depend on Each Other
```python
# BAD: test_b depends on test_a
def test_a():
    global shared_data
    shared_data = create_data()

def test_b():
    assert shared_data.is_valid()  # Fails if test_a doesn't run first!

# GOOD: Each test is independent
def test_a():
    data = create_data()
    assert data.is_valid()

def test_b():
    data = create_data()  # Create own data
    assert data.is_valid()
```

#### Mistake 3: Testing Too Much at Once
```python
# BAD: Tests multiple things
def test_user_system():
    user = create_user()
    assert user.name == "John"
    assert user.age == 25
    assert user.email == "john@example.com"
    assert user.can_login()
    assert user.has_permissions()
    # Which assertion failed?

# GOOD: One test per behavior
def test_user_creation():
    user = create_user()
    assert user.name == "John"

def test_user_login():
    user = create_user()
    assert user.can_login()
```



### Advanced Testing Concepts

#### Mocking External Dependencies

Sometimes you don't want to actually clone a repository (slow, requires network):

```python
from unittest.mock import patch, MagicMock

def test_clone_with_mock():
    # Mock the subprocess.run call
    with patch('subprocess.run') as mock_run:
        mock_run.return_value = MagicMock(returncode=0)
        
        result = clone_repository("https://github.com/test/repo", "test-path")
        
        # Verify subprocess.run was called correctly
        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert "git" in args
        assert "clone" in args
```

**When to Mock**:
- External API calls
- Slow operations
- Network requests
- File system operations (sometimes)

**When NOT to Mock**:
- Core business logic
- Simple functions
- Integration tests

#### Parametrized Tests

Test the same function with multiple inputs:

```python
@pytest.mark.parametrize("language,expected_pm", [
    ("nodejs", "npm"),
    ("python", "pip"),
    ("go", "go mod"),
    ("java", "maven"),
])
def test_package_manager_detection(language, expected_pm):
    pm = _get_package_manager(language)
    assert pm == expected_pm
```

**Benefits**:
- Less code duplication
- Easy to add new test cases
- Clear test coverage



### Test Coverage

**What is Test Coverage?**
- Percentage of code executed by tests
- Helps identify untested code
- Not a perfect metric (100% coverage ≠ bug-free)

**Check Coverage**:
```bash
pytest tests/test_repository_cloning.py --cov=src.tools.repository --cov-report=html
```

**View Coverage Report**:
```bash
open htmlcov/index.html  # Opens in browser
```

**Good Coverage Goals**:
- Critical functions: 100%
- Business logic: 90%+
- Utility functions: 80%+
- UI code: 60%+

### Testing Philosophy

**What to Test**:
- ✅ Public API functions
- ✅ Error handling
- ✅ Edge cases
- ✅ Business logic
- ✅ Integration points

**What NOT to Test**:
- ❌ Third-party libraries
- ❌ Language built-ins
- ❌ Trivial getters/setters
- ❌ Private implementation details

**Test Quality > Test Quantity**:
- 10 good tests > 100 bad tests
- Tests should be readable
- Tests should be maintainable
- Tests should be fast



## Summary

### Key Takeaways

1. **Tests verify behavior**: Each test checks one specific thing works correctly
2. **Fixtures provide setup**: Reusable setup/teardown code
3. **Assertions check results**: `assert` statements verify expected outcomes
4. **Cleanup is critical**: Always remove test data
5. **Error testing matters**: Test both success and failure cases

### Test Organization

```
tests/test_repository_cloning.py
├── TestRepositoryCloning (7 tests)
│   ├── Basic cloning
│   ├── Size handling
│   ├── Shallow cloning
│   ├── Error handling
│   ├── Timeout handling
│   └── Cleanup
├── TestRepositoryAnalysis (3 tests)
│   ├── Node.js detection
│   ├── Python detection
│   └── Go detection
└── TestDirectoryStructure (3 tests)
    ├── Directory exists
    ├── README exists
    └── Directory writable
```

### Quick Reference

**Run tests**:
```bash
pytest tests/test_repository_cloning.py -v
```

**Run specific test**:
```bash
pytest tests/test_repository_cloning.py::TestRepositoryCloning::test_clone_to_analyzed_repos_directory -v
```

**Debug test**:
```bash
pytest tests/test_repository_cloning.py::test_name -v -s --pdb
```

**Check coverage**:
```bash
pytest tests/test_repository_cloning.py --cov=src.tools.repository
```

### Next Steps

1. **Read the tests**: Open `tests/test_repository_cloning.py` and read through
2. **Run the tests**: Execute them and watch the output
3. **Modify a test**: Change an assertion and see it fail
4. **Write a test**: Add a new test for a feature
5. **Break something**: Comment out code and see which tests fail

### Resources

- **pytest documentation**: https://docs.pytest.org/
- **Python testing guide**: https://realpython.com/pytest-python-testing/
- **Test-driven development**: https://testdriven.io/

---

**Questions?** Review the test file and try running the tests yourself. The best way to learn is by doing!

