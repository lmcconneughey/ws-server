import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const clientFrontendUrl =
	process.env.CLIENT_ORIGIN || 'https://post-ez.vercel.app';
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
		console.log(`SERVER User: ${username} added!`);
	} else {
		console.log(`SERVER User: ${username} already exists!`);
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
	console.log('SERVER New client connected:', socket.id);
	socket.on('error', (error) => {
		console.error('SERVER: Socket error for ID', socket.id, ':', error);
	});

	socket.on('newUser', (username) => {
		console.log(`Registering new user: ${username}, socket: ${socket.id}`);
		addUser(username, socket.id);
		console.log('Online users array:', onlineUsers);
	});
	socket.on('disconnect', (reason) => {
		console.log(
			'SERVER: Client disconnected. Socket ID:',
			socket.id,
			'Reason:',
			reason
		);

		removeUser(socket.id);
	});

	socket.on('sendNotification', ({ receiverUsername, data }) => {
		const receiver = getUser(receiverUsername);
		if (!receiver) {
			console.warn(`SERVER: No such user: ${receiverUsername}`);
			return;
		}
		io.to(receiver?.socketId).emit('getNotification', {
			id: uuidv4(),
			...data,
		});
	});
});

const PORT = process.env.PORT;
if (!PORT) {
	console.error('SERVER ERROR: PORT environment variable is missing.');
	process.exit(1);
}

server.listen(PORT, () => {
	console.log(`SERVER: WebSocket server running on port ${PORT}`);
	console.log(`SERVER: CORS allowed from: ${clientFrontendUrl}`);
});
