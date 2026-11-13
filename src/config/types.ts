import type { IconName } from "../ui/Icon.tsx";

export type TabConfig = {
  /** URL のパス（"/" から始める） */
  path: string;
  label: string;
  icon: IconName;
};

/** 設定画面の「アプリ固有」区分に出す項目 */
export type AppSetting =
  | { id: string; type: "toggle"; label: string; description?: string; default: boolean }
  | {
      id: string;
      type: "select";
      label: string;
      description?: string;
      options: { value: string; label: string }[];
      default: string;
    };

/** 設定 ＞ データ の中身。アプリ側で処理を渡す */
export type DataHandlers = {
  /** 書き出す中身（JSON にして保存される） */
  export: () => Promise<unknown> | unknown;
  /** 書き出したファイルの中身を受け取って戻す */
  import: (data: unknown) => Promise<void> | void;
  /** すべてのデータを消す */
  clear: () => Promise<void> | void;
};

export type AppConfig = {
  name: string;
  shortName: string;
  description: string;
  /** タブ。2つ以上のときだけタブバーが出る（4つまで） */
  tabs: TabConfig[];
  settings: AppSetting[];
  /**
   * データを持つアプリだけ設定画面に「データ」区分を出す。
   * 処理（DataHandlers）は設定画面が useDataHandlers() から受け取る
   */
  hasData: boolean;
  /** 設定 ＞ フィードバック で開く送り先（フォームの URL や mailto:） */
  feedbackUrl?: string;
  /** このアプリのライセンス表記（設定 ＞ ライセンス） */
  license: string;
};
