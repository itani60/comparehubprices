// Regular User Chat Class - Handles chat between regular users and businesses
// This class is for REGULAR USERS to chat with businesses
class BusinessChat {
    constructor() {
        this.currentBusinessId = null;
        this.businesses = [];
        this.messages = {};
        this.pollInterval = null;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.init();
    }

    init() {
        this.attachEventListeners();
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
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }

        // Business search
        const searchInput = document.getElementById('businessSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterBusinesses(e.target.value));
        }
    }

    async loadBusinesses() {
        // Hardcoded data for preview
        this.businesses = [
            {
                businessId: 'biz-001',
                businessName: 'TechStore SA',
                email: 'contact@techstore.co.za',
                lastMessage: 'Thank you for your interest! We have that product in stock.',
                lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
                unreadCount: 2
            },
            {
                businessId: 'biz-002',
                businessName: 'Electronics Hub',
                email: 'info@electronicshub.co.za',
                lastMessage: 'Yes, we offer free delivery on orders over R500.',
                lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
                unreadCount: 0
            },
            {
                businessId: 'biz-003',
                businessName: 'Gadget World',
                email: 'hello@gadgetworld.co.za',
                lastMessage: 'The product will be available next week.',
                lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
                unreadCount: 1
            },
            {
                businessId: 'biz-004',
                businessName: 'Smart Devices Co',
                email: 'support@smartdevices.co.za',
                lastMessage: 'We can arrange a demo for you.',
                lastMessageTime: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), // 3 days ago
                unreadCount: 0
            },
            {
                businessId: 'biz-005',
                businessName: 'Digital Solutions',
                email: 'contact@digitalsolutions.co.za',
                lastMessage: 'Our warranty covers 12 months.',
                lastMessageTime: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), // 1 week ago
                unreadCount: 0
            }
        ];

        // Initialize hardcoded messages
        this.messages = {
            'biz-001': [
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
            'biz-002': [
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
            'biz-003': [
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
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading businesses from API:', error);
        }

        // Fallback to hardcoded data for preview/demo
        this.renderBusinessList();
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
                <div class="business-item" data-business-id="${business.businessId}" onclick="businessChat.selectBusiness('${business.businessId}')">
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

    renderEmptyBusinessList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <p>Unable to load businesses</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="businessChat.loadBusinesses()">Retry</button>
            </div>
        `;
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

    async selectBusiness(businessId) {
        // Update active state
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
            // Update chat header
            document.getElementById('chatBusinessName').textContent = business.businessName || 'Business';
            document.getElementById('chatBusinessStatus').textContent = 'Online';

            // Hide business list on mobile
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
            await this.loadMessages(businessId);

            // Start polling for new messages
            this.startPolling();
        }
    }

    showBusinessList() {
        // Show business list on mobile
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
        this.currentBusinessId = null;
    }

    async loadMessages(businessId) {
        // Try to load from API first
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
                        timestamp: msg.timestamp
                    }));
                    this.renderMessages(businessId);
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading messages from API:', error);
        }

        // Fallback to hardcoded messages if available
        if (this.messages[businessId]) {
            this.renderMessages(businessId);
            return;
        }

        // If no messages, initialize empty array
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

            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <div>${this.escapeHtml(message.content)}</div>
                    <div class="chat-message-time">${time}</div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        const message = input?.value.trim();

        if (!message || !this.currentBusinessId) {
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
            senderType: 'user',
            createdAt: new Date().toISOString()
        };

        if (!this.messages[this.currentBusinessId]) {
            this.messages[this.currentBusinessId] = [];
        }
        this.messages[this.currentBusinessId].push(tempMessage);
        this.renderMessages(this.currentBusinessId);

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Send to API
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
                // Replace temp message with real one
                const index = this.messages[this.currentBusinessId].findIndex(m => m.messageId === tempMessage.messageId);
                if (index !== -1) {
                    this.messages[this.currentBusinessId][index] = {
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp
                    };
                } else {
                    // If temp message not found, add the real one
                    this.messages[this.currentBusinessId].push({
                        messageId: data.data.message.messageId,
                        content: data.data.message.content,
                        senderType: data.data.message.senderType,
                        createdAt: data.data.message.createdAt,
                        timestamp: data.data.message.timestamp
                    });
                }

                this.renderMessages(this.currentBusinessId);

                // Update business list with new message
                const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
                if (business) {
                    business.lastMessage = message;
                    business.lastMessageTime = new Date().toISOString();
                    this.updateBusinessPreview(this.currentBusinessId, {
                        content: message,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError(error.message || 'Failed to send message. Please try again.');

            // Remove temp message on error
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
        // Clear existing interval
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        // Poll for new messages every 3 seconds
        this.pollInterval = setInterval(() => {
            if (this.currentBusinessId) {
                this.checkNewMessages();
            }
        }, 3000);
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
            const lastMessageId = lastMessage?.messageId;

            const url = `${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(this.currentBusinessId)}${lastMessageId ? `&lastMessageId=${encodeURIComponent(lastMessageId)}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
                    // Get existing message IDs to avoid duplicates
                    const existingIds = new Set((this.messages[this.currentBusinessId] || []).map(m => m.messageId));
                    
                    // Filter out messages we already have
                    const newMessages = data.data.messages.filter(msg => !existingIds.has(msg.messageId));
                    
                    if (newMessages.length > 0) {
                        // Add new messages
                        if (!this.messages[this.currentBusinessId]) {
                            this.messages[this.currentBusinessId] = [];
                        }
                        
                        // Add new messages and sort by timestamp
                        this.messages[this.currentBusinessId].push(...newMessages.map(msg => ({
                            messageId: msg.messageId,
                            content: msg.content,
                            senderType: msg.senderType,
                            createdAt: msg.createdAt,
                            timestamp: msg.timestamp
                        })));
                        
                        // Sort by timestamp
                        this.messages[this.currentBusinessId].sort((a, b) => {
                            const timeA = a.timestamp || new Date(a.createdAt).getTime();
                            const timeB = b.timestamp || new Date(b.createdAt).getTime();
                            return timeA - timeB;
                        });
                        
                        this.renderMessages(this.currentBusinessId);

                        // Update business list with new message preview
                        const lastNewMessage = newMessages[newMessages.length - 1];
                        this.updateBusinessPreview(this.currentBusinessId, lastNewMessage);
                        
                        // Update unread count
                        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
                        if (business && lastNewMessage.senderType === 'business') {
                            business.unreadCount = (business.unreadCount || 0) + newMessages.filter(m => m.senderType === 'business').length;
                            this.renderBusinessList();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking new messages:', error);
        }
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

        // Update modal content
        document.getElementById('modalBusinessName').textContent = business.businessName || 'Business';
        document.getElementById('modalBusinessEmail').textContent = business.email || 'No email available';
        document.getElementById('modalBusinessStatus').textContent = 'Online';
        
        // Update avatar
        const avatar = document.getElementById('modalBusinessAvatar');
        if (avatar) {
            avatar.innerHTML = '<i class="fas fa-store"></i>';
        }

        // Check mute status
        const muteToggle = document.getElementById('muteToggle');
        if (muteToggle) {
            const isMuted = localStorage.getItem(`muted_${this.currentBusinessId}`) === 'true';
            muteToggle.checked = isMuted;
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('businessInfoModal'));
        modal.show();
    }

    viewBusinessProfile() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (!business) return;

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
        if (modal) {
            modal.hide();
        }

        // Navigate to business profile page
        // TODO: Update with actual business profile URL when available
        const profileUrl = `local-business.html?businessId=${this.currentBusinessId}`;
        window.location.href = profileUrl;
        
        // Alternative: Open in new tab
        // window.open(profileUrl, '_blank');
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

        // Update business unread count
        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (business) {
            business.unreadCount = 0;
        }

        // Update UI
        const businessItem = document.querySelector(`[data-business-id="${this.currentBusinessId}"]`);
        if (businessItem) {
            const badge = businessItem.querySelector('.business-item-badge');
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

    reportBusiness() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        const businessName = business?.businessName || 'this business';

        if (confirm(`Are you sure you want to report ${businessName}? This action will be reviewed by our team.`)) {
            // TODO: Implement report API call
            console.log('Reporting business:', this.currentBusinessId);

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

    blockBusiness() {
        if (!this.currentBusinessId) return;

        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        const businessName = business?.businessName || 'this business';

        if (confirm(`Are you sure you want to block ${businessName}? You will no longer receive messages from them, and they won't be able to contact you.`)) {
            // TODO: Implement block API call
            console.log('Blocking business:', this.currentBusinessId);

            // Remove from businesses list
            this.businesses = this.businesses.filter(b => b.businessId !== this.currentBusinessId);
            this.renderBusinessList();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('businessInfoModal'));
            if (modal) {
                modal.hide();
            }

            // Show empty state
            this.showBusinessList();
            this.currentBusinessId = null;

            if (typeof showToast === 'function') {
                showToast('Business blocked successfully', 'success');
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

