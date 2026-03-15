const axios = require('axios');

async function debugData() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const res = await axios.get('https://quantum-computing.ibm.com/api/Backends', {
        headers: { 
            'x-access-token': accessToken,
            'Accept': 'application/json'
        }
    });
    console.log('Type:', typeof res.data);
    console.log('Snippet:', String(res.data).substring(0, 200));
}

debugData();
