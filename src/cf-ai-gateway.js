export default {

  async fetch(request, env) {

    try {

      // =====================
      // Auth
      // =====================

      if (!auth(request, env)) {

        return json(
          {
            error: "Unauthorized"
          },
          401
        );

      }

      const url =
        new URL(request.url);

      const path =
        url.pathname;

      // =====================
      // Models
      // =====================

      if (
        request.method === "GET" &&
        path === "/v1/models"
      ) {

        return json(
          await modelsList(env)
        );

      }

      // =====================
      // Catalog Root
      // =====================

      if (
        request.method === "GET" &&
        path === "/v1/models/catalog"
      ) {

        return json(
          await catalogRoot(env)
        );

      }

      // =====================
      // Catalog Category
      // =====================

      if (
        request.method === "GET" &&
        path.startsWith(
          "/v1/models/catalog/"
        )
      ) {

        const category =
          decodeURIComponent(
            path.substring(
              "/v1/models/catalog/".length
            )
          );

        return json(
          await catalogCategory(
            env,
            category
          )
        );

      }

      // =====================
      // Model Details
      // =====================

      if (
        request.method === "GET" &&
        path.startsWith(
          "/v1/models/details/"
        )
      ) {

        const modelId =
          decodeURIComponent(
            path.substring(
              "/v1/models/details/".length
            )
          );

        return await modelDetails(
          env,
          modelId
        );

      }

      // =====================
      // Chat Completions
      // =====================

      if (
        request.method === "POST" &&
        path === "/v1/chat/completions"
      ) {

        return await chat(
          request,
          env
        );

      }

      // =====================
      // Embeddings
      // =====================

      if (
        request.method === "POST" &&
        path === "/v1/embeddings"
      ) {

        return await embeddings(
          request,
          env
        );

      }

      // =====================
      // Image Generation
      // =====================

      if (
        request.method === "POST" &&
        path === "/v1/images/generations"
      ) {

        return await imageGeneration(
          request,
          env
        );

      }

      // =====================
      // Vision
      // =====================

      if (
        request.method === "POST" &&
        path === "/v1/vision"
      ) {

        return await vision(
          request,
          env
        );

      }

      // =====================
      // Not Found
      // =====================

      return json(
        {
          error: "Not Found"
        },
        404
      );

    } catch (err) {

      console.error(
        "Worker Error:",
        err
      );

      return json(
        {
          error:
            err?.message ||
            "Internal Error"
        },
        500
      );

    }

  }

};

// =======================
// Chat
// =======================

async function chat(
  request,
  env
) {

  const body =
    await request.json();

  const model =
    body.model;

  const messages =
    body.messages || [];

  const stream =
    body.stream === true;

  if (!model) {

    return json(
      {
        error:
          "model required"
      },
      400
    );

  }

  const result =
    await env.AI.run(
      model,
      {
        messages,
        stream
      }
    );

  // =====================
  // Streaming
  // =====================

  if (stream) {

    return new Response(
      result,
      {
        headers: {
          "Content-Type":
            "text/event-stream; charset=utf-8",

          "Cache-Control":
            "no-cache",

          "Connection":
            "keep-alive",

          "X-Accel-Buffering":
            "no"
        }
      }
    );

  }

  // =====================
  // Non-streaming
  // =====================

  const content =
    result?.response ??
    result?.content ??
    result?.text ??
    result?.result?.response ??
    result?.choices?.[0]?.message?.content ??
    "";

  return json({

    id:
      "chatcmpl-" +
      crypto.randomUUID(),

    object:
      "chat.completion",

    created:
      Math.floor(
        Date.now() / 1000
      ),

    model,

    usage:
      result?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        neurons: 0
      },

    choices: [
      {
        index: 0,

        message: {
          role:
            "assistant",

          content
        },

        finish_reason:
          "stop"
      }
    ]

  });

}

// =======================
// OpenAI Models
// =======================

async function modelsList(
  env
) {

  const {
    models
  } =
    await getAllModels(env);

  return {

    object:
      "list",

    data:
      models.map(
        model => ({
          id:
            model.name,
          object:
            "model"
        })
      )

  };

}

// =======================
// 一级目录
// =======================

