const axios = require('axios');

async function testV2() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const crn = 'crn:v1:bluemix:public:quantum-computing:us-east:a/0f4e2a25-7f56-4728-bcb7-32ca83564ea9::e553065c564e638a89fe16ad42155bd';

    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const endpoints = [
        'https://quantum.cloud.ibm.com/api/v2/backends',
        'https://quantum.cloud.ibm.com/api/v2/jobs'
    ];

    for (const url of endpoints) {
        console.log(`Testing: ${url}`);
        try {
            const res = await axios.get(url, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn
                }
            });
            console.log(`  SUCCESS! Data snippet: ${JSON.stringify(res.data).substring(0, 100)}`);
        } catch (e) {
            console.log(`  FAILED: ${e.response ? e.response.status : e.message}`);
        }
    }
}

testV2();
