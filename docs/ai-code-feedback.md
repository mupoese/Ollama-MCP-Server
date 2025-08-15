# AI Code Feedback Tool

The `ai_code_feedback` tool provides AI-powered code analysis and feedback using various model providers.

## Features

- **Multi-provider support**: ollama, github, claude, chatgpt
- **Multiple feedback types**: general, performance, security, style, bugs
- **Language-aware analysis**: Specify the programming language for accurate feedback
- **Trigger → Result → Feedback pattern**: Simple workflow for code analysis

## Usage

### Basic Usage

```json
{
  "name": "ai_code_feedback",
  "arguments": {
    "code": "function hello() { return 'world'; }",
    "language": "javascript",
    "provider": "ollama",
    "model": "codellama",
    "feedbackType": "general"
  }
}
```

### Parameters

- **code** (required): The code to analyze
- **language** (required): Programming language (e.g., "javascript", "python", "java")
- **provider** (required): AI provider ("ollama", "github", "claude", "chatgpt")
- **model** (required for ollama): Specific model name
- **feedbackType** (optional): Type of feedback ("general", "performance", "security", "style", "bugs")
- **options** (optional): Model-specific options (temperature, maxTokens)

### Feedback Types

- **general**: Overall code quality and best practices
- **performance**: Optimization opportunities and performance issues
- **security**: Security vulnerabilities and potential issues
- **style**: Code formatting and style conventions
- **bugs**: Potential bugs and logic errors

### Examples

#### Security Analysis with Ollama
```json
{
  "name": "ai_code_feedback",
  "arguments": {
    "code": "const query = 'SELECT * FROM users WHERE id = ' + userId;",
    "language": "javascript",
    "provider": "ollama",
    "model": "codellama",
    "feedbackType": "security"
  }
}
```

#### Performance Review with Claude
```json
{
  "name": "ai_code_feedback",
  "arguments": {
    "code": "for (let i = 0; i < array.length; i++) { array.forEach(item => process(item)); }",
    "language": "javascript",
    "provider": "claude",
    "feedbackType": "performance"
  }
}
```

#### Style Check with GitHub
```json
{
  "name": "ai_code_feedback",
  "arguments": {
    "code": "def my_function( x,y ):\n  return x+y",
    "language": "python",
    "provider": "github",
    "feedbackType": "style"
  }
}
```

## Provider Status

- **ollama**: ✅ Fully implemented - Uses local Ollama models for real-time feedback
- **github**: 🚧 Placeholder - Returns basic analysis with integration guidance
- **claude**: 🚧 Placeholder - Returns basic analysis with integration guidance  
- **chatgpt**: 🚧 Placeholder - Returns basic analysis with integration guidance

## Workflow Pattern

The tool follows the requested **trigger → result → feedback** pattern:

1. **Trigger**: Code submission with analysis parameters
2. **Result**: AI processing and analysis completion
3. **Feedback**: Actionable recommendations and insights

## Error Handling

The tool validates all inputs and provides clear error messages for:
- Missing required parameters
- Invalid provider names
- Missing model for ollama provider
- Invalid feedback types
- Malformed code or language specifications