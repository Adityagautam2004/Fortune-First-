const axios = require('axios');
const db = require('../models/db');
const redis = require('../utils/redis');

const getLivePortfolio = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;

    // 1. Fetch user's manual positions
    const positions = await db.query(
      `SELECT id, symbol, quantity, buy_price FROM portfolio_positions WHERE owner_id = $1 AND is_active = TRUE`,
      [boardMemberId]
    );

    if (positions.rows.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // 2. Fetch live prices efficiently using Twelve Data + Redis
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    const enrichedPositions = await Promise.all(positions.rows.map(async (pos) => {
      const cacheKey = `stock_price:${pos.symbol}`;
      let currentPrice = await redis.get(cacheKey);

      if (!currentPrice) {
        // Cache miss: hit external API
        const response = await axios.get(`https://api.twelvedata.com/price?symbol=${pos.symbol}&apikey=${apiKey}`);
        currentPrice = response.data.price;
        // Cache the result for 5 minutes
        if (currentPrice) await redis.set(cacheKey, currentPrice, 'EX', 300);
      }

      const pnl = (parseFloat(currentPrice) - parseFloat(pos.buy_price)) * pos.quantity;
      
      return {
        ...pos,
        currentPrice: parseFloat(currentPrice),
        pnl: parseFloat(pnl.toFixed(2))
      };
    }));

    return res.status(200).json({ status: 'success', data: enrichedPositions });
  } catch (error) {
    console.error('Portfolio Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load portfolio' });
  }
};

const addPosition = async (req, res) => {
  try {
    const { symbol, quantity, buyPrice } = req.body;
    await db.query(
      `INSERT INTO portfolio_positions (owner_id, symbol, quantity, buy_price) VALUES ($1, $2, $3, $4)`,
      [req.user.userId, symbol.toUpperCase(), quantity, buyPrice]
    );
    return res.status(201).json({ status: 'success', message: 'Position added' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to add position' });
  }
};

module.exports = { getLivePortfolio, addPosition };