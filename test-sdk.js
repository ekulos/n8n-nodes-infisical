const { InfisicalSDK } = require('@infisical/sdk');
require('dotenv').config();

// Test API parameters per SDK v4 con server reale
async function testApiParams() {
  try {
    // Load from environment variables
    const INFISICAL_SITE_URL = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';
    const INFISICAL_ACCESS_TOKEN = process.env.INFISICAL_ACCESS_TOKEN;
    const INFISICAL_PROJECT_ID = process.env.INFISICAL_PROJECT_ID;
    const INFISICAL_ENVIRONMENT = process.env.INFISICAL_ENVIRONMENT || 'dev';
    const INFISICAL_SECRET_NAME = process.env.INFISICAL_SECRET_NAME || 'c4c_emea_qa_account';

    if (!INFISICAL_ACCESS_TOKEN) {
      console.error('INFISICAL_ACCESS_TOKEN environment variable is required');
      process.exit(1);
    }

    if (!INFISICAL_PROJECT_ID) {
      console.error('INFISICAL_PROJECT_ID environment variable is required');
      process.exit(1);
    }

    console.log('Testing with client.auth().accessToken() configuration...');
    console.log(`Site URL: ${INFISICAL_SITE_URL}`);
    console.log(`Project ID: ${INFISICAL_PROJECT_ID}`);
    console.log(`Environment: ${INFISICAL_ENVIRONMENT}`);
    
    const client = new InfisicalSDK({
      siteUrl: INFISICAL_SITE_URL
    });
    
    // Autentica usando il metodo accessToken
    client.auth().accessToken(INFISICAL_ACCESS_TOKEN);

    const secretsClient = client.secrets();
    
    console.log('Testing listSecrets with accessToken auth...');
    
    // Test con workspace ID corretto dal Python SDK
    try {
      const result = await secretsClient.listSecrets({
        environment: INFISICAL_ENVIRONMENT,
        projectId: INFISICAL_PROJECT_ID,
        expandSecretReferences: true,
        viewSecretValue: true,
        includeImports: false,
        recursive: false,
        secretPath: '/'
      });
      console.log('Success with correct workspace ID:', result);
      
      // Test per cercare secret specifico per nome esatto
      console.log('\nTesting direct secret retrieval by name...');
      
      // Test getSecret per nome specifico
      try {
        const secretParams = {
          environment: INFISICAL_ENVIRONMENT,
          projectId: INFISICAL_PROJECT_ID,
          secretPath: '/',
          secretName: INFISICAL_SECRET_NAME  // Use environment variable
        };
        console.log('Trying with secretName parameter:', secretParams);
        const specificSecret = await secretsClient.getSecret(secretParams);
        console.log(`Success getting specific secret "${INFISICAL_SECRET_NAME}":`, specificSecret.secretValue);
      } catch (error) {
        console.log('Error with secretName, trying secretKey...', error.message);
        
        // Fallback to secretKey
        try {
          const secretParams2 = {
            environment: INFISICAL_ENVIRONMENT,
            projectId: INFISICAL_PROJECT_ID,
            secretPath: '/',
            secretKey: INFISICAL_SECRET_NAME
          };
          console.log('Trying with secretKey parameter:', secretParams2);
          const specificSecret = await secretsClient.getSecret(secretParams2);
          console.log(`Success getting specific secret "${INFISICAL_SECRET_NAME}":`, specificSecret.secretValue);
        } catch (error2) {
          console.log('Error with secretKey too:', error2.message);
        }
      }

    } catch (error) {
      console.log('Error with correct workspace ID:', error.message);
    }

     
  } catch (error) {
    console.error('Setup error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testApiParams();