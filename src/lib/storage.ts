// 端末への小さな保存。プライベートブラウズなどで使えないときも落ちないようにする。

const PREFIX = `${import.meta.env.BASE_URL}::`;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 保存できなくてもアプリは続ける
  }
}
