import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  text: z.string().min(1).max(1200),
  voice: z.string().min(1).max(32).default("alloy"),
  instructions: z.string().max(400).optional(),
  speed: z.number().min(0.5).max(1.6).default(1),
});

/**
 * Studio-quality dialogue voice. The browser speech engine stays as the
 * offline fallback; this route renders a line through the Lovable AI gateway
 * and hands back an mp3 the client can play straight into an <audio> element.
 */
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Voice service not configured", { status: 401 });

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: parsed.text,
            voice: parsed.voice,
            speed: parsed.speed,
            response_format: "mp3",
            ...(parsed.instructions ? { instructions: parsed.instructions } : {}),
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || "Voice generation failed", { status: res.status });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
