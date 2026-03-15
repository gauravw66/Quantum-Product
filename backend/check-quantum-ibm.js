const axios = require('axios');

async function checkQuantumIbm() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const url = 'https://quantum.ibm.com/api/Backends';
    console.log(`Testing: ${url}`);
    
    try {
        const res = await axios.get(url, {
            headers: { 
                'x-access-token': accessToken,
                'Accept': 'application/json'
            }
        });
        console.log(`  SUCCESS! Code: ${res.status}`);
        console.log(`  Content-Type: ${res.headers['content-type']}`);
        console.log(`  Data snippet: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
        console.log(`  FAILED: ${e.message}`);
        if (e.response) console.log(`  Status: ${e.response.status}`);
        if (e.response && e.response.headers.location) console.log('  Redirect to:', e.response.headers.location);
    }
}

checkQuantumIbm();
