// Pix Worker — بيحوّل Workers AI لواجهة OpenAI عشان Pix يكلّمه عبر PIX_CF_URL.
// Pix بيبعت POST {PIX_CF_URL}/v1/chat/completions و model = lite|fast|flash|code|ultra|vision.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...CORS } });

function pickModel(tier, env) {
  const map = {
    lite: env.MODEL_LITE,
    fast: env.MODEL_FAST,
    flash: env.MODEL_FLASH,
    code: env.MODEL_CODE,
    ultra: env.MODEL_ULTRA,
    vision: env.MODEL_VISION,
  };
  return map[tier] || map.fast || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
}

const chunk = (id, delta, finish = null) =>
  `data: ${JSON.stringify({ id, object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

// SSE بتاع Workers AI ({"response":"..."}) ← SSE بتاع OpenAI
function toOpenAIStream(src) {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const id = "pix-" + Math.random().toString(36).slice(2);
  let buf = "";
  return src.pipeThrough(
    new TransformStream({
      transform(part, ctl) {
        buf += dec.decode(part, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (!data) continue;
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.choices) ctl.enqueue(enc.encode(`data: ${data}\n\n`)); // already OpenAI-shaped
            else if (typeof j.response === "string" && j.response) ctl.enqueue(enc.encode(chunk(id, { content: j.response })));
          } catch { /* keepalive */ }
        }
      },
      flush(ctl) {
        ctl.enqueue(enc.encode(chunk(id, {}, "stop")));
        ctl.enqueue(enc.encode("data: [DONE]\n\n"));
      },
    }),
  );
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method === "GET") return json({ ok: true, name: "pix-ai worker", models: pickModel("fast", env) });
    if (!url.pathname.endsWith("/chat/completions")) return json({ error: "not found" }, 404);
    if (!env.AI) return json({ error: "AI binding missing (check wrangler.toml [ai])" }, 500);

    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "no messages" }, 400);

    const model = pickModel(String(body.model || "fast"), env);
    const input = {
      messages,
      max_tokens: Math.min(Number(body.max_tokens) || 2048, 8192),
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
    };

    try {
      if (body.stream) {
        const out = await env.AI.run(model, { ...input, stream: true });
        if (!(out instanceof ReadableStream)) throw new Error("model did not stream");
        return new Response(toOpenAIStream(out), {
          headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", ...CORS },
        });
      }
      const out = await env.AI.run(model, input);
      const text = out?.response ?? out?.choices?.[0]?.message?.content ?? "";
      return json({ id: "pix-" + Date.now(), object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }] });
    } catch (e) {
      return json({ error: String(e?.message || e), model }, 502);
    }
  },
};
