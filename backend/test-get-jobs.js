const axios = require('axios');

async function listJobs() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;
    console.log('IAM Token obtained.');

    const urls = [
        'https://quantum-computing.ibm.com/api/Jobs',
        'https://quantum-computing.ibm.com/api/jobs',
        'https://api.quantum-computing.ibm.com/api/Jobs',
        'https://api.quantum-computing.ibm.com/api/jobs'
    ];

    for (const url of urls) {
        try {
            console.log(`\nTesting GET: ${url}`);
            const res = await axios.get(url, {
                headers: { 
                    'x-access-token': accessToken,
                    'Accept': 'application/json'
                }
            });
            console.log(`  SUCCESS! Code: ${res.status}`);
            console.log(`  Content-Type: ${res.headers['content-type']}`);
        } catch (e) {
            console.log(`  FAILED: ${e.message}`);
            if (e.response && e.response.status === 301) console.log('  Redirect to:', e.response.headers.location);
            if (e.response && typeof e.response.data === 'string' && e.response.data.includes('<!DOCTYPE html>')) {
                console.log('  Response is HTML/Login Page');
            }
        }
    }
}

listJobs();
