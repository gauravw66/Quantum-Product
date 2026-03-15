# Quantum Cloud Runner -- Quickstart Workflow

## Tech Stack

-   Frontend: React (Next.js recommended)
-   Backend: Node.js (Express / NestJS)
-   Database: PostgreSQL
-   AI: Free-tier LLM (DeepSeek / Llama / Gemini)
-   Quantum Execution: IBM Quantum Cloud via Qiskit API

------------------------------------------------------------------------

# 1. Product Overview

Quantum Cloud Runner is a web platform that allows users to:

1.  Connect their **IBM Quantum Cloud account using API key**
2.  Select **prebuilt quantum computing modules**
3.  Use **AI to generate Qiskit-compatible quantum programs**
4.  Execute those programs on **IBM Quantum simulators or real quantum
    hardware**
5.  Track and manage **all quantum jobs in a personal dashboard**

------------------------------------------------------------------------

# 2. High Level Architecture

Frontend (React) ↓ REST API ↓ Backend (NodeJS) - Auth Service - IBM
Quantum Service - AI Code Generation Service - Job Manager - Module
Library ↓ PostgreSQL

External Services - IBM Quantum Cloud (Qiskit Runtime) - LLM API
(DeepSeek / Llama / Gemini)

------------------------------------------------------------------------

# 3. User Authentication

Features: - Email/password login - JWT authentication - Secure API key
storage

### users table

  column          type
  --------------- -----------
  id              uuid
  email           text
  password_hash   text
  created_at      timestamp

------------------------------------------------------------------------

# 4. IBM Quantum API Key Integration

Workflow:

1.  User opens **Settings → Quantum Provider**
2.  User pastes API Key
3.  Backend validates connection with IBM Quantum
4.  If successful → store encrypted key

### quantum_accounts table

  column              type
  ------------------- -----------
  id                  uuid
  user_id             uuid
  provider            text
  api_key_encrypted   text
  created_at          timestamp

API:

POST /api/quantum/connect

Steps: 1. Receive api_key 2. Test connection to IBM Quantum API 3. Store
encrypted key 4. Return available backends

------------------------------------------------------------------------

# 5. Module Library

Example modules:

  Module                      Description
  --------------------------- -------------------
  Bell State Generator        Entanglement demo
  Grover Search               Quantum search
  Quantum Random Generator    Random numbers
  Quantum Fourier Transform   QFT
  Shor Algorithm Demo         Factorization

Workflow:

User → Module Library → Select Module → Choose Backend → Run Job

### modules table

  column                 type
  ---------------------- ------
  id                     uuid
  name                   text
  description            text
  qiskit_code_template   text

------------------------------------------------------------------------

# 6. AI Quantum Code Generator

Users describe circuits in natural language.

Example:

"Create a 3 qubit GHZ state and measure all qubits"

AI generates **Qiskit-compatible Python code**.

Required imports:

``` python
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService
```

Prompt Template:

    You are a quantum computing assistant.

    Generate valid Python code using Qiskit for IBM Quantum Cloud.

    Requirements:
    - Must create a QuantumCircuit
    - Must include measurements
    - Must be executable on IBM Quantum backends
    - Do not include explanations
    - Only return code

    User Request:
    {user_prompt}

------------------------------------------------------------------------

# 7. Job Execution System

Every execution becomes a job.

Workflow:

User code/module\
↓\
Backend receives request\
↓\
Create job record\
↓\
Execute via IBM Quantum\
↓\
Store job ID + result\
↓\
Update dashboard

API:

POST /api/jobs/run

Request:

    {
     module_id | code,
     backend: "ibmq_qasm_simulator"
    }

------------------------------------------------------------------------

# 8. User Dashboard

Dashboard Sections:

## Recent Jobs

| Job \| Status \| Backend \| Time \|

## Job Details

-   Job ID
-   Backend Used
-   Circuit Visualization
-   Execution Result
-   Histogram

### jobs table

  column       type
  ------------ -----------
  id           uuid
  user_id      uuid
  job_name     text
  code         text
  backend      text
  status       text
  ibm_job_id   text
  result       json
  created_at   timestamp

------------------------------------------------------------------------

# 9. Circuit Visualization

Possible tools:

-   qiskit circuit drawer
-   quantum-circuit-js

------------------------------------------------------------------------

# 10. Backend Services

IBM Quantum Service:

-   validate API keys
-   fetch backends
-   submit jobs

Functions:

connectIBM(apiKey)

runQuantumJob(code, backend)

getJobStatus(jobId)

getJobResult(jobId)

AI Service:

generateQuantumCode(prompt)

validateCode()

------------------------------------------------------------------------

# 11. Security

-   Encrypt API keys
-   Backend executes jobs (not frontend)
-   Rate limit AI requests

------------------------------------------------------------------------

# 12. Suggested Project Structure

    quantum-platform/

    frontend/
      components/
      pages/
      dashboard/
      modules/

    backend/
      controllers/
      services/
      routes/
      middleware/

    database/
      migrations/
      schema.sql

------------------------------------------------------------------------

# 13. API Endpoints

Auth:

POST /auth/signup\
POST /auth/login

Quantum:

POST /quantum/connect\
GET /quantum/backends

AI:

POST /ai/generate-circuit

Jobs:

POST /jobs/run\
GET /jobs\
GET /jobs/:id

------------------------------------------------------------------------

# 14. MVP Feature List

Phase 1: - user login - IBM API integration - module library - AI code
generation - run on simulator - job dashboard

Phase 2: - circuit visualization - hardware execution - cost
estimation - collaboration

------------------------------------------------------------------------

# 15. Example Generated Code

``` python
from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService

service = QiskitRuntimeService()
backend = service.backend("ibmq_qasm_simulator")

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0,1)
qc.measure_all()

compiled = transpile(qc, backend)
job = backend.run(compiled)

result = job.result()
print(result.get_counts())
```
