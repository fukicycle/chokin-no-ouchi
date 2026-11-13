// 設定画面のアプリ固有の区分（一番上）。家族で共有する設定と、この端末だけの設定。
// 予算・固定費など中身のあるものは次の画面へ（›）、すぐ切り替わるものはその場で（スイッチ）。
import { useAuth } from "../../auth/AuthProvider";
import { useBudget, useFixedCosts } from "../../data/hooks";
import { formatYen } from "../../lib/analytics";
import { useGeminiSettings } from "../../receipt/useGeminiSettings";
import { useFeedback } from "../../ui/Feedback";
import { ActionRow, ControlRow, LinkRow, Section, Switch } from "../../ui/List";
import { useReminder } from "./useReminder";

export function ChokinSettings() {
  const { user, familyId, displayName, signOut } = useAuth();
  const { monthlyBudget } = useBudget();
  const { fixedCosts } = useFixedCosts();
  const { apiKey } = useGeminiSettings();
  const reminder = useReminder();
  const { confirm } = useFeedback();

  if (!user) return null;
  const fixedTotal = fixedCosts.reduce((s, f) => s + f.amount, 0);

  return (
    <>
      <Section title="家計簿（家族で共有）">
        <LinkRow
          label="月の予算"
          value={monthlyBudget ? formatYen(monthlyBudget) : "未設定"}
          to="/settings/budget"
        />
        <LinkRow
          label="固定費"
          value={fixedCosts.length ? `${fixedCosts.length}件・月 ${formatYen(fixedTotal)}` : "なし"}
          to="/settings/fixed-costs"
        />
        <LinkRow label="カテゴリーの整理" to="/settings/categories" />
      </Section>

      <Section title="この端末">
        <LinkRow
          label="レシートの読み取り"
          value={apiKey ? "使える" : "API キー未登録"}
          to="/settings/receipt"
        />
        <ControlRow
          label="入力忘れのお知らせ"
          description={
            reminder.supported
              ? "その日にまだ記録がなければ、夜にお知らせします"
              : "この端末では使えません（iPhone はホーム画面に追加してから開いてください）"
          }
        >
          <Switch
            label="入力忘れのお知らせ"
            checked={reminder.on}
            onChange={(v) => (reminder.supported ? reminder.set(v) : undefined)}
          />
        </ControlRow>
      </Section>

      <Section title="家族とアカウント">
        <LinkRow label="家族で共有" value={familyId ?? ""} to="/settings/family" />
        <ActionRow
          label="ログアウト"
          value={displayName}
          onClick={async () => {
            if (
              await confirm({
                title: "ログアウトしますか？",
                message: "記録は消えません。もう一度ログインすれば続きから使えます。",
                confirmLabel: "ログアウト",
              })
            ) {
              await signOut();
            }
          }}
        />
      </Section>
    </>
  );
}
