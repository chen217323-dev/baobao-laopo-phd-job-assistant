export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
    return;
  }

  try {
    const { job, resume } = request.body || {};
    if (!job) {
      response.status(400).json({ error: "Missing job payload." });
      return;
    }

    const payload = {
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

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You are a careful PhD job-search assistant. Analyze job posts for a Chinese-speaking PhD graduate. Be practical, warm, and honest. Return only valid JSON."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `请结合简历和岗位信息，判断这个岗位是否适合申请。请只返回 JSON，不要返回 Markdown。

JSON 格式必须是：
{
  "matchScore": 0-100,
  "summary": "一句话总结是否值得投",
  "strengths": ["优势1", "优势2"],
  "risks": ["风险1", "风险2"],
  "recommendedMaterials": ["材料1", "材料2"],
  "resumeFocus": ["简历应该强调的重点"],
  "nextSteps": ["下一步1", "下一步2"]
}

简历信息：
${JSON.stringify(resume || {}, null, 2)}

岗位信息：
${JSON.stringify(payload, null, 2)}`
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      response.status(openaiResponse.status).json({ error: data.error?.message || "OpenAI request failed." });
      return;
    }

    const text = data.output_text
      || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text
      || "{}";

    response.status(200).json(JSON.parse(text));
  } catch (error) {
    response.status(500).json({ error: error.message || "Unexpected server error." });
  }
}
