// 設定画面（全アプリ共通）。並び順は固定：
// アプリ固有 → 表示 → データ（全削除は一番下） → このアプリについて
// 上ほどよく触るもの、下ほど慎重に扱うもの・たまにしか見ないもの。
import { useRef } from "react";
import config from "../../app.config";
import type { AppSetting } from "../config/types";
import type { IconName } from "../ui/Icon";
import { useFeedback } from "../ui/Feedback";
import { ActionRow, Choice, ControlRow, InfoRow, LinkRow, Section, Switch } from "../ui/List";
import { UpdateNotice } from "../update/UpdateNotice";
import { useUpdate } from "../update/UpdateProvider";
import { useAppSetting } from "./useAppSetting";
import { useTheme, type ThemeMode } from "./useTheme";
import { ChokinSettings } from "./chokin/ChokinSettings";
import { useDataHandlers } from "../data/familyData";

function AppSettingRow({ s }: { s: AppSetting }) {
  const [value, set] = useAppSetting<boolean | string>(s.id);
  return (
    <ControlRow label={s.label} description={s.description}>
      {s.type === "toggle" ? (
        <Switch label={s.label} checked={value === true} onChange={set} />
      ) : (
        <Choice label={s.label} value={value as string} options={s.options} onChange={set} />
      )}
    </ControlRow>
  );
}

// アイコンだけで並べる（自動＝半分の円、昼＝日、夜＝月）。選んだものの名前は行の説明に出す
const themeOptions: { value: ThemeMode; label: string; icon: IconName; note: string }[] = [
  { value: "auto", label: "自動", icon: "theme-auto", note: "自動（端末の設定に合わせる）" },
  { value: "light", label: "昼", icon: "sun", note: "昼（明るい表示）" },
  { value: "dark", label: "夜", icon: "moon", note: "夜（暗い表示）" },
];

const clock = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" });

export function SettingsScreen() {
  const [theme, setTheme] = useTheme();
  const { current, latest, checking, lastChecked, error, check } = useUpdate();
  const { confirm, toast } = useFeedback();
  const fileInput = useRef<HTMLInputElement>(null);
  // 対象はログイン中の家族のデータ。ログインしていなければ「データ」区分は出さない
  const handlers = useDataHandlers();
  const data = config.hasData ? handlers : null;

  const exportData = async () => {
    if (!data) return;
    const payload = {
      app: config.name,
      version: current.version,
      exportedAt: new Date().toISOString(),
      data: await data.export(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${config.shortName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ message: "書き出しました" });
  };

  const importData = async (file: File) => {
    if (!data) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ok = await confirm({
        title: "今のデータを置き換えますか？",
        message: `「${file.name}」の内容で、今のデータを置き換えます。`,
        confirmLabel: "置き換える",
      });
      if (!ok) return;
      await data.import(parsed?.data ?? parsed);
      toast({ message: "読み込みました" });
    } catch {
      toast({ message: "読み込めませんでした。このアプリで書き出したファイルか確かめてください。" });
    }
  };

  const clearData = async () => {
    if (!data) return;
    const first = await confirm({
      title: "すべてのデータを削除しますか？",
      message:
        "家族全員の支出・固定費・予算が消えます。先に「書き出し」で控えを取っておくと、あとで戻せます。",
      confirmLabel: "次へ",
      danger: true,
    });
    if (!first) return;
    const second = await confirm({
      title: "本当に削除しますか？",
      message: "この操作は取り消せません。",
      confirmLabel: "すべて削除する",
      danger: true,
    });
    if (!second) return;
    await data.clear();
    toast({ message: "すべてのデータを削除しました" });
  };

  const checkStatus = error
    ? "確認できませんでした"
    : checking
      ? "確認しています…"
      : lastChecked
        ? `最新です（${clock.format(lastChecked)}）`
        : "最新です";

  return (
    <div className="page">
      <ChokinSettings />

      {config.settings.length > 0 && (
        <Section title={config.shortName}>
          {config.settings.map((s) => (
            <AppSettingRow key={s.id} s={s} />
          ))}
        </Section>
      )}

      <Section title="表示">
        <ControlRow label="テーマ" description={themeOptions.find((o) => o.value === theme)?.note}>
          <Choice label="テーマ" value={theme} options={themeOptions} onChange={setTheme} />
        </ControlRow>
      </Section>

      {data && (
        <Section title="データ">
          <ActionRow label="書き出し" value="JSON" onClick={exportData} />
          <ActionRow label="読み込み" onClick={() => fileInput.current?.click()} />
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
          <ActionRow label="すべてのデータを削除" danger onClick={clearData} />
        </Section>
      )}

      <Section title="このアプリについて">
        <InfoRow
          label="バージョン"
          value={
            <>
              v{current.version}
              {current.date && <span className="row-value-sub">{current.date}</span>}
            </>
          }
        />
        {latest ? (
          <div className="row row--block">
            <UpdateNotice info={latest} />
          </div>
        ) : (
          <ActionRow label="新しい版を確認" value={checkStatus} disabled={checking} onClick={check} />
        )}
        <LinkRow label="リリースノート" to="/settings/release-notes" />
        {config.feedbackUrl && <LinkRow label="フィードバック" href={config.feedbackUrl} />}
        <LinkRow label="ライセンス" to="/settings/licenses" />
      </Section>
    </div>
  );
}
