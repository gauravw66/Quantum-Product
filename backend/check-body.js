const axios = require('axios');

async function checkBody() {
    const apiToken = 'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const res = await axios.get('https://quantum-computing.ibm.com/api/Backends', {
        headers: { 'x-access-token': accessToken }
    });
    
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Data Type:', typeof res.data);
    if (typeof res.data === 'string') {
        console.log('Snippet:', res.data.substring(0, 500));
    } else {
        console.log('Data:', JSON.stringify(res.data, null, 2).substring(0, 500));
    }
}

checkBody();
