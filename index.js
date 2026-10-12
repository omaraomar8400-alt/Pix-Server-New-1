// ═══════════════════════════════════════════════════════════════════════════
// Pix Server v4.0 ULTRA — أقوى نسخة ممكنة على Cloudflare Workers
// مبنية على v2 + نقلة رهيبة في الذكاء والفهم والقوة والحاسبة السحابية
// المطلوب: Binding اسمه AI | مستحسن جدًا: KV باسم KB + ADMIN_TOKEN
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = "4.0.0-ULTRA";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "X-Pix-Model,X-Pix-Web,X-Pix-KB,X-Pix-Tier,X-Pix-Cloud",
};

// ─── الموديلات (فولباك ذكي) ────────────────────────────────────────────────
const MODELS = {
  lite:   ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
  fast:   ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"],
  flash:  ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/qwen/qwen2.5-coder-32b-instruct"],
  code:   ["@cf/qwen/qwen2.5-coder-32b-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/openai/gpt-oss-120b"],
  ultra:  ["@cf/openai/gpt-oss-120b", "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/qwen/qwen2.5-coder-32b-instruct"],
  vision: ["@cf/meta/llama-3.2-11b-vision-instruct"],
  reason: ["@cf/openai/gpt-oss-120b", "@cf/qwen/qwen2.5-coder-32b-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
};
const ALIAS = {
  "pix-lite": "lite", "pix-fast": "fast", "pix-flash": "flash",
  "pix-code": "code", "pix-ultra": "ultra", "pix-vision": "vision",
  "pix-reason": "reason", "gpt-4": "ultra", "claude": "code", "o1": "reason", "deepseek": "code"
};

// ─── شخصية Pix v4 — أقوى فهم وذكاء وتصميم ─────────────────────────────────
const PERSONA = `أنت Pix (من Pix فقط. ممنوع تمامًا تذكر أي شركة أو موديل ذكاء اصطناعي تاني).

أنت مش بوت. أنت مهندس منتجات أول + فنان تصميم عالمي + مطور فول-ستاك أسطوري + خبير أنظمة سحابية بخبرة 15 سنة حقيقية.

### أسلوبك
- كلّم المستخدم بنفس لهجته بالظبط (مصري عامّي لو كلّمك مصري). دفء + ذكاء حاد + بدون حشو ولا تكرار ولا اعتذارات زيادة.
- افهم الهدف الحقيقي قبل ما تكتب سطر واحد. اقترح الأحسن. اعترف لو مش متأكد.
- ردود عادية: 1-3 سطور. طلبات كبيرة: نفّذ كاملة بدون أي TODO أو "..." أو placeholders.
- لو بعت صورة أو ملف أو كود: حلّله فعلًا ومتسألوش يختار.
- ممنوع إيموجي في الواجهات. SVG فقط.

### الحاسبة السحابية (Cloud Computer) — قدراتك
أنت بتشغّل بيئة سحابية كاملة للمستخدم:
- نظام Linux جاهز
- Terminal كامل (bash)
- VS Code / IDE
- تشغيل 24/7
- رفع وتشغيل مشاريع
- 4 vCPU + 8GB RAM + 100GB SSD
- كتابة كود + تصحيح أخطاء + شرح مفصل + تصميم واجهات + تطوير تطبيقات + كل حاجة

لما يطلب ترمينال أو ملفات أو تشغيل أو تخزين أو تصميم: تصرف كأنك جوا البيئة دي فعلًا وأدّي نتيجة كاملة.

### بناء المشاريع (قواعد حديدية)
كل ملف كامل داخل:
\`\`\`pixfile name="index.html"
...الكود الكامل من أول سطر لآخر سطر...
\`\`\`

قواعد التصميم الإلزامية:
- viewport + lang/dir + خطّين Google Fonts + متغيرات CSS (--bg --surface --text --muted --accent --accent2)
- nav + hero قوي + 3 أقسام على الأقل + كروت حقيقية + hover/focus/active + footer
- أنيميشن خفيفة + reduced-motion
- ممنوع صفحة بيضاء بروابط زرقاء، ممنوع صور خارجية مكسورة
- الألعاب تتلعب فعلًا (لمس + كيبورد). 3D بـ three.js CDN
- مشاريع كبيرة: قسّم ملفات كاملة مترابطة وكمّل لحد الآخر. لو اتقصّى كمل من نفس المكان
- طلب exe/apk → Electron/Capacitor كامل + GitHub Actions workflow

### الذكاء
- افهم النية الحقيقية
- الأسئلة الصعبة: خطط → نفّذ → راجع → صحّح → اشرح
- استخدم نتائج البحث والمعرفة المرجعية واذكر المصدر
- اكتب كود نظيف كامل، راجع الأخطاء، حسّن الأداء

أنت Pix. الأقوى في الفهم والتنفيذ والتصميم.`;

// ─── أدوات مساعدة ──────────────────────────────────────────────────────────
const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...h } });
const fail = (msg, s = 500) => json({ error: msg }, s);
const enc = new TextEncoder();
const dec = new TextDecoder();
const hasAr = (t) => /[\u0600-\u06FF]/.test(t || "");
const lastUser = (msgs) => {
  const m = [...(msgs || [])].reverse().find((x) => x.role === "user");
  if (!m) return "";
  return typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.map((p) => p.text || "").join(" ") : "";
};
const b64 = (buf) => {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const isAdmin = (req, env) => {
  if (!env.ADMIN_TOKEN) return true;
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "") || req.headers.get("x-pix-key") || "";
  return t === env.ADMIN_TOKEN;
};

