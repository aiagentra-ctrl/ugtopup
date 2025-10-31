const BALANCE_KEY = 'user_balance';

export const getUserBalance = (): number => {
  try {
    const stored = localStorage.getItem(BALANCE_KEY);
    return stored ? parseFloat(stored) : 0;
  } catch (error) {
    console.error('Error reading balance:', error);
    return 0;
  }
};

export const addCreditsToBalance = (credits: number): number => {
  try {
    const currentBalance = getUserBalance();
    const newBalance = currentBalance + credits;
    localStorage.setItem(BALANCE_KEY, newBalance.toString());
    return newBalance;
  } catch (error) {
    console.error('Error updating balance:', error);
    return getUserBalance();
  }
};

export const setUserBalance = (balance: number): void => {
  localStorage.setItem(BALANCE_KEY, balance.toString());
};
