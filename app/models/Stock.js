const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
    ticker: { type: String, required: true, uppercase: true },
    price: Number,
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', StockSchema);