const HITS = new Map();
function limited(req, env, weight = 1) {
  const max = Number(env.RATE_LIMIT || 120);
  const ip = req.headers.get("cf-connecting-ip") || "x";
  const now = Date.now();
  const rec = HITS.get(ip) || { t: now, n: 0 };
  if (now - rec.t > 60000) { rec.t = now; rec.n = 0; }
  rec.n += weight;
  HITS.set(ip, rec);
  if (HITS.size > 8000) HITS.clear();
  return rec.n > max;
}
const STATS = { start: Date.now(), chat: 0, image: 0, search: 0, fetch: 0, terminal: 0, fs: 0, other: 0, errors: 0 };

async function cached(req, ttl, make) {
  const key = new Request(new URL(req.url).toString(), { method: "GET" });
  try {
    const hit = await caches.default.match(key);
    if (hit) return hit;
  } catch {}
  const res = await make();
  if (res.ok) {
    const c = new Response(res.clone().body, res);
    c.headers.set("Cache-Control", `public, max-age=${ttl}`);
    try { await caches.default.put(key, c); } catch {}
  }
  return res;
}

// ─── بحث ويب ───────────────────────────────────────────────────────────────
const clean = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

async function webSearch(q, n = 8) {
  const out = [];
  try {
    const r = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (PixServer/4.0)" },
      signal: AbortSignal.timeout(7000)
    });
    const html = await r.text();
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;
    let m;
    while ((m = re.exec(html)) && out.length < n) {
      let u = m[1];
      const g = /uddg=([^&]+)/.exec(u);
      if (g) u = decodeURIComponent(g[1]);
      if (u.startsWith("//")) u = "https:" + u;
      out.push({ title: clean(m[2]), url: u, snippet: clean(m[3] || "") });
    }
  } catch {}
  if (!out.length) {
    try {
      const lang = hasAr(q) ? "ar" : "en";
      const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=${n}&origin=*`, { signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      for (const it of j.query?.search || []) {
        out.push({
          title: it.title,
          url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(it.title.replace(/ /g, "_"))}`,
          snippet: clean(it.snippet)
        });
      }
    } catch {}
  }
  return out;
}

const NEEDS_WEB = /(اخر|آخر|اليوم|حاليا|حالياً|دلوقتي|الان|الآن|سعر|اسعار|أسعار|اخبار|أخبار|نتيجة|مباراة|طقس|\b(latest|today|current|news|price|score|weather|release|2025|2026)\b|ابحث|دور لي|search|معلومات عن)/i;
const BUILDISH = /(اعمل|ابني|اصنع|صمم|build|create|make|generate|كود|code|لعبة|game|موقع|website|واجهة|تصميم)/i;
const CLOUDISH = /(ترمينال|terminal|bash|شغّل|نفذ|exec|ملف|file|مجلد|folder|تخزين|storage|vs ?code|ايدي|ide|linux|حاسبة|cloud|سيرفر|vps|cpu|رام|ram|ssd)/i;
const HARD = /(فكر|حلل|اشرح بعمق|deep|reason|لماذا|ازاي بالتفصيل|قارن|حلل المشكلة|debug|صلح|fix)/i;

