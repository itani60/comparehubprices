class BusinessChat {
    constructor() {
        this.currentUserId = null;
        this.users = [];
        this.messages = {};
        this.pollInterval = null;
        this.lastTypingPingAt = 0;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        this.GET_USER_PROFILE_PUBLIC_URL = `${this.API_BASE_URL}/user/get-user-profile-public`;
        this.BLOCK_USER_URL = `${this.API_BASE_URL}/user/block-user`;
        this.REPORT_USER_URL = `${this.API_BASE_URL}/user/report-user`;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadUsers();
    }

    attachEventListeners() {
        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        const messageInput = document.getElementById('chatMessageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', (e) => {
                const input = e.target;
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
                this.sendTypingPing(true);
            });
            
            messageInput.addEventListener('blur', () => {
                this.sendTypingPing(false);
            });
        }

        const searchInput = document.getElementById('businessSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(this.GET_CONVERSATIONS_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.users) {
                    this.users = data.data.users.map(user => ({
                        userId: user.userId,
                        userName: user.userName || 'User',
                        email: user.email || '',
                        lastMessage: user.lastMessage || '',
                        lastMessageTime: user.lastMessageTime || new Date().toISOString(),
                        unreadCount: user.unreadCount || 0
                    }));
                    this.renderUserList();
                    return;
                }
            }
            
            this.users = [];
            this.renderUserList();
        } catch (error) {
            console.error('Error loading users from API:', error);
            this.users = [];
            this.renderUserList();
        }
    }

    renderUserList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-user" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p>No users available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.users.map(user => {
            const lastMessage = user.lastMessage || '';
            const unreadCount = user.unreadCount || 0;
            const lastMessageTime = user.lastMessageTime ? this.formatTime(user.lastMessageTime) : '';

            return `
                <div class="business-item" data-user-id="${user.userId}" onclick="businessChat.selectUser('${user.userId}')">
                    <div class="business-item-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="business-item-info">
                        <div class="business-item-name">${this.escapeHtml(user.userName || 'User')}</div>
                        <div class="business-item-preview">${this.escapeHtml(lastMessage)}</div>
                        <div class="business-item-meta">
                            ${lastMessageTime ? `<span class="business-item-time">${lastMessageTime}</span>` : ''}
                        </div>
                    </div>
                    ${unreadCount > 0 ? `<span class="business-item-badge">${unreadCount}</span>` : ''}
                </div>
            `;
        }).join('');
    }

    filterUsers(searchTerm) {
        const items = document.querySelectorAll('.business-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const name = item.querySelector('.business-item-name')?.textContent.toLowerCase() || '';
            if (name.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async selectUser(userId) {
        document.querySelectorAll('.business-item').forEach(item => {
            item.classList.remove('active');
        });
        const selectedItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentUserId = userId;
        const user = this.users.find(u => u.userId === userId);

        if (user) {
            document.getElementById('chatBusinessName').textContent = user.userName || 'User';
            document.getElementById('chatBusinessStatus').textContent = 'Online';

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('businessListSidebar');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            }

            document.getElementById('chatEmptyState').style.display = 'none';
            document.getElementById('chatActive').style.display = 'flex';

            await this.loadMessages(userId);
            this.startPolling();
        }
    }

    showUserList() {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('businessListSidebar');
            if (sidebar) {
                sidebar.classList.remove('hidden');
            }
            document.getElementById('chatActive').style.display = 'none';
            document.getElementById('chatEmptyState').style.display = 'flex';
        }
        
        this.stopPolling();
        this.currentUserId = null;
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`${this.GET_MESSAGES_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.messages) {
                    this.messages[userId] = data.data.messages.map(msg => ({
                        messageId: msg.messageId,
                        content: msg.content,
                        senderType: msg.senderType,
                        createdAt: msg.createdAt,
                        timestamp: msg.timestamp,
                        isRead: msg.isRead !== undefined ? msg.isRead : false,
                        readAt: msg.readAt || null
                    }));
                    this.renderMessages(userId);
                    this.sendTypingPing(true);
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading messages from API:', error);
        }

        if (!this.messages[userId]) {
            this.messages[userId] = [];
        }
        this.renderMessages(userId);
    }

    renderMessages(userId) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const messages = this.messages[userId] || [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 2rem;">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(message => {
            const isSent = message.senderType === 'business';
            const time = this.formatTime(message.createdAt);
            
            let readReceipt = '';
            if (isSent) {
                const isRead = message.isRead === true;
                readReceipt = `<span class="message-read-receipt" title="${isRead ? 'Read' : 'Sent'}">${isRead ? '✓✓' : '✓'}</span>`;
            }

            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <div>${this.escapeHtml(message.content)}</div>
                    <div class="chat-message-time">${time}${readReceipt}</div>
                </div>
            `;
        }).join('');

        this.renderTypingIndicator(container);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const existing = container.querySelector('.typing-indicator');
        if (existing) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();
    }

    renderTypingIndicator(container) {
    }

    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        const message = input?.value.trim();

        if (!message || !this.currentUserId) {
            return;
        }

        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        const tempMessage = {
            messageId: 'temp-' + Date.now(),
            content: message,
            senderType: 'business',
            createdAt: new Date().toISOString()
        };

        if (!this.messages[this.currentUserId]) {
            this.messages[this.currentUserId] = [];
        }
        this.messages[this.currentUserId].push(tempMessage);
        this.renderMessages(this.currentUserId);

        input.value = '';
        input.style.height = 'auto';
        this.hideTypingIndicator();

        try {
            const response = await fetch(this.SEND_MESSAGE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send message');
            }

            const data = await response.json();

            if (data.success && data.data && data.data.message) {
                const index = this.messages[this.currentUserId].findIndex(m => m.messageId === tempMessage.messageId);
                if (index !== -1) {
                    this.messages[this.currentUserId][index] = {
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp,
                        isRead: data.data.message.isRead !== undefined ? data.data.message.isRead : false,
                        readAt: data.data.message.readAt || null
                    };
                } else {
                    this.messages[this.currentUserId].push({
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp,
                        isRead: data.data.message.isRead !== undefined ? data.data.message.isRead : false,
                        readAt: data.data.message.readAt || null
                    });
                }

                this.renderMessages(this.currentUserId);

                const user = this.users.find(u => u.userId === this.currentUserId);
                if (user) {
                    user.lastMessage = message;
                    user.lastMessageTime = new Date().toISOString();
                    this.updateUserPreview(this.currentUserId, {
                        content: message,
                        createdAt: new Date().toISOString()
                    });
                }
                
                setTimeout(() => {
                    this.checkNewMessages();
                }, 500);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError(error.message || 'Failed to send message. Please try again.');

            this.messages[this.currentUserId] = this.messages[this.currentUserId].filter(
                m => m.messageId !== tempMessage.messageId
            );
            this.renderMessages(this.currentUserId);
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    }

    startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(() => {
            if (this.currentUserId) {
                this.checkNewMessages();
            }
        }, 1500);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async checkNewMessages() {
        if (!this.currentUserId) return;

        try {
            const lastMessage = this.messages[this.currentUserId]?.slice(-1)[0];
            const lastTs = (lastMessage?.timestamp != null)
                ? Number(lastMessage.timestamp)
                : (lastMessage?.createdAt ? Math.floor(new Date(lastMessage.createdAt).getTime() / 1000) : null);

            const url = `${this.GET_MESSAGES_URL}?userId=${encodeURIComponent(this.currentUserId)}${Number.isFinite(lastTs) ? `&afterTimestamp=${encodeURIComponent(String(lastTs))}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                const typingStatus = data?.data?.typing;
                if (typingStatus?.isTyping === true && typingStatus?.by === 'user') {
                    this.showTypingIndicator();
                } else {
                    this.hideTypingIndicator();
                }

                if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
                    const existingIds = new Set((this.messages[this.currentUserId] || []).map(m => m.messageId));
                    const newMessages = data.data.messages.filter(msg => !existingIds.has(msg.messageId));
                    
                    if (newMessages.length > 0) {
                        if (!this.messages[this.currentUserId]) {
                            this.messages[this.currentUserId] = [];
                        }
                        
                        this.messages[this.currentUserId].push(...newMessages.map(msg => ({
                            messageId: msg.messageId,
                            content: msg.content,
                            senderType: msg.senderType,
                            createdAt: msg.createdAt,
                            timestamp: msg.timestamp,
                            isRead: msg.isRead !== undefined ? msg.isRead : false,
                            readAt: msg.readAt || null
                        })));
                        
                        newMessages.forEach(newMsg => {
                            if (newMsg.isRead) {
                                const existingMsg = this.messages[this.currentUserId].find(m => m.messageId === newMsg.messageId);
                                if (existingMsg) {
                                    existingMsg.isRead = true;
                                    existingMsg.readAt = newMsg.readAt;
                                }
                            }
                        });
                        
                        this.messages[this.currentUserId].sort((a, b) => {
                            const timeA = a.timestamp || new Date(a.createdAt).getTime();
                            const timeB = b.timestamp || new Date(b.createdAt).getTime();
                            return timeA - timeB;
                        });
                        
                        this.renderMessages(this.currentUserId);

                        const lastNewMessage = newMessages[newMessages.length - 1];
                        this.updateUserPreview(this.currentUserId, lastNewMessage);
                        
                        const user = this.users.find(u => u.userId === this.currentUserId);
                        if (user && lastNewMessage.senderType === 'user') {
                            user.unreadCount = (user.unreadCount || 0) + newMessages.filter(m => m.senderType === 'user').length;
                            this.renderUserList();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking new messages:', error);
        }
    }

    async sendTypingPing(isTyping) {
        if (!this.currentUserId) return;

        const now = Date.now();
        if (isTyping === true && now - this.lastTypingPingAt < 1000) return;
        this.lastTypingPingAt = now;

        try {
            await fetch(this.SET_TYPING_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    isTyping: isTyping === true
                })
            });
        } catch {
        }
    }

    updateUserPreview(userId, lastMessage) {
        const userItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (userItem) {
            const preview = userItem.querySelector('.business-item-preview');
            if (preview) {
                preview.textContent = this.escapeHtml(lastMessage.content);
            }

            const time = userItem.querySelector('.business-item-time');
            if (time) {
                time.textContent = this.formatTime(lastMessage.createdAt);
            }
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        if (typeof showErrorToast === 'function') {
            showErrorToast(message);
        } else {
            console.error(message);
        }
    }

    showUserInfoModal() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        if (!user) return;

        document.getElementById('modalBusinessName').textContent = user.userName || 'User';
        document.getElementById('modalBusinessStatus').textContent = 'Online';
        
        const avatar = document.getElementById('modalBusinessAvatar');
        if (avatar) {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        const modal = new bootstrap.Modal(document.getElementById('businessInfoModal'));
        modal.show();
    }

    viewUserProfile() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        if (!user) return;

        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        const profileUrl = `regular_view_profile.html?userId=${this.currentUserId}`;
        window.location.href = profileUrl;
    }

    async reportUser() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        const userName = user?.userName || 'this user';

        const reason = prompt(`Why are you reporting ${userName}?\n\nOptions: spam, inappropriate, fake, offensive, other\n\nEnter reason:`);
        if (!reason) return;

        const validReasons = ['spam', 'inappropriate', 'fake', 'offensive', 'other'];
        if (!validReasons.includes(reason.toLowerCase())) {
            if (typeof showErrorToast === 'function') {
                showErrorToast('Invalid reason. Please use one of: spam, inappropriate, fake, offensive, other');
            } else if (typeof showToast === 'function') {
                showToast('Invalid reason. Please use one of: spam, inappropriate, fake, offensive, other', 'error');
            }
            return;
        }

        const description = prompt('Additional details (optional):') || '';

        if (confirm(`Are you sure you want to report ${userName}? This action will be reviewed by our team.`)) {
            try {
                const response = await fetch(this.REPORT_USER_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        reportedUserId: this.currentUserId,
                        reason: reason.toLowerCase(),
                        description: description
                    })
                });

                const data = await response.json();

                const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
                if (modal) {
                    modal.hide();
                }

                if (data.success) {
                    if (typeof showSuccessToast === 'function') {
                        showSuccessToast(data.message || 'Report submitted successfully. Our team will review it shortly.');
                    } else if (typeof showToast === 'function') {
                        showToast(data.message || 'Report submitted successfully. Our team will review it shortly.', 'success');
                    }
                } else {
                    if (typeof showErrorToast === 'function') {
                        showErrorToast(data.message || 'Failed to submit report');
                    } else if (typeof showToast === 'function') {
                        showToast(data.message || 'Failed to submit report', 'error');
                    }
                }
            } catch (error) {
                console.error('Error reporting user:', error);
                if (typeof showErrorToast === 'function') {
                    showErrorToast('Failed to submit report. Please try again.');
                } else if (typeof showToast === 'function') {
                    showToast('Failed to submit report. Please try again.', 'error');
                }
            }
        }
    }

    async blockUser() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        const userName = user?.userName || 'this user';

        if (confirm(`Are you sure you want to block ${userName}? You will no longer receive messages from them, and they won't be able to contact you.`)) {
            try {
                const response = await fetch(this.BLOCK_USER_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        blockedUserId: this.currentUserId,
                        action: 'block'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.users = this.users.filter(u => u.userId !== this.currentUserId);
                    this.renderUserList();

                    const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
                    if (modal) {
                        modal.hide();
                    }

                    this.showUserList();
                    this.currentUserId = null;

                    if (typeof showSuccessToast === 'function') {
                        showSuccessToast(data.message || 'User blocked successfully');
                    } else if (typeof showToast === 'function') {
                        showToast(data.message || 'User blocked successfully', 'success');
                    }
                } else {
                    if (typeof showErrorToast === 'function') {
                        showErrorToast(data.message || 'Failed to block user');
                    } else if (typeof showToast === 'function') {
                        showToast(data.message || 'Failed to block user', 'error');
                    }
                }
            } catch (error) {
                console.error('Error blocking user:', error);
                if (typeof showErrorToast === 'function') {
                    showErrorToast('Failed to block user. Please try again.');
                } else if (typeof showToast === 'function') {
                    showToast('Failed to block user. Please try again.', 'error');
                }
            }
        }
    }
}

let businessChat;
document.addEventListener('DOMContentLoaded', function() {
    businessChat = new BusinessChat();
    
    const loadingOverlay = document.getElementById('pageLoadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }, 500);
    }
});

