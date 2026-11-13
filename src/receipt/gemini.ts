// レシート画像を Gemini で読み取る（BYOK：API キーは端末にだけ保存し、Firebase には送らない）。
// 無料枠では混雑時に 503 が返ることがあるので、選んだモデルの後は一覧の順に次のモデルを試す。

export const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0];

export const modelFallbackOrder = (model: string) =>
  GEMINI_MODELS.includes(model) ? [model, ...GEMINI_MODELS.filter((m) => m !== model)] : GEMINI_MODELS;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type ReceiptResult = {
  date: string;
  storeName: string;
  amount: number;
  category: string;
  items: { name: string; price: number }[];
};

export type ReceiptStatus =
  | { type: "trying"; model: string }
  | { type: "fallback"; from: string; to: string; status: number }
  | { type: "rateLimited"; model: string; waitSeconds: number; attempt: number; maxRetries: number };

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description: "レシートの利用日 (YYYY-MM-DD形式、西暦)。読み取れない場合は空文字。",
    },
    storeName: { type: "string", description: "店名。読み取れない場合は空文字。" },
    amount: { type: "number", description: "合計金額（円、税込の数値のみ）。読み取れない場合は0。" },
    category: { type: "string", description: "支出カテゴリーの推定。" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, price: { type: "number" } },
        required: ["name", "price"],
      },
    },
  },
  required: ["date", "storeName", "amount", "category", "items"],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 無料枠のレート制限に当たらないよう、続けて送るときはこの間隔を空ける */
export const waitBetweenRequests = () => sleep(5500);

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export async function readReceipt(
  apiKey: string,
  image: File,
  {
    categories = [],
    model: preferred = DEFAULT_GEMINI_MODEL,
    maxRetries = 4,
    onStatus = () => {},
  }: {
    categories?: string[];
    model?: string;
    maxRetries?: number;
    onStatus?: (s: ReceiptStatus) => void;
  } = {},
): Promise<{ data: ReceiptResult; model: string }> {
  if (!apiKey)
    throw new Error("Gemini の API キーがありません。設定 ＞ レシートの読み取り で登録してください。");

  const hint = categories.length
    ? `既存のカテゴリー候補: ${categories.join("、")}。できるだけこの中から選んでください。該当がなければ新しいカテゴリー名を提案してください。`
    : "";
  const prompt = `これは買い物のレシート画像です。内容を読み取り、指定されたJSON形式で構造化して出力してください。
- date: 利用日 (YYYY-MM-DD形式)。和暦の場合は西暦に変換すること。
- storeName: 店名。
- amount: 合計金額（円、税込の数値）。
- category: 支出カテゴリー。${hint}
- items: 購入品目の配列（品名と価格）。読み取れる範囲でよい。
金額や日付が不明瞭な場合は、画像から最も妥当な推定値を入れてください。`;

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: image.type || "image/jpeg", data: await fileToBase64(image) } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", responseSchema: RECEIPT_SCHEMA },
  });

  const models = modelFallbackOrder(preferred);
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    onStatus({ type: "trying", model });
    let res: Response;
    for (let attempt = 0; ;) {
      res = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.status === 429 && attempt < maxRetries) {
        attempt += 1;
        const waitSeconds = 2 ** attempt;
        onStatus({ type: "rateLimited", model, waitSeconds, attempt, maxRetries });
        await sleep(waitSeconds * 1000);
        continue;
      }
      break;
    }
    if (res.status === 503 && models[i + 1]) {
      onStatus({ type: "fallback", from: model, to: models[i + 1], status: 503 });
      continue;
    }
    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        throw new Error("API キーが使えませんでした。設定 ＞ レシートの読み取り でキーを確かめてください。");
      }
      if (res.status === 429)
        throw new Error("読み取りの回数が上限に達しました。少し時間をおいてもう一度試してください。");
      throw new Error(`読み取れませんでした（${res.status}）。もう一度試してください。`);
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      return { data: JSON.parse(text) as ReceiptResult, model };
    } catch {
      throw new Error("読み取った内容を解釈できませんでした。写真を撮り直して試してください。");
    }
  }
  throw new Error("どのモデルも混雑していて読み取れませんでした。少し時間をおいて試してください。");
}
