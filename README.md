# CF AI Gateway Free

Free OpenAI-compatible gateway for Cloudflare Workers AI.

Supports:

- Chat Completions
- Streaming
- Vision (OCR & Image Understanding)
- Embeddings
- Image Generation
- Dynamic Models Catalog

---

# Features

✅ OpenAI Compatible API

✅ Cloudflare Workers AI Backend

✅ Dynamic Models Catalog

✅ Streaming Support

✅ Vision / OCR

✅ Image Generation

✅ Embeddings

✅ Signed URL Image Support

✅ R2 Image Support

✅ Free Tier Friendly

---

# Supported Endpoints

## Models

### List Models

```http
GET /v1/models
```

### Model Catalog

```http
GET /v1/models/catalog
```

### Category Models

```http
GET /v1/models/catalog/:category
```

Example:

```http
GET /v1/models/catalog/text_generation
```

### Model Details

```http
GET /v1/models/details/:model
```

Example:

```http
GET /v1/models/details/@cf/qwen/qwen3.8-27b
```

---

## Chat

### Chat Completions

```http
POST /v1/chat/completions
```

Example:

```json
{
  "model": "@cf/qwen/qwen3.8-27b",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

---

### Streaming

```json
{
  "model": "@cf/openai/gpt-oss-120b",
  "stream": true,
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

---

## Vision

Analyze images using Cloudflare vision-capable models.

```http
POST /v1/vision
```

Example:

```json
{
  "model": "@cf/qwen/qwen3.8-27b",
  "image_url": "https://example.com/test.png",
  "prompt": "Describe this image and extract all text"
}
```

Response:

```json
{
  "image_width": 643,
  "image_height": 382,
  "content_type": "image/png",
  "choices": [
    {
      "message": {
        "content": "..."
      }
    }
  ]
}
```

---

## Embeddings

```http
POST /v1/embeddings
```

Example:

```json
{
  "model": "@cf/baai/bge-m3",
  "input": "hello"
}
```

---

## Image Generation

```http
POST /v1/images/generations
```

Example:

```json
{
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "prompt": "A cute cat"
}
```

---

# Vision Models

Automatically discovered from Cloudflare Models Catalog.

Examples:

```text
@cf/qwen/qwen3.8-27b
@cf/google/gemma-4-26b-a4b-it
@cf/moonshotai/kimi-k2.7-code
@cf/meta/llama-4-scout-17b-16e-instruct
@cf/meta/llama-3.2-11b-vision-instruct
```

---

# Authentication

All endpoints require:

```http
Authorization: Bearer YOUR_API_KEY
```

---

# Environment Variables

## Required

```text
API_KEY
CF_API_TOKEN
CF_ACCOUNT_ID
```

## Optional

```text
VISION_PROMPT
```

Default:

```text
详细描述图片，识别文字，识别图表内容
```

---

# Cloudflare Bindings

Workers AI:

```text
AI
```

---

# Example Clients

Works with:

```text
Cherry Studio
OpenWebUI
LobeChat
Cursor
Cline
Roo Code
LibreChat
```

---

# Architecture

```text
Client
   │
   ▼

CF AI Gateway

   ├── Models Catalog
   ├── Chat
   ├── Vision
   ├── Embeddings
   └── Images

           │
           ▼

Cloudflare Workers AI
```

---

# License

MIT License
