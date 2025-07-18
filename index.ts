import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*', // replace with your frontend URL on production
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (socket) => {
	console.log('New client connected:', socket.id);

	socket.on('helloFromClient', (data) => {
		console.log('📦 Received from client:', data);
	});

	socket.emit('welcome', 'Thanks for connecting!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`WebSocket server running on http://localhost:${PORT}`);
});
