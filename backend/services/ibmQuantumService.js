const axios = require('axios');

const IBM_AUTH_URL = 'https://quantum-computing.ibm.com/api/users/loginWithToken'; 
const IBM_API_BASE = 'https://quantum-computing.ibm.com/api';
const IBM_RUNTIME_BASE = 'https://us-east.quantum-computing.cloud.ibm.com';

// Cache for CRN lookup (avoids repeated API calls)
let cachedCrn = null;

const getAccessToken = async (apiToken) => {
    // All tokens go through IAM exchange first
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.append('apikey', apiToken);

        const response = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
        if (response.data && response.data.access_token) {
            console.log('IAM Token Exchange Success.');
            return response.data.access_token;
        }
    } catch (error) {
        console.log('IAM Exchange Failed, trying Legacy...');
    }

    // Legacy Login fallback
    try {
        const response = await axios.post(IBM_AUTH_URL, { apiToken });
        if (response.data && response.data.id) {
            console.log('Legacy Login Success.');
            return response.data.id;
        }
    } catch (error) {
        console.log('Legacy Login also failed.');
    }

    throw new Error('Failed to authenticate with IBM Quantum.');
};

const getServiceCrn = async (accessToken) => {
    if (cachedCrn) return cachedCrn;

    try {
        const response = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const quantumInstance = response.data.resources.find(r => 
            r.crn && r.crn.includes('quantum-computing')
        );

        if (quantumInstance) {
            cachedCrn = quantumInstance.crn;
            console.log('Found Quantum Service CRN:', cachedCrn);
            return cachedCrn;
        }
    } catch (error) {
        console.error('CRN Lookup Failed:', error.message);
    }

    return null;
};

const validateApiKey = async (token) => {
    try {
        await getAccessToken(token);
        return true;
    } catch (error) {
        return false;
    }
};

const getAvailableBackends = async (token) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            // Use Runtime API
            const response = await axios.get(`${IBM_RUNTIME_BASE}/backends`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            if (Array.isArray(response.data)) {
                return response.data.map(b => ({
                    name: b.name || b.backend_name,
                    type: b.simulator ? 'simulator' : 'hardware',
                    nQubits: b.num_qubits || b.nQubits,
                    status: b.status
                }));
            }
        }

        // Fallback to Legacy
        const response = await axios.get(`${IBM_API_BASE}/Backends`, {
            headers: { 'x-access-token': accessToken, 'Accept': 'application/json' }
        });
        if (typeof response.data === 'string') {
            throw new Error('IBM returned HTML instead of backend data.');
        }
        return response.data.map(b => ({
            name: b.name,
            type: b.simulator ? 'simulator' : 'hardware',
            nQubits: b.nQubits,
            status: b.status
        }));
    } catch (error) {
        console.error('IBM Backend Error:', error.message);
        throw error;
    }
};

const runJob = async (token, qasmCode, backendName, instance) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            // Use IBM Cloud Runtime API with Primitives V2
            // Circuits must be QASM 3.0 with ISA-compatible gates (rz, sx, x, cz)
            console.log('Submitting to IBM Cloud Runtime API (Primitives V2)...');

            const payload = {
                program_id: 'sampler',
                backend: backendName,
                params: {
                    pubs: [
                        [qasmCode, null, 1024]
                    ],
                    version: "2"
                }
            };

            const response = await axios.post(`${IBM_RUNTIME_BASE}/jobs`, payload, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'Content-Type': 'application/json',
                    'IBM-API-Version': '2025-01-01'
                }
            });

            console.log('IBM Runtime Response:', JSON.stringify(response.data).substring(0, 200));
            return {
                ibmJobId: response.data.id,
                status: response.data.status || 'Queued'
            };
        }

        // Fallback: Legacy Platform API
        console.log('Using Legacy Platform API...');
        let hub = 'ibm-q', group = 'open', project = 'main';
        if (instance) {
            if (instance.includes('/')) {
                const parts = instance.split('/');
                if (parts.length === 3) [hub, group, project] = parts;
            } else {
                project = instance;
            }
        }

        const payload = {
            qasm: qasmCode,
            backend: { name: backendName },
            hub, group, project,
            shots: 1024
        };

        const response = await axios.post(`${IBM_API_BASE}/Jobs`, payload, {
            headers: { 
                'x-access-token': accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            throw new Error('IBM API returned HTML. Use an IBM Cloud API Key instead.');
        }

        return {
            ibmJobId: response.data.id || response.data.jobId,
            status: response.data.status || 'QUEUED'
        };
    } catch (error) {
        console.error('IBM Submission Error:', error.response?.data || error.message);
        throw error;
    }
};

const getJobStatus = async (token, ibmJobId) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const response = await axios.get(`${IBM_RUNTIME_BASE}/jobs/${ibmJobId}`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            return response.data.status;
        }

        const response = await axios.get(`${IBM_API_BASE}/Jobs/${ibmJobId}`, {
            headers: { 'x-access-token': accessToken }
        });
        return response.data.status;
    } catch (error) {
        throw error;
    }
};

const getJobResult = async (token, ibmJobId) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const response = await axios.get(`${IBM_RUNTIME_BASE}/jobs/${ibmJobId}/results`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            
            if (!response.data || !response.data.results) {
                return { status: 'PENDING' };
            }

            const counts = response.data.results[0]?.data?.counts || {};
            const shots = 1024;
            const probabilities = {};
            for (const [state, count] of Object.entries(counts)) {
                probabilities[state] = (count / shots).toFixed(4);
            }
            return {
                counts, shots, probabilities,
                metadata: {
                    backendName: response.data.backend_name,
                    timestamp: response.data.date
                }
            };
        }

        // Legacy fallback
        const response = await axios.get(`${IBM_API_BASE}/Jobs/${ibmJobId}/result`, {
            headers: { 'x-access-token': accessToken }
        });
        
        if (!response.data || !response.data.results) {
            return { status: 'PENDING' };
        }

        const resultData = response.data.results[0].data;
        const counts = resultData.counts;
        const shots = response.data.results[0].shots;
        const probabilities = {};
        for (const [state, count] of Object.entries(counts)) {
            probabilities[state] = (count / shots).toFixed(4);
        }

        return {
            counts, shots, probabilities,
            metadata: {
                executionTime: response.data.time_taken,
                backendName: response.data.backend_name,
                timestamp: response.data.date
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    validateApiKey,
    getAvailableBackends,
    runJob,
    getJobStatus,
    getJobResult
};
