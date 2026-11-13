// 家族で共有：自分の家族 ID を家族に伝える／家族の ID を入れて参加する。
import { useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useFeedback } from "../../ui/Feedback";
import { Icon } from "../../ui/Icon";
import { Section } from "../../ui/List";

export function FamilyScreen() {
  const { familyId, joinFamily } = useAuth();
  const { confirm, toast } = useFeedback();
  const [input, setInput] = useState("");

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (!id) return;
    if (id === familyId) return toast({ message: "すでにこの家族に参加しています" });
    const ok = await confirm({
      title: `家族「${id}」に参加しますか？`,
      message:
        "参加すると、その家族の家計簿が表示されます。今の家族の記録は消えず、ID を入れ直せば戻れます。",
      confirmLabel: "参加する",
    });
    if (!ok) return;
    await joinFamily(id);
    setInput("");
    toast({ message: `家族「${id}」に参加しました` });
  };

  return (
    <div className="page">
      <Section title="あなたの家族 ID">
        <div className="row">
          <span className="row-text">
            <span className="family-id num">{familyId}</span>
          </span>
          <button
            className="fk-icon-button"
            aria-label="家族 ID をコピー"
            onClick={async () => {
              await navigator.clipboard.writeText(familyId ?? "");
              toast({ message: "コピーしました" });
            }}
          >
            <Icon name="copy" />
          </button>
        </div>
      </Section>
      <p className="hint">
        この ID を家族に伝えて、家族の端末の［家族の ID で参加］に入れてもらうと、同じ家計簿を一緒に使えます。
      </p>

      <form className="form section" onSubmit={join}>
        <h2 className="section-title">家族の ID で参加</h2>
        <input
          className="fk-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例：AB12CD34"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <button className="fk-button fk-button--block" disabled={!input.trim()}>
          参加する
        </button>
      </form>
    </div>
  );
}
