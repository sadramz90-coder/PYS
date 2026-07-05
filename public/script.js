const socket = io();

let currentUser = '';
let isTyping = false;
let typingTimeout = null;

// ===== المان‌ها =====
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messageContainer = document.getElementById('message-container');
const userBadge = document.getElementById('user-badge');
const typingIndicator = document.getElementById('typing-indicator');

// ===== ورود =====
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    const name = usernameInput.value.trim();
    if (name.length < 2) {
        alert('اسمت باید حداقل ۲ حرف باشه، سلطان!');
        return;
    }
    
    currentUser = name;
    socket.emit('user-join', currentUser);
    
    // تغییر UI
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    userBadge.textContent = `👑 ${currentUser}`;
    document.title = `PYS · ${currentUser}`;
    
    // فوکوس روی ورودی پیام
    messageInput.focus();
}

// ===== ارسال پیام =====
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    socket.emit('send-message', { text });
    messageInput.value = '';
    messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ===== تایپ ایندیکیتور =====
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', true);
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing', false);
    }, 1000);
});

// ===== دریافت پیام از سرور =====
socket.on('new-message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.isOwn ? 'own' : 'other'}`;
    
    messageDiv.innerHTML = `
        <span class="msg-user">${data.isOwn ? '👤 شما' : data.user}</span>
        ${data.text}
        <span class="msg-time">${data.time}</span>
    `;
    
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

// ===== پیام‌های سیستمی =====
socket.on('system-message', (msg) => {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = msg;
    messageContainer.appendChild(div);
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

// ===== تایپ دیگران =====
let typingTimeoutUI = null;
socket.on('user-typing', ({ username, isTyping }) => {
    if (isTyping) {
        typingIndicator.textContent = `⚜️ ${username} در حال نوشتن است...`;
        typingIndicator.classList.add('active');
    } else {
        typingIndicator.classList.remove('active');
    }
    
    clearTimeout(typingTimeoutUI);
    typingTimeoutUI = setTimeout(() => {
        typingIndicator.classList.remove('active');
    }, 3000);
});

// ===== به‌روزرسانی آنلاین‌ها =====
socket.on('update-users', (users) => {
    console.log('👥 آنلاین‌ها:', users.join(', '));
});

// ===== خروج =====
document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('میخوای از قلمرو طلایی خارج شی؟')) {
        location.reload();
    }
});
