const axios = require('axios');

async function testNewApi() {
    const apiToken = 'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S';
    
    try {
        console.log('Obtaining IAM Token...');
        const params = new URLSearchParams();
        params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.set('apikey', apiToken);
        const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
        const accessToken = iamRes.data.access_token;
        console.log('IAM Token obtained.');

        // Try NEW API with IAM Token as Bearer
        const url = 'https://quantum.cloud.ibm.com/api/v1/backends';
        console.log(`Testing New API with IAM: ${url}`);
        
        try {
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log('New API with IAM: SUCCESS!');
            console.log('Data Type:', typeof res.data);
            if (Array.isArray(res.data)) {
                console.log('Backends count:', res.data.length);
            } else {
                console.log('Data:', JSON.stringify(res.data, null, 2).substring(0, 500));
            }
        } catch (e) {
            console.log('New API with IAM: FAILED', e.response ? e.response.status : e.message);
            if (e.response && e.response.data) console.log(JSON.stringify(e.response.data, null, 2).substring(0, 200));
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testNewApi();
