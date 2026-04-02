const { InfisicalSDK } = require('@infisical/sdk');
require('dotenv').config();

// Test the plugin logic for direct secret retrieval
async function testPluginLogic() {
  try {
    // Load from environment variables
    const INFISICAL_SITE_URL = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';
    const INFISICAL_ACCESS_TOKEN = process.env.INFISICAL_ACCESS_TOKEN;
    const INFISICAL_PROJECT_ID = process.env.INFISICAL_PROJECT_ID;
    const INFISICAL_ENVIRONMENT = process.env.INFISICAL_ENVIRONMENT || 'dev';

    if (!INFISICAL_ACCESS_TOKEN || !INFISICAL_PROJECT_ID) {
      console.error('X Missing required environment variables');
      process.exit(1);
    }

    console.log('Testing plugin logic...');
    console.log(`Site URL: ${INFISICAL_SITE_URL}`);
    console.log(`Project ID: ${INFISICAL_PROJECT_ID}`);
    console.log(`Environment: ${INFISICAL_ENVIRONMENT}`);
    
    const client = new InfisicalSDK({
      siteUrl: INFISICAL_SITE_URL
    });
    
    // Authenticate using accessToken method
    client.auth().accessToken(INFISICAL_ACCESS_TOKEN);

    const infisical = client;
    
    // Test with exact service name
    const serviceName = 'c4c_emea_qa_account';
    const secretPath = '/';
    
    console.log(`\nTesting direct retrieval for service: "${serviceName}"`);
    
    try {
      const secretData = await infisical.secrets().getSecret({
        environment: INFISICAL_ENVIRONMENT,
        projectId: INFISICAL_PROJECT_ID,
        secretPath: secretPath,
        secretName: serviceName,
      });
      
      console.log('Found secret data:', {
        secretKey: secretData.secretKey,
        secretValue: secretData.secretValue.substring(0, 50) + '...',
        fullLength: secretData.secretValue.length
      });
      
      // Process the found secret (plugin logic)
      const output = {};
      
      if (secretData) {
        const secret = secretData;
        
        // Try to parse the secret value as JSON if it looks like structured data
        try {
          let jsonValue = secret.secretValue;
          
          // Fix common JSON formatting issues
          if (jsonValue.startsWith('{') && jsonValue.includes('"') && !jsonValue.endsWith('}')) {
            jsonValue = jsonValue + '}';
          }
          if (jsonValue.includes('{username"')) {
            jsonValue = jsonValue.replace('{username"', '{"username"');
          }
          
          console.log('Attempting to parse JSON:', jsonValue);
          
          const parsedValue = JSON.parse(jsonValue);
          if (typeof parsedValue === 'object' && parsedValue !== null) {
            // If it's a JSON object, use its properties directly
            Object.assign(output, parsedValue);
            console.log('Parsed as JSON object');
          } else {
            // If it's a simple JSON value, use the secret key
            output[secret.secretKey] = parsedValue;
            console.log('Parsed as simple JSON value');
          }
        } catch (parseError) {
          // Not JSON or malformed JSON, use as-is
          output[secret.secretKey] = secret.secretValue;
          console.log('Could not parse as JSON, using raw value:', parseError.message);
        }
      }
      
      console.log('Plugin output:', output);
      
    } catch (error) {
      console.log('X Error retrieving secret:', error.message);
      
      // Test variations
      console.log('\nTesting variations...');
      const variations = [
        serviceName.toLowerCase(),
        serviceName.toUpperCase(),
        `${serviceName.toLowerCase()}_account`,
        `${serviceName.toUpperCase()}_ACCOUNT`,
      ];
      
      for (const variation of variations) {
        try {
          console.log(`  Trying variation: "${variation}"`);
          const secretData = await infisical.secrets().getSecret({
            environment: INFISICAL_ENVIRONMENT,
            projectId: INFISICAL_PROJECT_ID,
            secretPath: secretPath,
            secretName: variation,
          });
          console.log(`  Found with variation: "${variation}"`);
          break;
        } catch {
          console.log(`  X Not found: "${variation}"`);
        }
      }
    }
    
    // Test with simple secret
    console.log('\nTesting simple secret: "my-super-super-secret"');
    try {
      const secretData = await infisical.secrets().getSecret({
        environment: INFISICAL_ENVIRONMENT,
        projectId: INFISICAL_PROJECT_ID,
        secretPath: secretPath,
        secretName: 'my-super-super-secret',
      });
      
      console.log('Found simple secret:', {
        secretKey: secretData.secretKey,
        secretValue: secretData.secretValue
      });
      
      // Process simple secret
      const output = {};
      output[secretData.secretKey] = secretData.secretValue;
      console.log('Simple secret output:', output);
      
    } catch (error) {
      console.log('X Error retrieving simple secret:', error.message);
    }
     
  } catch (error) {
    console.error('X Setup error:', error.message);
  }
}

testPluginLogic();