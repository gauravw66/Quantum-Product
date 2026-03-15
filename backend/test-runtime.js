const axios = require('axios');

async function testRuntime() {
    const apiToken = 'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S';
    const region = 'us-east';
    
    try {
        console.log('Obtaining IAM Token...');
        const params = new URLSearchParams();
        params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.set('apikey', apiToken);
        const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
        const accessToken = iamRes.data.access_token;
        console.log('IAM Token obtained.');

        const runtimeUrl = `https://${region}.quantum-computing.cloud.ibm.com/runtime/backends`;
        console.log(`Testing Runtime API: ${runtimeUrl}`);
        
        const runtimeRes = await axios.get(runtimeUrl, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': 'crn:v1:bluemix:public:quantum-computing:us-east:a/be-project:xxxx::' // Placeholder, usually not needed for backends
            }
        });
        console.log('Runtime Backends Success!');
        console.log(JSON.stringify(runtimeRes.data, null, 2).substring(0, 500));

    } catch (err) {
        console.error('Runtime Test Failed:', err.response ? err.response.data : err.message);
    }
}

testRuntime();