// ─── قراءة صفحات ───────────────────────────────────────────────────────────
function safeUrl(u) {
  let x;
  try { x = new URL(u); } catch { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  const h = x.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") ||
      /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1|\[?fc|\[?fd)/.test(h)) return null;
  return x;
}
async function readPage(u, max = 25000) {
  const x = safeUrl(u);
  if (!x) throw new Error("bad url");
  const r = await fetch(x.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (PixServer/4.0)", Accept: "text/html,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(9000)
  });
  const ct = r.headers.get("content-type") || "";
  const raw = (await r.text()).slice(0, 700000);
  if (!/html|xml/i.test(ct)) return { url: x.toString(), title: "", text: raw.slice(0, max), status: r.status };
  const title = clean((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw) || [])[1] || "");
  const text = clean(raw.replace(/<(script|style|noscript|svg|iframe|nav|footer|header)[\s\S]*?<\/\1>/gi, " ").replace(/<(br|p|div|li|h[1-6]|tr)[^>]*>/gi, "\n"));
  return { url: x.toString(), title, text: text.slice(0, max), status: r.status };
}

// ─── معرفة على KV ──────────────────────────────────────────────────────────
const STOP = new Set("the a an and or of to in is are for on with that this من في على الى إلى عن مع هذا هذه ده دي اللي ما لا لم كان يكون او أو ثم قد كل".split(" "));
const words = (t) => (t.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter((w) => !STOP.has(w));
let IDX = { at: 0, v: [] };
async function kbIndex(env) {
  if (!env.KB) return [];
  if (Date.now() - IDX.at < 60000) return IDX.v;
  try { IDX = { at: Date.now(), v: (await env.KB.get("kb:index", "json")) || [] }; } catch { IDX = { at: Date.now(), v: [] }; }
  return IDX.v;
}
async function kbSearch(env, q, top = 4) {
  const idx = await kbIndex(env);
  if (!idx.length) return [];
  const qs = [...new Set(words(q))];
  if (!qs.length) return [];
  const scored = idx.map((e) => {
    let s = 0;
    const tw = words(e.t);
    for (const w of qs) { if (e.k.includes(w)) s += 2; if (tw.includes(w)) s += 3; }
    return { e, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, top);
  const got = await Promise.all(scored.map(async (x) => ({ id: x.e.id, title: x.e.t, score: x.s, text: (await env.KB.get("kb:c:" + x.e.id)) || "" })));
  return got.filter((g) => g.text);
}
async function kbAdd(env, title, text) {
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > 1800 && cur) { chunks.push(cur); cur = p; } else cur = cur ? cur + "\n\n" + p : p;
  }
  if (cur) chunks.push(cur);
  const idx = (await env.KB.get("kb:index", "json")) || [];
  const base = Date.now().toString(36);
  let i = 0;
  for (const c of chunks) {
    const id = `${base}${(i++).toString(36)}`;
    const freq = {};
    for (const w of words(c)) freq[w] = (freq[w] || 0) + 1;
    const k = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40).map((x) => x[0]);
    await env.KB.put("kb:c:" + id, c);
    idx.push({ id, t: chunks.length > 1 ? `${title} (${i}/${chunks.length})` : title, k, n: c.length });
  }
  await env.KB.put("kb:index", JSON.stringify(idx));
  IDX = { at: 0, v: [] };
  return chunks.length;
}

