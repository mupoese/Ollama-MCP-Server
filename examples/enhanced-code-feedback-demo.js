#!/usr/bin/env node

/**
 * Enhanced AI Code Feedback Tool Demo
 * Demonstrates the improved features and structured output of the code feedback tool
 */

import { handleCodeFeedback } from '../src/handlers/tools.js';

console.log('🚀 Enhanced AI Code Feedback Tool Demo\n');

/**
 * Real-world code samples with various issues for demonstration
 */
const codeExamples = {
  vulnerableJavaScript: {
    language: 'javascript',
    code: `
// Vulnerable user authentication system
function authenticateUser(username, password) {
  // SQL Injection vulnerability
  const query = "SELECT * FROM users WHERE username = '" + username + 
                "' AND password = '" + password + "'";
  
  // Dangerous eval usage
  const userLevel = eval("user." + username + ".level");
  
  // XSS vulnerability
  document.getElementById('welcome').innerHTML = 'Welcome ' + username;
  
  return database.query(query);
}

// No error handling
function processPayment(amount) {
  const result = paymentGateway.charge(amount);
  return result.transactionId;
}`,
    issues: ['security', 'bugs'],
    description: 'Authentication system with multiple security vulnerabilities',
  },

  inefficientPython: {
    language: 'python',
    code: `
def analyze_large_dataset(data):
    """Process a large dataset with performance issues"""
    
    # Inefficient loop - repeatedly calculating length
    results = []
    for i in range(len(data)):
        for j in range(len(data)):
            if data[i] > data[j]:
                results.append(data[i])
    
    # Memory inefficient - loading all at once
    processed_data = []
    for item in data:
        # Inefficient string concatenation
        summary = ""
        for value in item.values():
            summary = summary + str(value) + ", "
        processed_data.append(summary)
    
    # No caching of expensive operations
    final_results = []
    for item in processed_data:
        calculated_hash = hashlib.sha256(item.encode()).hexdigest()
        if calculated_hash not in final_results:
            final_results.append(calculated_hash)
    
    return final_results`,
    issues: ['performance'],
    description: 'Data processing function with performance bottlenecks',
  },

  poorlyFormattedJava: {
    language: 'java',
    code: `
public class UserManager{
private static final int MAX_USERS=100;
private List<User>users;
public UserManager(){
this.users=new ArrayList<>();
}
public void addUser(String n,int a,String e){
if(users.size()<MAX_USERS){
User u=new User();
u.setName(n);u.setAge(a);u.setEmail(e);
users.add(u);
}
}
public User findUser(String name){
for(User u:users){
if(u.getName().equals(name)){
return u;
}
}
return null;
}
}`,
    issues: ['style'],
    description: 'Java class with formatting and style issues',
  },
};

/**
 * Demonstrate enhanced feedback for each code example
 */
async function demonstrateEnhancedFeedback() {
  console.log('📚 Demonstrating enhanced AI code feedback capabilities:\n');

  for (const [, example] of Object.entries(codeExamples)) {
    console.log(`\n🔍 Example: ${example.description}`);
    console.log('━'.repeat(80));
    console.log(`Language: ${example.language.toUpperCase()}`);
    console.log(`Code length: ${example.code.length} characters`);
    console.log(`Target issues: ${example.issues.join(', ')}`);

    for (const feedbackType of example.issues) {
      console.log(`\n📋 ${feedbackType.toUpperCase()} Analysis:`);
      console.log('┌─ Processing with enhanced prompt engineering...');

      try {
        // Test with placeholder provider to show enhanced static analysis
        const args = {
          code: example.code.trim(),
          language: example.language,
          provider: 'github', // Using placeholder to show enhanced analysis
          feedbackType,
        };

        const result = await handleCodeFeedback(args);
        const feedback = result.content[0].text;

        console.log('├─ Analysis complete ✅');
        console.log(`├─ Response length: ${feedback.length} characters`);
        console.log('└─ Sample output:');

        // Show first few lines of the structured output
        const lines = feedback.split('\n');
        const sampleLines = lines.slice(0, 8);
        sampleLines.forEach(line => {
          console.log(`   ${line}`);
        });

        if (lines.length > 8) {
          console.log(`   ... (${lines.length - 8} more lines)`);
        }

      } catch (error) {
        console.log(`└─ Error: ${error.message} ❌`);
      }
    }
  }
}

