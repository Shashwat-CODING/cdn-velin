// Auth API using Neon PostgreSQL for persistence
const crypto = require('crypto');
const { Pool } = require('pg');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

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

// Initialize database on startup
initializeDatabase().catch(console.error);

// SIGNUP ENDPOINT
app.post('/signup', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// SIGNIN ENDPOINT
app.post('/signin', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Signin Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// LIST ALL USERS ENDPOINT
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT email, created_at FROM users');
    
    return res.status(200).json({
      success: true,
      userCount: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('List Users Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for serverless environments if needed
module.exports = app;
