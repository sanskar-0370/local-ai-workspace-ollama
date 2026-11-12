import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom Vite Middleware to scrape live DuckDuckGo HTML results locally (No API Key required)
const localWebSearchPlugin = () => ({
  name: 'local-web-rag-search',
  configureServer(server) {
    server.middlewares.use('/api/web-search', async (req, res) => {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const query = urlObj.searchParams.get('q') || '';

        if (!query.trim()) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ results: [] }));
          return;
        }

        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(ddgUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });

        const html = await response.text();
        const results = [];

        // Extract Titles, URLs, and Snippets from DuckDuckGo HTML
        const blockRegex =
          /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        let match;

        while ((match = blockRegex.exec(html)) !== null && results.length < 5) {
          let rawUrl = match[1];
          const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
          if (uddgMatch) rawUrl = decodeURIComponent(uddgMatch[1]);

          const cleanText = (str) =>
            str
              .replace(/<[^>]+>/g, '')
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/\s+/g, ' ')
              .trim();

          const title = cleanText(match[2]);
          const snippet = cleanText(match[3]);

          if (title && snippet && rawUrl.startsWith('http')) {
            results.push({ title, url: rawUrl, snippet });
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ results }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message, results: [] }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), localWebSearchPlugin()],
});