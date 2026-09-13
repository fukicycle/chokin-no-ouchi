import React from "react";
import ExpenseList from "./ExpenseList";

const HistoryView = ({ familyId, year, month, viewMode, initialCategory }) => {
  return (
    <section className="glass-card rounded-3xl p-4 sm:p-5">
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
