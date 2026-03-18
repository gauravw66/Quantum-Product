import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('./.env') });

const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey) {
  console.error('FIRECRAWL_API_KEY not set in .env');
  process.exit(1);
}

const app = new FirecrawlApp({ apiKey });

const sites = [
  'https://quantum-computing.ibm.com/docs',
  'https://openqasm.com/',
  'https://qiskit.org/textbook/',
  'https://docs.qiskit.org/'
];

const crawlOptions = {
  formats: ['markdown', 'html'], // best for RAG: markdown for embeddings, html for fallback parsing
  limit: 50, // crawl up to 50 pages per site for deep coverage
  depth: 2, // go 2 levels deep for subpages
  followLinks: true, // follow internal links for richer dataset
  includeSitemaps: true, // use sitemaps if available
  includeRobots: true, // respect robots.txt
  timeout: 120000 // 2 min per site
};

(async () => {
  for (const url of sites) {
    try {
      const res = await app.crawlUrl(url, crawlOptions);
      const base = url.replace(/https?:\/\//, '').replace(/\W+/g, '_');
      if (res.pages) {
        for (const page of res.pages) {
          const fname = `${base}_${page.url.replace(/https?:\/\//, '').replace(/\W+/g, '_')}.md`;
          fs.writeFileSync(
            path.join('data', fname),
            page.markdown || ''
          );
        }
        console.log(`Crawled ${res.pages.length} pages from: ${url}`);
      } else {
        // fallback: single page
        const fname = `${base}.md`;
        fs.writeFileSync(
          path.join('data', fname),
          res.markdown || ''
        );
        console.log(`Crawled single page: ${url}`);
      }
    } catch (err) {
      console.error(`Failed to crawl ${url}:`, err.message);
    }
  }
})();
