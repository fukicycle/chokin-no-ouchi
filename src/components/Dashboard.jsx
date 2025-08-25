// src/components/Dashboard.jsx
import React, { useState, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import { useMonthlyExpenses } from "../hooks/useMonthlyExpenses";
import { useRecentExpenses } from "../hooks/useRecentExpenses";
import FAB from "./FAB";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import SummaryChart from "./SummaryChart";
import SpendingTrendCard from "./SpendingTrendCard";
import CategoryRankingCard from "./CategoryRankingCard";
import SettingModal from "./SettingModal"; // 新しいコンポーネントをインポート
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faListUl,
  faChevronLeft,
  faChevronRight,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // 設定モーダルの状態

  const { currentUser } = useAuth();
  const { userData, loading: userLoading } = useUserData();

  // userLoadingがtrueの間はfamilyIdを取得しない
  const familyId = !userLoading && userData ? userData.familyId : undefined;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const { expenses, loading: expensesLoading } = useMonthlyExpenses(
    familyId,
    currentYear,
    currentMonth
  );

  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleString("ja-JP", { year: "numeric", month: "long" });
  }, [currentYear, currentMonth]);

  const { data: trendData } = useRecentExpenses(familyId, 3);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 2);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
  };

  const isNextMonthDisabled = useMemo(() => {
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    return (
      currentYear > todayYear ||
      (currentYear === todayYear && currentMonth >= todayMonth)
    );
  }, [currentYear, currentMonth]);

  if (!currentUser || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary text-text-dark text-xl">
        読み込み中...
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-bg-primary text-text-dark">
      <header className="sticky top-0 z-50 p-4 flex justify-between items-center bg-translucent-light backdrop-blur-md border-b border-white/20 shadow-md">
        <h2 className="text-xl font-bold">
          ようこそ、{userData.displayName}さん 👋
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-2 text-accent-blue bg-bg-secondary rounded-full text-lg shadow-md transition-colors duration-200 hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-accent-blue bg-bg-secondary rounded-full text-lg shadow-md transition-colors duration-200 hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="flex justify-between items-center my-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-accent-blue hover:text-blue-500"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h3 className="text-2xl font-bold text-center">{monthName}</h3>
          <button
            onClick={handleNextMonth}
            disabled={isNextMonthDisabled}
            className={`p-2 text-accent-blue ${
              isNextMonthDisabled
                ? "opacity-30 cursor-not-allowed"
                : "hover:text-blue-500"
            }`}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <section className="relative p-4 bg-translucent-light backdrop-blur-md border border-white/20 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold mb-2">今月の家計</h4>
              <button
                onClick={() => setIsListModalOpen(true)}
                className="text-accent-blue text-2xl p-1"
              >
                <FontAwesomeIcon icon={faListUl} />
              </button>
            </div>
            {expensesLoading ? (
              <div className="text-center text-gray-600">支出を計算中...</div>
            ) : (
              <SummaryChart expenses={expenses} />
            )}
            <div className="absolute bottom-4 right-4">
              <FAB onClick={() => setIsFormModalOpen(true)} />
            </div>
          </section>

          <section className="p-4 bg-translucent-light backdrop-blur-md border border-white/20 rounded-3xl shadow-lg">
            <CategoryRankingCard expenses={expenses} />
          </section>

          <section className="p-4 bg-translucent-light backdrop-blur-md border border-white/20 rounded-3xl shadow-lg">
            <SpendingTrendCard data={trendData} />
          </section>
        </div>
      </main>

      {isFormModalOpen && (
        <Modal onClose={() => setIsFormModalOpen(false)} title="支出を追加">
          <ExpenseForm
            userId={currentUser.uid}
            familyId={familyId}
            onClose={() => setIsFormModalOpen(false)}
          />
        </Modal>
      )}

      {isListModalOpen && (
        <Modal onClose={() => setIsListModalOpen(false)} title="支出リスト">
          <ExpenseList
            familyId={familyId}
            year={currentYear}
            month={currentMonth}
            onMonthChange={(year, month) => {
              setCurrentYear(year);
              setCurrentMonth(month);
            }}
            onClose={() => setIsListModalOpen(false)}
          />
        </Modal>
      )}

      {/* 設定モーダル */}
      {isSettingsModalOpen && (
        <Modal onClose={() => setIsSettingsModalOpen(false)} title="設定">
          <SettingModal familyId={userData.familyId} />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
