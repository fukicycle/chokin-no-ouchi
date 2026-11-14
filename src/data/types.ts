/** expenses/{familyId}/{id} */
export type Expense = {
  id: string;
  amount: number;
  category: string;
  description?: string;
  /** ISO 文字列 */
  date: string;
  userId?: string | null;
  /** 固定費から自動で計上したもの */
  isFixed?: boolean;
  fixedCostId?: string;
  /**
   * 特別費（車検・結婚式など、ふだんの暮らしの外の大きな出費）。v3 で足した印。
   * 「使えるお金」と月ごとの貯金の判定には数えず、これまでに貯まったお金からは引く（src/lib/savings.ts）
   */
  isSpecial?: boolean | null;
};

export type ExpenseInput = Omit<Expense, "id">;

/** fixedCosts/{familyId}/{id}：毎月かかる固定費のひな形 */
export type FixedCost = {
  id: string;
  name: string;
  category: string;
  amount: number;
  /** 支払日（1〜31。31 は月末） */
  dayOfMonth: number;
  createdBy?: string | null;
  createdAt?: string;
  /** 最後に支出として計上した月（"YYYY-MM"） */
  lastGeneratedMonth?: string;
};

export type FixedCostInput = Pick<FixedCost, "name" | "category" | "amount" | "dayOfMonth">;
