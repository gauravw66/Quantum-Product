import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const sites = [
  // 🔥 CORE (must-have)
  'https://openqasm.com/',
  'https://openqasm.com/language/',
  'https://openqasm.com/examples/',

  // 🔥 IBM execution rules
  'https://quantum-computing.ibm.com/docs',
  'https://docs.qiskit.org/docs/guides',

  // 🔥 Circuit patterns (VERY IMPORTANT)
  'https://qiskit.org/textbook/ch-states/',
  'https://qiskit.org/textbook/ch-algorithms/',
  'https://qiskit.org/textbook/ch-gates/',

  // 🔥 API-level circuit construction
  'https://docs.qiskit.org/documentation/apidoc/circuit.html',
    'https://openqasm.com/grammar/'
];

const visited = new Set();
const maxPagesPerSite = 50;
const maxDepth = 5;

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.error(`Failed to fetch ${url}:`, e.message);
    return null;
  }
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const regex = /href=["']([^"'#?]+)["']/g;
  let match;
  while ((match = regex.exec(html))) {
    let link = match[1];
    if (link.startsWith('http')) {
      if (link.startsWith(baseUrl)) links.add(link);
    } else if (link.startsWith('/')) {
      links.add(baseUrl.replace(/\/$/, '') + link);
    }
  }
  return Array.from(links);
}

// Helper: Filter out non-doc pages (assets, search, login, etc.)
function isDocPage(url) {
  return !/\.(png|jpg|jpeg|gif|svg|css|js|ico|pdf|zip|tar|gz|mp4|mp3|woff|ttf|eot|json)$/i.test(url)
    && !/\b(login|signup|register|search|account|auth|static|assets|cdn|image|video|audio|download|logout|reset)\b/i.test(url);
}

// Helper: Extract main content (tries common doc selectors, fallback to body)
function extractMainContent(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  let main = doc.querySelector('main, article, .main-content, .content, #content, #main, .doc-content');
  if (!main) main = doc.body;
  return main ? main.innerHTML : html;
}

// Helper: Extract code blocks (including QASM)
function extractCodeBlocks(html) {
  const dom = new JSDOM(html);
  const codeBlocks = Array.from(dom.window.document.querySelectorAll('pre, code'));
  return codeBlocks.map(el => el.textContent.trim()).filter(Boolean);
}

const turndownService = new TurndownService();

async function crawlSite(startUrl, siteIdx) {
  const base = startUrl.replace(/https?:\/\//, '').replace(/\W+/g, '_');
  let queue = [{ url: startUrl, depth: 0 }];
  let count = 0;
  while (queue.length && count < maxPagesPerSite) {
    const { url, depth } = queue.shift();
    if (visited.has(url) || depth > maxDepth || !isDocPage(url)) continue;
    visited.add(url);
    const html = await fetchPage(url);
    if (!html) continue;
    // Extract main content and convert to markdown
    const mainHtml = extractMainContent(html);
    const markdown = turndownService.turndown(mainHtml);
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(mainHtml);
    // Save markdown
    const mdFname = `${base}_${count}.md`;
    fs.writeFileSync(path.join('data', mdFname), markdown);
    // Save code blocks (if any)
    if (codeBlocks.length) {
      const codeFname = `${base}_${count}_code.txt`;
      fs.writeFileSync(path.join('data', codeFname), codeBlocks.join('\n\n---\n\n'));
    }
    console.log(`Saved: ${url}`);
    count++;
    if (depth < maxDepth) {
      const links = extractLinks(html, startUrl);
      for (const link of links) {
        if (!visited.has(link) && isDocPage(link)) queue.push({ url: link, depth: depth + 1 });
      }
    }
  }
}

(async () => {
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  for (let i = 0; i < sites.length; i++) {
    await crawlSite(sites[i], i);
  }
})();
