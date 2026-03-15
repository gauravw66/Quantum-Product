const axios = require('axios');

async function testLegacyWithIam() {
    const apiToken = 'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S';
    
    try {
        console.log('Obtaining IAM Token...');
        const params = new URLSearchParams();
        params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.set('apikey', apiToken);
        const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
        const accessToken = iamRes.data.access_token;
        console.log('IAM Token obtained.');

        // Try Legacy API with IAM Token as x-access-token
        const legacyUrl = 'https://quantum-computing.ibm.com/api/Backends';
        console.log(`Testing Legacy API with IAM: ${legacyUrl}`);
        
        try {
            const res = await axios.get(legacyUrl, {
                headers: { 'x-access-token': accessToken }
            });
            console.log('Legacy API with IAM: SUCCESS!');
            console.log('Backends count:', res.data.length);
        } catch (e) {
            console.log('Legacy API with IAM: FAILED', e.response ? e.response.status : e.message);
            if (e.response && e.response.data) console.log(JSON.stringify(e.response.data, null, 2).substring(0, 200));
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testLegacyWithIam();
