# Authentication API Documentation

Base URL: `https://vercel-auth-delta.vercel.app/`

## Overview

This API provides authentication services including user registration and login functionality. The API uses JSON for request and response payloads.

## Endpoints

### Health Check

Check if the API server is running properly.

```
GET /health
```

#### Response

```json
{
  "status": "ok", 
  "message": "Server is running"
}
```

### Database Connection Test

Verify the database connection is working correctly.

```
GET /db-test
```

#### Successful Response

```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2025-04-06T12:34:56.789Z"
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Database connection failed",
  "details": "Error message details"
}
```

### User Registration

Register a new user account.

```
POST /signup
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Successful Response (201 Created)

```json
{
  "success": true,
  "message": "User created successfully",
  "email": "user@example.com"
}
```

#### Error Responses

**Missing Fields (400 Bad Request)**
```json
{
  "success": false,
  "message": "Email and password required"
}
```

**User Already Exists (409 Conflict)**
```json
{
  "success": false,
  "message": "User already exists"
}
```

**Server Error (500 Internal Server Error)**
```json
{
  "success": false,
  "message": "Server error",
  "details": "Error message details"
}
```

### User Login

Authenticate an existing user.

```
POST /signin
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Successful Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "email": "user@example.com"
}
```

#### Error Responses

**Missing Fields (400 Bad Request)**
```json
{
  "success": false,
  "message": "Email and password required"
}
```

**Invalid Credentials (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Server Error (500 Internal Server Error)**
```json
{
  "success": false,
  "message": "Server error",
  "details": "Error message details"
}
```

## Error Handling

The API returns appropriate HTTP status codes along with JSON responses containing:
- `success`: Boolean indicating if the request was successful
- `message`: Human-readable description of the result
- `details`: (Only on 500 errors) Technical details about the error

## Content Types

- All requests must include `Content-Type: application/json` header
- All responses will be in JSON format
