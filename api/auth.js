// Auth API using Neon PostgreSQL for persistence
const crypto = require('crypto');
const { Pool } = require('pg');

// Connection config
const pool = new Pool({
  connectionString: 'postgresql://podcast_owner:npg_4AqXVbtgrGz3@ep-noisy-resonance-a5j31fh8-pooler.us-east-2.aws.neon.tech/podcast?sslmode=require'
});

// Helper functions
const generateSalt = () => Math.random().toString(36).substring(2, 15);
const hashPassword = (password, salt) => crypto.createHash('sha256').update(password + salt).digest('hex');

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

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
    // Ensure database is initialized
    await initializeDatabase();
    
    // SIGNUP ENDPOINT
    if (path === 'signup' && req.method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }
      
      // Check if user already exists
      const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkResult.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }
      
      // Create new user
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);
      
      // Store user
      await pool.query(
        'INSERT INTO users (email, password, salt) VALUES ($1, $2, $3)',
        [email, hashedPassword, salt]
      );
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        email
      });
    }
    
    // SIGNIN ENDPOINT
    if (path === 'signin' && req.method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }
      
      // Check if user exists
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      // Verify password
      const hashedPassword = hashPassword(password, user.salt);
      
      if (hashedPassword !== user.password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        email: user.email
      });
    }
    
    // LIST ALL USERS ENDPOINT
    if (path === 'users' && req.method === 'GET') {
      const result = await pool.query('SELECT email, created_at FROM users');
      
      return res.status(200).json({
        success: true,
        userCount: result.rows.length,
        users: result.rows
      });
    }
    
    // Endpoint not found
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Auth API Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
