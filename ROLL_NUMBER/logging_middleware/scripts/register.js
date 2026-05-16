require('dotenv').config();
const { registerClient } = require('../src/services/registrationService');

const runRegistration = async () => {
  try {
    console.log('Starting client registration with evaluation service...');
    const { clientID, clientSecret } = await registerClient();

    console.log('\nRegistration successful. Add these to your .env file:\n');
    console.log(`CLIENT_ID=${clientID}`);
    console.log(`CLIENT_SECRET=${clientSecret}`);
    console.log('\nThen use Log() from your application.');
  } catch (error) {
    console.error('Registration failed:', error.message);
    process.exit(1);
  }
};

runRegistration();
