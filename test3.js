import sqlite3 from './sqliteInit.js';
import uniswapStrategyBacktest from 'uniswap-v3-backtest';
import { createReadStream } from 'fs';
import csv from 'csv-parser';

const results = [];
let previousTime = null;
let counter = 0;

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

const executeBacktests = async () => {
  for (const entry of results) {
    const upperBand = parseFloat(entry.upper_band);
    const lowerBand = parseFloat(entry.lower_band);
    console.log(entry.time)
    console.log(upperBand)
    console.log(lowerBand)

    const backtestResults = await uniswapStrategyBacktest(
      "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35",
      5000000,
      lowerBand,
      upperBand,
      { days: 7, period: "hourly", priceToken: 1, startTimestamp: parseFloat(entry.time)}
    );
    // console.log("Backtest: ", backtestResults)

    const db = new sqlite3.Database('./backtestResult.db');

    backtestResults.forEach((result) => {
        const [newToken0Amount, newToken1Amount] = balanceAssets(result);
        const priceImpact0 = calculatePriceImpact(result.liquidity, result.tokens[0], newToken0Amount);
        const priceImpact1 = calculatePriceImpact(result.liquidity, result.tokens[1], newToken1Amount);
  
        db.run(`INSERT OR REPLACE INTO backtestResults (
          periodStartUnix, liquidity, high, low, close, day, month, year, fg0, fg1,
          activeliquidity, feeToken0, feeToken1, fgV, feeV, feeUnb, amountV, amountTR,
          feeUSD, baseClose, newToken0Amount, newToken1Amount, priceImpact0, priceImpact1,
          upper_band, lower_band
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.periodStartUnix, result.liquidity, result.high, result.low, result.close, result.day,
          result.month, result.year, result.fg0, result.fg1, result.activeliquidity, result.feeToken0,
          result.feeToken1, result.fgV, result.feeV, result.feeUnb, result.amountV, result.amountTR,
          result.feeUSD, result.baseClose, newToken0Amount, newToken1Amount, priceImpact0, priceImpact1,
          upperBand, lowerBand
        ]);
      });
  
      db.close();
    }
  };

createReadStream('BINANCE_BTCUSD, 240.csv')
  .pipe(csv())
  .on('data', (data) => {
    if (counter === 0 || (data.time - previousTime >= 604800)) {
      results.push({
        time: data.time,
        close: data.close,
        upper_band: data['Upper Band'],
        lower_band: data['Lower Band'],
      });
      previousTime = data.time;
      counter += 1;
    }
  })
  .on('end', async () => {
    console.log('CSV reading done. Starting backtests.');
    await executeBacktests();
  });
