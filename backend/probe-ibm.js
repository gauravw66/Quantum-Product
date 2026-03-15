const axios = require('axios');

async function probe() {
    const urls = [
        'https://quantum-computing.ibm.com/api/Backends',
        'https://api.quantum-computing.ibm.com/api/Backends',
        'https://quantum.cloud.ibm.com/api/v1/backends',
        'https://us-east.quantum-computing.cloud.ibm.com/runtime/backends',
        'https://iam.cloud.ibm.com/identity/token'
    ];

    for (const url of urls) {
        try {
            const res = await axios.head(url, { timeout: 3000 });
            console.log(`[PASS] ${url} -> ${res.status}`);
        } catch (e) {
            console.log(`[FAIL] ${url} -> ${e.code || (e.response ? e.response.status : 'ERROR')}`);
        }
    }
}

probe();
