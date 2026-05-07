# Post API Documentation

This document provides details for the Post management API routes in the Sullerk platform. These routes follow a two-step process: first, uploading media, and second, finalizing the post creation.

---

## 1. Upload Post Media (Step 1)
**Endpoint:** `POST /api/v1/posts/upload`  
**Description:** Uploads a single media file (image/video) to be used in a post. The file is initially marked as `pending`.

### Request
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: multipart/form-data`
- **Body (form-data):**
  - `file`: (binary) The media file.
  - `purpose`: (string) e.g., `PHOTOS`, `PROOF_PHOTO`.
  - `context`: (string) `CREATE` or `EDIT`.

### Response (200 OK)
```json
{
  "message": "File uploaded successfully",
  "success": true,
  "data": [
    {
      "id": "69fb040e3915f10779259593",
      "name": "tiny.jpg",
      "url": "http://localhost:8989/api/v1/files/5a1a1f9c-ccf2-43d7-a3cd-c13cebd1f410.webp",
      "purpose": "PHOTOS",
      "isPending": true
    }
  ]
}
```

### CURL Example
```bash
curl -X POST "http://localhost:8989/api/v1/posts/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg" \
  -F "purpose=PHOTOS" \
  -F "context=CREATE"
```

---

## 2. Create Post (Step 2)
**Endpoint:** `POST /api/v1/posts`  
**Description:** Finalizes the post creation using the file IDs obtained from Step 1.

### Request
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "description": "Check out my new collection!",
  "images": [
    {
      "fileId": "69fb040e3915f10779259593",
      "url": "http://localhost:8989/api/v1/files/5a1a1f9c-ccf2-43d7-a3cd-c13cebd1f410.webp"
    }
  ],
  "poll": {
    "question": "Which sport is the best?",
    "options": [
      { "text": "Football" },
      { "text": "Basketball" }
    ],
    "multipleChoice": false
  }
}
```

### Response (201 Created)
```json
{
  "message": "Post created successfully",
  "success": true,
  "data": {
    "id": "69fb06a63915f10779259594",
    "description": "Check out my new collection!",
    "images": [
      {
        "fileId": "69fb040e3915f10779259593",
        "url": "http://localhost:8989/api/v1/files/5a1a1f9c-ccf2-43d7-a3cd-c13cebd1f410.webp"
      }
    ],
    "pollQuestion": "Which sport is the best?",
    "pollOptions": [
      { "id": "69fb06a63915f10779259595", "text": "Football", "votes": 0 },
      { "id": "69fb06a63915f10779259596", "text": "Basketball", "votes": 0 }
    ],
    "createdAt": "2026-05-06T09:15:18.210Z"
  }
}
```

### CURL Example
```bash
curl -X POST "http://localhost:8989/api/v1/posts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Check out my new collection!",
    "images": [
      {
        "fileId": "69fb040e3915f10779259593",
        "url": "http://localhost:8989/api/v1/files/5a1a1f9c-ccf2-43d7-a3cd-c13cebd1f410.webp"
      }
    ],
    "poll": {
      "question": "Which sport is the best?",
      "options": [
        { "text": "Football" },
        { "text": "Basketball" }
      ],
      "multipleChoice": false
    }
  }'
```

---

## 3. Delete Pending Media
**Endpoint:** `DELETE /api/v1/posts/upload/{id}`  
**Description:** Deletes a pending media file that has not yet been attached to a post.

### Request
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`

### Response (200 OK)
```json
{
  "message": "File deleted successfully",
  "success": true,
  "data": {
    "success": true
  }
}
```

### CURL Example
```bash
curl -X DELETE "http://localhost:8989/api/v1/posts/upload/69fb040e3915f10779259593" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
