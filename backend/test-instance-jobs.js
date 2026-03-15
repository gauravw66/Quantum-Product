const axios = require('axios');

async function testInstanceBackends() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const crn = 'crn:v1:bluemix:public:quantum-computing:us-east:a/0f4e2a25-7f56-4728-bcb7-32ca83564ea9::e553065c564e638a89fe16ad42155bd';
    // The instance ID is the part after the last :: or sometimes the whole CRN
    // Usually for the API, we use the CRN as a header or a path param.
    
    console.log('Obtaining Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    // Correct Qiskit Runtime Endpoint:
    // https://{region}.quantum-computing.cloud.ibm.com/jobs
    // But we need to specify instance.
    
    const url = 'https://us-east.quantum-computing.cloud.ibm.com/jobs';
    console.log(`Testing Runtime Jobs (GET): ${url}`);
    
    try {
        const res = await axios.get(url, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn,
                'Accept': 'application/json'
            }
        });
        console.log('SUCCESS! Jobs found:', Array.isArray(res.data) ? res.data.length : 'Not an array');
        if (!Array.isArray(res.data)) console.log('Data Snippet:', JSON.stringify(res.data).substring(0, 200));
    } catch (e) {
        console.log('FAILED:', e.response ? e.response.status : e.message);
        if (e.response && e.response.data) console.log(JSON.stringify(e.response.data));
    }
}

testInstanceBackends();
