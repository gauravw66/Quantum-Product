Perfect—let’s get you from **0 → working crawler + dataset** fast ⚡
I’ll give you a **practical quickstart using Firecrawl + scripts + target sites list** tailored for your QASM AI.

---

# 🚀 1. Firecrawl Quickstart (5 mins)

## ✅ Step 1: Install SDK

```bash
npm install @mendable/firecrawl-js
```

---

## ✅ Step 2: Get API Key

* Go to: [https://firecrawl.dev](https://firecrawl.dev)
* Copy your API key

---

## ✅ Step 3: Basic Scrape Script

```javascript
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({
  apiKey: "YOUR_API_KEY"
});

const urls = [
  "https://quantum-computing.ibm.com/docs",
  "https://openqasm.com/",
];

for (const url of urls) {
  const result = await app.scrapeUrl(url, {
    formats: ["markdown"],   // BEST for RAG
  });

  console.log(result.markdown);
}
```

---

## ⚡ Pro Tip (IMPORTANT)

Use:

```js
formats: ["markdown", "html"]
```

* Markdown → embeddings
* HTML → fallback parsing

---

# 🌐 2. Your Target Knowledge Base (Top 10 Sites)

Here’s a **clean list + what to scrape from each**

---

## 1. IBM Quantum Docs (🔥 MOST IMPORTANT)

* [https://quantum-computing.ibm.com/docs](https://quantum-computing.ibm.com/docs)

👉 Focus:

* Circuit execution
* Backend constraints
* Transpilation

---

## 2. OpenQASM Official

* [https://openqasm.com/](https://openqasm.com/)

👉 Focus:

* Syntax rules
* Grammar
* QASM 2 vs 3

---

## 3. OpenQASM GitHub

* [https://github.com/openqasm/openqasm](https://github.com/openqasm/openqasm)

👉 Use:

```bash
git clone https://github.com/openqasm/openqasm
```

👉 Extract:

* Spec files
* Examples

---

## 4. Qiskit Textbook

* [https://qiskit.org/textbook/](https://qiskit.org/textbook/)

👉 Focus:

* Bell, GHZ, QFT, Grover
* Convert circuits → QASM

---

## 5. Qiskit Docs

* [https://docs.qiskit.org/](https://docs.qiskit.org/)

👉 Focus:

* Circuit API
* Gate definitions

---

## 6. Qiskit GitHub (🔥 CODE GOLDMINE)

* [https://github.com/Qiskit/qiskit](https://github.com/Qiskit/qiskit)

👉 Clone:

```bash
git clone https://github.com/Qiskit/qiskit
```

👉 Extract:

* `/examples`
* `/test`

---

## 7. IBM Quantum Lab (⚡ dynamic)

* [https://quantum-computing.ibm.com/lab](https://quantum-computing.ibm.com/lab)

👉 Use:

* Playwright (not Firecrawl)

---

## 8. Stack Overflow

* [https://stackoverflow.com](https://stackoverflow.com)

Search:

* `qiskit openqasm error`
* `transpile issue`

👉 Use Firecrawl on specific pages only

---

## 9. Quantum Computing SE

* [https://quantumcomputing.stackexchange.com/](https://quantumcomputing.stackexchange.com/)

👉 Same strategy as above

---

## 10. arXiv (advanced circuits)

* [https://arxiv.org/](https://arxiv.org/)

👉 Use:

* PDFs → parse separately

---

# 🧠 3. Batch Crawl Script (REAL USE)

```javascript
import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs';

const app = new FirecrawlApp({ apiKey: "YOUR_API_KEY" });

const sites = [
  "https://quantum-computing.ibm.com/docs",
  "https://openqasm.com/",
  "https://qiskit.org/textbook/",
  "https://docs.qiskit.org/"
];

for (const url of sites) {
  const res = await app.scrapeUrl(url, {
    formats: ["markdown"]
  });

  fs.writeFileSync(
    `data/${url.replace(/https?:\/\//, "").replace(/\//g, "_")}.md`,
    res.markdown
  );

  console.log(`Saved: ${url}`);
}
```

---

# 🔥 4. Crawl Entire Site (VERY USEFUL)

```javascript
await app.crawlUrl("https://qiskit.org/textbook/", {
  limit: 50, // pages
  formats: ["markdown"]
});
```

💡 Use for:

* Docs
* Textbooks

---

# 🧩 5. Post-Processing (CRUCIAL STEP)

After scraping, extract:

### 🎯 QASM snippets

```regex
(OpenQASM|qreg|creg|cx|h).*;
```

---

### 🎯 Code blocks

Split markdown:

````js
content.split("```")
````

---

### 🎯 Store as structured JSON

```json
{
  "source": "qiskit_textbook",
  "type": "circuit",
  "content": "OPENQASM 2.0; ...",
  "tags": ["ghz", "entanglement"]
}
```

---

# ⚠️ 6. Common Mistakes (Avoid These)

❌ Crawling everything blindly → noisy embeddings
❌ Not chunking → poor retrieval
❌ Mixing docs + code without labeling
❌ Ignoring backend constraints

---

# 🚀 7. Minimum Working Pipeline

Start simple:

1. Firecrawl → markdown
2. Extract code blocks
3. Store JSON
4. Embed (OpenAI / local)
5. Retrieve → generate QASM

---


