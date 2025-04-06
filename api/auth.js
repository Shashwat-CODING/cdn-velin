const { createHash } = require('crypto');
const { createClient } = require('@vercel/edge-config');
const jwt = require('jsonwebtoken');

// Initialize Edge Config client
const edge = createClient(process.env.EDGE_CONFIG);

// Helper functions
const generateSalt = () => Math.random().toString(36).substring(2, 15);
const hashPassword = (password, salt) => createHash('sha256').update(password + salt).digest('hex');

// Middleware to verify admin access
const verifyAdminToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an admin user (you might want to add admin flag in user data)
    // For testing purposes, we'll just check if the token is valid
    return !!decoded;
  } catch (error) {
    return false;
  }
};

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
      
      // Get users from Edge Config
      let users = await edge.get('users') || {};
      
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
      
      await edge.set('users', users);
      
      // Generate JWT
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      
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
      
      // Get users from Edge Config
      const users = await edge.get('users') || {};
      
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
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      
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
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({
          success: true,
          user: { email: decoded.email }
        });
      } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    
    // LIST ALL USERS ENDPOINT - Admin/Testing only
    if (path === 'users' && req.method === 'GET') {
      // In a production environment, you should secure this endpoint
      if (!process.env.TESTING_MODE && !verifyAdminToken(req)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
      
      // Get users from Edge Config
      const users = await edge.get('users') || {};
      
      // Format user data (you might want to exclude sensitive information in production)
      const userList = Object.keys(users).map(email => {
        // For testing/development, include all info
        if (process.env.TESTING_MODE === 'true') {
          return {
            email,
            ...users[email]
          };
        }
        
        // For production, exclude sensitive info
        return {
          email,
          createdAt: users[email].createdAt
        };
      });
      
      return res.status(200).json({
        success: true,
        userCount: userList.length,
        users: userList
      });
    }
    
    // RESET DATABASE ENDPOINT - Testing only
    if (path === 'reset' && req.method === 'DELETE') {
      // Only allow this in testing mode
      if (process.env.TESTING_MODE !== 'true') {
        return res.status(403).json({ 
          success: false, 
          message: 'This endpoint is only available in testing mode' 
        });
      }
      
      // Reset users database
      await edge.set('users', {});
      
      return res.status(200).json({
        success: true,
        message: 'Database reset successfully'
      });
    }
    
    // Endpoint not found
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
