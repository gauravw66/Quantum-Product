const axios = require('axios');

async function testRuntimeCorrect() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const crn = 'crn:v1:bluemix:public:quantum-computing:us-east:a/0f4e2a25-7f56-4728-bcb7-32ca83564ea9::e553065c564e638a89fe16ad42155bd';
    const region = 'us-east';

    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    console.log('Testing Runtime V1 Backends...');
    try {
        const res = await axios.get(`https://${region}.quantum-computing.cloud.ibm.com/api/v1/backends`, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn
            }
        });
        console.log('SUCCESS! Backends:', res.data.length);
    } catch (e) {
        console.log('FAILED V1:', e.response ? e.response.status : e.message);
    }

    console.log('Testing Runtime V2 Backends...');
    try {
        const res = await axios.get(`https://${region}.quantum-computing.cloud.ibm.com/runtime/backends`, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn
            }
        });
        console.log('SUCCESS V2! Backends:', res.data.length);
    } catch (e) {
        console.log('FAILED V2:', e.response ? e.response.status : e.message);
    }
}

testRuntimeCorrect();
