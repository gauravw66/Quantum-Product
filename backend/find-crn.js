const axios = require('axios');

async function findCrn() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    console.log('Obtaining IAM Token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    console.log('Fetching Resource Instances...');
    try {
        // IBM Resource Controller API
        const res = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        console.log('Instances found:', res.data.resources.length);
        const quantumInstances = res.data.resources.filter(r => r.resource_id === 'quantum-computing');
        quantumInstances.forEach(i => {
            console.log(`- Name: ${i.name}, CRN: ${i.crn}`);
        });
    } catch (e) {
        console.log('  FAILED to fetch instances:', e.message);
    }
}

findCrn();
