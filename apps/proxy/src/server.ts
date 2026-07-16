import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { registerProxyRouter } from './routes/proxy.js';
import { createResourceInvocationsTable } from '@x402scan/analytics-db';

const app = new Hono();

// Enable CORS for all origins
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
    credentials: true,
  })
);

app.get('/', c => {
  const acceptHeader = c.req.header('accept') ?? '';

  // Serve HTML for browser requests
  if (acceptHeader.includes('text/html')) {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>x402 Proxy Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-top: 0; }
    h2 { color: #555; margin-top: 30px; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .endpoint {
      background: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #007acc;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    a { color: #007acc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
  <script>
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
  <div class="container">
    <h1>🔄 x402 Proxy Server</h1>
    <p><strong>Version:</strong> 1.0.0</p>
    <p>CORS-enabled proxy service for x402 resource invocations</p>
    
    <h2>Endpoints</h2>
    <div class="endpoint">
      <strong>Proxy Endpoint:</strong><br>
      <code>/api/proxy?url=&lt;encoded-url&gt;&share_data=&lt;boolean&gt;</code>
    </div>
    
    <h2>Usage</h2>
    <p>Proxy requests to external URLs with CORS support</p>
    <p><strong>Example:</strong><br>
    <code>/api/proxy?url=https%3A%2F%2Fexample.com%2Fapi</code></p>
    
    <h2>Parameters</h2>
    <ul>
      <li><strong>url</strong> (Required): The URL to proxy the request to (URL-encoded)</li>
      <li><strong>share_data</strong> (Optional): Set to "true" to include request/response headers and body in logs</li>
    </ul>
    
    <h2>Supported Methods</h2>
    <p>GET, POST, PUT, PATCH, DELETE</p>
    
    <div class="footer">
      <p><a href="https://x402scan.com" target="_blank">Visit x402scan.com</a></p>
    </div>
  </div>
</body>
</html>
    `);
  }

  // Serve JSON for API requests
  return c.json({
    service: 'x402 Proxy Server',
    description: 'CORS-enabled proxy service for x402 resource invocations',
    version: '1.0.0',
    endpoints: {
      proxy: '/api/proxy?url=<encoded-url>&share_data=<boolean>',
    },
    usage: {
      description: 'Proxy requests to external URLs with CORS support',
      example: '/api/proxy?url=https%3A%2F%2Fexample.com%2Fapi',
      parameters: {
        url: 'Required. The URL to proxy the request to (URL-encoded)',
        share_data:
          'Optional. Set to "true" to include request/response headers and body in logs',
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    links: {
      website: 'https://x402scan.com',
    },
  });
});

registerProxyRouter(app);

const port = Number(process.env.PORT) || 6969;

// Initialize ClickHouse table on startup
void createResourceInvocationsTable().catch(error => {
  console.error(
    'Failed to initialize ClickHouse, continuing without it:',
    error instanceof Error ? error.message : String(error)
  );
});

serve({
  fetch: app.fetch,
  port,
});
