const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrnetUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'MuffinChatBot';

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects 
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);


    // Welcome current user
    socket.emit('message', formatMessage( botName,'Welcome to ChatCord!!.'));

    // Broadcast when a user connects 
    socket.broadcast.to(user.room).emit(
        'message', 
        formatMessage( botName,`A ${user.username} has joined the chat`)
        );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });
});

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrnetUser(socket.id);

      io.to(user.room).emit('message', formatMessage( `${user.username}`,msg))
    })    

    // Runs when client disconnects 
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit(
             'message', 
             formatMessage( botName, `A ${user.username} has left the chat`));  
       

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

})

const PORT = 3000 || process.env.PORT; 

server.listen(PORT, () => console.log('Server is running now..'));