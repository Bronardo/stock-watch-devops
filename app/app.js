const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.status(200).json({ status: 'UP', database: dbStatus });
});

app.get('/price/:ticker', async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const token = process.env.FINNHUB_KEY;

    // Check if we are in test mode OR if DB is disconnected
    const isDbConnected = mongoose.connection.readyState === 1;

    try {
        // 1. DATABASE CHECK (Only if connected)
        if (isDbConnected) {
            let stock = await Stock.findOne({ ticker });
            if (stock && (new Date() - stock.lastUpdated < 300000)) {
                return res.json({ source: 'database', ticker, price: stock.price });
            }
        }

        // 2. API FETCH
        // If no token exists (like in a basic build stage), throw error to test error handling
        if (!token) throw new Error("Missing API Key");

        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${token}`);
        const price = response.data.c;

        if (!price) throw new Error("Invalid Ticker");

        // 3. DATABASE UPDATE (Only if connected)
        if (isDbConnected) {
            await Stock.findOneAndUpdate(
                { ticker },
                { price, lastUpdated: new Date() },
                { upsert: true }
            );
        }

        res.json({ source: 'api', ticker, price });
    } catch (error) {
        // If it's a test and we expected a 500, this is where we land
        res.status(500).json({ error: error.message || "Service unavailable" });
    }
});

module.exports = app;