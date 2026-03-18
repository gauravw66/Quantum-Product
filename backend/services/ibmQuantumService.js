const axios = require('axios');

const IBM_AUTH_URL = 'https://quantum-computing.ibm.com/api/users/loginWithToken'; 
const IBM_API_BASE = 'https://quantum-computing.ibm.com/api';
const IBM_RUNTIME_BASE = 'https://us-east.quantum-computing.cloud.ibm.com';

// Removed global cachedCrn to prevent cross-user token mismatches.

const getAccessToken = async (apiToken) => {
    // All tokens go through IAM exchange first
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
        params.append('apikey', apiToken.trim());

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
        console.log('Legacy Login failed:', error.response?.data?.error?.message || error.message);
    }

    throw new Error('Failed to authenticate with IBM Quantum. Check if your API key is active/enabled in IBM Cloud console.');
};

const getServiceCrn = async (accessToken) => {
    try {
        const response = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // Find the first valid quantum computing instance
        const quantumInstance = response.data.resources.find(r => 
            r.crn && (r.crn.includes('quantum-computing') || r.crn.includes('q-computing'))
        );

        if (quantumInstance) {
            console.log('Found Quantum Service CRN:', quantumInstance.crn);
            return quantumInstance.crn;
        }
    } catch (error) {
        console.error('CRN Lookup Failed:', error.response?.data || error.message);
    }

    return null;
};

const getBaseUrl = (crn) => {
    // Standard: crn:v1:bluemix:public:quantum-computing:us-east:a/...
    try {
        const parts = crn.split(':');
        const region = parts[5];
        if (region) {
            return `https://${region}.quantum-computing.cloud.ibm.com`;
        }
    } catch (e) {}
    return 'https://us-east.quantum-computing.cloud.ibm.com';
};

const isHtmlResponse = (data) => {
    return typeof data === 'string' && /<\s*!doctype\s+html|<\s*html|<\s*head|<\s*body/i.test(data);
};

const normalizeBackends = (payload) => {
    const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.backends)
            ? payload.backends
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.devices)
                    ? payload.devices
                    : (payload?.devices && typeof payload.devices === 'object')
                        ? Object.values(payload.devices)
                        : [];

    return list
        .map((b) => ({
            name: b.name || b.backend_name || b.id,
            type: (b.simulator || b.type === 'simulator' || b.clops?.type === 'simulator') ? 'simulator' : 'hardware',
            nQubits: b.num_qubits ?? b.nQubits ?? b.n_qubits ?? b.qubits ?? null,
            status: typeof b.status === 'string'
                ? b.status
                : (b.status?.status || b.status?.name || (b.operational === false ? 'offline' : 'online'))
        }))
        .filter((b) => Boolean(b.name));
};

const validateApiKey = async (token) => {
    // This will throw an error if the token is invalid or disabled
    await getAccessToken(token);
    return true;
};

const getAvailableBackends = async (token) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const baseUrl = getBaseUrl(crn);
            const runtimeHeaders = {
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn,
                'IBM-API-Version': '2025-01-01',
                'Accept': 'application/json'
            };

            // Try known runtime discovery endpoints in order.
            const runtimeUrls = [
                `${baseUrl}/backends`,
                'https://quantum.cloud.ibm.com/api/v1/backends',
                `${baseUrl}/api/v1/backends`,
                `${baseUrl}/runtime/backends`
            ];

            for (const url of runtimeUrls) {
                try {
                    const response = await axios.get(url, { headers: runtimeHeaders });
                    if (isHtmlResponse(response.data)) {
                        console.warn(`IBM runtime endpoint returned HTML, trying next endpoint: ${url}`);
                        continue;
                    }

                    const mapped = normalizeBackends(response.data);
                    if (mapped.length > 0) {
                        return mapped;
                    }
                } catch (runtimeError) {
                    console.warn(`Runtime backend probe failed for ${url}:`, runtimeError.response?.status || runtimeError.message);
                }
            }
        }

        // Fallback to Legacy
        const response = await axios.get(`${IBM_API_BASE}/Backends`, {
            headers: { 'x-access-token': accessToken, 'Accept': 'application/json' }
        });
        if (isHtmlResponse(response.data)) {
            throw new Error('IBM returned HTML instead of backend data. Verify API key type, IBM Quantum service entitlement, and runtime endpoint access.');
        }

        const legacyMapped = normalizeBackends(response.data);
        if (legacyMapped.length > 0) {
            return legacyMapped;
        }

        throw new Error('No quantum backends were returned by IBM APIs.');
    } catch (error) {
        console.error('IBM Backend Error:', error.message);
        throw error;
    }
};

