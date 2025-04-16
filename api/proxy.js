const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Target URL to proxy requests to
const targetUrl = 'https://archive.org/serve/akkidark';

// Configuration for the proxy
const proxyOptions = {
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/' // Keep paths intact when forwarding
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log the response from the target server
    console.log(`Proxied ${req.method} request to ${req.path} with status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
};

// Status endpoint to verify the proxy is running
app.get('/status', (req, res) => {
  res.json({ status: 'ok', proxy: targetUrl });
});

// Apply the proxy middleware to all other routes
app.use('/', createProxyMiddleware(proxyOptions));

// Start the server if not running in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
    console.log(`All requests will be forwarded to: ${targetUrl}`);
  });
}

// Export for serverless environment
module.exports = app;
