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

const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

udpSocket.on('message', (msg, rinfo) => {
    try {
        if (msg.length < 25) return;

        const tickerId = msg.readUInt32LE(0);
        const price = msg.readDoubleLE(4);
        const volume = msg.readUInt32LE(12);
        const side = msg.toString('utf8', 24, 25);
        
        const ticker = tickerById[tickerId] || tickerId.toString();

        // Translate the C++ "side/price" format into the format the original React frontend expects
        if (side === 'B') {
            io.emit('market_update', {
                ticker,
                bid: price,
                bid_size: volume,
                ask: null,
                ask_size: null
            });
        } else if (side === 'A') {
            io.emit('market_update', {
                ticker,
                bid: null,
                bid_size: null,
                ask: price,
                ask_size: volume
            });
        }
        // Ignoring 'T' (Trades) for this specific tape as they belong in Trade History

    } catch (error) {
        console.error('Decoding error:', error);
    }
});

udpSocket.on('error', (error) => {
    console.error(`UDP Socket Error: ${error.stack}`);
});

const MULTICAST_GROUP = '239.0.0.1';

udpSocket.bind(Number(PORT_UDP), '0.0.0.0', () => {
    udpSocket.addMembership(MULTICAST_GROUP);
    console.log(`Bridge live: UDP ${PORT_UDP} -> Socket.io ${PORT_WS}`);
    console.log(`CORS allowed for: ${FRONTEND_URL}`);
});