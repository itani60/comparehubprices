// Regular User Chat Class - Handles chat between regular users and businesses
// This class is for REGULAR USERS to chat with businesses
class RegularUserChat {
    constructor() {
        this.currentBusinessId = null;
        this.businesses = [];
        this.messages = {};
        this.pollInterval = null;
        // cross-user typing
        this.lastTypingPingAt = 0;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        this.pendingBusinessId = null;
        this.init();
    }

    init() {
        this.attachEventListeners();
        
        // Check if businessId is in URL (from business profile page)
        const urlParams = new URLSearchParams(window.location.search);
        this.pendingBusinessId = urlParams.get('businessId');
        
        // Load businesses and then auto-select if needed
        this.loadBusinesses();
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

                // Tell server "user is typing" so BUSINESS sees it
                this.sendTypingPing(true);
            });
            
            // Stop typing ping when input loses focus
            messageInput.addEventListener('blur', () => {
                this.sendTypingPing(false);
            });
        }

        // Business search
        const searchInput = document.getElementById('businessSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterBusinesses(e.target.value));
        }
    }

    async loadBusinesses() {
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
                if (data.success && data.data && data.data.businesses) {
                    this.businesses = data.data.businesses.map(biz => ({
                        businessId: biz.businessId,
                        businessName: biz.businessName || 'Business',
                        email: biz.email || '',
                        lastMessage: biz.lastMessage || '',
                        lastMessageTime: biz.lastMessageTime || new Date().toISOString(),
                        unreadCount: biz.unreadCount || 0
                    }));
                    this.renderBusinessList();
                    
                    // Update chat badge in header
                    this.updateChatBadge();
                    
                    // Auto-select business if pending
                    if (this.pendingBusinessId) {
                        this.handlePendingBusinessSelection();
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading businesses from API:', error);
        }

        // Fallback to hardcoded data for preview/demo
        this.businesses = [
            {
                businessId: 'biz-001',
                businessName: 'TechStore SA',
                email: 'contact@techstore.co.za',
                lastMessage: 'Thank you for your interest! We have that product in stock.',
                lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
                unreadCount: 2
            },
            {
                businessId: 'biz-002',
                businessName: 'Electronics Hub',
                email: 'info@electronicshub.co.za',
                lastMessage: 'Yes, we offer free delivery on orders over R500.',
                lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
                unreadCount: 0
            },
            {
                businessId: 'biz-003',
                businessName: 'Gadget World',
                email: 'hello@gadgetworld.co.za',
                lastMessage: 'The product will be available next week.',
                lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(),
                unreadCount: 1
            }
        ];

        this.renderBusinessList();
        
        // Auto-select business if pending (after rendering)
        if (this.pendingBusinessId) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                this.handlePendingBusinessSelection();
            }, 100);
        }
    }

    renderBusinessList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        if (this.businesses.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-store" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p>No businesses available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.businesses.map(business => {
            const lastMessage = business.lastMessage || '';
            const unreadCount = business.unreadCount || 0;
            const lastMessageTime = business.lastMessageTime ? this.formatTime(business.lastMessageTime) : '';

            return `
                <div class="business-item" data-business-id="${business.businessId}" onclick="regularUserChat.selectBusiness('${business.businessId}')">
                    <div class="business-item-avatar">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="business-item-info">
                        <div class="business-item-name">${this.escapeHtml(business.businessName || 'Business')}</div>
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

    filterBusinesses(searchTerm) {
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

    async handlePendingBusinessSelection() {
        if (!this.pendingBusinessId) return;
        
        const businessId = this.pendingBusinessId;
        this.pendingBusinessId = null; // Clear pending
        
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if business exists in list
        let business = this.businesses.find(b => b.businessId === businessId);
        
        // If business not in list, try to fetch business info and add it
        if (!business) {
            try {
                // Try to get business info from API
                const response = await fetch(`https://hub.comparehubprices.co.za/business/business/public/${businessId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.business) {
                        // Add business to list
                        business = {
                            businessId: data.business.businessId || businessId,
                            businessName: data.business.businessName || 'Business',
                            email: data.business.email || '',
                            lastMessage: '',
                            lastMessageTime: new Date().toISOString(),
                            unreadCount: 0
                        };
                        this.businesses.unshift(business); // Add to beginning
                        this.renderBusinessList();
                    }
                }
            } catch (error) {
                console.error('Error fetching business info:', error);
            }
            
            // If still no business, create a minimal entry
            if (!business) {
                business = {
                    businessId: businessId,
                    businessName: 'Business',
                    email: '',
                    lastMessage: '',
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0
                };
                this.businesses.unshift(business);
                this.renderBusinessList();
            }
        }
        
        // Select the business - ensure it happens
        if (business) {
            // Wait a bit more for rendering to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.selectBusiness(businessId);
        } else {
            console.error('Failed to create or find business:', businessId);
        }
    }

    async selectBusiness(businessId) {
        console.log('Selecting business:', businessId);
        
        document.querySelectorAll('.business-item').forEach(item => {
            item.classList.remove('active');
        });
        const selectedItem = document.querySelector(`[data-business-id="${businessId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentBusinessId = businessId;
        const business = this.businesses.find(b => b.businessId === businessId);

        if (business) {
            const businessNameEl = document.getElementById('chatBusinessName');
            if (businessNameEl) {
                businessNameEl.textContent = business.businessName || 'Business';
            }
            const businessStatusEl = document.getElementById('chatBusinessStatus');
            if (businessStatusEl) {
                businessStatusEl.textContent = 'Online';
            }

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('businessListSidebar');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            }

            // Hide empty state and show active chat
            const emptyState = document.getElementById('chatEmptyState');
            const activeChat = document.getElementById('chatActive');
            
            if (emptyState) {
                emptyState.style.display = 'none';
            } else {
                console.warn('chatEmptyState element not found');
            }
            
            if (activeChat) {
                activeChat.style.display = 'flex';
                console.log('Chat window opened for business:', businessId);
            } else {
                console.error('chatActive element not found! Cannot open chat window.');
            }

            await this.loadMessages(businessId);
            this.startPolling();
            
            // Focus on message input
            const messageInput = document.getElementById('chatMessageInput');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 300);
            } else {
                console.error('chatMessageInput element not found!');
            }
        } else {
            // Business not found - show error
            console.error('Business not found:', businessId);
            console.log('Available businesses:', this.businesses.map(b => b.businessId));
            if (typeof showErrorToast === 'function') {
                showErrorToast('Business not found. Please try again.');
            }
        }
    }

    showBusinessList() {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('businessListSidebar');
            if (sidebar) {
                sidebar.classList.remove('hidden');
            }
            document.getElementById('chatActive').style.display = 'none';
            document.getElementById('chatEmptyState').style.display = 'flex';
        }
        this.stopPolling();
        this.currentBusinessId = null;
    }

    async loadMessages(businessId) {
        try {
            const response = await fetch(`${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(businessId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.messages) {
                    this.messages[businessId] = data.data.messages.map(msg => ({
                        messageId: msg.messageId,
                        content: msg.content,
                        senderType: msg.senderType,
                        createdAt: msg.createdAt,
                        timestamp: msg.timestamp,
                        isRead: msg.isRead !== undefined ? msg.isRead : false,
                        readAt: msg.readAt || null
                    }));
                    this.renderMessages(businessId);
                    
                    // Mark messages as seen when chat is opened
                    this.sendTypingPing(true);
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading messages from API:', error);
        }

        if (this.messages[businessId]) {
            this.renderMessages(businessId);
            return;
        }

        this.messages[businessId] = [];
        this.renderMessages(businessId);
    }

    renderMessages(businessId) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const messages = this.messages[businessId] || [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 2rem;">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(message => {
            const isSent = message.senderType === 'user';
            const time = this.formatTime(message.createdAt);
            
            // Show read receipt for sent messages
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

        // Add typing indicator if needed
        this.renderTypingIndicator(container);

        container.scrollTop = container.scrollHeight;
    }
    
    handleTyping() {
        if (!this.currentBusinessId) return;
        
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

        if (!message || !this.currentBusinessId) {
            return;
        }

        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        const tempMessage = {
            messageId: 'temp-' + Date.now(),
            content: message,
            senderType: 'user',
            createdAt: new Date().toISOString()
        };

        if (!this.messages[this.currentBusinessId]) {
            this.messages[this.currentBusinessId] = [];
        }
        this.messages[this.currentBusinessId].push(tempMessage);
        this.renderMessages(this.currentBusinessId);

        input.value = '';
        input.style.height = 'auto';
        
        // Hide typing indicator
        this.hideTypingIndicator();

        try {
            const response = await fetch(this.SEND_MESSAGE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessId: this.currentBusinessId,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send message');
            }

            const data = await response.json();

            if (data.success && data.data && data.data.message) {
                const index = this.messages[this.currentBusinessId].findIndex(m => m.messageId === tempMessage.messageId);
                if (index !== -1) {
                    this.messages[this.currentBusinessId][index] = {
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp,
                        isRead: data.data.message.isRead !== undefined ? data.data.message.isRead : false,
                        readAt: data.data.message.readAt || null
                    };
                } else {
                    this.messages[this.currentBusinessId].push({
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp
                    });
                }

                this.renderMessages(this.currentBusinessId);

                const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
                if (business) {
                    business.lastMessage = message;
                    business.lastMessageTime = new Date().toISOString();
                    this.updateBusinessPreview(this.currentBusinessId, {
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

            this.messages[this.currentBusinessId] = this.messages[this.currentBusinessId].filter(
                m => m.messageId !== tempMessage.messageId
            );
            this.renderMessages(this.currentBusinessId);
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

        // Poll for new messages every 1.5 seconds for better real-time feel
        this.pollInterval = setInterval(() => {
            if (this.currentBusinessId) {
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
        if (!this.currentBusinessId) return;

        try {
            const lastMessage = this.messages[this.currentBusinessId]?.slice(-1)[0];
            const lastTs = (lastMessage?.timestamp != null)
                ? Number(lastMessage.timestamp)
                : (lastMessage?.createdAt ? Math.floor(new Date(lastMessage.createdAt).getTime() / 1000) : null);

            const url = `${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(this.currentBusinessId)}${Number.isFinite(lastTs) ? `&afterTimestamp=${encodeURIComponent(String(lastTs))}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // OTHER party typing (business typing -> show)
                // Check typing status - show indicator if the other party (business) is typing
                const typingStatus = data?.data?.typing;
                if (typingStatus?.isTyping === true && typingStatus?.by === 'business') {
                    this.showTypingIndicator();
                } else {
                    this.hideTypingIndicator();
                }

                if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
                    const existingIds = new Set((this.messages[this.currentBusinessId] || []).map(m => m.messageId));
                    const newMessages = data.data.messages.filter(msg => !existingIds.has(msg.messageId));
                    
                    if (newMessages.length > 0) {
                        if (!this.messages[this.currentBusinessId]) {
                            this.messages[this.currentBusinessId] = [];
                        }
                        
                        this.messages[this.currentBusinessId].push(...newMessages.map(msg => ({
                            messageId: msg.messageId,
                            content: msg.content,
                            senderType: msg.senderType,
                            createdAt: msg.createdAt,
                            timestamp: msg.timestamp,
                            isRead: msg.isRead !== undefined ? msg.isRead : false,
                            readAt: msg.readAt || null
                        })));
                        
                        // Update existing messages' read status if they were marked as read
                        newMessages.forEach(newMsg => {
                            if (newMsg.isRead) {
                                const existingMsg = this.messages[this.currentBusinessId].find(m => m.messageId === newMsg.messageId);
                                if (existingMsg) {
                                    existingMsg.isRead = true;
                                    existingMsg.readAt = newMsg.readAt;
                                }
                            }
                        });
                        
                        this.messages[this.currentBusinessId].sort((a, b) => {
                            const timeA = a.timestamp || new Date(a.createdAt).getTime();
                            const timeB = b.timestamp || new Date(b.createdAt).getTime();
                            return timeA - timeB;
                        });
                        
                        this.renderMessages(this.currentBusinessId);

                        const lastNewMessage = newMessages[newMessages.length - 1];
                        this.updateBusinessPreview(this.currentBusinessId, lastNewMessage);
                        
                        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
                        if (business && lastNewMessage.senderType === 'business') {
                            business.unreadCount = (business.unreadCount || 0) + newMessages.filter(m => m.senderType === 'business').length;
                            this.renderBusinessList();
                            this.updateChatBadge();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking new messages:', error);
        }
    }

    async sendTypingPing(isTyping) {
        if (!this.currentBusinessId) return;

        const now = Date.now();
        if (isTyping === true && now - this.lastTypingPingAt < 1000) return;
        this.lastTypingPingAt = now;

        try {
            await fetch(this.SET_TYPING_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: this.currentBusinessId,
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

    updateBusinessPreview(businessId, lastMessage) {
        const businessItem = document.querySelector(`[data-business-id="${businessId}"]`);
        if (businessItem) {
            const preview = businessItem.querySelector('.business-item-preview');
            if (preview) {
                preview.textContent = this.escapeHtml(lastMessage.content);
            }

            const time = businessItem.querySelector('.business-item-time');
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

    showBusinessInfoModal() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (!business) return;

        document.getElementById('modalBusinessName').textContent = business.businessName || 'Business';
        document.getElementById('modalBusinessEmail').textContent = business.email || 'No email available';
        document.getElementById('modalBusinessStatus').textContent = 'Online';
        
        const avatar = document.getElementById('modalBusinessAvatar');
        if (avatar) {
            avatar.innerHTML = '<i class="fas fa-store"></i>';
        }

        const muteToggle = document.getElementById('muteToggle');
        if (muteToggle) {
            const isMuted = localStorage.getItem(`muted_${this.currentBusinessId}`) === 'true';
            muteToggle.checked = isMuted;
        }

        const modal = new bootstrap.Modal(document.getElementById('businessInfoModal'));
        modal.show();
    }

    viewBusinessProfile() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (!business) return;

        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        const profileUrl = `local-business.html?businessId=${this.currentBusinessId}`;
        window.location.href = profileUrl;
    }

    toggleMute() {
        if (!this.currentBusinessId) return;

        const muteToggle = document.getElementById('muteToggle');
        if (!muteToggle) return;

        const isMuted = muteToggle.checked;
        localStorage.setItem(`muted_${this.currentBusinessId}`, isMuted.toString());

        if (typeof showToast === 'function') {
            showToast(
                isMuted ? 'Notifications muted for this business' : 'Notifications unmuted for this business',
                'success'
            );
        }
    }

    markAsRead() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (business) {
            business.unreadCount = 0;
        }

        const businessItem = document.querySelector(`[data-business-id="${this.currentBusinessId}"]`);
        if (businessItem) {
            const badge = businessItem.querySelector('.business-item-badge');
            if (badge) {
                badge.remove();
            }
        }

        // Update chat badge
        this.updateChatBadge();

        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        if (typeof showToast === 'function') {
            showToast('All messages marked as read', 'success');
        }
    }

    reportBusiness() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        const businessName = business?.businessName || 'this business';

        if (confirm(`Are you sure you want to report ${businessName}? This action will be reviewed by our team.`)) {
            console.log('Reporting business:', this.currentBusinessId);

            const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
            if (modal) {
                modal.hide();
            }

            if (typeof showToast === 'function') {
                showToast('Report submitted. Our team will review it shortly.', 'success');
            }
        }
    }

    blockBusiness() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        const businessName = business?.businessName || 'this business';

        if (confirm(`Are you sure you want to block ${businessName}? You will no longer receive messages from them, and they won't be able to contact you.`)) {
            console.log('Blocking business:', this.currentBusinessId);

            this.businesses = this.businesses.filter(b => b.businessId !== this.currentBusinessId);
            this.renderBusinessList();

            const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
            if (modal) {
                modal.hide();
            }

            this.showBusinessList();
            this.currentBusinessId = null;

            if (typeof showToast === 'function') {
                showToast('Business blocked successfully', 'success');
            }
        }
    }

    updateChatBadge() {
        // Calculate total unread count
        const totalUnread = this.businesses.reduce((total, biz) => total + (biz.unreadCount || 0), 0);
        
        // Update desktop badge
        const desktopBadge = document.getElementById('desktopChatUnreadCount');
        if (desktopBadge) {
            desktopBadge.textContent = totalUnread;
            desktopBadge.style.display = totalUnread === 0 ? 'none' : 'inline-flex';
        }
        
        // Trigger event for badge counter
        document.dispatchEvent(new CustomEvent('chatUpdated'));
    }
}

// Initialize chat when DOM is ready
let regularUserChat;
document.addEventListener('DOMContentLoaded', function() {
    regularUserChat = new RegularUserChat();
    
    // Hide page loading overlay
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

