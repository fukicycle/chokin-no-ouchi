// レシートの読み取り：Gemini の API キー（この端末にだけ保存）と、最初に使うモデル。
import { useState, type FormEvent } from "react";
import { GEMINI_MODELS, modelFallbackOrder } from "../../receipt/gemini";
import { useGeminiSettings } from "../../receipt/useGeminiSettings";
import { useFeedback } from "../../ui/Feedback";
import { Section } from "../../ui/List";

export function ReceiptSettingsScreen() {
  const { apiKey, model, setApiKey, setModel } = useGeminiSettings();
  const { toast } = useFeedback();
  const [input, setInput] = useState(apiKey);
  const [show, setShow] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    setApiKey(input);
    toast({ message: input.trim() ? "API キーを保存しました" : "API キーを消しました" });
  };

  return (
    <div className="page">
      <form className="form" onSubmit={save}>
        <p className="lead">
          レシートの写真から金額・日付・カテゴリーを読み取るのに、Google の Gemini API
          キーを使います。キーはこの端末にだけ保存され、家族やサーバーには送りません。
        </p>
        <label className="field">
          <span className="field-label">Gemini API キー</span>
          <input
            className="fk-input"
            type={show ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
          />
        </label>
        <div className="form-row">
          <button type="button" className="text-button" onClick={() => setShow(!show)}>
            {show ? "キーを隠す" : "キーを表示"}
          </button>
          <a
            className="text-button"
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
          >
            キーを作る（Google AI Studio）
          </a>
        </div>
        <button className="fk-button fk-button--primary fk-button--block">保存する</button>
      </form>

      <Section title="最初に使うモデル">
        {GEMINI_MODELS.map((m) => (
          <button
            key={m}
            className="row row--link"
            role="radio"
            aria-checked={model === m}
            onClick={() => setModel(m)}
          >
            <span className="row-text">
              <span className="row-label">{m}</span>
            </span>
            {model === m && <span className="row-value selected-mark">使う</span>}
          </button>
        ))}
      </Section>
      <p className="hint">
        混み合っているときは、次の順に別のモデルで読み取ります：{modelFallbackOrder(model).join(" → ")}
      </p>
    </div>
  );
}
