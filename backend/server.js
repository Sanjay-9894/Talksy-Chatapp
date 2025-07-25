const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const corsOptions = {
	origin: process.env.FRONTEND_URL,
	methods: ["GET", "POST", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;


const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const messageRouter = require("./routes/message");

main()
	.then(() => console.log("Database Connection established"))
	.catch((err) => console.log(err));

async function main() {
	await mongoose.connect(process.env.MONGODB_URI);
}


app.get("/", (req, res) => {
	res.json({
		message: "Welcome to Chat Application!",
		frontend_url: process.env.FRONTEND_URL,
	});
});


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

app.all("*", (req, res) => {
	res.json({ error: "Invalid Route" });
});


app.use((err, req, res, next) => {
	const errorMessage = err.message || "Something Went Wrong!";
	res.status(500).json({ message: errorMessage });
});


const server = app.listen(PORT, async () => {
	console.log(`Server listening on ${PORT}`);
});


const { Server } = require("socket.io");
const io = new Server(server, {
	pingTimeout: 60000,
	transports: ["websocket"],
	cors: corsOptions,
});

//Important for latency
const onlineUsers = new Map();


io.on("connection", (socket) => {
	console.log("Connected to socket.io:", socket.id);

	
	const setupHandler = (userId) => {
		if (!socket.hasJoined) {
			socket.join(userId);
			socket.hasJoined = true;
			onlineUsers.set(userId, socket.id);
			console.log("User joined:", userId);
			socket.emit("connected");
			io.emit("online-users", Array.from(onlineUsers.keys()));
		}
	};

	
	const newMessageHandler = (newMessageReceived, callback) => {
		let chat = newMessageReceived?.chat;
		chat?.users.forEach((user) => {
			if (user._id === newMessageReceived.sender._id) return;
			const receiverSocketId = onlineUsers.get(user._id);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("message received", newMessageReceived);
			}
		});
		if (callback) callback({ status: "received" });
	};

	//room to reduce latency issue
	const joinChatHandler = (room) => {
		if (socket.currentRoom === room) {
			console.log(`User already in Room: ${room}`);
			return;
		}
		if (socket.currentRoom) {
			socket.leave(socket.currentRoom);
			console.log(`User left Room: ${socket.currentRoom}`);
		}
		socket.join(room);
		socket.currentRoom = room;
		console.log("User joined Room:", room);
	};

	
	const typingHandler = (room) => {
		socket.in(room).emit("typing");
	};
	const stopTypingHandler = (room) => {
		socket.in(room).emit("stop typing");
	};

	
	const clearChatHandler = (chatId) => {
		socket.in(chatId).emit("clear chat", chatId);
	};
	const deleteChatHandler = (chat, authUserId) => {
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			socket.in(user._id).emit("delete chat", chat._id);
		});
	};
	const chatCreateChatHandler = (chat, authUserId) => {
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			socket.in(user._id).emit("chat created", chat);
		});
	};

	
	socket.on("setup", setupHandler);
	socket.on("new message", newMessageHandler);
	socket.on("join chat", joinChatHandler);
	socket.on("typing", typingHandler);
	socket.on("stop typing", stopTypingHandler);
	socket.on("clear chat", clearChatHandler);
	socket.on("delete chat", deleteChatHandler);
	socket.on("chat created", chatCreateChatHandler);

	
	socket.on("disconnect", () => {
		console.log(" User disconnected:", socket.id);
		
		for (const [userId, socketId] of onlineUsers.entries()) {
			if (socketId === socket.id) {
				onlineUsers.delete(userId);
				break;
			}
		}
		io.emit("online-users", Array.from(onlineUsers.keys()));

		socket.off("setup", setupHandler);
		socket.off("new message", newMessageHandler);
		socket.off("join chat", joinChatHandler);
		socket.off("typing", typingHandler);
		socket.off("stop typing", stopTypingHandler);
		socket.off("clear chat", clearChatHandler);
		socket.off("delete chat", deleteChatHandler);
		socket.off("chat created", chatCreateChatHandler);
	});
});
