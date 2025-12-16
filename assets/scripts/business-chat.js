class BusinessChat {
    constructor() {
        this.currentUserId = null;
        this.users = [];
        this.messages = {};
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.GET_USER_PROFILE_URL = `${this.API_BASE_URL}/chat-hub/chat/user-profile`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        this.typingTimeout = null;
        this.typingPollInterval = null;
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
                } else {
                    this.handleTyping();
                }
            });
            
            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }
    }

    async loadUsers() {
        try {
            console.log('BusinessChat: Loading users from API:', this.GET_CONVERSATIONS_URL);
            const response = await fetch(this.GET_CONVERSATIONS_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('BusinessChat: Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('BusinessChat: Get conversations response:', data);
                
                if (data.success && data.data && data.data.users) {
                    this.users = data.data.users.map(user => ({
                        userId: user.userId,
                        userName: user.userName || 'User',
                        email: user.email || '',
                        lastMessage: user.lastMessage || '',
                        lastMessageTime: user.lastMessageTime || new Date().toISOString(),
                        unreadCount: user.unreadCount || 0
                    }));
                    console.log('BusinessChat: Processed users:', this.users.length);
                    this.renderUserList();
                    return;
                } else {
                    console.warn('BusinessChat: API returned success but no users found in response:', data);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('BusinessChat: API error response:', response.status, errorData);
            }
            
            this.users = [];
            this.renderUserList();
        } catch (error) {
            console.error('BusinessChat: Error loading users from API:', error);
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

            const emptyState = document.getElementById('chatEmptyState');
            const activeChat = document.getElementById('chatActive');
            const messagesContainer = document.getElementById('chatMessages');
            
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            if (activeChat) {
                activeChat.style.display = 'flex';
            }
            
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div style="text-align: center; color: #6c757d; padding: 2rem;">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
            }
            
            this.loadMessages(userId);
            this.startTypingPoll(userId);
            
            const messageInput = document.getElementById('chatMessageInput');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 100);
            }
        }
    }

    handleTyping() {
        if (!this.currentUserId) return;
        
        this.setTypingStatus(true);
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.setTypingStatus(false);
        }, 3000);
    }

    async setTypingStatus(isTyping) {
        if (!this.currentUserId) return;
        
        try {
            await fetch(this.SET_TYPING_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    isTyping: isTyping
                })
            });
        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    }

    startTypingPoll(userId) {
        if (this.typingPollInterval) {
            clearInterval(this.typingPollInterval);
        }
        
        this.typingPollInterval = setInterval(async () => {
            if (this.currentUserId === userId) {
                await this.checkTypingStatus(userId);
            } else {
                clearInterval(this.typingPollInterval);
            }
        }, 2000);
    }

    async checkTypingStatus(userId) {
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
                if (data.success && data.data && data.data.typing) {
                    this.showTypingIndicator(data.data.typing.isTyping);
                }
            }
        } catch (error) {
            console.error('Error checking typing status:', error);
        }
    }

    showTypingIndicator(isTyping) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        let typingIndicator = document.getElementById('typingIndicator');
        
        if (isTyping) {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.id = 'typingIndicator';
                typingIndicator.className = 'typing-indicator';
                typingIndicator.innerHTML = `
                    <div class="message-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
                messagesContainer.appendChild(typingIndicator);
            }
            typingIndicator.style.display = 'flex';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
        }
    }

    async loadMessages(userId) {
        if (!userId) return;
        
        try {
            console.log('BusinessChat: Loading messages for userId:', userId);
            const response = await fetch(`${this.GET_MESSAGES_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('BusinessChat: Get messages response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('BusinessChat: Get messages response data:', data);
                if (data.success && data.data) {
                    if (data.data.messages) {
                        this.messages[userId] = data.data.messages;
                        console.log('BusinessChat: Loaded', data.data.messages.length, 'messages');
                        this.renderMessages(userId);
                    }
                    
                    if (data.data.typing) {
                        this.showTypingIndicator(data.data.typing.isTyping);
                    }
                } else {
                    console.warn('BusinessChat: No messages in response');
                    this.renderMessages(userId, []);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('BusinessChat: Get messages error:', response.status, errorData);
                this.renderMessages(userId, []);
            }
        } catch (error) {
            console.error('BusinessChat: Error loading messages:', error);
            this.renderMessages(userId, []);
        }
    }

    renderMessages(userId, messages = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageList = messages !== null ? messages : (this.messages[userId] || []);
        
        if (messageList.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 2rem;">
                    <p>Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messageList.map(msg => {
            const isSent = msg.senderType === 'business';
            const messageTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            
            return `
                <div class="message-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="message-avatar">
                        <i class="fas ${isSent ? 'fa-store' : 'fa-user'}"></i>
                    </div>
                    <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                        <p class="message-content">${this.escapeHtml(msg.content || '')}</p>
                        <span class="message-time">${messageTime}</span>
                    </div>
                </div>
            `;
        }).join('');

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

        const requestBody = {
            userId: this.currentUserId,
            message: message
        };
        
        console.log('Business sending message:', requestBody);

        try {
            const response = await fetch(this.SEND_MESSAGE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Send message response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Send message error:', errorData);
                throw new Error(errorData.message || 'Failed to send message');
            }

            const data = await response.json();
            console.log('Send message response data:', data);

            if (data.success) {
                input.value = '';
                this.loadUsers();
                if (this.currentUserId) {
                    setTimeout(() => {
                        this.loadMessages(this.currentUserId);
                    }, 500);
                }
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert(error.message || 'Failed to send message. Please try again.');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
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

    showUserList() {
        const sidebar = document.getElementById('businessListSidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }
        const chatActive = document.getElementById('chatActive');
        if (chatActive) {
            chatActive.style.display = 'none';
        }
        const chatEmptyState = document.getElementById('chatEmptyState');
        if (chatEmptyState) {
            chatEmptyState.style.display = 'flex';
        }
        this.currentUserId = null;
    }

    async showUserInfoModal() {
        if (!this.currentUserId) return;
        
        const user = this.users.find(u => u.userId === this.currentUserId);
        if (!user) return;

        const modal = document.getElementById('businessInfoModal');
        if (!modal) return;

        const modalName = document.getElementById('modalBusinessName');
        const modalStatus = document.getElementById('modalBusinessStatus');
        const modalAvatar = document.getElementById('modalBusinessAvatar');

        if (modalName) {
            modalName.textContent = user.userName || 'User';
        }

        if (modalStatus) {
            modalStatus.textContent = 'Online';
        }

        if (modalAvatar) {
            modalAvatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    viewUserProfile() {
        if (!this.currentUserId) return;
        window.location.href = `regular_view_profile.html?userId=${encodeURIComponent(this.currentUserId)}`;
    }

    reportUser() {
        if (!this.currentUserId) return;
        alert('Report user functionality coming soon');
    }

    blockUser() {
        if (!this.currentUserId) return;
        alert('Block user functionality coming soon');
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

