const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

// ذخیره آنلاین‌ها
const users = new Map(); // socketId -> username

io.on('connection', (socket) => {
    console.log('کاربر جدید متصل شد:', socket.id);

    // ثبت نام کاربر
    socket.on('user-join', (username) => {
        users.set(socket.id, username);
        socket.broadcast.emit('system-message', `⚜️ ${username} وارد قلمرو شد`);
        io.emit('update-users', Array.from(users.values()));
    });

    // دریافت پیام
    socket.on('send-message', (data) => {
        const username = users.get(socket.id);
        if (!username) return;
        
        const messageData = {
            user: username,
            text: data.text,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            isOwn: false
        };
        
        socket.broadcast.emit('new-message', messageData);
        socket.emit('new-message', { ...messageData, isOwn: true });
    });

    // تایپ کردن
    socket.on('typing', (isTyping) => {
        const username = users.get(socket.id);
        if (!username) return;
        socket.broadcast.emit('user-typing', { username, isTyping });
    });

    // قطع اتصال
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            io.emit('system-message', `⚰️ ${username} قلمرو را ترک کرد`);
            io.emit('update-users', Array.from(users.values()));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 سرور طلایی روشن شد: http://localhost:${PORT}`);
});
