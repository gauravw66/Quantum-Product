const axios = require('axios');

async function checkJson() {
    const apiToken = 'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S';
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
        console.log('Success!', res.status);
        console.log('Content-Type:', res.headers['content-type']);
    } catch (e) {
        console.log('Failed', e.response ? e.response.status : e.message);
        if (e.response && e.response.data) {
            console.log('Body snippet:', String(e.response.data).substring(0, 100));
        }
    }
}

checkJson();
