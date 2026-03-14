const dgram = require('dgram');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT_WS = process.env.BRIDGE_SOCKET_PORT || 3001;
const PORT_UDP = process.env.UDP_BROADCAST_PORT || 9000;
const FRONTEND_URL = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const marketRoot = path.resolve(__dirname, '..', '..');

// --- 1. SETUP SQLITE DATABASE ---
const dbPath = path.join(__dirname, 'market_data.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite connection error:', err);
    else console.log(`Connected to SQLite at ${dbPath}`);
});

// Create Time-Series Table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS candles_5s (
            ticker TEXT,
            timestamp INTEGER,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            PRIMARY KEY (ticker, timestamp)
        )
    `);
});

// --- 2. DATA RETENTION CRON JOB ---
// Runs every 1 hour to delete candles older than 7 days
setInterval(() => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    db.run(`DELETE FROM candles_5s WHERE timestamp < ?`, [oneWeekAgo], function(err) {
        if (err) console.error('Cleanup error:', err);
        else if (this.changes > 0) console.log(`[DB CLEANUP] Deleted ${this.changes} stale 5s candles.`);
    });
}, 60 * 60 * 1000); 

// Load Ticker Map
function loadTickerMap() {
    try {
        const file = fs.readFileSync(path.join(marketRoot, 'tickers.json'), 'utf8');
        const parsed = JSON.parse(file);
        const map = {};
        for (const [symbol, id] of Object.entries(parsed.tickers || {})) {
            map[Number(id)] = symbol;
        }
        return map;
    } catch (error) {
        console.error('Failed to load ticker map:', error);
        return {};
    }
}
const tickerById = loadTickerMap();

// Socket.io Server
const io = new Server(Number(PORT_WS), {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
});

const orderBooks = {};

// NEW: Active Candle Memory
// Tracks the currently building 5-second candle for each ticker
const activeCandles = {};

// Helper to flush a completed candle to SQLite and broadcast to UI
function flushCandle(ticker, candle) {
    db.run(
        `INSERT INTO candles_5s (ticker, timestamp, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ticker, candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume],
        (err) => { if (err) console.error('Insert error:', err); }
    );
    
    // Broadcast the locked candle to the frontend chart
    io.emit('candle_update', { ticker, ...candle });
}

io.on('connection', (socket) => {
    socket.on('get_snapshot', (ticker) => {
        if (orderBooks[ticker]) {
            const bids = Array.from(orderBooks[ticker].bids.entries()).map(([price, volume]) => ({ price, volume }));
            const asks = Array.from(orderBooks[ticker].asks.entries()).map(([price, volume]) => ({ price, volume }));
            socket.emit('snapshot', { ticker, bids, asks });
        } else {
            socket.emit('snapshot', { ticker, bids: [], asks: [] });
        }
    });

    // NEW: Allow frontend to request historical candles on load
    socket.on('get_chart_history', (ticker) => {
        db.all(
            `SELECT timestamp, open, high, low, close, volume FROM candles_5s WHERE ticker = ? ORDER BY timestamp ASC LIMIT 5000`, 
            [ticker], 
            (err, rows) => {
                if (err) console.error(err);
                else socket.emit('chart_history', { ticker, candles: rows });
            }
        );
    });
});

const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

udpSocket.on('message', (msg, rinfo) => {
    try {
        if (msg.length < 25) return;

        const tickerId = msg.readUInt32LE(0);
        const price = msg.readDoubleLE(4);
        const volume = msg.readUInt32LE(12);
        // Convert C++ nanoseconds to JavaScript milliseconds
        const timestampMs = Number(msg.readBigUInt64LE(16) / 1000000n); 
        const side = msg.toString('utf8', 24, 25);
        
        const ticker = tickerById[tickerId] || tickerId.toString();

        if (side === 'B' || side === 'A') {
            if (!orderBooks[ticker]) orderBooks[ticker] = { bids: new Map(), asks: new Map() };
            const book = orderBooks[ticker];
            
            if (side === 'B') {
                if (volume === 0) book.bids.delete(price);
                else book.bids.set(price, volume);
                io.emit('market_update', { ticker, bid: price, bid_size: volume, ask: null, ask_size: null });
            } else {
                if (volume === 0) book.asks.delete(price);
                else book.asks.set(price, volume);
                io.emit('market_update', { ticker, bid: null, bid_size: null, ask: price, ask_size: volume });
            }
        } else if (side === 'T') {
            // Send raw trade to the Trade History tape
            io.emit('trade_update', { ticker, price, volume, timestamp: timestampMs });

            // --- TICK TO CANDLE AGGREGATION ---
            // Round the trade timestamp down to the nearest 5-second bucket
            const bucketMs = Math.floor(timestampMs / 5000) * 5000;

            if (!activeCandles[ticker]) {
                activeCandles[ticker] = { timestamp: bucketMs, open: price, high: price, low: price, close: price, volume: volume };
            } else {
                let candle = activeCandles[ticker];

                if (bucketMs > candle.timestamp) {
                    // Time has crossed into a new 5-second window! Flush the old one.
                    flushCandle(ticker, candle);
                    // Start a new candle
                    activeCandles[ticker] = { timestamp: bucketMs, open: price, high: price, low: price, close: price, volume: volume };
                } else {
                    // Update the currently building candle
                    candle.high = Math.max(candle.high, price);
                    candle.low = Math.min(candle.low, price);
                    candle.close = price;
                    candle.volume += volume;
                }
            }
        }
    } catch (error) {
        console.error('Decoding error:', error);
    }
});

udpSocket.bind(Number(PORT_UDP), '0.0.0.0', () => {
    udpSocket.addMembership('239.0.0.1');
    console.log(`Bridge live: UDP ${PORT_UDP} -> Socket.io ${PORT_WS}`);
});

// Periodic flush to ensure candles that don't receive new trades are still saved
setInterval(() => {
    const currentBucket = Math.floor(Date.now() / 5000) * 5000;
    for (const [ticker, candle] of Object.entries(activeCandles)) {
        if (candle.timestamp < currentBucket) {
            flushCandle(ticker, candle);
            delete activeCandles[ticker];
        }
    }
}, 1000);