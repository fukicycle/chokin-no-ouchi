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
