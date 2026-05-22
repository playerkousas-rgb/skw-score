import type { ScoreResult, ContestConfig } from '../store/appStore';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function analyzeWithGPT4o(file: File, config: ContestConfig, apiKey: string): Promise<ScoreResult> {
  if (!apiKey) {
    throw new Error('請先輸入 OpenAI API Key');
  }

  const base64Image = await fileToBase64(file);

  const criteriaList = config.criteria
    .map((c) => `- ${c.name} (權重: ${c.weight}%): ${c.description || '無詳細描述'}`)
    .join('\n');

  const systemPrompt = `你是一位專業的藝術與設計評審。你正在評估一份參加 ${config.mode === 'coloring' ? '填色' : '設計'} 比賽的作品。
${config.theme ? `本次比賽的主題為：「${config.theme}」` : ''}

請嚴格根據以下評分指標對作品進行評分與評價：
${criteriaList}

你需要回傳一份嚴格且有效的 JSON 格式資料，符合以下結構。所有分數（score）為單項滿分 100 分制（尚未加權）。totalScore 是根據各項分數乘以其權重後的加權平均總分（整數）。
{
  "totalScore": number,
  "categories": [
    { "name": "評分指標名稱", "score": number, "maxScore": 100, "feedback": "針對此指標的簡短專業評語" }
  ],
  "aiComment": "評審的綜合專業評語（大約 50-100 字）",
  "suggestions": ["具體建議1", "具體建議2", "具體建議3"],
  "strengths": ["優點1", "優點2"],
  "tags": ["標籤1", "標籤2", "標籤3"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: '請評估這張圖片並輸出符合要求的 JSON。' },
              { type: 'image_url', image_url: { url: base64Image } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'GPT-4o 分析失敗');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // 映射確保指標一致性，並加入原本的 weight
    const mappedCategories = config.criteria.map((c) => {
      const matching = parsed.categories.find((pc: any) => pc.name === c.name) || { score: 60, feedback: '無法取得對應評分' };
      return {
        name: c.name,
        score: matching.score,
        maxScore: 100,
        feedback: matching.feedback,
        weight: c.weight,
      };
    });

    // 重新計算加權總分確保精確
    const calculatedTotal = Math.round(
      mappedCategories.reduce((sum, cat) => sum + cat.score * (cat.weight / 100), 0)
    );

    return {
      totalScore: parsed.totalScore || calculatedTotal,
      categories: mappedCategories,
      aiComment: parsed.aiComment || 'AI 分析完成。',
      suggestions: parsed.suggestions || [],
      strengths: parsed.strengths || [],
      tags: parsed.tags || [],
    };
  } catch (err: any) {
    console.error('GPT analysis error:', err);
    throw new Error(err.message || '分析過程發生未知錯誤');
  }
}
