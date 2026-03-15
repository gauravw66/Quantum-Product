const axios = require('axios');

async function testOldToken() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    try {
        console.log('Testing Legacy Token with loginWithToken...');
        try {
            const res = await axios.post('https://auth.quantum-computing.ibm.com/api/users/loginWithToken', { apiToken });
            console.log('  loginWithToken: SUCCESS');
            console.log('  Token ID:', res.data.id);
        } catch (e) {
            console.log('  loginWithToken: FAILED');
        }

        // Try IAM exchange
        console.log('Testing Legacy Token with IAM Exchange...');
        try {
            const params = new URLSearchParams();
            params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
            params.set('apikey', apiToken);
            const res = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
            console.log('  IAM Exchange: SUCCESS');
        } catch (e) {
            console.log('  IAM Exchange: FAILED');
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testOldToken();
