const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = process.env.EVALUATION_BASE_URL || 'http://4.224.186.213/evaluation-service';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function generateCurlCommands() {
  console.log('Fetching fresh access token...\n');
  
  try {
    const authRes = await axios.post(`${BASE_URL}/auth`, {
      email: process.env.EMAIL,
      name: process.env.NAME,
      rollNo: process.env.ROLL_NO,
      accessCode: process.env.ACCESS_CODE,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });

    const token = authRes.data.access_token || authRes.data.accessToken || authRes.data.token;
    
    if (!token) {
      console.error('Failed to get token from response:', authRes.data);
      return;
    }

    console.log('✅ Token acquired successfully! Copy and paste the commands below into your terminal:\n');
    console.log('═'.repeat(80));
    
    console.log('\n1. Get Depots:');
    console.log(`curl -X GET "${BASE_URL}/depots" -H "Authorization: Bearer ${token}"\n`);
    
    console.log('2. Get Vehicles (Tasks):');
    console.log(`curl -X GET "${BASE_URL}/vehicles" -H "Authorization: Bearer ${token}"\n`);
    
    console.log('3. Get Notifications:');
    console.log(`curl -X GET "${BASE_URL}/notifications" -H "Authorization: Bearer ${token}"\n`);
    
    console.log('4. Send Log (Example):');
    console.log(`curl -X POST "${BASE_URL}/logs" -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "{\\"stack\\":\\"backend\\",\\"level\\":\\"info\\",\\"package\\":\\"route\\",\\"message\\":\\"Manual API test log\\"}"\n`);
    
    console.log('═'.repeat(80));
    console.log('\nTIP: If you are using Postman, you can copy just the token below and use it in the "Bearer Token" authorization tab:');
    console.log(`\n${token}\n`);
    
  } catch (error) {
    console.error('Error getting token:', error.response?.data || error.message);
  }
}

generateCurlCommands();
