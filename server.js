const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});


app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');
app.use(express.static('public'));



app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
});


/**
 *  Joining a specific room (uuid)
*/
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).broadcast.emit('user-connected', userId); //Notfies that the user has connected
        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message);
        });
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });
    
    });
});

server.listen(process.env.PORT||3030);
//server.listen(3030);