async function catalogRoot(
  env
) {

  const {
    totalCount,
    models
  } =
    await getAllModels(env);

  const stats = {};

  for (const model of models) {

    const category =
      normalizeCategory(
        model?.task?.name
      );

    stats[category] =
      (stats[category] || 0) + 1;

  }

  const categories =
    Object.entries(
      stats
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(
        ([id, count]) => ({
          id,
          name:
            prettifyCategory(
              id
            ),
          count
        })
      );

  return {

    object:
      "catalog",

    model_count:
      models.length,

    cloudflare_catalog_count:
      totalCount,

    category_count:
      categories.length,

    categories

  };

}

// =======================
// 二级目录
// =======================

async function catalogCategory(
  env,
  category
) {

  const {
    models
  } =
    await getAllModels(
      env
    );

  const result =
    models
      .filter(
        model =>
          normalizeCategory(
            model?.task?.name
          ) === category
      )
      .map(
        model => {

          const reasoning =
            hasProperty(
              model,
              "reasoning"
            );

          const functionCalling =
            hasProperty(
              model,
              "function_calling"
            );

          const vision =
            hasProperty(
              model,
              "vision"
            );

          return {

            id:
              model.name,

            description:
              model.description,

            task:
              model.task?.name,

            created_at:
              model.created_at,

            context_window:
              Number(
                getProperty(
                  model,
                  "context_window"
                )
              ) || null,

            reasoning,

            function_calling:
              functionCalling,

            vision,

            capability_score:
              [
                reasoning,
                functionCalling,
                vision
              ].filter(Boolean).length,

            chat_url:
              "/v1/chat/completions",

            details_url:
              `/v1/models/details/${encodeURIComponent(
                model.name
              )}`

          };

        }
      )
      .sort(
        (a, b) =>
          Date.parse(
            b.created_at
          ) -
          Date.parse(
            a.created_at
          )
      );

  return {

    category,

    name:
      prettifyCategory(
        category
      ),

    count:
      result.length,

    models:
      result

  };

}

// =======================
// 三级目录
// =======================

async function modelDetails(
  env,
  modelId
) {

  const {
    models
  } =
    await getAllModels(env);

  const model =
    models.find(
      m =>
        m.name ===
        modelId
    );

  if (!model) {

    return json(
      {
        error:
          "Model Not Found"
      },
      404
    );

  }

  return json({

    id:
      model.name,

    description:
      model.description,

    task:
      model.task?.name,

    created_at:
      model.created_at,

    context_window:
      Number(
        getProperty(
          model,
          "context_window"
        )
      ) || null,

    reasoning:
      hasProperty(
        model,
        "reasoning"
      ),

    function_calling:
      hasProperty(
        model,
        "function_calling"
      ),

    vision:
      hasProperty(
        model,
        "vision"
      ),

    properties:
      model.properties || []

  });

}

// =======================
// Cloudflare Models API
// =======================

async function getAllModels(
  env
) {

  const resp =
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/models/search`,
      {
        headers: {
          Authorization:
            `Bearer ${env.CF_API_TOKEN}`
        }
      }
    );

  if (!resp.ok) {

    throw new Error(
      `Cloudflare Models API Error ${resp.status}`
    );

  }

  const data =
    await resp.json();

  return {

    totalCount:
      data.result_info
        ?.total_count || 0,

    models:
      data.result || []

  };

}

async function embeddings(
  request,
  env
) {

  const body =
    await request.json();

  const model =
    body.model;

  const input =
    body.input;

  if (!model) {

    return json(
      {
        error:
          "model required"
      },
      400
    );

  }

  if (!input) {

    return json(
      {
        error:
          "input required"
      },
      400
    );

  }

  const result =
    await env.AI.run(
      model,
      {
        text:
          Array.isArray(input)
            ? input.join("\n")
            : input
      }
    );

  return json({

    object:
      "list",

    model,

    data: [
      {
        object:
          "embedding",

        index: 0,

        embedding:
          result?.data?.[0] ??
          result?.embedding ??
          result
      }
    ]

  });

}

async function imageGeneration(
  request,
  env
) {

  const body =
    await request.json();

  const model =
    body.model;

  const prompt =
    body.prompt;

  if (!model) {

    return json(
      {
        error:
          "model required"
      },
      400
    );

  }

  if (!prompt) {

    return json(
      {
        error:
          "prompt required"
      },
      400
    );

  }

  const result =
    await env.AI.run(
      model,
      {
        prompt
      }
    );

  const image =
    result?.image ??
    result?.result?.image ??
    result?.images?.[0] ??
    result;

  const base64Length =
    typeof image === "string"
      ? image.length
      : 0;

  const sizeBytes =
    typeof image === "string"
      ? Math.floor(
        (base64Length * 3) / 4
      )
      : 0;

  const sizeKB =
    Number(
      (
        sizeBytes / 1024
      ).toFixed(2)
    );

  const sizeMB =
    Number(
      (
        sizeKB / 1024
      ).toFixed(2)
    );

  return json({

    created:
      Math.floor(
        Date.now() / 1000
      ),

    model,

    revised_prompt:
      prompt,

    base64_length:
      base64Length,

    size_bytes:
      sizeBytes,

    size_kb:
      sizeKB,

    size_mb:
      sizeMB,

    data: [
      {
        b64_json:
          image
      }
    ]

  });

}

// =======================
// Vision Url
// =======================

async function getVisionModels(
  env
) {

  const {
    models
  } =
    await getAllModels(
      env
    );

  return models.filter(
    model => {

      const category =
        normalizeCategory(
          model?.task?.name
        );

      return (
        category ===
        "text_generation" &&
        hasProperty(
          model,
          "vision"
        )
      );

    }
  );

}

function getImageDimensions(
  bytes
) {

  // =====================
  // PNG
  // =====================

  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47
  ) {

    const width =
      (bytes[16] << 24) |
      (bytes[17] << 16) |
      (bytes[18] << 8) |
      bytes[19];

    const height =
      (bytes[20] << 24) |
      (bytes[21] << 16) |
      (bytes[22] << 8) |
      bytes[23];

    return {
      width,
      height
    };

  }

  // =====================
  // JPEG
  // =====================

  if (
    bytes.length >= 4 &&
    bytes[0] === 0xFF &&
    bytes[1] === 0xD8
  ) {

    let offset = 2;

    while (
      offset < bytes.length
    ) {

      if (
        bytes[offset] !== 0xFF
      ) {
        break;
      }

      const marker =
        bytes[offset + 1];

      const length =
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];

      // SOF markers
      if (
        marker === 0xC0 ||
        marker === 0xC1 ||
        marker === 0xC2 ||
        marker === 0xC3 ||
        marker === 0xC5 ||
        marker === 0xC6 ||
        marker === 0xC7 ||
        marker === 0xC9 ||
        marker === 0xCA ||
        marker === 0xCB ||
        marker === 0xCD ||
        marker === 0xCE ||
        marker === 0xCF
      ) {

        const height =
          (bytes[offset + 5] << 8) |
          bytes[offset + 6];

        const width =
          (bytes[offset + 7] << 8) |
          bytes[offset + 8];

        return {
          width,
          height
        };

      }

      offset +=
        2 + length;

    }

  }

  return {
    width: null,
    height: null
  };

}

async function imageUrlToDataUrl(
  imageUrl,
  env
) {

  console.error(
    "VISION_FETCH_URL=" +
    imageUrl
  );

  const response =
    await fetch(
      imageUrl
    );

  console.error(
    "VISION_FETCH_STATUS=" +
    response.status
  );

  if (!response.ok) {

    let errorBody = "";

    try {

      errorBody =
        await response.text();

    } catch {
    }

    console.error(
      "VISION_FETCH_ERROR_BODY=" +
      errorBody
    );

    throw new Error(
      `Image download failed (${response.status})`
    );

  }

  const contentType =
    response.headers.get(
      "content-type"
    ) ||
    "image/png";

  const buffer =
    await response.arrayBuffer();

  const maxSize =
    Number(
      env.VISION_MAX_IMAGE_SIZE ||
      10485760
    );

  if (
    buffer.byteLength >
    maxSize
  ) {

    throw new Error(
      `Image too large (${buffer.byteLength} bytes)`
    );

  }

  console.error(
    "VISION_IMAGE_SIZE=" +
    buffer.byteLength
  );

  const bytes =
    new Uint8Array(
      buffer
    );

  const dimensions =
    getImageDimensions(
      bytes
    );

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    binary +=
      String.fromCharCode(
        bytes[i]
      );

  }

  const base64 =
    btoa(binary);

  console.error(
    "VISION_BASE64_LENGTH=" +
    base64.length
  );

  return {

    dataUrl:
      `data:${contentType};base64,${base64}`,

    contentType,

    sizeBytes:
      bytes.length,

    base64Length:
      base64.length,

    width:
      dimensions.width,

    height:
      dimensions.height

  };

}

async function vision(
  request,
  env
) {

  const body =
    await request.json();

  const model =
    body.model ||
    env.VISION_MODEL ||
    "@cf/qwen/qwen3.8-27b";

  const imageUrl =
    body.image_url;

  const prompt =
    body.prompt ||
    env.VISION_PROMPT ||
    "详细描述图片中的内容，并识别其中所有文字";

  if (!model) {

    return json(
      {
        error:
          "No vision model configured"
      },
      400
    );

  }

  if (!imageUrl) {

    return json(
      {
        error:
          "image_url required"
      },
      400
    );

  }

  // =====================
  // Validate Vision Model
  // =====================

  const visionModels =
    await getVisionModels(
      env
    );

  const isVisionModel =
    visionModels.some(
      item =>
        item.name === model
    );

  if (!isVisionModel) {

    return json(
      {
        error:
          `${model} is not a vision-capable model`
      },
      400
    );

  }

  // =====================
  // Download Image
  // =====================

  const image =
    await imageUrlToDataUrl(
      imageUrl,
      env
    );

  // =====================
  // Vision Inference
  // =====================

  const result =
    await env.AI.run(
      model,
      {
        messages: [
          {
            role: "user",

            content: [
              {
                type: "text",

                text:
                  prompt
              },

              {
                type:
                  "image_url",

                image_url: {
                  url:
                    image.dataUrl
                }
              }
            ]
          }
        ]
      }
    );

  const content =
    result?.response ??
    result?.content ??
    result?.text ??
    result?.description ??
    result?.result?.response ??
    result?.result?.description ??
    result?.choices?.[0]?.message?.content ??
    result?.choices?.[0]?.text ??
    JSON.stringify(
      result
    );

  return json({

    id:
      "vision-" +
      crypto.randomUUID(),

    object:
      "vision.completion",

    created:
      Math.floor(
        Date.now() / 1000
      ),

    model,

    image_url:
      imageUrl,

    content_type:
      image.contentType,

    image_width:
      image.width,

    image_height:
      image.height,

    image_size_bytes:
      image.sizeBytes,

    image_size_kb:
      Number(
        (
          image.sizeBytes /
          1024
        ).toFixed(2)
      ),

    image_size_mb:
      Number(
        (
          image.sizeBytes /
          1024 /
          1024
        ).toFixed(2)
      ),

    base64_length:
      image.base64Length,

    choices: [
      {
        index: 0,

        message: {
          role:
            "assistant",

          content
        },

        finish_reason:
          "stop"
      }
    ]

  });

}

// =======================
// Helpers
// =======================

function auth(
  request,
  env
) {

  const token =
    (
      request.headers.get(
        "Authorization"
      ) || ""
    ).replace(
      "Bearer ",
      ""
    );

  return (
    token ===
    env.API_KEY
  );

}

function getProperty(
  model,
  propertyId
) {

  return model
    .properties
    ?.find(
      p =>
        p.property_id ===
        propertyId
    )
    ?.value;

}

function hasProperty(
  model,
  propertyId
) {

  return !!model
    .properties
    ?.find(
      p =>
        p.property_id ===
        propertyId
    );

}

function normalizeCategory(
  taskName = ""
) {

  const map = {

    "Text Generation":
      "text_generation",

    "Text Embeddings":
      "embeddings",

    "Text-to-Image":
      "text_to_image",

    "Image-to-Text":
      "image_to_text",

    "Text-to-Speech":
      "text_to_speech",

    "Automatic Speech Recognition":
      "speech_to_text",

    "Text Classification":
      "text_classification",

    "Image Classification":
      "image_classification",

    "Translation":
      "translation",

    "Dumb Pipe":
      "dumb_pipe"

  };

  return (
    map[taskName] ||
    taskName
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      )
  );

}

function prettifyCategory(
  id
) {

  const map = {

    text_generation:
      "Text Generation",

    embeddings:
      "Embeddings",

    text_to_image:
      "Text To Image",

    image_to_text:
      "Image To Text",

    speech_to_text:
      "Speech To Text",

    text_to_speech:
      "Text To Speech",

    text_classification:
      "Text Classification",

    image_classification:
      "Image Classification",

    translation:
      "Translation",

    dumb_pipe:
      "Dumb Pipe"

  };

  return map[id] || id;

}

function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store"
      }
    }
  );

}