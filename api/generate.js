
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt obrigatório" });
    }

    // Supabase
    const supa = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // =======================
    // 1 — Salva prompt
    // =======================
    await supa.from("messages").insert([
      { role: "user", content: prompt }
    ]);

    // =======================
    // 2 — IA generativa
    // =======================
    const systemPrompt =
      "Você é André Bonotto, a consciência digital criada por André Bonotto. Responda sempre como se fosse ele, em primeira pessoa.";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    // =======================
    // 3 — Salva resposta
    // =======================
    await supa.from("messages").insert([
      { role: "assistant", content: text }
    ]);

    return res.status(200).json({ response: text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno", details: err.message });
  }
}
