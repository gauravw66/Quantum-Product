const axios = require('axios');

async function testAuthHeader() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const authHeaders = [
        { 'x-access-token': accessToken },
        { 'Authorization': `Bearer ${accessToken}` }
    ];

    for (const headers of authHeaders) {
        console.log(`\nTesting with headers: ${JSON.stringify(Object.keys(headers))}`);
        try {
            const res = await axios.get('https://quantum-computing.ibm.com/api/Backends', {
                headers: { ...headers, 'Accept': 'application/json' }
            });
            console.log(`  SUCCESS! Status: ${res.status}`);
            console.log(`  Content-Type: ${res.headers['content-type']}`);
            if (typeof res.data === 'string' && res.data.includes('html')) console.log('  WARN: Got HTML');
        } catch (e) {
            console.log(`  FAILED: ${e.message}`);
        }
    }
}

testAuthHeader();