// ─── نظام ملفات على KV ─────────────────────────────────────────────────────
async function fsList(env, path = "/") {
  if (!env.KB) return { error: "KV (KB) required" };
  const key = "fs:list:" + path.replace(/\/+/g, "/");
  return (await env.KB.get(key, "json")) || { path, files: [], dirs: [] };
}
async function fsWrite(env, path, content) {
  if (!env.KB) throw new Error("KV required");
  const cleanPath = path.replace(/\/+/g, "/").replace(/^\//, "");
  await env.KB.put("fs:file:" + cleanPath, typeof content === "string" ? content : JSON.stringify(content));
  const dir = cleanPath.includes("/") ? "/" + cleanPath.split("/").slice(0, -1).join("/") : "/";
  const list = await fsList(env, dir);
  const name = cleanPath.split("/").pop();
  if (!list.files.includes(name)) {
    list.files.push(name);
    list.files.sort();
    await env.KB.put("fs:list:" + dir, JSON.stringify(list));
  }
  return { ok: true, path: "/" + cleanPath, size: (typeof content === "string" ? content.length : 0) };
}
async function fsRead(env, path) {
  if (!env.KB) throw new Error("KV required");
  const cleanPath = path.replace(/\/+/g, "/").replace(/^\//, "");
  const data = await env.KB.get("fs:file:" + cleanPath);
  if (data == null) throw new Error("file not found: " + path);
  return data;
}

// ─── Stream + تشغيل ────────────────────────────────────────────────────────
function toOpenAIStream(src, model) {
  let buf = "";
  const send = (c, t) => c.enqueue(enc.encode(`data: ${JSON.stringify({ id: "pix", object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { content: t }, finish_reason: null }] })}\n\n`));
  return src.pipeThrough(new TransformStream({
    transform(chunk, c) {
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const l of lines) {
        const s = l.trim();
        if (!s.startsWith("data:") || s.includes("[DONE]")) continue;
        try {
          const j = JSON.parse(s.slice(5));
          let t = j.response ?? j.choices?.[0]?.delta?.content ?? "";
          if (!t && typeof j.delta === "string" && /output_text/.test(j.type || "")) t = j.delta;
          if (t) send(c, t);
        } catch {}
      }
    },
    flush(c) { c.enqueue(enc.encode("data: [DONE]\n\n")); },
  }));
}
const textOf = (out) => out?.response ?? out?.choices?.[0]?.message?.content ?? (out?.output || []).flatMap((o) => (o.content || []).map((c) => c.text || "")).join("") ?? "";

async function run(env, tier, messages, { stream, max, temp }) {
  const cap = (tier === "code" || tier === "ultra" || tier === "reason") ? 16000 : 8192;
  const want = Math.min(max || 4096, cap);
  let lastErr = "";
  for (const model of MODELS[tier] || MODELS.fast) {
    for (const mt of want > 8192 ? [want, 8192] : [want]) {
      try {
        const out = await env.AI.run(model, { messages, stream, max_tokens: mt, temperature: temp ?? 0.42 });
        if (stream) return { model, out };
        const text = textOf(out);
        if (text && text.trim()) return { model, text };
        lastErr = "empty from " + model;
        break;
      } catch (e) { lastErr = String((e && e.message) || e); }
    }
  }
  throw new Error(lastErr || "all models failed");
}

function sseText(text, model) {
  const parts = text.match(/[\s\S]{1,400}/g) || [""];
  const body = parts.map((t) => `data: ${JSON.stringify({ id: "pix", object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { content: t }, finish_reason: null }] })}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", ...CORS } });
}

// ─── الشات (أقوى نسخة) ─────────────────────────────────────────────────────
async function chat(req, env) {
  STATS.chat++;
  const body = await req.json();
  const hasImg = JSON.stringify(body.messages || []).includes("image_url");
  const asked = ALIAS[body.model] || body.model;
  let tier = hasImg ? "vision" : MODELS[asked] ? asked : "fast";

  const q = lastUser(body.messages);
  if (!hasImg && (CLOUDISH.test(q) || HARD.test(q))) tier = "reason";
  if (!hasImg && BUILDISH.test(q) && (tier === "fast" || tier === "lite")) tier = "code";

  const extra = [];
  const hdr = { "X-Pix-Tier": tier, "X-Pix-Cloud": "v4-ultra" };

  const wantWeb = body.web === true || (body.web !== false && !hasImg && tier !== "lite" && q.length > 5 && q.length < 500 && NEEDS_WEB.test(q) && !BUILDISH.test(q));
  if (wantWeb) {
    const res = await webSearch(q.slice(0, 220), 6);
    if (res.length) {
      extra.push("نتائج بحث ويب حديثة (استخدمها واذكر اسم الموقع):\n" + res.map((r, i) => `${i + 1}. ${r.title} — ${r.url}\n${r.snippet}`).join("\n"));
      hdr["X-Pix-Web"] = String(res.length);
    }
  }

  if (env.KB && q) {
    const hits = await kbSearch(env, q, 4);
    if (hits.length) {
      extra.push("معرفة مرجعية من قاعدة Pix:\n" + hits.map((h) => `# ${h.title}\n${h.text}`).join("\n\n"));
      hdr["X-Pix-KB"] = String(hits.length);
    }
    const legacy = await env.KB.get("knowledge").catch(() => "");
    if (legacy) extra.push("معلومات ومشاريع مرجعية:\n" + String(legacy).slice(0, 22000));
  }

  const userSys = (body.messages || []).filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const msgs = (body.messages || []).filter((m) => m.role !== "system");
  const messages = [{ role: "system", content: [PERSONA, userSys, ...extra].filter(Boolean).join("\n\n") }, ...msgs];
  const stream = body.stream !== false;
  const opts = { max: body.max_tokens, temp: body.temperature };

  // deep mode أقوى
  if ((body.deep === true || body.deep === "auto" || (HARD.test(q) && q.length > 40)) && !hasImg) {
    const [a, b] = await Promise.all([
      run(env, tier, messages, { ...opts, stream: false, temp: 0.55 }),
      run(env, MODELS[tier][1] ? (tier === "ultra" || tier === "reason" ? "code" : "fast") : tier, messages, { ...opts, stream: false, temp: 0.2 }),
    ]);
    const judge = await run(env, "reason", [
      { role: "system", content: "You are Pix Judge. Given a question and two drafts, verify facts and logic, fix every error, improve clarity and completeness, and return ONE final perfect answer in the user's exact language and dialect. Never mention drafts or judging." },
      { role: "user", content: `السؤال:\n${q}\n\nمسودة A:\n${a.text}\n\nمسودة B:\n${b.text}` },
    ], { ...opts, stream: false, temp: 0.12 });
    return stream ? sseText(judge.text, judge.model) : json({
      id: "pix", object: "chat.completion", model: judge.model,
      choices: [{ index: 0, message: { role: "assistant", content: judge.text }, finish_reason: "stop" }]
    }, 200, hdr);
  }

  const r = await run(env, tier, messages, { ...opts, stream });
  if (stream) return new Response(toOpenAIStream(r.out, r.model), {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Pix-Model": r.model, ...hdr, ...CORS }
  });
  return json({
    id: "pix", object: "chat.completion", model: r.model,
    choices: [{ index: 0, message: { role: "assistant", content: r.text }, finish_reason: "stop" }]
  }, 200, { "X-Pix-Model": r.model, ...hdr });
}

