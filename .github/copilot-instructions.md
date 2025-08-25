# Ollama MCP Server Development Guide

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.**

This is a Node.js-based Model Context Protocol (MCP) server that provides Ollama AI model integration. The server is built with ES modules and includes comprehensive testing, AI core functionality, and Docker support.

## Quick Start & Critical Setup

**CRITICAL:** Set appropriate timeouts (120+ seconds) for all build and test commands. NEVER CANCEL builds or tests that are running.

### Bootstrap the Development Environment
```bash
# Clone and setup (if not already done)
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server

# Install dependencies - takes ~15 seconds, NEVER CANCEL
npm install

# Validate setup - takes ~3 seconds total
npm run lint          # Code quality check - always passes
npm run validate       # Lint + tests - takes ~3s, expect 2 test failures due to MCP SDK issues
```

## Working Development Commands

### Code Quality (Always Works)
```bash
# Linting - takes ~1 second, NEVER CANCEL even though it's fast
npm run lint          # Check for code quality issues
npm run lint:fix      # Auto-fix linting issues

# Both commands should ALWAYS complete successfully
# If linting fails, fix the issues before proceeding
```

### Testing (Partially Works) 
```bash
# NEVER CANCEL: Test suite takes 2-3 seconds total
npm test              # Run all tests (5/7 suites pass, 2 fail due to MCP SDK)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Expected test results:
# - ✅ 5 test suites pass: config.test.js, schemas.test.js, validation.test.js, integration.test.js, ai-core.test.js
# - ❌ 2 test suites fail: tooling-enhancements.test.js, code-feedback.test.js (MCP SDK import issues)
# - Total: 67 tests pass, 0 tests fail (failures are import errors, not test failures)
```

### Combined Validation
```bash
# NEVER CANCEL: Takes ~3 seconds total - combines lint + test
npm run validate

# Expected behavior:
# - Linting passes completely
# - Tests run with 5/7 suites passing
# - Command exits with code 1 due to test import failures
# - This is normal behavior for current codebase state
```

## Known Issues and Current Limitations

### ❌ Server Runtime Issues
```bash
# DO NOT attempt to run the server directly - it will fail:
node server.js        # FAILS: MCP SDK missing dist files

# The @modelcontextprotocol/sdk package is missing built JavaScript files
# This affects both runtime execution and some tests
```

### ❌ Docker Build Issues
```bash
# DO NOT attempt Docker builds - they will fail:
docker build -t ollama-mcp-server .  # FAILS: npm install timeout in container

# Docker builds fail during npm install step after ~70 seconds
# Issue appears to be related to network/dependency resolution in container
```

### ⚠️ Partial Test Coverage
The test suite has import issues with MCP SDK but core functionality tests pass:
- **config.test.js**: ✅ Configuration validation (6 tests)
- **schemas.test.js**: ✅ Schema validation (multiple tests) 
- **validation.test.js**: ✅ Input validation (multiple tests)
- **integration.test.js**: ✅ AI core integration (4 tests)
- **ai-core.test.js**: ✅ AI system tests (2 tests)
- **tooling-enhancements.test.js**: ❌ Import errors
- **code-feedback.test.js**: ❌ Import errors

## Repository Structure & Navigation

### Key Directories
```
Ollama-MCP-Server/
├── src/                    # Main source code
│   ├── config/            # Configuration management
│   ├── handlers/          # MCP tool handlers
│   ├── utils/             # Utility functions
│   └── server.js          # Main server implementation
├── tests/                  # Test suite
├── ai_core/                # AI learning system
├── logic/                  # Pattern detection logic
├── governance/             # AI governance framework
├── server.js              # Entry point (imports src/server.js)
├── package.json           # Dependencies and scripts
├── .github/workflows/     # CI/CD pipeline
└── docs/                  # Documentation
```

