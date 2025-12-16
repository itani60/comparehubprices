// Business Chat Class - Handles chat between business users and regular users
// This class is for BUSINESS USERS to chat with regular users
class BusinessChat {
    constructor() {
        this.currentUserId = null;
        this.users = [];
        this.messages = {};
        this.pollInterval = null;
        // cross-user typing
        this.lastTypingPingAt = 0;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadUsers();
    }

    attachEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input - Enter key to send
        const messageInput = document.getElementById('chatMessageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            messageInput.addEventListener('input', (e) => {
                const input = e.target;
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';

                // Tell server "business is typing" so USER sees it
                this.sendTypingPing(true);
            });
            
            // Stop typing ping when input loses focus
            messageInput.addEventListener('blur', () => {
                this.sendTypingPing(false);
            });
        }

        // User search
        const searchInput = document.getElementById('businessSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }
    }

    async loadUsers() {
        // Hardcoded data for preview
        this.users = [
            {
                userId: 'user-001',
                userName: 'John Doe',
                email: 'john@example.com',
                lastMessage: 'Hello! I\'m interested in the iPhone 15 Pro.',
                lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
                unreadCount: 2
            },
            {
                userId: 'user-002',
                userName: 'Jane Smith',
                email: 'jane@example.com',
                lastMessage: 'Do you offer delivery?',
                lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
                unreadCount: 0
            },
            {
                userId: 'user-003',
                userName: 'Mike Johnson',
                email: 'mike@example.com',
                lastMessage: 'When will the Samsung Galaxy S24 be available?',
                lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
                unreadCount: 1
            }
        ];

        // Initialize hardcoded messages
        this.messages = {
            'user-001': [
                {
                    messageId: 'msg-001',
                    content: 'Hello! I\'m interested in the iPhone 15 Pro. Do you have it in stock?',
                    senderType: 'user',
                    createdAt: new Date(Date.now() - 30 * 60000).toISOString()
                },
                {
                    messageId: 'msg-002',
                    content: 'Hello! Yes, we have the iPhone 15 Pro in stock. Which color are you interested in?',
                    senderType: 'business',
                    createdAt: new Date(Date.now() - 25 * 60000).toISOString()
                },
                {
                    messageId: 'msg-003',
                    content: 'I\'m looking for the Natural Titanium version.',
                    senderType: 'user',
                    createdAt: new Date(Date.now() - 20 * 60000).toISOString()
                },
                {
                    messageId: 'msg-004',
                    content: 'Perfect! We have that in stock. The price is R24,999. Would you like to proceed?',
                    senderType: 'business',
                    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
                },
                {
                    messageId: 'msg-005',
                    content: 'Yes, please! Can you hold it for me?',
                    senderType: 'user',
                    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
                },
                {
                    messageId: 'msg-006',
                    content: 'Thank you for your interest! We have that product in stock.',
                    senderType: 'business',
                    createdAt: new Date(Date.now() - 5 * 60000).toISOString()
                }
            ],
            'user-002': [
                {
                    messageId: 'msg-007',
                    content: 'Hi, do you offer delivery?',
                    senderType: 'user',
                    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
                },
                {
                    messageId: 'msg-008',
                    content: 'Yes, we offer free delivery on orders over R500.',
                    senderType: 'business',
                    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
                }
            ],
            'user-003': [
                {
                    messageId: 'msg-009',
                    content: 'When will the Samsung Galaxy S24 be available?',
                    senderType: 'user',
                    createdAt: new Date(Date.now() - 25 * 3600000).toISOString()
                },
                {
                    messageId: 'msg-010',
                    content: 'The product will be available next week.',
                    senderType: 'business',
                    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
                }
            ]
        };

        // Try to load from API first, fallback to hardcoded data
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
        } catch (error) {
            console.error('Error loading users from API:', error);
        }

        // Fallback to hardcoded data for preview/demo
        this.renderUserList();
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

    renderEmptyUserList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <p>Unable to load users</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="businessChat.loadUsers()">Retry</button>
            </div>
        `;
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
        // Update active state
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
            // Update chat header
            document.getElementById('chatBusinessName').textContent = user.userName || 'User';
            document.getElementById('chatBusinessStatus').textContent = 'Online';

            // Hide user list on mobile
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('businessListSidebar');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            }

            // Show chat window
            document.getElementById('chatEmptyState').style.display = 'none';
            document.getElementById('chatActive').style.display = 'flex';

            // Load messages
            await this.loadMessages(userId);

            // Start polling for new messages
            this.startPolling();
        }
    }

    showUserList() {
        // Show user list on mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('businessListSidebar');
            if (sidebar) {
                sidebar.classList.remove('hidden');
            }
            
            // Hide chat active view
            document.getElementById('chatActive').style.display = 'none';
            document.getElementById('chatEmptyState').style.display = 'flex';
        }
        
        // Stop polling when not viewing a chat
        this.stopPolling();
        this.currentUserId = null;
    }

    async loadMessages(userId) {
        // Try to load from API first
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
                        timestamp: msg.timestamp
                    }));
                    this.renderMessages(userId);
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading messages from API:', error);
        }

        // Fallback to hardcoded messages if available
        if (this.messages[userId]) {
            this.renderMessages(userId);
            return;
        }

        // If no messages, initialize empty array
        this.messages[userId] = [];
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
            // For business users: business messages are "sent", user messages are "received"
            const isSent = message.senderType === 'business';
            const time = this.formatTime(message.createdAt);

            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <div>${this.escapeHtml(message.content)}</div>
                    <div class="chat-message-time">${time}</div>
                </div>
            `;
        }).join('');

        // Add typing indicator if needed
        this.renderTypingIndicator(container);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
    
    handleTyping() {
        if (!this.currentUserId) return;
        
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Show typing indicator
        if (!this.isTyping) {
            this.isTyping = true;
            this.showTypingIndicator();
        }
        
        // Hide typing indicator after 3 seconds of no typing
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, 3000);
    }
    
    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        // Remove existing typing indicator
        const existing = container.querySelector('.typing-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator received';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    renderTypingIndicator(container) {
        // This is called from renderMessages, but typing indicator is managed separately
        // We don't add it here to avoid duplicates
    }

    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        const message = input?.value.trim();

        if (!message || !this.currentUserId) {
            return;
        }

        // Disable send button
        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        // Add message optimistically
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

        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Hide typing indicator
        this.hideTypingIndicator();

        // Send to API
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
                // Replace temp message with real one
                const index = this.messages[this.currentUserId].findIndex(m => m.messageId === tempMessage.messageId);
                if (index !== -1) {
                    this.messages[this.currentUserId][index] = {
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp
                    };
                } else {
                    // If temp message not found, add the real one
                    this.messages[this.currentUserId].push({
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp
                    });
                }

                this.renderMessages(this.currentUserId);

                // Update user list with new message
                const user = this.users.find(u => u.userId === this.currentUserId);
                if (user) {
                    user.lastMessage = message;
                    user.lastMessageTime = new Date().toISOString();
                    this.updateUserPreview(this.currentUserId, {
                        content: message,
                        createdAt: new Date().toISOString()
                    });
                }
                
                // Immediately check for new messages (in case other party responded quickly)
                setTimeout(() => {
                    this.checkNewMessages();
                }, 500);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError(error.message || 'Failed to send message. Please try again.');

            // Remove temp message on error
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
        // Clear existing interval
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        // Poll for new messages every 1.5 seconds for better real-time feel
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

                // OTHER party typing (user typing -> show)
                // Check typing status - show indicator if the other party (user) is typing
                const typingStatus = data?.data?.typing;
                if (typingStatus?.isTyping === true && typingStatus?.by === 'user') {
                    this.showTypingIndicator();
                } else {
                    this.hideTypingIndicator();
                }

                if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
                    // Get existing message IDs to avoid duplicates
                    const existingIds = new Set((this.messages[this.currentUserId] || []).map(m => m.messageId));
                    
                    // Filter out messages we already have
                    const newMessages = data.data.messages.filter(msg => !existingIds.has(msg.messageId));
                    
                    if (newMessages.length > 0) {
                        // Add new messages
                        if (!this.messages[this.currentUserId]) {
                            this.messages[this.currentUserId] = [];
                        }
                        
                        // Add new messages and sort by timestamp
                        this.messages[this.currentUserId].push(...newMessages.map(msg => ({
                            messageId: msg.messageId,
                            content: msg.content,
                            senderType: msg.senderType,
                            createdAt: msg.createdAt,
                            timestamp: msg.timestamp
                        })));
                        
                        // Sort by timestamp
                        this.messages[this.currentUserId].sort((a, b) => {
                            const timeA = a.timestamp || new Date(a.createdAt).getTime();
                            const timeB = b.timestamp || new Date(b.createdAt).getTime();
                            return timeA - timeB;
                        });
                        
                        this.renderMessages(this.currentUserId);

                        // Update user list with new message preview
                        const lastNewMessage = newMessages[newMessages.length - 1];
                        this.updateUserPreview(this.currentUserId, lastNewMessage);
                        
                        // Update unread count (for business users, unread = messages from users)
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
            // non-blocking
        }
    }

    // UI-only: typing indicator is for the OTHER party, not local typing.
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

        // Update modal content
        document.getElementById('modalBusinessName').textContent = user.userName || 'User';
        document.getElementById('modalBusinessEmail').textContent = user.email || 'No email available';
        document.getElementById('modalBusinessStatus').textContent = 'Online';
        
        // Update avatar
        const avatar = document.getElementById('modalBusinessAvatar');
        if (avatar) {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        // Check mute status
        const muteToggle = document.getElementById('muteToggle');
        if (muteToggle) {
            const isMuted = localStorage.getItem(`muted_${this.currentUserId}`) === 'true';
            muteToggle.checked = isMuted;
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('businessInfoModal'));
        modal.show();
    }

    viewUserProfile() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        if (!user) return;

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        // Navigate to user profile page (if available)
        // TODO: Update with actual user profile URL when available
        console.log('Viewing user profile:', this.currentUserId);
        
        if (typeof showToast === 'function') {
            showToast('User profile view not yet implemented', 'info');
        }
    }

    toggleMute() {
        if (!this.currentUserId) return;

        const muteToggle = document.getElementById('muteToggle');
        if (!muteToggle) return;

        const isMuted = muteToggle.checked;
        localStorage.setItem(`muted_${this.currentUserId}`, isMuted.toString());

        if (typeof showToast === 'function') {
            showToast(
                isMuted ? 'Notifications muted for this user' : 'Notifications unmuted for this user',
                'success'
            );
        }
    }

    markAsRead() {
        if (!this.currentUserId) return;

        // Update user unread count
        const user = this.users.find(u => u.userId === this.currentUserId);
        if (user) {
            user.unreadCount = 0;
        }

        // Update UI
        const userItem = document.querySelector(`[data-user-id="${this.currentUserId}"]`);
        if (userItem) {
            const badge = userItem.querySelector('.business-item-badge');
            if (badge) {
                badge.remove();
            }
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        if (typeof showToast === 'function') {
            showToast('All messages marked as read', 'success');
        }
    }

    reportUser() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        const userName = user?.userName || 'this user';

        if (confirm(`Are you sure you want to report ${userName}? This action will be reviewed by our team.`)) {
            // TODO: Implement report API call
            console.log('Reporting user:', this.currentUserId);

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
            if (modal) {
                modal.hide();
            }

            if (typeof showToast === 'function') {
                showToast('Report submitted. Our team will review it shortly.', 'success');
            }
        }
    }

    blockUser() {
        if (!this.currentUserId) return;

        const user = this.users.find(u => u.userId === this.currentUserId);
        const userName = user?.userName || 'this user';

        if (confirm(`Are you sure you want to block ${userName}? You will no longer receive messages from them, and they won't be able to contact you.`)) {
            // TODO: Implement block API call
            console.log('Blocking user:', this.currentUserId);

            // Remove from users list
            this.users = this.users.filter(u => u.userId !== this.currentUserId);
            this.renderUserList();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
            if (modal) {
                modal.hide();
            }

            // Show empty state
            this.showUserList();
            this.currentUserId = null;

            if (typeof showToast === 'function') {
                showToast('User blocked successfully', 'success');
            }
        }
    }
}

// Initialize chat when DOM is ready
let businessChat;
document.addEventListener('DOMContentLoaded', function() {
    businessChat = new BusinessChat();
    
    // Hide page loading overlay
    const loadingOverlay = document.getElementById('pageLoadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            // Remove from DOM after animation
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }, 500);
    }
});

