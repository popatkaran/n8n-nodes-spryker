#!/usr/bin/env node

/**
 * Troubleshooting script for Spryker authentication issues
 * Usage: node scripts/troubleshoot-auth.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testSprykerAuth() {
  console.log('🔍 Spryker Authentication Troubleshooter');
  console.log('=========================================\n');

  try {
    // Get credentials from user
    const baseUrl = await askQuestion('Enter your Spryker Base URL (e.g., https://glue.eu.spryker.local): ');
    const username = await askQuestion('Enter your username/email: ');
    const password = await askQuestion('Enter your password: ');

    console.log('\n🧪 Testing authentication...\n');

    // Validate baseUrl format
    try {
      const url = new URL(baseUrl);
      console.log(`✅ Base URL format is valid: ${url.protocol}//${url.host}`);
    } catch (error) {
      console.log('❌ Invalid Base URL format');
      console.log('   Please provide a valid URL like: https://glue.eu.spryker.local');
      return;
    }

    // Test authentication endpoint
    const authUrl = `${baseUrl.replace(/\/$/, '')}/access-tokens`;
    console.log(`🌐 Testing endpoint: ${authUrl}`);

    const requestBody = {
      data: {
        type: 'access-tokens',
        attributes: {
          username: username,
          password: password,
        },
      },
    };

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Authentication successful!');
        console.log(`   Token Type: ${data.data?.attributes?.tokenType || 'Unknown'}`);
        console.log(`   Expires In: ${data.data?.attributes?.expiresIn || 'Unknown'} seconds`);
        console.log(`   Access Token: ${data.data?.attributes?.accessToken ? 'Present' : 'Missing'}`);
        console.log(`   Refresh Token: ${data.data?.attributes?.refreshToken ? 'Present' : 'Missing'}`);
        
        console.log('\n🎉 Your credentials are working correctly!');
        console.log('   If you\'re still having issues, the problem might be:');
        console.log('   1. Token caching issues in n8n');
        console.log('   2. Network connectivity during workflow execution');
        console.log('   3. Token expiration during long-running workflows');
        
      } else {
        const errorText = await response.text();
        console.log('❌ Authentication failed');
        console.log(`   Error: ${errorText}`);
        
        if (response.status === 401) {
          console.log('\n💡 Troubleshooting tips:');
          console.log('   - Double-check your username and password');
          console.log('   - Ensure your account is active and not locked');
          console.log('   - Verify you\'re using the correct Spryker instance');
        } else if (response.status === 404) {
          console.log('\n💡 Troubleshooting tips:');
          console.log('   - Check if your Base URL is correct');
          console.log('   - Ensure the /access-tokens endpoint exists');
          console.log('   - Verify your Spryker instance is running');
        }
      }
    } catch (fetchError) {
      console.log('❌ Network error occurred');
      console.log(`   Error: ${fetchError.message}`);
      
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check your internet connection');
      console.log('   - Verify the Base URL is accessible');
      console.log('   - Check if there are any firewall restrictions');
      console.log('   - Try accessing the URL in your browser');
    }

  } catch (error) {
    console.log('❌ Unexpected error occurred');
    console.log(`   Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Additional diagnostic functions
function printDiagnosticInfo() {
  console.log('\n📋 System Information:');
  console.log(`   Node.js Version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  console.log(`   Current Directory: ${process.cwd()}`);
}

async function main() {
  printDiagnosticInfo();
  await testSprykerAuth();
  
  console.log('\n📚 Additional Resources:');
  console.log('   - Spryker API Documentation: https://docs.spryker.com/docs/scos/dev/glue-api-guides/');
  console.log('   - Authentication Guide: https://docs.spryker.com/docs/scos/dev/glue-api-guides/202311.0/managing-customers/authenticating-as-a-customer.html');
  console.log('   - n8n Community Nodes: https://docs.n8n.io/integrations/community-nodes/');
}

if (require.main === module) {
  main().catch(console.error);
}
