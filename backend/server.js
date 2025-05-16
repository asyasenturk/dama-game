const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);


app.use(express.json());

app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));


// MongoDB'ye bağlan
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ MongoDB bağlantısı başarılı!');
}).catch((err) => {
    console.error('❌ MongoDB bağlantı hatası:', err);
    process.exit(1);
});

// Public klasörünü static olarak sun
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;

let waitingPlayer = null;
let roomTurns = {};

io.on('connection', (socket) => {   
    console.log('Yeni kullanıcı bağlandı: ' + socket.id);

    socket.on('joinRoom', (roomName) => {
    socket.join(roomName);

    const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
    const numClients = clientsInRoom ? clientsInRoom.size : 0;

    if (numClients === 1) {
        socket.emit('roomJoined', { room: roomName, player: 1 });
    } else if (numClients === 2) {
        socket.emit('roomJoined', { room: roomName, player: 2 });
        socket.to(roomName).emit('startGame');
        socket.emit('startGame');
        roomTurns[roomName] = 1;
    } else {
        socket.emit('roomFull');
        socket.leave(roomName); // Fazla kişi varsa çıkar
    }
});

socket.on('readyToStart', (room) => {
  io.to(room).emit('startGame');
});


  socket.on('move', (data) => {
  // Güvenlik kontrolü (isteğe bağlı)
    data.isQueen = !!data.isQueen

  // BoardState'i düzgün şekilde opponentMove ile gönder
  io.to(data.room).emit("opponentMove", {
    from: data.from,
    to: data.to,
    isQueen: data.isQueen,
    boardState: data.boardState  // ✅ EN ÖNEMLİSİ BU
  });

  // Tur değiştir ve bildir
  roomTurns[data.room] = roomTurns[data.room] === 1 ? 2 : 1;
  io.to(data.room).emit("turnChanged", { turn: roomTurns[data.room] });
});


    socket.on('gameOver', ({ room, winner }) => {
    io.to(room).emit('gameOver', winner);
});

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı: ' + socket.id);
        if (waitingPlayer === socket) { 
            waitingPlayer = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});
