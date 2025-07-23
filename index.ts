import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const clientFrontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3001';
app.use(
	cors({
		origin: clientFrontendUrl,
		methods: ['GET', 'POST'],
	})
);

let onlineUsers: Array<{ username: string; socketId: string }> = [];

const addUser = (username: string, socketId: string) => {
	// chack if user exists
	const isExist = onlineUsers.find((user) => user.socketId === socketId);

	if (!isExist) {
		onlineUsers.push({ username, socketId });
		console.log(`User: ${username} added!`);
	} else {
		console.log(`User: ${username} already exists!`);
	}
};
// remove logged out users
const removeUser = (socketId: string) => {
	onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
	console.log(`User removed!`);
};

const getUser = (username: string) => {
	const data = onlineUsers.find((user) => user.username === username);

	return data;
};
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: clientFrontendUrl, // replace with your frontend URL on production
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (socket) => {
	console.log('New client connected:', socket.id);

	socket.on('newUser', (username) => {
		console.log(`Registering new user: ${username}, socket: ${socket.id}`);
		addUser(username, socket.id);
		console.log('Online users array:', onlineUsers);
	});
	socket.on('disconnect', () => {
		removeUser(socket.id);
	});

	socket.on('sendNotification', ({ receiverUsername, data }) => {
		const receiver = getUser(receiverUsername);
		if (!receiver) {
			console.warn(`No such user: ${receiverUsername}`);
			return;
		}
		io.to(receiver?.socketId).emit('getNotification', {
			id: uuidv4(),
			...data,
		});
	});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`WebSocket server running on http://localhost:${PORT}`);
});
