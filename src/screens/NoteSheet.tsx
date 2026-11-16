// 日ごとのメモを書くシート。「きろく」の暦で日を選び、その日の記録の上の［この日のメモを書く］から開く。
//
// 動機：旅行や帰省、お祝いのように「この日はなぜ多かったか」を、後から月を振り返ったときに分かるようにしたい。
// 書くのは出かけた日やその後なので、急ぐ操作ではない。打つ欄はシートの上側、［残す］は欄のすぐ下に置き、
// 端末のキーボードが出ても隠れない位置にする。空にして残すと消える（消した後もトーストの［元に戻す］で戻せる）。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { restoreDayNote, saveDayNote, type DayNote } from "../data/notes";
import { useFeedback } from "../ui/Feedback";
import { Sheet } from "../ui/Sheet";

const MAX = 200;

export function NoteSheet({
  dayKey,
  label,
  note,
  open,
  onClose,
}: {
  dayKey: string;
  /** 「11月14日（土）」 */
  label: string;
  note: DayNote | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const { familyId, user } = useAuth();
  const { toast } = useFeedback();
  const [text, setText] = useState(note?.text ?? "");
  const changed = text.trim() !== (note?.text ?? "");

  const save = () => {
    if (!familyId || !changed) return onClose();
    const before = note;
    void saveDayNote(familyId, dayKey, text, user?.uid ?? null);
    onClose();
    toast({
      message: text.trim() ? "メモを残しました" : "メモを消しました",
      actionLabel: "元に戻す",
      onAction: () => restoreDayNote(familyId, dayKey, before),
    });
  };

  return (
    <Sheet open={open} title={`${label}のメモ`} onClose={onClose}>
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <textarea
          className="fk-input note-input"
          autoFocus
          rows={4}
          maxLength={MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="旅行・帰省・お祝いなど、この日のできごと"
          aria-label="この日のメモ"
        />
        <p className="hint">家族みんなに見えます。空にして残すと消えます</p>
        <button className="fk-button fk-button--primary fk-button--block" disabled={!changed}>
          {note && !text.trim() ? "メモを消す" : "残す"}
        </button>
      </form>
    </Sheet>
  );
}
