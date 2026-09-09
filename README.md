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

✅ OCR & Document Understanding

✅ Image Generation

✅ Embeddings

✅ Signed URL Image Support

✅ R2 Image Support

✅ Automatic Image Download

✅ Automatic Data URL Conversion

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

### Features

- OCR
- Image Understanding
- External Image URLs
- Signed URL Images
- R2 Images
- Automatic Image Download
- Automatic Data URL Conversion
- Image Metadata Extraction

### Example

```json
{
  "image_url": "https://example.com/test.png"
}
```

Or:

```json
{
  "image_url": "https://img.example.com/Test.png?expires=xxx&sign=xxx",
  "prompt": "Extract all text from the image"
}
```

### Sample Response

```json
{
  "id": "vision-xxxx",
  "object": "vision.completion",
  "model": "@cf/qwen/qwen3.8-27b",

  "image_url": "https://img.example.com/Test.png?...",

  "content_type": "image/png",

  "image_width": 643,
  "image_height": 382,

  "image_size_bytes": 186936,
  "image_size_kb": 182.55,
  "image_size_mb": 0.18,

  "base64_length": 249248,

  "choices": [
    {
      "message": {
        "content": "..."
      }
    }
  ]
}
```

### Current OCR Model

Default OCR model:

```text
@cf/qwen/qwen3.8-27b
```

Verified capabilities:

- OCR
- Card Recognition
- Document Analysis
- Chinese Text Extraction
- Structured Text Recognition

### Image Metadata

The Vision API automatically returns:

- image_width
- image_height
- image_size_bytes
- image_size_kb
- image_size_mb
- base64_length
- content_type

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

Vision-capable models are automatically discovered from the Cloudflare Models Catalog.

Examples:

```text
@cf/qwen/qwen3.8-27b
@cf/google/gemma-4-26b-a4b-it
@cf/moonshotai/kimi-k2.7-code
@cf/meta/llama-4-scout-17b-16e-instruct
@cf/meta/llama-3.2-11b-vision-instruct
@cf/zai-org/glm-5.3-flash
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

### Vision

```text
VISION_MODEL
VISION_PROMPT
VISION_MAX_IMAGE_SIZE
```

Default Vision Model:

```text
@cf/qwen/qwen3.8-27b
```

Default Prompt:

```text
详细描述图片，识别文字，识别图表内容
```

Default Max Image Size:

```text
10485760
```

(10 MB)

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

CF AI Gateway Free

   ├── Models Catalog
   ├── Chat
   ├── Vision / OCR
   ├── Embeddings
   └── Images

           │
           ▼

Cloudflare Workers AI
```

---

# Related Projects

```text
CF-AI-Gateway-Free
CF-AI-Model-Router
CF-Image-Proxy
CF-Image-Sign
```

---

# License

MIT License
