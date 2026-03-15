const axios = require('axios');

async function strictProbe() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    try {
        const res = await axios.get('https://quantum-computing.ibm.com/api/Backends', {
            headers: { 
                'x-access-token': accessToken,
                'Accept': 'application/json'
            }
        });
        console.log('Strict Accept PASS!', res.status);
        console.log('Is Array?', Array.isArray(res.data));
    } catch (e) {
        console.log('Strict Accept FAIL', e.response ? e.response.status : e.message);
    }
}

strictProbe();
