const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

// Налаштування Redis клієнта
const redisClient = redis.createClient({
    url: 'https://allowed-hermit-29302.upstash.io',
    password: 'AXJ2AAIjcDFjMjJhMDVmMzZmZDA0M2IyYjE2MDQ0M2QzMGVhYWI1NHAxMA'   // Вставити токен
});

redisClient.connect()
    .then(() => console.log('Connected to Redis!'))
    .catch((err) => console.log('Redis connection error:', err));

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Сервіс для видачі HTML сторінки
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Обробка подій WebSocket
io.on('connection', (socket) => {
    console.log('New user connected');

    // Підключаємо до чату всі нові повідомлення
    redisClient.lRange('chat:messages', 0, -1).then((messages) => {
        // Відправляємо існуючі повідомлення при підключенні
        socket.emit('chat history', messages.reverse());
    });

    // Обробка нових повідомлень
    socket.on('new message', (message) => {
        const timestamp = new Date().toISOString();
        // Додаємо повідомлення в Redis
        redisClient.rPush('chat:messages', JSON.stringify({ message, timestamp }));
        // Передаємо нове повідомлення всім користувачам
        io.emit('new message', { message, timestamp });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Запуск сервера на порту 3000
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
