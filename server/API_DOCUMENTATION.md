# 📡 Echolia API Documentation

Complete API reference for the Echolia real-time chat application.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Room Endpoints](#room-endpoints)
- [Message Endpoints](#message-endpoints)
- [Upload Endpoints](#upload-endpoints)
- [Socket.io Events](#socketio-events)

## Base URL

```
Development: http://localhost:5000
Production: https://your-domain.com
```

## Authentication

Echolia uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Token Lifespan
- **Access Token**: 7 days (default)
- **Refresh Token**: 30 days (default)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Common Error Messages

```json
{
  "success": false,
  "message": "Not authorized to access this route. No token provided."
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per window
- Exceeding limit returns 429 (Too Many Requests)

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:
- `username`: 3-30 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Minimum 6 characters

**Success Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": "https://ui-avatars.com/api/?background=random&name=john_doe",
      "status": "offline",
      "isOnline": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### Login

Authenticate and receive access tokens.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": "https://ui-avatars.com/api/?background=random&name=john_doe",
      "status": "online",
      "isOnline": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Get Current User

Retrieve authenticated user's information.

**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": "https://ui-avatars.com/api/?background=random&name=john_doe",
      "status": "online",
      "statusMessage": "Available",
      "isOnline": true,
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Logout

Logout and invalidate refresh token.

**Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Update Password

Change user's password.

**Endpoint**: `PUT /api/auth/password`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## User Endpoints

### Get Online Users

Retrieve all currently online users.

**Endpoint**: `GET /api/users/online`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "avatar": "https://...",
        "status": "online"
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "username": "jane_smith",
        "avatar": "https://...",
        "status": "online"
      }
    ],
    "count": 2
  }
}
```

---

### Search Users

Search for users by username or email.

**Endpoint**: `GET /api/users/search?q=john`

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:
- `q` (required): Search query (2-100 characters)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com",
        "avatar": "https://...",
        "status": "online",
        "isOnline": true
      }
    ]
  }
}
```

---

### Get User by ID

Retrieve a specific user's profile.

**Endpoint**: `GET /api/users/:userId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "avatar": "https://...",
      "status": "online",
      "statusMessage": "Available",
      "isOnline": true,
      "lastSeen": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Update Profile

Update user's profile information.

**Endpoint**: `PUT /api/users/profile`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "username": "new_username",
  "avatar": "https://new-avatar-url.com/avatar.jpg",
  "statusMessage": "Busy with work",
  "status": "busy"
}
```

**Validation**:
- `username`: Optional, 3-30 characters
- `statusMessage`: Optional, max 100 characters
- `status`: Optional, one of: online, offline, away, busy

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "new_username",
      "avatar": "https://...",
      "status": "busy",
      "statusMessage": "Busy with work"
    }
  }
}
```

---

### Block User

Block a user from sending messages.

**Endpoint**: `POST /api/users/block/:userId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### Unblock User

Unblock a previously blocked user.

**Endpoint**: `DELETE /api/users/block/:userId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## Room Endpoints

### Get Public Rooms

Retrieve all public chat rooms.

**Endpoint**: `GET /api/rooms/public`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "General",
        "description": "General discussion",
        "roomType": "public",
        "avatar": "https://...",
        "memberCount": 25,
        "creator": {
          "id": "507f1f77bcf86cd799439011",
          "username": "john_doe",
          "avatar": "https://..."
        },
        "lastActivity": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Get User's Rooms

Retrieve rooms the authenticated user is a member of.

**Endpoint**: `GET /api/rooms/my-rooms`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "General",
        "roomType": "public",
        "memberCount": 25,
        "unreadCount": 5,
        "lastMessage": {
          "id": "507f1f77bcf86cd799439014",
          "content": "Hello everyone!",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      }
    ]
  }
}
```

---

### Get Room by ID

Retrieve detailed information about a specific room.

**Endpoint**: `GET /api/rooms/:roomId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "507f1f77bcf86cd799439013",
      "name": "General",
      "description": "General discussion",
      "roomType": "public",
      "avatar": "https://...",
      "creator": {
        "id": "507f1f77bcf86cd799439011",
        "username": "john_doe"
      },
      "members": [
        {
          "user": {
            "id": "507f1f77bcf86cd799439011",
            "username": "john_doe",
            "avatar": "https://...",
            "status": "online",
            "isOnline": true
          },
          "role": "admin",
          "joinedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "memberCount": 25,
      "lastActivity": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Create Room

Create a new chat room.

**Endpoint**: `POST /api/rooms`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "name": "Project Team",
  "description": "Team collaboration space",
  "roomType": "private",
  "avatar": "https://custom-avatar-url.com/avatar.jpg"
}
```

**Validation**:
- `name`: Required, 3-50 characters
- `description`: Optional, max 200 characters
- `roomType`: Optional, "public" or "private" (default: "public")
- `avatar`: Optional, URL string

**Success Response** (201):
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": {
      "id": "507f1f77bcf86cd799439015",
      "name": "Project Team",
      "description": "Team collaboration space",
      "roomType": "private",
      "creator": {
        "id": "507f1f77bcf86cd799439011",
        "username": "john_doe"
      },
      "memberCount": 1
    }
  }
}
```

---

### Update Room

Update room information (admin only).

**Endpoint**: `PUT /api/rooms/:roomId`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "name": "Updated Room Name",
  "description": "Updated description",
  "avatar": "https://new-avatar.jpg"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "room": {
      "id": "507f1f77bcf86cd799439015",
      "name": "Updated Room Name",
      "description": "Updated description"
    }
  }
}
```

---

### Delete Room

Delete a room (creator only).

**Endpoint**: `DELETE /api/rooms/:roomId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

