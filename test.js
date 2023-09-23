import sqlite3 from './sqliteInit.js';
import uniswapStrategyBacktest from 'uniswap-v3-backtest';

async function main() {
  // Get backtest results
  const backtestResults = await uniswapStrategyBacktest("0x99ac8ca7087fa4a2a1fb6357269965a2014abc35", 5000000, 21006.398813829263, 45175.31799777073, { days: 1, period: "daily", priceToken: 1, startTimestamp: 1626897600 });
  // console.log(backtestResults);

  // Initialize SQLite database
const db = new sqlite3.Database('backtestResult.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to SQLite database.');
  });
  
  // Create table if not exists
  db.run(`CREATE TABLE IF NOT EXISTS backtestResults (
    periodStartUnix INTEGER,
    liquidity TEXT,
    high TEXT,
    low TEXT,
    poolId TEXT,
    totalValueLockedUSD TEXT,
    totalValueLockedToken1 TEXT,
    totalValueLockedToken0 TEXT,
    close TEXT,
    feeGrowthGlobal0X128 TEXT,
    feeGrowthGlobal1X128 TEXT,
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
    baseClose REAL
  )`);
  
  // Insert data
  backtestResults.forEach((result) => {
    const {
      periodStartUnix,
      liquidity,
      high,
      low,
      pool,
      close,
      feeGrowthGlobal0X128,
      feeGrowthGlobal1X128,
      day,
      month,
      year,
      fg0,
      fg1,
      activeliquidity,
      feeToken0,
      feeToken1,
      fgV,
      feeV,
      feeUnb,
      amountV,
      amountTR,
      feeUSD,
      baseClose
    } = result;
  
    const poolId = pool.id;
    const totalValueLockedUSD = pool.totalValueLockedUSD;
    const totalValueLockedToken1 = pool.totalValueLockedToken1;
    const totalValueLockedToken0 = pool.totalValueLockedToken0;
  
    const sql = `INSERT INTO backtestResults (
      periodStartUnix,
      liquidity,
      high,
      low,
      poolId,
      totalValueLockedUSD,
      totalValueLockedToken1,
      totalValueLockedToken0,
      close,
      feeGrowthGlobal0X128,
      feeGrowthGlobal1X128,
      day,
      month,
      year,
      fg0,
      fg1,
      activeliquidity,
      feeToken0,
      feeToken1,
      fgV,
      feeV,
      feeUnb,
      amountV,
      amountTR,
      feeUSD,
      baseClose
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    db.run(sql, [
      periodStartUnix,
      liquidity,
      high,
      low,
      poolId,
      totalValueLockedUSD,
      totalValueLockedToken1,
      totalValueLockedToken0,
      close,
      feeGrowthGlobal0X128,
      feeGrowthGlobal1X128,
      day,
      month,
      year,
      fg0,
      fg1,
      activeliquidity,
      feeToken0,
      feeToken1,
      fgV,
      feeV,
      feeUnb,
      amountV,
      amountTR,
      feeUSD,
      baseClose
    ]);
  });
  
}

main().catch((err) => {
    console.error('An error occurred:', err);
  });