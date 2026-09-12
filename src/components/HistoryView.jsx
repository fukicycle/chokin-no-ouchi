import React from "react";
import ExpenseList from "./ExpenseList";

const HistoryView = ({ familyId, year, month, onMonthChange, viewMode, initialCategory }) => {
  return (
    <section className="glass-card rounded-3xl p-6">
      <ExpenseList
        familyId={familyId}
        year={year}
        month={month}
        onMonthChange={onMonthChange}
        viewMode={viewMode}
        initialCategory={initialCategory}
      />
    </section>
  );
};

export default HistoryView;
