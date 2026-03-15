const axios = require('axios');

async function listAllResources() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const res = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log('All Instances:');
    res.data.resources.forEach(i => {
        console.log(`- ${i.name} (ID: ${i.resource_id}) -> ${i.crn}`);
    });
}

listAllResources();
