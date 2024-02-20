const express = require('express');
const app = express();

const httpServer = require("http").createServer();

const io = require('socket.io')(httpServer, {
    cors: {
        origin: "*"
    }});
const {makeid} = require("./utils");

const clientRooms = {};
const lobbies = {};
io.on('connection', (socket) => {
    console.log('connection');

    socket.on('createNewGame', (user) => {
        handleNewGame(user, socket);
    });

    socket.on('joinGame', (user) => {
        handleJoinGame(user.user, socket);
    });

    socket.on('getUsers', (room) => {
        handleGetUsers(room, socket);
    });

    socket.on('initGame', (user) => {
        handleInitGame(user, socket);
    });

    socket.on('selectOption', (msg, option) => {
        io.to(msg.roomName).emit('optionSelected', msg.option);
    });

    socket.on('answerSend', (msg) => {
        // console.log(msg);
        socket.to(msg.room).emit('answerArrived', msg);
    });

    socket.on('changeTeamName', (msg) => {
        console.log(msg)
        socket.to(msg.room).emit('teamNameChanged', msg);
    })
})

function handleNewGame(user, socket) {
    let roomName = makeid(5);
    clientRooms[roomName] = {}
    clientRooms[roomName].msg = []
    clientRooms[roomName].users = []
    user.user.socketId = socket.id;
    clientRooms[roomName].users.push(user.user);
    console.log(clientRooms)

    socket.emit('gameCode', roomName);
    console.log("Handle New Game ", roomName)
    console.log('createSuperUser', user);
    socket.join(roomName);
    console.log('Analyse rooms');
    console.log('rooms: ' );
    io.emit('setUser', socket.id);
    socket.number = 1;
    //update user with socket id
    //socket.emit('init', 1);
}

function handleJoinGame(user, socket) {
    console.log("user.roomName handleJoinGame");
    console.log(JSON.stringify(user));
    if (!clientRooms[user.roomName]) {
        console.log('unknownCode');
        socket.emit('unknownCode');
        return;
    } else if(clientRooms[user.roomName].users.length > 5) {
        console.log('tooManyPlayers');
        socket.emit('tooManyPlayers');
        return;
    } else {
        // io.to(user.roomName).emit('warning', 'Ваш ход!');
        console.log('handleJoinGame', user);
        console.log("handle joing game code " + user.roomName)
        user.socketId = socket.id;
        clientRooms[user.roomName].users.push(user);
        socket.join(user.roomName);

        console.log('rooms: ' + JSON.stringify(io.sockets.adapter.rooms));

        console.log('rooms get size: ' + JSON.stringify(io.sockets.adapter.rooms.get(user.roomName)?.size));

        console.log("player Joined")
        console.log(JSON.stringify(clientRooms[user.roomName]));
        //
        io.number = 2;
        io.emit('init', 2);
        io.emit('gameCode', user.roomName);
        io.emit('setUser', socket.id);
        io.emit('userJoined',  user);
        io.emit('users',  clientRooms[user.roomName]);
    }
}

function handleGetUsers(room, socket) {
    console.log('handleGetUsers', room.room);
    console.log(JSON.stringify(clientRooms[room.room]));


    console.log('rooms get size: ' + JSON.stringify(io.sockets.adapter.rooms.get(room.room)?.size));

    io.emit('recieveUsers',  clientRooms[room.room]);
}

function handleInitGame(room, socket) {
    console.log(JSON.stringify('gameInited',clientRooms));
    // get users
    io.emit('gameInited',  room);
}

httpServer.listen(3000, () => {
    console.log('listening on *:3000');
});
