import React from "react";
import ExpenseList from "./ExpenseList";

// 履歴はフィルター・並べ替えを画面上部に固定し、明細リストだけが
// スクロールする。そのため与えられた高さを使い切る縦flexにする。
const HistoryView = ({ familyId, year, month, viewMode, initialCategory }) => {
  return (
    <section className="glass-card rounded-3xl p-4 sm:p-5 h-full min-h-0 flex flex-col overflow-hidden">
      <ExpenseList
        familyId={familyId}
        year={year}
        month={month}
        viewMode={viewMode}
        initialCategory={initialCategory}
      />
    </section>
  );
};

export default HistoryView;
