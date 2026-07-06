const DEFAULT_MODEL = "gpt-5.4-mini";

function modelName() {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

function pickText(data) {
  if (data.output_text) return data.output_text;
  const content = data.output?.flatMap((item) => item.content || []) || [];
  return content.find((item) => item.type === "output_text")?.text || "{}";
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {
      matchScore: 0,
      summary: "AI returned text, but the app could not parse it as JSON.",
      risks: ["Please try again, or check the OpenAI model setting in Vercel."],
      nextSteps: ["Set OPENAI_MODEL to gpt-5.4-mini and redeploy."]
    };
  }
}

export default async function handler(request, response) {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  if (request.method === "GET") {
    response.status(200).json({
      ok: true,
      apiKeyConfigured: hasKey,
      model: modelName(),
      message: "POST a job and resume payload to run AI analysis."
    });
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!hasKey) {
    response.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
    return;
  }

  try {
    const { job, resume } = request.body || {};
    if (!job) {
      response.status(400).json({ error: "Missing job payload." });
      return;
    }

    const jobPayload = {
      title: job.title,
      org: job.org,
      department: job.department,
      type: job.type,
      city: job.city,
      deadline: job.deadline,
      majors: job.majors,
      requirements: job.requirements,
      benefits: job.benefits,
      materials: job.materials,
      rawText: String(job.rawText || "").slice(0, 3500)
    };

    const prompt = [
      "Analyze this PhD job opportunity for a Chinese-speaking PhD graduate.",
      "Return only valid JSON. Write all user-facing string values in Simplified Chinese.",
      "Required JSON keys:",
      "matchScore: number from 0 to 100",
      "summary: one sentence",
      "strengths: array of strings",
      "risks: array of strings",
      "recommendedMaterials: array of strings",
      "resumeFocus: array of strings",
      "nextSteps: array of strings",
      "",
      "Resume profile:",
      JSON.stringify(resume || {}, null, 2),
      "",
      "Job post:",
      JSON.stringify(jobPayload, null, 2)
    ].join("\n");

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName(),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You are a careful, practical PhD job-search assistant. Return only valid JSON."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt
              }
            ]
          }
        ],
        max_output_tokens: 1200,
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      response.status(openaiResponse.status).json({
        error: data.error?.message || "OpenAI request failed.",
        model: modelName()
      });
      return;
    }

    response.status(200).json(safeJson(pickText(data)));
  } catch (error) {
    response.status(500).json({ error: error.message || "Unexpected server error." });
  }
}
