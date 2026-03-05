const dgram = require('dgram');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT_WS = process.env.BRIDGE_SOCKET_PORT || 3001;
const PORT_UDP = process.env.UDP_BROADCAST_PORT || 9000;
const FRONTEND_URL = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const marketRoot = path.resolve(__dirname, '..', '..');
const tickerMapPath = path.join(marketRoot, 'tickers.json');

function loadTickerMap() {
    try {
        const file = fs.readFileSync(tickerMapPath, 'utf8');
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

const io = new Server(Number(PORT_WS), {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
});

const udpSocket = dgram.createSocket('udp4');

udpSocket.on('message', (msg, rinfo) => {
    try {
        if (msg.length < 25) return;

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

udpSocket.bind(Number(PORT_UDP), '127.0.0.1', () => {
    console.log(`Bridge live: UDP ${PORT_UDP} -> Socket.io ${PORT_WS}`);
    console.log(`CORS allowed for: ${FRONTEND_URL}`);
});