### Important Files to Check After Changes
- **src/config/index.js**: Always check after modifying environment variables
- **src/handlers/schemas.js**: Check after adding new MCP tools
- **src/utils/validation.js**: Check after modifying input validation
- **tests/**: Always run relevant tests after code changes

## Manual Validation Scenarios

### Test Configuration Changes
```bash
# After modifying environment variables or configuration:
npm run test -- --testNamePattern="config"  # Should pass all 6 tests

# Validate specific configuration scenarios:
# 1. Check default configuration loads correctly
# 2. Verify environment variable override functionality
# 3. Test invalid configuration rejection
```

### Test Schema Validation
```bash
# After adding or modifying MCP tool schemas:
npm run test -- tests/schemas.test.js       # Should pass completely

# Manual verification steps:
# 1. Check schema definitions are valid JSON Schema
# 2. Verify required fields are properly marked
# 3. Test schema validation logic
```

### Integration Testing
```bash
# After major changes to core functionality:
npm run test -- tests/integration.test.js   # Should pass AI core tests

# Manual checks:
# 1. AI status configuration validates
# 2. Core component structure is maintained
# 3. Integration points remain functional
```

## CI/CD Validation Requirements

### Pre-commit Validation
**ALWAYS run these commands before committing changes:**
```bash
npm run lint:fix    # Auto-fix linting issues
npm run validate    # Ensure linting passes and core tests work
```

### Expected CI Behavior
The GitHub Actions workflow (.github/workflows/ci.yml) includes:
- **Lint check**: Should always pass
- **Test suite**: Expects 5/7 suites to pass (known MCP SDK issues)
- **Docker build**: Currently fails (known issue)
- **Security audit**: Should pass

## Environment Configuration

### Key Environment Variables
```bash
# Required for MCP functionality:
OLLAMA_API=http://host.docker.internal:11434  # Default Ollama endpoint
SILENCE_STARTUP=true                          # MCP protocol compatibility
DEBUG=false                                   # Debug logging

# Optional configuration:
REQUEST_TIMEOUT=30000                         # HTTP timeout (ms)
MAX_RETRIES=3                                 # Retry attempts
AI_CORE_ENABLED=true                         # Enable AI learning system
```

### Configuration File Location
- Development: `.env` (example provided)
- Runtime: Environment variables
- Testing: Overridden in test setup

## Development Workflow Best Practices

### Making Code Changes
1. **Always run linting first**: `npm run lint`
2. **Make minimal changes**: Focus on specific functionality
3. **Test immediately**: `npm run validate` after each change
4. **Check related files**: Follow the "Important Files" guidance above

### Adding New Features
1. **Add schema definitions** in `src/handlers/schemas.js`
2. **Implement validation** in `src/utils/validation.js`  
3. **Add handler logic** in appropriate `src/handlers/` file
4. **Write tests** following existing patterns
5. **Run validation**: `npm run validate`

### Debugging Issues
1. **Check linting first**: `npm run lint`
2. **Run specific tests**: `npm run test -- --testNamePattern="pattern"`
3. **Enable debug logging**: Set `DEBUG=true` in environment
4. **Check configuration**: Validate environment variables

## Working Commands Reference

```bash
# Development (all commands work)
npm install                    # ~15s - dependency installation
npm run lint                   # ~1s - code quality check  
npm run lint:fix              # ~1s - auto-fix issues
npm test                      # ~3s - run test suite (5/7 pass)
npm run test:watch            # ~3s+ - watch mode testing
npm run test:coverage         # ~3s - coverage report
npm run validate              # ~3s - lint + test combined

# Analysis
npm audit                     # Security audit
npm ls                        # Dependency tree
git status                    # Repository status

# File operations
find src/ -name "*.js"        # List source files
grep -r "pattern" src/        # Search codebase
```

## Troubleshooting Common Issues

### "Cannot find module @modelcontextprotocol/sdk"
- **Issue**: MCP SDK missing built files
- **Workaround**: Use working tests and linting for development
- **Status**: Known issue affecting runtime and some tests

### Docker build failures
- **Issue**: npm install fails in container after ~70s
- **Workaround**: Use local development environment
- **Status**: Known issue under investigation

### Test import errors
- **Issue**: 2/7 test suites fail with import errors
- **Impact**: 5/7 test suites work normally, core functionality testable
- **Workaround**: Focus on working test suites for validation

**Remember**: This codebase has known MCP SDK dependency issues that prevent full server runtime and Docker builds. Focus on the working development workflow (editing, linting, core testing) while these issues are being resolved.