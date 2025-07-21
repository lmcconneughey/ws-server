import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(cors());

let onlineUsers: Array<{ username: string; socketId: string }> = [];

const addUser = (username: string, socketId: string) => {
	// chack if user exists
	const isExist = onlineUsers.find((user) => user.socketId === socketId);

	if (!isExist) {
		onlineUsers.push({ username, socketId });
		console.log(`User: ${username} added!`);
	}
};
// remove logged out users
const removeUser = (socketId: string) => {
	onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
	console.log(`User removed!`);
};

const getUser = (username: string) => {
	return onlineUsers.find((user) => user.username === username);
};

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*', // replace with your frontend URL on production
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (socket) => {
	console.log('New client connected:', socket.id);

	socket.on('newUser', (username) => {
		addUser(username, socket.id);
	});
	socket.on('disconnect', () => {
		removeUser(socket.id);
	});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`WebSocket server running on http://localhost:${PORT}`);
});
