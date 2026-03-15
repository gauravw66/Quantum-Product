const axios = require('axios');

async function testToken() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    console.log('Testing Token:', apiToken);

    // Try IAM Exchange
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.append('apikey', apiToken);

        const response = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
        console.log('IAM Success:', !!response.data.access_token);
        return;
    } catch (error) {
        console.log('IAM Failed:', error.response?.data || error.message);
    }

    // Try Legacy Fallback
    try {
        const response = await axios.post('https://quantum-computing.ibm.com/api/users/loginWithToken', { apiToken });
        console.log('Legacy Success:', !!response.data.id);
    } catch (error) {
        console.log('Legacy Failed:', error.response?.data || error.message);
    }
}

testToken();
