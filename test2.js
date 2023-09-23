import sqlite3 from './sqliteInit.js';
import uniswapStrategyBacktest from 'uniswap-v3-backtest';

// Function to balance assets based on the latest close prices
const balanceAssets = (result) => {
  const closePrice = parseFloat(result.close);
  const oldToken0Amount = result.tokens[0];
  const oldToken1Amount = result.tokens[1];

  const valueOfToken0 = oldToken0Amount * closePrice;
  const valueOfToken1 = oldToken1Amount;

  const totalValue = valueOfToken0 + valueOfToken1;
  const balancedValue = totalValue / 2;

  const newToken0Amount = balancedValue / closePrice;
  const newToken1Amount = balancedValue;

  return [newToken0Amount, newToken1Amount];
};

const calculatePriceImpact = (liquidity, oldAmount, newAmount) => {
    const tradeSize = Math.abs(newAmount - oldAmount);
    const priceImpact = (tradeSize / parseFloat(liquidity)) * 100;  // Multiply by 100 to get a percentage
    return priceImpact;
  };

(async () => {
  const backtestResults = await uniswapStrategyBacktest("0x99ac8ca7087fa4a2a1fb6357269965a2014abc35", 5000000, 23813.70, 27842.69, { days: 7, period: "hourly", priceToken: 1 });

  // Initialize SQLite database
  const db = new sqlite3.Database('./backtestResult.db');

  // Create table if not exists
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS backtestResults (
      periodStartUnix INTEGER,
      liquidity TEXT,
      high TEXT,
      low TEXT,
      close TEXT,
      day INTEGER,
      month INTEGER,
      year INTEGER,
      fg0 REAL,
      fg1 REAL,
      activeliquidity REAL,
      feeToken0 REAL,
      feeToken1 REAL,
      fgV REAL,
      feeV REAL,
      feeUnb REAL,
      amountV REAL,
      amountTR REAL,
      feeUSD REAL,
      baseClose REAL,
      newToken0Amount REAL,
      newToken1Amount REAL,
      priceImpact0 REAL, 
      priceImpact1 REAL
    );`);
  });

  // Inserting and updating data
  backtestResults.forEach((result) => {
    const [newToken0Amount, newToken1Amount] = balanceAssets(result);
    result.newToken0Amount = newToken0Amount;
    result.newToken1Amount = newToken1Amount;

    const priceImpact0 = calculatePriceImpact(result.liquidity, result.tokens[0], newToken0Amount);
    const priceImpact1 = calculatePriceImpact(result.liquidity, result.tokens[1], newToken1Amount);

    // Insert or update the record into SQLite database
    db.run(`INSERT OR REPLACE INTO backtestResults (
      periodStartUnix, liquidity, high, low, close, day, month, year, fg0, fg1,
      activeliquidity, feeToken0, feeToken1, fgV, feeV, feeUnb, amountV, amountTR,
      feeUSD, baseClose, newToken0Amount, newToken1Amount, priceImpact0, priceImpact1
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.periodStartUnix, result.liquidity, result.high, result.low, result.close, result.day,
      result.month, result.year, result.fg0, result.fg1, result.activeliquidity, result.feeToken0,
      result.feeToken1, result.fgV, result.feeV, result.feeUnb, result.amountV, result.amountTR,
      result.feeUSD, result.baseClose, result.newToken0Amount, result.newToken1Amount, priceImpact0, priceImpact1
    ]);
  });

  // Close the database connection
  db.close();
})();
