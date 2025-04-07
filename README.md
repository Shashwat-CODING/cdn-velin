# Authentication API Documentation

This API provides user authentication services including signup, signin, and user management functionality.

## Base URL

```
https://vercel-auth-delta.vercel.app/
```

## API Endpoints

### Health Check

Verify if the API server is operational.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Database Connection Test

Test the connection to the database.

**Endpoint:** `GET /db-test`

**Success Response:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2025-04-07T12:34:56.789Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Database connection failed",
  "details": "Error details here"
}
```

### User Signup

Register a new user with the system.

**Endpoint:** `POST /signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Error Responses:**
- **400 Bad Request** - Missing required fields
  ```json
  {
    "success": false,
    "message": "Email, password, name, and phone number are required"
  }
  ```

- **409 Conflict** - User already exists
  ```json
  {
    "success": false,
    "message": "User already exists"
  }
  ```

- **500 Server Error**
  ```json
  {
    "success": false,
    "message": "Server error",
    "details": "Error details here"
  }
  ```

### User Signin

Authenticate an existing user.

**Endpoint:** `POST /signin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Error Responses:**
- **400 Bad Request** - Missing required fields
  ```json
  {
    "success": false,
    "message": "Email and password required"
  }
  ```

- **401 Unauthorized** - Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

- **500 Server Error**
  ```json
  {
    "success": false,
    "message": "Server error",
    "details": "Error details here"
  }
  ```

### List All Users (Internal Use Only)

Retrieve information about all registered users.

**Endpoint:** `GET /users`

**Success Response (200):**
```json
{
  "success": true,
  "userCount": 2,
  "users": [
    {
      "id": 1,
      "email": "user1@example.com",
      "name": "User One",
      "phone": "+1234567890",
      "password": "hashedpasswordvalue",
      "salt": "randomsaltvalue",
      "created_at": "2025-04-07T10:30:00.000Z"
    },
    {
      "id": 2,
      "email": "user2@example.com",
      "name": "User Two",
      "phone": "+0987654321",
      "password": "hashedpasswordvalue",
      "salt": "randomsaltvalue",
      "created_at": "2025-04-07T11:45:00.000Z"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Server error",
  "details": "Error details here"
}
```

## Sample Code

### JavaScript (Fetch API)

#### Signup Example
```javascript
async function signupUser(userData) {
  try {
    const response = await fetch('https://vercel-auth-delta.vercel.app/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}
```

#### Signin Example
```javascript
async function signinUser(credentials) {
  try {
    const response = await fetch('https://vercel-auth-delta.vercel.app/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
}
```

#### List Users Example
```javascript
async function getUsers() {
  try {
    const response = await fetch('https://vercel-auth-delta.vercel.app/users');
    return await response.json();
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}
```

## Important Notes

- The `/users` endpoint provides sensitive information including password hashes and should **only be used internally** with proper access controls.
- All endpoints return JSON responses with a consistent structure including a `success` boolean flag.
- HTTP status codes are used appropriately to indicate the result of the request.

## Security Considerations

- This API does not implement token-based authentication. Consider implementing JWT for production use.
- Password hashing is implemented server-side using SHA-256 with salting.
- Ensure that this API is only accessible over HTTPS in production environments.
