import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let usernames = {}; // Store usernames mapped to socket IDs

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    console.log("Socket.IO server initialized and waiting for connections...");

    io.on("connection", (socket) => {
        console.log("✅ Something connected:", socket.id);

        socket.on("join-call", (path, username) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }

            // Store the username for this socket ID
            if (username) {
                usernames[socket.id] = username;
            }

            // Store existing users before adding new user
            const existingUsers = [...connections[path]];

            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Create usernames object for this room
            const roomUsernames = {};
            connections[path].forEach(sid => {
                roomUsernames[sid] = usernames[sid] || 'Unknown';
            });

            // Notify existing users about the new user
            existingUsers.forEach(existingUserId => {
                io.to(existingUserId).emit("user-joined", socket.id, connections[path], roomUsernames);
            });

            // Notify the new user about all existing users
            if (existingUsers.length > 0) {
                io.to(socket.id).emit("user-joined", socket.id, connections[path], roomUsernames);
            }

            if (messages[path] !== undefined) {
                for (let b = 0; b < messages[path].length; b++) {
                    io.to(socket.id).emit("chat-message", messages[path][b]['data'], messages[path][b]['sender'], messages[path][b]['socket-id-sender ']);
                }
            }
        })
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });
        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                return [room, isFound];
            },
                ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({ "data": data, "sender": sender, "socket-id-sender": socket.id });
                console.log("message", "key", ":", sender, data);
                for (let a = 0; a < connections[matchingRoom].length; a++) {
                    io.to(connections[matchingRoom][a]).emit("chat-message", data, sender, socket.id);
                }

            }
        });
        socket.on("disconnect", () => {
            var diffTime = Math.abs(new Date() - timeOnline[socket.id]);
            var key;
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] === socket.id) {
                        key = k;
                        for (let b = 0; b < connections[key].length; b++) {
                            io.to(connections[key][b]).emit("user-disconnected", socket.id, diffTime);
                        }
                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);
                        if (connections[key].length === 0) {
                            delete connections[key];
                            delete messages[key];
                        }

                    }
                }
            }
            // Clean up username
            delete usernames[socket.id];
        });
    });



    return io;
}


export default connectToSocket;