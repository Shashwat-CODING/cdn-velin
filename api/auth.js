const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = process.env.PORT || 3000;

// Target URL to proxy requests to
const targetUrl = 'https://archive.org/serve/akkidark';

// Configuration for the proxy
const proxyOptions = {
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/' // Rewrite all paths
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log the response from the target server
    console.log(`Proxied response from ${targetUrl} with status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
};

// Apply the proxy middleware
app.use('/', createProxyMiddleware(proxyOptions));

// Start the server
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
  console.log(`All requests will be forwarded to: ${targetUrl}`);
});
