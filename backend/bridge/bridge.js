const dgram = require('dgram');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const marketRoot = path.resolve(__dirname, '..', '..');
const tickerMapPath = path.join(marketRoot, 'tickers.json');

function loadTickerMap() {
    try {
        const file = fs.readFileSync(tickerMapPath, 'utf8');
        const parsed = JSON.parse(file);
        return Object.fromEntries(
            Object.entries(parsed.tickers || {}).map(([symbol, id]) => [Number(id), symbol])
        );
    } catch (error) {
        console.error('Failed to load ticker map:', error);
        return {};
    }
}

const tickerById = loadTickerMap();

const io = new Server(3001, {
    cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

const udpSocket = dgram.createSocket('udp4');

// Exchange::MarketUpdate is packed with pragma pack(1):
// uint32_t tickerId (0), double price (4), uint32_t volume (12),
// uint64_t timestamp (16), char side (24) => 25 bytes total
udpSocket.on('message', (msg, rinfo) => {
    try {
        if (msg.length < 25) {
            console.warn(`Ignoring short market packet (${msg.length} bytes) from ${rinfo.address}:${rinfo.port}`);
            return;
        }

        const tickerId = msg.readUInt32LE(0);
        const price = msg.readDoubleLE(4);
        const volume = msg.readUInt32LE(12);
        const side = msg.toString('utf8', 24, 25);
        const ticker = tickerById[tickerId] || tickerId.toString();

        const update = {
            bid_size: side === 'B' ? volume : 0,
            bid: side === 'B' ? price : price - 0.05,
            ask: side === 'A' ? price : price + 0.05,
            ask_size: side === 'A' ? volume : 0,
            ticker
        };

        io.emit('market_update', update);
    } catch (error) {
        console.error('Decoding error:', error);
    }
});

udpSocket.on('error', (error) => {
    console.error(`UDP Socket Error: ${error.stack}`);
});

udpSocket.bind(9000, '127.0.0.1', () => {
    console.log('Bridge live: UDP 9000 -> Socket.io 3001');
});