const runJob = async (token, qasmCode, backendName, instance) => {
    const trimmedToken = token.trim();
    try {
        const accessToken = await getAccessToken(trimmedToken);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const baseUrl = getBaseUrl(crn);
            // Use IBM Cloud Runtime API with Primitives V2
            // Circuits must be QASM 3.0 with ISA-compatible gates (rz, sx, x, cz)
            console.log(`Submitting to IBM Cloud Runtime API (${baseUrl}) (Primitives V2)...`);

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

            const response = await axios.post(`${baseUrl}/jobs`, payload, {
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
            const baseUrl = getBaseUrl(crn);
            const response = await axios.get(`${baseUrl}/jobs/${ibmJobId}`, {
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
            const baseUrl = getBaseUrl(crn);
            const response = await axios.get(`${baseUrl}/jobs/${ibmJobId}/results`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            
            if (!response.data || !response.data.results) {
                return { status: 'PENDING' };
            }

            const resultData = response.data.results[0]?.data;
            let counts = {};
            let shots = 1024;

            if (resultData) {
                // V2 Primitives return samples inside a named bit register (often 'meas')
                const bitRegister = Object.values(resultData)[0]; // Usually 'meas' or 'c'
                
                if (bitRegister && bitRegister.samples) {
                    shots = bitRegister.samples.length;
                    
                    // First pass: find max width to ensure consistent padding
                    let maxWidth = 4;
                    bitRegister.samples.forEach(hex => {
                        const bin = parseInt(hex, 16).toString(2);
                        if (bin.length > maxWidth) maxWidth = bin.length;
                    });

                    bitRegister.samples.forEach(hex => {
                        // Convert hex to binary bitstring and pad
                        const bitstring = parseInt(hex, 16).toString(2).padStart(maxWidth, '0');
                        counts[bitstring] = (counts[bitstring] || 0) + 1;
                    });
                } else if (resultData.counts) {
                    counts = resultData.counts;
                    shots = Object.values(counts).reduce((a, b) => a + b, 0) || 1024;
                }
            }

            const probabilities = {};
            for (const [state, count] of Object.entries(counts)) {
                probabilities[state] = (count / shots).toFixed(4);
            }

            return {
                counts, shots, probabilities,
                metadata: {
                    backendName: response.data.backend_name || 'IBM Quantum',
                    timestamp: response.data.date || new Date().toISOString()
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

const getRawJobInfo = async (token, ibmJobId) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const baseUrl = getBaseUrl(crn);
            const response = await axios.get(`${baseUrl}/jobs/${ibmJobId}`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            return response.data;
        }

        const response = await axios.get(`${IBM_API_BASE}/Jobs/${ibmJobId}`, {
            headers: { 'x-access-token': accessToken }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getRawJobResults = async (token, ibmJobId) => {
    try {
        const accessToken = await getAccessToken(token);
        const crn = await getServiceCrn(accessToken);

        if (crn) {
            const baseUrl = getBaseUrl(crn);
            const response = await axios.get(`${baseUrl}/jobs/${ibmJobId}/results`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            return response.data;
        }

        const response = await axios.get(`${IBM_API_BASE}/Jobs/${ibmJobId}/result`, {
            headers: { 'x-access-token': accessToken }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getJobPortalUrl = async (token, ibmJobId) => {
    const accessToken = await getAccessToken(token);
    const crn = await getServiceCrn(accessToken);

    if (crn) {
        return `https://quantum.cloud.ibm.com/instances/${encodeURIComponent(crn)}/jobs/${ibmJobId}`;
    }

    return `https://quantum.cloud.ibm.com/jobs/${ibmJobId}`;
};

module.exports = {
    validateApiKey,
    getAvailableBackends,
    runJob,
    getJobStatus,
    getJobResult,
    getRawJobInfo,
    getRawJobResults,
    getJobPortalUrl
};