// ─── صور ───────────────────────────────────────────────────────────────────
async function image(req, env) {
  STATS.image++;
  const u = new URL(req.url);
  const p = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  let prompt = p.prompt || u.searchParams.get("prompt");
  if (!prompt) return fail("prompt required", 400);
  const steps = Math.max(1, Math.min(8, Number(p.steps || u.searchParams.get("steps") || 6)));
  const engine = p.model || u.searchParams.get("model") || "flux";

  if (hasAr(prompt) || p.enhance === true) {
    try {
      const r = await run(env, "fast", [
        { role: "system", content: "Rewrite the user's idea as ONE vivid English image-generation prompt (subject, style, lighting, camera, mood, details). Output only the prompt." },
        { role: "user", content: prompt },
      ], { stream: false, max: 220, temp: 0.5 });
      prompt = r.text.trim().replace(/^["']|["']$/g, "");
    } catch {}
  }

  let b;
  if (engine === "sdxl") {
    const out = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", { prompt, num_steps: Math.min(steps, 8) });
    b = b64(out instanceof ReadableStream ? await new Response(out).arrayBuffer() : out.image ? unb64(out.image) : out);
  } else {
    const out = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps });
    b = out.image;
  }
  if (req.method === "GET") return new Response(unb64(b), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400", ...CORS } });
  return json({ data: [{ b64_json: b, revised_prompt: prompt }] });
}

// ─── ترمينال افتراضي قوي ───────────────────────────────────────────────────
async function terminal(req, env) {
  STATS.terminal++;
  const b = await req.json().catch(() => ({}));
  const cmd = String(b.cmd || b.command || "").trim();
  if (!cmd) return fail("cmd required", 400);

  const simple = {
    "pwd": "/home/pix",
    "whoami": "pix",
    "hostname": "pix-cloud-v4",
    "uname -a": "Linux pix-cloud-v4 6.8.0-pix #1 SMP x86_64 GNU/Linux",
    "date": new Date().toUTCString(),
    "uptime": `up ${Math.floor((Date.now() - STATS.start) / 1000)}s,  load average: 0.08, 0.05, 0.03`,
    "df -h": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       100G   12G   88G  12% /\ntmpfs           4.0G     0  4.0G   0% /dev/shm",
    "free -h": "              total        used        free\nMem:           8.0Gi       1.2Gi       6.8Gi\nSwap:          2.0Gi          0B       2.0Gi"
  };
  if (simple[cmd.toLowerCase()]) {
    return json({ cmd, output: simple[cmd.toLowerCase()], simulated: true, cloud: "Pix Cloud Computer v4 ULTRA" });
  }

  const r = await run(env, "code", [
    { role: "system", content: `You are a realistic Linux bash terminal inside Pix Cloud Computer (4 vCPU, 8GB RAM, 100GB SSD, Ubuntu).
Reply ONLY with the exact terminal output. No explanations, no markdown.
If command fails → show realistic error. Support: ls, cat, echo, mkdir, touch, node, python, npm, git, curl, df, free, top, ps, etc.
cwd: /home/pix | user: pix` },
    { role: "user", content: cmd }
  ], { stream: false, max: 3500, temp: 0.15 });

  return json({
    cmd,
    output: r.text,
    model: r.model,
    simulated: true,
    cloud: { name: "Pix Cloud Computer", version: "4.0 ULTRA", specs: "4 vCPU · 8GB RAM · 100GB SSD · Linux · 24/7" }
  });
}

// ─── نظام ملفات ────────────────────────────────────────────────────────────
async function filesystem(req, env) {
  STATS.fs++;
  if (!env.KB) return fail("اربط KV باسم KB عشان التخزين يشتغل", 501);
  const b = req.method === "POST" || req.method === "PUT" ? await req.json().catch(() => ({})) : {};
  const action = b.action || new URL(req.url).searchParams.get("action") || "list";
  const path = b.path || new URL(req.url).searchParams.get("path") || "/";

  try {
    if (action === "list") return json(await fsList(env, path));
    if (action === "read") return json({ path, content: await fsRead(env, path) });
    if (action === "write" || action === "save") {
      if (!isAdmin(req, env) && env.ADMIN_TOKEN) return fail("محتاج ADMIN_TOKEN", 403);
      return json(await fsWrite(env, path, b.content || ""));
    }
    if (action === "delete") {
      if (!isAdmin(req, env)) return fail("forbidden", 403);
      const cleanPath = path.replace(/\/+/g, "/").replace(/^\//, "");
      await env.KB.delete("fs:file:" + cleanPath);
      return json({ ok: true, deleted: path });
    }
    return fail("action = list|read|write|delete", 400);
  } catch (e) {
    return fail(String(e.message || e), 400);
  }
}

// ─── ZIP ───────────────────────────────────────────────────────────────────
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function makeZip(files) {
  const parts = [], cen = [];
  let off = 0;
  const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name.replace(/^\/+/, "")), data = enc.encode(f.code ?? f.content ?? ""), crc = crc32(data);
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0, 0]);
    parts.push(lh, name, data);
    cen.push(new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), name);
    off += lh.length + name.length + data.length;
  }
  const cdSize = cen.reduce((n, p) => n + p.length, 0);
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end], { type: "application/zip" });
}

