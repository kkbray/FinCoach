const cadenceMap = {
  weekly: 4.33,
  biweekly: 2.17,
  "semi-monthly": 2,
  monthly: 1,
  annual: 1 / 12,
};

function number(value) {
  return Number.isFinite(value) ? value : 0;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + number(selector(item)), 0);
}

function categoryPressure(category) {
  const ratio = category.target > 0 ? category.spent / category.target : 0;
  return {
    ...category,
    ratio,
    remaining: Math.max(category.target - category.spent, 0),
    pressure: ratio > 0.9 ? "high" : ratio > 0.72 ? "medium" : "low",
  };
}

export function buildFinancialSnapshot(input) {
  const accounts = input.accounts || [];
  const bills = input.bills || [];
  const transactions = input.transactions || [];
  const categories = input.categories || [];
  const goals = input.goals || [];
  const incomeStreams = input.incomeStreams || [];
  const incomeMode = input.incomeMode || "salary";
  const streakDays = input.streakDays || 0;

  const checking = sum(accounts.filter((account) => account.type === "checking"), (account) => account.availableBalance ?? account.balance);
  const savings = sum(accounts.filter((account) => account.type === "savings"), (account) => account.availableBalance ?? account.balance);
  const totalBalance = checking + savings;
  const upcomingBills = bills.filter((bill) => ["upcoming", "scheduled"].includes(bill.status));
  const essentialBills = upcomingBills.filter((bill) => bill.isEssential);
  const upcomingBillsTotal = sum(upcomingBills, (bill) => bill.amount);
  const essentialBillsTotal = sum(essentialBills, (bill) => bill.amount);
  const monthlyEssentials = essentialBillsTotal * 2.15;
  const conservativeFactor = incomeMode === "gig" ? 0.72 : incomeMode === "mixed" ? 0.82 : 0.92;
  const monthlyConservativeIncome = sum(incomeStreams, (stream) => number(stream.amount) * (cadenceMap[stream.cadence] || 1) * conservativeFactor);
  const protectedBufferTarget = Math.max(600, goals.find((goal) => goal.id === "g1")?.targetAmount || 0, monthlyEssentials * 0.35);
  const safeToSpend = Math.round(totalBalance + monthlyConservativeIncome - upcomingBillsTotal - protectedBufferTarget);
  const dailySpendingSurplus = Math.round(safeToSpend / 14);
  const bufferCoverageDays = Math.max(Math.round((totalBalance + monthlyConservativeIncome) / Math.max(monthlyEssentials / 30, 1)), 0);
  const categoryPressures = categories.map(categoryPressure);
  const unreviewed = transactions.filter((transaction) => !transaction.reviewed);
  const suspicious = unreviewed.filter((transaction) => {
    const amount = Math.abs(transaction.amount);
    const merchant = String(transaction.merchant || "").toLowerCase();
    return amount >= 40 || merchant.includes("transfer") || merchant.includes("atm") || merchant.includes("cash");
  });

  const billPressure = safeToSpend < 0 || totalBalance < upcomingBillsTotal * 0.55
    ? "high"
    : safeToSpend < 250 || totalBalance < upcomingBillsTotal
      ? "medium"
      : "low";

  const financialState = safeToSpend <= 0 || billPressure === "high"
    ? "tight"
    : safeToSpend <= 250 || billPressure === "medium"
      ? "watching"
      : "stable";

  return {
    totalBalance,
    checkingBalance: checking,
    savingsBalance: savings,
    upcomingBillsTotal,
    essentialBillsTotal,
    monthlyEssentials: Math.round(monthlyEssentials),
    conservativeMonthlyIncome: Math.round(monthlyConservativeIncome),
    protectedBufferTarget: Math.round(protectedBufferTarget),
    safeToSpend,
    dailySpendingSurplus,
    bufferCoverageDays,
    billPressure,
    financialState,
    categoryPressure: categoryPressures,
    hiddenSavingsEstimate: Math.round(
      sum(categoryPressures.filter((category) => category.pressure !== "low"), (category) => category.remaining * 0.4) +
      sum(unreviewed, (transaction) => Math.abs(transaction.amount) * 0.15),
    ),
    transactionSignals: {
      unreviewedCount: unreviewed.length,
      suspiciousCount: suspicious.length,
    },
    unreadAlerts: unreviewed.length,
    streakDays,
    goalProgress: goals.length
      ? goals.reduce((total, goal) => total + ((goal.currentAmount || 0) / Math.max(goal.targetAmount || 1, 1)), 0) / goals.length
      : 0,
  };
}
