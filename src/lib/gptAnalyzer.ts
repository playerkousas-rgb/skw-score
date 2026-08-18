import type { ScoreResult, ContestConfig } from '../store/appStore';

interface ModelCategory {
  id?: unknown;
  name?: unknown;
  score?: unknown;
  confidence?: unknown;
  evidence?: unknown;
  feedback?: unknown;
}

interface ModelResponse {
  categories?: unknown;
  aiComment?: unknown;
  suggestions?: unknown;
  strengths?: unknown;
  tags?: unknown;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 8)
    : [];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

export async function analyzeWithGPT4o(file: File, config: ContestConfig, apiKey: string): Promise<ScoreResult> {
  if (!apiKey) {
    throw new Error('請先輸入 OpenAI API Key');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('GPT-4o Vision 目前只支援圖片檔案，請改用圖片或本地分析。');
  }

  const base64Image = await fileToBase64(file);
  const criteriaList = config.criteria
    .map((criterion) => [
      `id: ${criterion.id}`,
      `名稱: ${criterion.name}`,
      `權重: ${criterion.weight}%`,
      `評估範圍: ${criterion.description || '依名稱判斷，但只評估畫面中可見的證據'}`,
    ].join('｜'))
    .join('\n');

  const systemPrompt = `你是一位嚴謹、可重複、以證據為本的藝術與設計比賽評審。請評估一張參賽圖片，而不是評估作者或檔案名稱。
比賽類型：${config.mode === 'coloring' ? '填色' : '設計'}
${config.theme ? `比賽主題：${config.theme}` : '沒有指定主題'}
${config.description ? `比賽補充說明：${config.description}` : ''}

評分項目如下，每一項必須獨立評估，不可用同一個整體印象重複加分：
${criteriaList}

評分規則：
1. 每項只使用 0 至 100 的整數。請先找出畫面中可見的證據，再給分；不要因為圖片更鮮豔、元素更多或解析度更高就自動判定為更有創意或更符合主題。
2. 使用一致的錨點：0 = 沒有可見證據，25 = 明顯不足，50 = 基本達標，75 = 清楚且穩定地達標，100 = 卓越、完整且有充分證據。大多數普通作品應落在 45 至 80，不要把分數集中在 90 分以上。
3. 技術品質可以評估解析度、清晰度、曝光、對比與瑕疵；創意、主題契合、內容深度等項目必須引用畫面中的具體構思、符號、敘事或視覺選擇，不可只用色彩數量代替。
4. 若某項無法單從圖片可靠判斷，降低 confidence，並在 evidence 說明限制；不要猜測作者意圖。不要使用檔名、裝置、地點、人物身分或任何受保護特徵作為評分依據。
5. 每個項目輸出一個唯一的 id、分數、0 至 100 的 confidence、一句可核對的 evidence，以及一句針對該項目的 feedback。輸出項目必須與上方清單完全一致。
6. totalScore 只是暫存值，系統會按照權重重新計算；請仍然輸出加權平均的整數。

只輸出有效 JSON，不要 Markdown 或額外文字：
{
  "totalScore": number,
  "categories": [
    {
      "id": "評分項目 id",
      "name": "評分項目名稱",
      "score": number,
      "confidence": number,
      "evidence": "畫面中可核對的證據或判斷限制",
      "feedback": "針對該項目的具體評語"
    }
  ],
  "aiComment": "整體評語，說明最強與最弱項目及主要可見證據，約 50 至 100 字",
  "suggestions": ["具體且可執行的建議"],
  "strengths": ["有證據支持的優點"],
  "tags": ["中性標籤"]
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
              { type: 'text', text: '請依照上述評分規則，先逐項找證據，再輸出嚴格 JSON。' },
              { type: 'image_url', image_url: { url: base64Image, detail: 'high' } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2400,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      throw new Error(errorData.error?.message || 'GPT-4o 分析失敗');
    }

    const data = await response.json() as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI 沒有回傳有效的評分內容，請重試。');
    }

    const parsed = JSON.parse(content) as ModelResponse;
    const parsedCategories: ModelCategory[] = Array.isArray(parsed.categories)
      ? parsed.categories.filter(isRecord)
      : [];

    const mappedCategories = config.criteria.map((criterion) => {
      const matching = parsedCategories.find((category) => category.id === criterion.id)
        ?? parsedCategories.find((category) => category.name === criterion.name);
      if (!matching || typeof matching.score !== 'number' || !Number.isFinite(matching.score)) {
        throw new Error(`AI 回傳的「${criterion.name}」評分不完整，請重試。`);
      }

      return {
        id: criterion.id,
        name: criterion.name,
        score: clampNumber(matching.score, 0, 100, 50),
        maxScore: 100,
        confidence: clampNumber(matching.confidence, 0, 100, 50),
        evidence: typeof matching.evidence === 'string' ? matching.evidence : 'AI 未提供可核對的證據。',
        feedback: typeof matching.feedback === 'string' ? matching.feedback : 'AI 未提供此項目的詳細評語。',
        weight: criterion.weight,
      };
    });

    const totalWeight = mappedCategories.reduce((sum, category) => sum + category.weight, 0) || 1;
    const calculatedTotal = Math.round(
      mappedCategories.reduce((sum, category) => sum + category.score * category.weight, 0) / totalWeight
    );

    return {
      totalScore: calculatedTotal,
      categories: mappedCategories,
      aiComment: typeof parsed.aiComment === 'string' ? parsed.aiComment : 'AI 分析完成。',
      suggestions: asStringArray(parsed.suggestions),
      strengths: asStringArray(parsed.strengths),
      tags: asStringArray(parsed.tags),
    };
  } catch (error: unknown) {
    console.error('GPT analysis error:', error);
    const message = error instanceof Error ? error.message : '分析過程發生未知錯誤';
    throw new Error(message);
  }
}