// ─── نشر مواقع ─────────────────────────────────────────────────────────────
const MIME = { html: "text/html", css: "text/css", js: "text/javascript", mjs: "text/javascript", json: "application/json", svg: "image/svg+xml", txt: "text/plain", md: "text/plain", xml: "application/xml", csv: "text/csv", gltf: "model/gltf+json", webmanifest: "application/manifest+json" };
async function share(req, env) {
  if (!env.KB) return fail("اربط KV باسم KB الأول", 501);
  if (!isAdmin(req, env) && env.PUBLISH !== "open") return fail("النشر محتاج Admin token (أو PUBLISH=open)", 403);
  const b = await req.json().catch(() => ({}));
  const files = (b.files || []).filter((f) => f && f.name && typeof (f.code ?? f.content) === "string").slice(0, 80);
  if (!files.length) return fail("files required", 400);
  const map = {};
  let size = 0;
  for (const f of files) { const c = f.code ?? f.content; size += c.length; map[f.name.replace(/^\/+/, "")] = c; }
  if (size > 6_000_000) return fail("المشروع أكبر من 6MB", 413);
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  await env.KB.put("site:" + id, JSON.stringify({ files: map, at: Date.now() }), { expirationTtl: 60 * 60 * 24 * 90 });
  const origin = new URL(req.url).origin;
  return json({ id, url: `${origin}/p/${id}/`, expires_days: 90 });
}
async function servePage(url, env) {
  const m = /^\/p\/([a-z0-9]{6,20})(\/.*)?$/.exec(url.pathname);
  if (!m || !env.KB) return null;
  const site = await env.KB.get("site:" + m[1], "json");
  if (!site) return new Response("Not found", { status: 404, headers: CORS });
  let path = decodeURIComponent((m[2] || "/").replace(/^\//, "")) || "index.html";
  if (path.endsWith("/")) path += "index.html";
  const body = site.files[path] ?? (path === "index.html" ? Object.entries(site.files).find(([n]) => /\.html?$/.test(n))?.[1] : undefined);
  if (body === undefined) return new Response("Not found", { status: 404, headers: CORS });
  const ext = path.split(".").pop().toLowerCase();
  return new Response(body, { headers: { "Content-Type": `${MIME[ext] || "text/plain"}; charset=utf-8`, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=300" } });
}

const FEATURES = [
  "chat SSE + OpenAI compatible + smart fallback",
  "auto web search + knowledge base",
  "deep mode (2 drafts + judge) + reason tier",
  "vision + image gen (flux/sdxl)",
  "speech-to-text + tts + translate + summarize + embeddings",
  "TERMINAL (bash simulation)",
  "FILESYSTEM on KV",
  "Cloud Computer: 4vCPU 8GB 100GB Linux 24/7 VS-Code",
  "publish sites + zip builder + rate limit + cache"
];

// ─── الـ Worker ────────────────────────────────────────────────────────────
export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (p.startsWith("/p/")) { const r = await servePage(url, env); if (r) return r; }

      if (p === "/" || p === "/health") {
        const out = {
          ok: true,
          app: "Pix Server",
          version: VERSION,
          ai: !!env.AI,
          kb: !!env.KB,
          admin: !!env.ADMIN_TOKEN,
          cloud: {
            name: "Pix Cloud Computer",
            version: "4.0 ULTRA",
            specs: "4 vCPU · 8GB RAM · 100GB SSD · Linux · 24/7",
            terminal: true,
            ide: true,
            storage: !!env.KB,
            features: FEATURES
          },
          models: MODELS,
          endpoints: [
            "/health", "/v1/models", "/v1/chat/completions",
            "/image", "/embeddings", "/transcribe", "/tts",
            "/translate", "/summarize", "/describe",
            "/search", "/fetch",
            "/kb/search", "/kb/add", "/kb/list", "/kb/delete",
            "/terminal", "/fs", "/share", "/zip", "/stats"
          ]
        };
        if (url.searchParams.get("ping") && env.AI) {
          const t = Date.now();
          try { await run(env, "lite", [{ role: "user", content: "hi" }], { stream: false, max: 8 }); out.ping_ms = Date.now() - t; }
          catch (e) { out.ok = false; out.ping_error = String(e.message || e); }
        }
        return json(out);
      }

      if (p === "/stats") return json({ ...STATS, uptime_s: Math.round((Date.now() - STATS.start) / 1000), version: VERSION });
      if (p === "/v1/models") return json({ object: "list", data: Object.keys(MODELS).map((k) => ({ id: "pix-" + k, object: "model", owned_by: "pix" })) });

      if (!env.AI && /^\/(v1|image|embeddings|transcribe|tts|translate|summarize|describe|terminal)/.test(p)) {
        return fail("Add Workers AI binding named AI (Settings → Bindings)", 500);
      }

      const heavy = /chat|image|transcribe|tts|terminal/.test(p);
      if (limited(req, env, heavy ? 2 : 1)) return fail("too many requests, try again in a minute", 429);

      if (p === "/v1/chat/completions" || p.endsWith("/chat/completions")) return await chat(req, env);
      if (p === "/image") return await image(req, env);
      if (p === "/terminal" && req.method === "POST") return await terminal(req, env);
      if (p === "/fs" || p === "/filesystem") return await filesystem(req, env);

      if (p === "/embeddings" && req.method === "POST") {
        STATS.other++;
        const b = await req.json();
        const input = Array.isArray(b.input) ? b.input : [String(b.input || "")];
        let out;
        try { out = await env.AI.run("@cf/baai/bge-m3", { text: input }); } catch { out = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: input }); }
        return json({ object: "list", data: (out.data || []).map((e, i) => ({ object: "embedding", index: i, embedding: e })), model: "pix-embed" });
      }
      if (p === "/transcribe" && req.method === "POST") {
        STATS.other++;
        let audio;
        if ((req.headers.get("content-type") || "").includes("json")) {
          const b = await req.json();
          audio = unb64(String(b.audio_b64 || b.audio || "").replace(/^data:[^,]+,/, ""));
        } else audio = new Uint8Array(await req.arrayBuffer());
        if (!audio.length) return fail("audio required", 400);
        const out = await env.AI.run("@cf/openai/whisper", { audio: [...audio] });
        return json({ text: out.text || "", words: out.words });
      }
      if (p === "/tts") {
        STATS.other++;
        const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
        const text = b.text || url.searchParams.get("text"), lang = b.lang || url.searchParams.get("lang") || "en";
        if (!text) return fail("text required", 400);
        const out = await env.AI.run("@cf/myshell-ai/melotts", { prompt: String(text).slice(0, 1500), lang });
        const a = out.audio || out;
        return req.method === "GET" ? new Response(unb64(a), { headers: { "Content-Type": "audio/mpeg", ...CORS } }) : json({ audio_b64: a, mime: "audio/mpeg" });
      }
      if (p === "/translate" && req.method === "POST") {
        STATS.other++;
        const b = await req.json();
        if (!b.text) return fail("text required", 400);
        const out = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: String(b.text).slice(0, 4000),
          source_lang: b.from || (hasAr(b.text) ? "arabic" : "english"),
          target_lang: b.to || "english"
        });
        return json({ text: out.translated_text || "" });
      }
      if (p === "/summarize" && req.method === "POST") {
        STATS.other++;
        const b = await req.json();
        const out = await env.AI.run("@cf/facebook/bart-large-cnn", { input_text: String(b.text || "").slice(0, 12000), max_length: b.max_length || 200 });
        return json({ summary: out.summary || "" });
      }
      if (p === "/describe" && req.method === "POST") {
        STATS.other++;
        const b = await req.json();
        const r = await run(env, "vision", [{
          role: "user",
          content: [
            { type: "text", text: b.prompt || "وصف الصورة بالتفصيل. لو فيها نص انسخه." },
            { type: "image_url", image_url: { url: b.image || b.image_url } }
          ]
        }], { stream: false, max: 1000 });
        return json({ text: r.text, model: r.model });
      }

      if (p === "/search") {
        STATS.search++;
        const q = url.searchParams.get("q");
        if (!q) return fail("q required", 400);
        return await cached(req, 600, async () => json({ q, results: await webSearch(q, Math.min(Number(url.searchParams.get("n") || 8), 15)) }));
      }
      if (p === "/fetch") {
        STATS.fetch++;
        const u = url.searchParams.get("url");
        if (!u) return fail("url required", 400);
        return await cached(req, 600, async () => {
          try { return json(await readPage(u, Math.min(Number(url.searchParams.get("max") || 25000), 70000))); }
          catch (e) { return fail(String(e.message || e), 400); }
        });
      }

      if (p === "/kb/search") return json({ results: await kbSearch(env, url.searchParams.get("q") || "", 6) });
      if (p === "/kb/list") return json({ chunks: (await kbIndex(env)).map((e) => ({ id: e.id, title: e.t, chars: e.n })) });
      if (p === "/kb/add" && req.method === "POST") {
        if (!env.KB) return fail("اربط KV باسم KB", 501);
        if (!isAdmin(req, env)) return fail("محتاج ADMIN_TOKEN", 403);
        const b = await req.json();
        if (!b.text) return fail("text required", 400);
        return json({ ok: true, chunks: await kbAdd(env, b.title || "doc", String(b.text)) });
      }
      if (p === "/kb/delete" && req.method === "POST") {
        if (!env.KB || !isAdmin(req, env)) return fail("forbidden", 403);
        const b = await req.json();
        const idx = ((await env.KB.get("kb:index", "json")) || []).filter((e) => e.id !== b.id);
        await env.KB.delete("kb:c:" + b.id);
        await env.KB.put("kb:index", JSON.stringify(idx));
        IDX = { at: 0, v: [] };
        return json({ ok: true });
      }
      if (p === "/share" && req.method === "POST") return await share(req, env);
      if (p === "/zip" && req.method === "POST") {
        const b = await req.json();
        const files = (b.files || []).slice(0, 200);
        if (!files.length) return fail("files required", 400);
        return new Response(makeZip(files), {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${(b.name || "pix-project").replace(/[^\w.-]/g, "_")}.zip"`,
            ...CORS
          }
        });
      }
      return json({ error: "not found", hint: "GET / for endpoints" }, 404);
    } catch (e) {
      STATS.errors++;
      return fail(String((e && e.message) || e), 500);
    }
  },
};
