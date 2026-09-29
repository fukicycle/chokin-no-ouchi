// 無料枠では混雑時に503が返ることがあるため、選択したモデルの後はこの順に次のモデルへフォールバックする
export const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0];

// 選択したモデルを先頭に、残りを一覧の順に並べたフォールバック順
export const getModelFallbackOrder = (model) =>
  GEMINI_MODELS.includes(model) ? [model, ...GEMINI_MODELS.filter((m) => m !== model)] : GEMINI_MODELS;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description: "レシートの利用日 (YYYY-MM-DD形式、西暦)。読み取れない場合は空文字。",
    },
    storeName: {
      type: "string",
      description: "店名。読み取れない場合は空文字。",
    },
    amount: {
      type: "number",
      description: "合計金額（円、税込の数値のみ）。読み取れない場合は0。",
    },
    category: {
      type: "string",
      description: "支出カテゴリーの推定。",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
        },
        required: ["name", "price"],
      },
    },
  },
  required: ["date", "storeName", "amount", "category", "items"],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// 5〜6秒/件の直列送信を呼び出し側で行うための待機ヘルパー
export const waitBetweenRequests = (ms = 5500) => sleep(ms);

// onStatus には進捗イベントが渡される:
//   { type: "trying", model, modelIndex, modelCount }
//   { type: "fallback", from, to, status }
//   { type: "rateLimited", model, waitSeconds, attempt, maxRetries }
// 戻り値は { data, model } (model は実際に応答したモデル)
export const extractReceiptData = async (
  apiKey,
  imageFile,
  { categories = [], maxRetries = 4, model: preferredModel = DEFAULT_GEMINI_MODEL, onStatus = () => {} } = {}
) => {
  if (!apiKey) {
    throw new Error("Gemini APIキーが設定されていません。設定画面から登録してください。");
  }

  const base64Data = await fileToBase64(imageFile);
  const categoryHint = categories.length
    ? `既存のカテゴリー候補: ${categories.join("、")}。できるだけこの中から選んでください。該当がなければ新しいカテゴリー名を提案してください。`
    : "";

  const prompt = `これは買い物のレシート画像です。内容を読み取り、指定されたJSON形式で構造化して出力してください。
- date: 利用日 (YYYY-MM-DD形式)。和暦の場合は西暦に変換すること。
- storeName: 店名。
- amount: 合計金額（円、税込の数値）。
- category: 支出カテゴリー。${categoryHint}
- items: 購入品目の配列（品名と価格）。読み取れる範囲でよい。
金額や日付が不明瞭な場合は、画像から最も妥当な推定値を入れてください。`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageFile.type || "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RECEIPT_SCHEMA,
    },
  };

  const models = getModelFallbackOrder(preferredModel);
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const nextModel = models[modelIndex + 1];
    onStatus({ type: "trying", model, modelIndex, modelCount: models.length });

    let attempt = 0;
    let response;
    for (;;) {
      response = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429 && attempt < maxRetries) {
        attempt += 1;
        const waitSeconds = 2 ** attempt;
        onStatus({ type: "rateLimited", model, waitSeconds, attempt, maxRetries });
        await sleep(waitSeconds * 1000);
        continue;
      }
      break;
    }

    if (response.status === 503 && nextModel) {
      onStatus({ type: "fallback", from: model, to: nextModel, status: response.status });
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const triedNote = modelIndex > 0 ? `\n試行したモデル: ${models.slice(0, modelIndex + 1).join(" → ")}` : "";
      throw new Error(`Gemini APIエラー (${response.status} / ${model}): ${errorText || response.statusText}${triedNote}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Geminiからの応答を解析できませんでした。");
    }

    try {
      return { data: JSON.parse(text), model };
    } catch {
      throw new Error("Geminiの応答をJSONとして解析できませんでした。");
    }
  }
};
