# AI Code Feedback Tool

The `ai_code_feedback` tool provides AI-powered code analysis and feedback using various model providers.

## Features

- **Multi-provider support**: ollama, github, claude, chatgpt
- **Multiple feedback types**: general, performance, security, style, bugs
- **Language-aware analysis**: Specify the programming language for accurate feedback
- **Trigger → Result → Feedback pattern**: Simple workflow for code analysis
- **Structured output format**: Consistent, professional feedback with clear sections
- **Enhanced prompt engineering**: Specialized prompts for each feedback type
- **Basic static analysis**: Intelligent fallback for non-ollama providers

## Feedback Output Structure

The tool provides structured feedback in the following format:

### 🔍 Analysis Summary
Brief overview of the code's current state and main findings.

### ⚠️ Issues Identified
Specific issues with priority levels:
- **Priority Level**: High/Medium/Low
- **Issue**: Description of the problem
- **Line/Section**: Where the issue occurs
- **Impact**: Potential consequences

### ✅ Positive Aspects
Recognition of good practices and well-implemented features.

### 🔧 Recommendations
Actionable recommendations categorized as:
1. **Immediate fixes** (critical issues)
2. **Improvements** (optimization opportunities)  
3. **Best practices** (long-term maintainability)

### 📚 Code Examples
Improved code snippets or alternatives when applicable.

### 🏷️ Overall Rating
Quality assessment: Excellent/Good/Fair/Needs Improvement

## Feedback Types

- **general**: Overall code quality and best practices
- **performance**: Optimization opportunities and performance issues  
- **security**: Security vulnerabilities and potential issues
- **style**: Code formatting and style conventions
- **bugs**: Potential bugs and logic errors

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

### Enhanced Examples

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

#### Expected Output Example (Security Analysis)

When analyzing potentially vulnerable code, you'll receive structured feedback like:

```markdown
## 🔍 Analysis Summary
This JavaScript code contains a critical SQL injection vulnerability that could allow attackers to manipulate database queries.

## ⚠️ Issues Identified
- **Priority Level**: High
- **Issue**: SQL Injection vulnerability through string concatenation
- **Line/Section**: `'SELECT * FROM users WHERE id = ' + userId`
- **Impact**: Could allow unauthorized database access and data manipulation

## ✅ Positive Aspects
- Code is readable and follows basic JavaScript syntax
- Variable naming is clear and descriptive

## 🔧 Recommendations
1. **Immediate fixes**: Replace string concatenation with parameterized queries
2. **Improvements**: Add input validation and sanitization
3. **Best practices**: Implement prepared statements and ORM usage

## 📚 Code Examples
```javascript
// ❌ Vulnerable (current)
const query = 'SELECT * FROM users WHERE id = ' + userId;

// ✅ Secure (recommended)
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

## 🏷️ Overall Rating
Needs Improvement - Critical security issue requires immediate attention
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

- **ollama**: ✅ Fully implemented - Uses local Ollama models with enhanced prompts for comprehensive real-time feedback
- **github**: 🔧 Enhanced placeholder - Returns structured static analysis with basic pattern detection and actionable recommendations
- **claude**: 🔧 Enhanced placeholder - Returns structured static analysis with basic pattern detection and actionable recommendations  
- **chatgpt**: 🔧 Enhanced placeholder - Returns structured static analysis with basic pattern detection and actionable recommendations

## Enhanced Features

### Advanced Prompt Engineering (Ollama Provider)
- Specialized system messages for each feedback type
- Language-specific analysis instructions
- Structured output formatting requirements
- Context-aware recommendations

### Intelligent Static Analysis (Other Providers)
- Code complexity assessment
- Language-specific pattern detection
- Feedback-type specific observations
- Structured placeholder responses with actionable insights
- Basic security, performance, and style checks

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