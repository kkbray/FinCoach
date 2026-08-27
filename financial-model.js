(function (global) {
  function toNumber(value) {
    return Number.isFinite(value) ? value : 0;
  }

  function sum(items, selector) {
    return items.reduce((total, item) => total + toNumber(selector(item)), 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cadenceToMonthFactor(cadence) {
    switch (cadence) {
      case "weekly":
        return 4.33;
      case "biweekly":
        return 2.17;
      case "semi-monthly":
        return 2;
      case "annual":
        return 1 / 12;
      case "monthly":
      default:
        return 1;
    }
  }

  function incomeConservatism(mode) {
    switch (mode) {
      case "gig":
        return 0.72;
      case "mixed":
        return 0.82;
      case "salary":
      default:
        return 0.92;
    }
  }

  function computeCategoryPressure(category) {
    const ratio = category.target > 0 ? category.spent / category.target : 0;
    return {
      ...category,
      ratio,
      remaining: Math.max(category.target - category.spent, 0),
      pressure: ratio > 0.9 ? "high" : ratio > 0.72 ? "medium" : "low",
    };
  }

  function computeBillPressure(upcomingBillsTotal, totalBalance, conservativeIncomeNext30, protectedBufferTarget) {
    const liquidity = totalBalance + conservativeIncomeNext30 - protectedBufferTarget;
    const pressureGap = upcomingBillsTotal - Math.max(liquidity, 0);

    if (pressureGap > 250 || totalBalance < upcomingBillsTotal * 0.55) return "high";
    if (pressureGap > 0 || totalBalance < upcomingBillsTotal) return "medium";
    return "low";
  }

  function buildTransactionSignals(transactions) {
    const unreviewed = transactions.filter((transaction) => !transaction.reviewed);
    const recurring = transactions.filter((transaction) => transaction.isRecurring);
    const suspicious = unreviewed.filter((transaction) => {
      const amount = Math.abs(transaction.amount);
      const merchant = String(transaction.merchant || "").toLowerCase();
      return amount >= 40 || merchant.includes("transfer") || merchant.includes("atm") || merchant.includes("cash");
    });

    return {
      unreviewedCount: unreviewed.length,
      recurringCount: recurring.length,
      suspiciousCount: suspicious.length,
      suspiciousTransactions: suspicious,
    };
  }

  function buildIncomeModel(incomeStreams, incomeMode) {
    const conservatism = incomeConservatism(incomeMode);
    const monthlyGross = sum(incomeStreams, (stream) => toNumber(stream.amount) * cadenceToMonthFactor(stream.cadence));
    const monthlyConservative = sum(incomeStreams, (stream) => {
      const base = toNumber(stream.amount) * cadenceToMonthFactor(stream.cadence);
      const streamFactor = stream.variable ? conservatism * 0.95 : conservatism;
      return base * streamFactor;
    });

    return {
      monthlyGross,
      monthlyConservative,
      next30DaysConservative: monthlyConservative,
      mode: incomeMode,
    };
  }

  function buildFinancialSnapshot(input) {
    const accounts = input.accounts || [];
    const bills = input.bills || [];
    const transactions = input.transactions || [];
    const categories = input.categories || [];
    const goals = input.goals || [];
    const incomeStreams = input.incomeStreams || [];
    const incomeMode = input.incomeMode || "salary";
    const streakDays = input.streakDays || 0;

    const checkingBalance = sum(accounts.filter((account) => account.type === "checking"), (account) => account.availableBalance ?? account.balance);
    const savingsBalance = sum(accounts.filter((account) => account.type === "savings"), (account) => account.availableBalance ?? account.balance);
    const creditAvailable = sum(accounts.filter((account) => account.type === "credit"), (account) => account.availableBalance ?? 0);
    const totalLiquidBalance = checkingBalance + savingsBalance;

    const essentialBills = bills.filter((bill) => bill.isEssential && ["upcoming", "scheduled"].includes(bill.status));
    const upcomingBills = bills.filter((bill) => ["upcoming", "scheduled"].includes(bill.status));
    const essentialBillsTotal = sum(essentialBills, (bill) => bill.amount);
    const upcomingBillsTotal = sum(upcomingBills, (bill) => bill.amount);
    const monthlyEssentials = essentialBillsTotal * 2.15;

    const income = buildIncomeModel(incomeStreams, incomeMode);
    const protectedBufferTarget = Math.max(
      600,
      goals.find((goal) => goal.id === "g1")?.targetAmount || 0,
      monthlyEssentials * 0.35,
    );
    const bufferGap = Math.max(protectedBufferTarget - savingsBalance, 0);

    const safeToSpend = Math.round(totalLiquidBalance + income.next30DaysConservative - upcomingBillsTotal - protectedBufferTarget);
    const dailySpendingSurplus = Math.round(safeToSpend / 14);
    const bufferCoverageDays = Math.max(Math.round((totalLiquidBalance + income.next30DaysConservative) / Math.max(monthlyEssentials / 30, 1)), 0);

    const categoryPressure = categories.map(computeCategoryPressure);
    const pressureCounts = categoryPressure.reduce(
      (counts, category) => {
        counts[category.pressure] += 1;
        return counts;
      },
      { low: 0, medium: 0, high: 0 },
    );

    const transactionSignals = buildTransactionSignals(transactions);
    const hiddenSavingsEstimate = Math.round(
      sum(categoryPressure.filter((category) => category.pressure !== "low"), (category) => Math.max(category.remaining, 0) * 0.4) +
        sum(transactions.filter((transaction) => !transaction.reviewed), (transaction) => Math.abs(transaction.amount) * 0.15) +
        sum(bills.filter((bill) => !bill.isEssential && bill.status !== "paid"), (bill) => bill.amount * 0.5),
    );

    const billPressure = computeBillPressure(upcomingBillsTotal, totalLiquidBalance, income.next30DaysConservative, protectedBufferTarget);
    const financialState = safeToSpend <= 0 || billPressure === "high"
      ? "tight"
      : safeToSpend <= 250 || billPressure === "medium"
        ? "watching"
        : "stable";

    const totalGoalProgress = goals.reduce((progress, goal) => {
      const ratio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
      return progress + ratio;
    }, 0);

    const primaryAlert = transactionSignals.suspiciousCount > 0
      ? {
          type: "fraud",
          severity: "critical",
          title: "Suspicious charge needs review",
        }
      : billPressure === "high"
        ? {
            type: "overdraft",
            severity: "critical",
            title: "Cash timing could cause an overdraft",
          }
        : billPressure === "medium"
          ? {
              type: "bill-pressure",
              severity: "warning",
              title: "Bills are close enough to deserve attention",
            }
          : null;

    return {
      totalBalance: totalLiquidBalance,
      checkingBalance,
      savingsBalance,
      creditAvailable,
      essentialBillsTotal,
      upcomingBillsTotal,
      monthlyEssentials,
      protectedBufferTarget,
      bufferGap,
      incomeMode,
      streakDays,
      monthlyGrossIncome: Math.round(income.monthlyGross),
      conservativeMonthlyIncome: Math.round(income.monthlyConservative),
      conservativeIncomeNext30Days: Math.round(income.next30DaysConservative),
      safeToSpend,
      dailySpendingSurplus,
      bufferCoverageDays,
      billPressure,
      financialState,
      categoryPressure,
      categoryPressureCounts: pressureCounts,
      hiddenSavingsEstimate,
      transactionSignals,
      unreadAlerts: transactionSignals.unreviewedCount,
      goalProgress: totalGoalProgress / Math.max(goals.length, 1),
      primaryAlert,
    };
  }

  global.FinCoachModel = {
    buildFinancialSnapshot,
    computeCategoryPressure,
    computeBillPressure,
  };
})(window);