/**
 * Show configuration options and their effects
 */
async function demonstrateConfigurationOptions() {
  console.log('\n\n⚙️ Configuration Options Demo:\n');

  const testCases = [
    {
      name: 'Minimum length validation',
      code: 'x=1',
      shouldFail: true,
      reason: 'Code too short (minimum 5 characters)',
    },
    {
      name: 'Maximum length handling',
      code: 'a'.repeat(60000),
      shouldFail: true,
      reason: 'Code exceeds maximum length limit',
    },
    {
      name: 'Invalid language format',
      code: 'function test() { return "valid code"; }',
      language: 'java-script!',
      shouldFail: true,
      reason: 'Invalid language format (special characters)',
    },
    {
      name: 'Security pattern detection',
      code: 'eval("dangerous code here"); function test() { return true; }',
      shouldFail: false,
      reason: 'Should log security warning but not fail',
    },
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);

    try {
      const args = {
        code: testCase.code,
        language: testCase.language || 'javascript',
        provider: 'github',
        feedbackType: 'general',
      };

      const result = await handleCodeFeedback(args);
      if (testCase.shouldFail) {
        console.log(`   ❌ Expected failure but succeeded: ${testCase.reason}`);
      } else {
        console.log(`   ✅ Passed as expected: ${result.content[0].text.length} chars`);
      }
    } catch (error) {
      if (testCase.shouldFail) {
        console.log(`   ✅ Failed as expected: ${error.message}`);
      } else {
        console.log(`   ❌ Unexpected failure: ${error.message}`);
      }
    }
  }
}

/**
 * Show provider comparison
 */
async function demonstrateProviderComparison() {
  console.log('\n\n🔄 Provider Comparison Demo:\n');

  const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`;

  const providers = ['github', 'claude', 'chatgpt'];

  for (const provider of providers) {
    console.log(`\n🏷️ ${provider.toUpperCase()} Provider Response:`);

    try {
      const args = {
        code: sampleCode.trim(),
        language: 'javascript',
        provider: provider,
        feedbackType: 'performance',
      };

      const result = await handleCodeFeedback(args);
      const feedback = result.content[0].text;

      // Show the provider-specific header
      const lines = feedback.split('\n');
      const headerLines = lines.slice(0, 5);
      headerLines.forEach(line => {
        console.log(`   ${line}`);
      });
      console.log(`   ... (${feedback.length} total characters)`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

/**
 * Main demo execution
 */
async function runDemo() {
  try {
    await demonstrateEnhancedFeedback();
    await demonstrateConfigurationOptions();
    await demonstrateProviderComparison();

    console.log('\n\n🎯 Enhanced Features Summary:');
    console.log('✅ Advanced prompt engineering with role-specific instructions');
    console.log('✅ Structured markdown output with clear sections');
    console.log('✅ Intelligent static analysis for placeholder providers');
    console.log('✅ Comprehensive input validation and security checks');
    console.log('✅ Configurable limits and security monitoring');
    console.log('✅ Language-aware analysis and recommendations');
    console.log('✅ Professional formatting with priorities and examples');

    console.log('\n🔧 For Ollama Provider:');
    console.log('• Use with local models like codellama, deepseek-coder, or starcoder');
    console.log('• Provides real AI-powered analysis with the enhanced prompts');
    console.log('• Supports all configuration options and security features');

    console.log('\n🏁 Enhanced demo completed successfully!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo };
