// Simplified auth.js - No environment variables or external dependencies
const crypto = require('crypto');

// In-memory storage - For a production app, you'd want to use a database
const users = {};

// Fixed JWT secret - In production, this should be an environment variable
const JWT_SECRET = "your-fixed-jwt-secret-replace-in-production";

// Helper functions
const generateSalt = () => Math.random().toString(36).substring(2, 15);
const hashPassword = (password, salt) => crypto.createHash('sha256').update(password + salt).digest('hex');

// Simple JWT implementation
const generateToken = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours expiration
  const data = { ...payload, exp };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '');
  const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64').replace(/=/g, '');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64')
    .replace(/=/g, '');
  
  return `${base64Header}.${base64Payload}.${signature}`;
};

const verifyToken = (token) => {
  try {
    const [base64Header, base64Payload, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64')
      .replace(/=/g, '');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    
    // Check token expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

// Main request handler
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const path = req.url.split('/').pop();
  
  try {
    // SIGNUP ENDPOINT
    if (path === 'signup' && req.method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }
      
      // Check if user already exists
      if (users[email]) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }
      
      // Create new user
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);
      
      // Store user
      users[email] = {
        salt,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      // Generate JWT
      const token = generateToken({ email });
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        token
      });
    }
    
    // SIGNIN ENDPOINT
    if (path === 'signin' && req.method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }
      
      // Check if user exists
      if (!users[email]) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Verify password
      const user = users[email];
      const hashedPassword = hashPassword(password, user.salt);
      
      if (hashedPassword !== user.password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Generate JWT
      const token = generateToken({ email });
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token
      });
    }
    
    // VERIFY TOKEN ENDPOINT
    if (path === 'verify' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization header required' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      
      return res.status(200).json({
        success: true,
        user: { email: decoded.email }
      });
    }
    
    // LIST ALL USERS ENDPOINT
    if (path === 'users' && req.method === 'GET') {
      const userList = Object.keys(users).map(email => ({
        email,
        createdAt: users[email].createdAt
      }));
      
      return res.status(200).json({
        success: true,
        userCount: userList.length,
        users: userList
      });
    }
    
    // Endpoint not found
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Auth API Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