---

### Add Member to Room

Add a user to a room.

**Endpoint**: `POST /api/rooms/:roomId/members`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439012"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "room": {
      "id": "507f1f77bcf86cd799439015",
      "memberCount": 2
    }
  }
}
```

---

### Remove Member from Room

Remove a user from a room (admin) or leave room (self).

**Endpoint**: `DELETE /api/rooms/:roomId/members/:userId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## Message Endpoints

### Get Room Messages

Retrieve messages from a room with pagination.

**Endpoint**: `GET /api/messages/room/:roomId?page=1&limit=50`

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 50, max: 100)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439014",
        "content": "Hello everyone!",
        "sender": {
          "id": "507f1f77bcf86cd799439011",
          "username": "john_doe",
          "avatar": "https://...",
          "status": "online"
        },
        "room": "507f1f77bcf86cd799439013",
        "messageType": "text",
        "isEdited": false,
        "reactions": [
          {
            "user": "507f1f77bcf86cd799439012",
            "emoji": "👍",
            "createdAt": "2024-01-15T10:31:00.000Z"
          }
        ],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalMessages": 150,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

---

### Get Direct Messages

Retrieve direct messages between two users.

**Endpoint**: `GET /api/messages/direct/:userId?page=1&limit=50`

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 50, max: 100)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439016",
        "content": "Hi there!",
        "sender": {
          "id": "507f1f77bcf86cd799439011",
          "username": "john_doe"
        },
        "recipient": "507f1f77bcf86cd799439012",
        "messageType": "text",
        "readBy": [
          {
            "user": "507f1f77bcf86cd799439012",
            "readAt": "2024-01-15T10:31:00.000Z"
          }
        ],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalMessages": 25,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### Edit Message

Edit a message (within 15 minutes).

**Endpoint**: `PUT /api/messages/:messageId`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "content": "Updated message content"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "message": {
      "id": "507f1f77bcf86cd799439014",
      "content": "Updated message content",
      "isEdited": true,
      "editedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Cannot edit messages older than 15 minutes"
}
```

---

### Delete Message

Delete a message (sender or room admin).

**Endpoint**: `DELETE /api/messages/:messageId`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### Search Messages

Search through messages.

**Endpoint**: `GET /api/messages/search?q=keyword&roomId=507f1f77bcf86cd799439013`

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:
- `q`: Search query (required, 2-100 characters)
- `roomId`: Optional, search within specific room

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439014",
        "content": "Hello everyone! This matches the keyword.",
        "sender": {
          "username": "john_doe"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### Get Unread Message Count

Get count of unread messages.

**Endpoint**: `GET /api/messages/unread/count`

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalUnread": 15,
    "unreadByRoom": {
      "507f1f77bcf86cd799439013": 10,
      "507f1f77bcf86cd799439015": 3
    },
    "unreadDirectMessages": 2
  }
}
```

---

## Upload Endpoints

### Upload File

Upload a single file (image, document, or media).

**Endpoint**: `POST /api/upload`

**Headers**: 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body** (Form Data):
- `file`: File to upload (max 5MB)

**Allowed File Types**:
- Images: jpeg, jpg, png, gif, webp
- Documents: pdf, doc, docx, txt
- Media: mp4, mp3, wav

**Success Response** (200):
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "echolia/images/abc123",
    "format": "jpg",
    "size": 1048576,
    "fileType": "image",
    "originalName": "photo.jpg"
  }
}
```

---

### Upload Multiple Files

Upload multiple files at once (max 5 files).

**Endpoint**: `POST /api/upload/multiple`

**Headers**: 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body** (Form Data):
- `files`: Array of files (max 5)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "files": [
      {
        "url": "https://res.cloudinary.com/.../image1.jpg",
        "publicId": "echolia/images/abc123",
        "fileType": "image"
      },
      {
        "url": "https://res.cloudinary.com/.../image2.jpg",
        "publicId": "echolia/images/def456",
        "fileType": "image"
      }
    ],
    "count": 2
  }
}
```

---

### Upload Avatar

Upload user avatar (profile picture).

**Endpoint**: `POST /api/upload/avatar`

**Headers**: 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body** (Form Data):
- `avatar`: Image file (max 5MB, images only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../avatar.jpg",
    "publicId": "echolia/avatars/abc123",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "avatar": "https://res.cloudinary.com/.../avatar.jpg"
    }
  }
}
```

---

### Upload Room Avatar

Upload room/channel avatar.

**Endpoint**: `POST /api/upload/room-avatar`

**Headers**: 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body** (Form Data):
- `roomAvatar`: Image file (max 5MB, images only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Room avatar uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../room-avatar.jpg",
    "publicId": "echolia/room-avatars/xyz789"
  }
}
```

---

### Delete File

Delete an uploaded file from Cloudinary.

**Endpoint**: `DELETE /api/upload`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "publicId": "echolia/images/abc123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Socket.io Events

See the [README.md](README.md#-socketio-events) for complete Socket.io event documentation.

---

## Code Examples

### JavaScript (Fetch API)

```javascript
// Register user
const register = async () => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Get user profile (authenticated)
const getProfile = async (token) => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
};
```

### cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Testing with Postman

1. Import the API endpoints into Postman
2. Set up an environment variable for `baseUrl`: `http://localhost:5000`
3. Create a collection for Echolia API
4. Add requests for each endpoint
5. Use Postman's authentication tab to set Bearer token

---

**For more information, see the [README.md](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md)**