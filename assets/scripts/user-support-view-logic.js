/* User Support View Logic */
const API_URL = 'https://hub.comparehubprices.co.za/admin/support-management';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('id');

    if (!ticketId) {
        setText('ticket-subject', 'Ticket Not Found');
        setText('ticket-ref', '--');
        const container = document.getElementById('messages-list');
        if (container) container.innerHTML = '<div class="p-3 text-center text-muted">No ticket ID provided.</div>';
        return;
    }

    // Auth Check
    // Auth: Cookies handled automatically via credentials: 'include'

    // Load Details
    await loadTicketDetails(ticketId);

    // Setup Reply
    const sendBtn = document.getElementById('send-reply-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => sendReply(ticketId));
    }
});

async function loadTicketDetails(id) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getTicketDetails', ticketId: id })
        });

        const data = await response.json();
        const ticket = data.ticket;

        if (response.ok && ticket && ticket.TicketID) {
            // Update Header
            setText('ticket-subject', ticket.Subject);
            setText('ticket-ref', '#' + ticket.TicketID);
            setText('ticket-category-badge', ticket.Category);
            setText('ticket-status-badge', ticket.Status);

            // Format Status Badge
            const statusBadge = document.getElementById('ticket-status-badge');
            if (statusBadge) {
                statusBadge.className = 'badge border ';
                if (ticket.Status === 'Resolved') statusBadge.classList.add('bg-success', 'text-white');
                else if (ticket.Status === 'Pending') statusBadge.classList.add('bg-warning', 'text-dark');
                else statusBadge.classList.add('bg-primary', 'bg-opacity-10', 'text-primary');
                statusBadge.innerText = ticket.Status;
            }

            // Render Messages
            // Support both 'Messages' (new schema) and legacy 'History' if any
            const messages = ticket.Messages || ticket.History || [];
            renderMessages(messages);
        } else {
            const container = document.getElementById('messages-list');
            if (container) container.innerHTML = `<div class="p-3 text-center text-danger">Ticket not found or access denied. Error: ${data.error || 'Unknown'}</div>`;
        }
    } catch (e) {
        console.error(e);
        const container = document.getElementById('messages-list');
        if (container) container.innerHTML = '<div class="p-3 text-center text-danger">Network error connecting to support service.</div>';
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages-list');
    if (!container) return;
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">No messages yet.</div>';
        return;
    }

    // Sort by Timestamp
    messages.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));

    messages.forEach(item => {
        if (item.Type === 'System') return;

        // Determine if message is from Customer (Me) or Admin (Support)
        // Check Role first, then Sender fallback
        const role = item.Role || 'User';
        const isMe = (role === 'User' || role === 'Business' || item.Sender === 'Customer');

        const msgDiv = document.createElement('div');
        msgDiv.className = 'd1-message';

        const avatar = isMe ? 'ME' : '<i class="fas fa-headset"></i>';
        const avatarClass = isMe ? 'd1-avatar' : 'd1-avatar bg-primary text-white';
        const nameText = isMe ? 'Me' : 'Support Team';
        const metaText = isMe ? 'Customer' : 'Admin';

        // Attachments
        let attachmentsHtml = '';
        if (item.Attachments && item.Attachments.length > 0) {
            attachmentsHtml = '<div class="mt-2 d-flex flex-wrap gap-2">';
            item.Attachments.forEach(att => {
                const fileName = att.split('/').pop();
                const url = att.startsWith('http') ? att : `https://${att}`; // Simple fix, ideally use stored full URL or construct with bucket
                // Assuming att is key or URL. If key, we need bucket URL. Backend seems to store Key? 
                // index.js getUploadUrl returns fileUrl: `https://${CONFIG.S3_BUCKET}/${key}`
                // Let's assume the frontend sends/receives usable URLs or we prepend bucket. 
                // For now, if it looks like a relative path, we might need a base.
                // But let's trust it's a renderable string for now or just a link.

                attachmentsHtml += `<a href="${att}" target="_blank" class="badge bg-light text-dark border text-decoration-none"><i class="fas fa-paperclip me-1"></i>${fileName}</a>`;
            });
            attachmentsHtml += '</div>';
        }

        if (!isMe) {
            msgDiv.style.borderLeft = '4px solid var(--primary)';
        }

        msgDiv.innerHTML = `
            <div class="d-flex gap-3">
                <div class="${avatarClass}">${avatar}</div>
                <div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="fw-bold ${!isMe ? 'text-primary' : ''}">${nameText}</span>
                        <span class="d1-meta">${metaText} • ${new Date(item.Timestamp).toLocaleString()}</span>
                    </div>
                    <p class="mb-0 text-dark" style="white-space: pre-wrap;">${item.Message}</p>
                    ${attachmentsHtml}
                </div>
            </div>
        `;
        container.appendChild(msgDiv);
    });

    // Scroll to bottom?
    // container.scrollTop = container.scrollHeight;
}

async function sendReply(id) {
    const input = document.getElementById('reply-input');
    const msg = input.value.trim();
    if (!msg) return;

    const btn = document.getElementById('send-reply-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Sending...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'addReply',
                ticketId: id,
                message: msg,
                author: 'Customer' // Backend will override/verify if needed, but 'Customer' maps to User/Business Role logic.
            })
        });

        const res = await response.json();
        if (response.ok && res.success) {
            input.value = '';
            // Reload details to show new message
            setTimeout(() => loadTicketDetails(id), 500);
        } else {
            alert('Failed to send reply: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Error sending reply.');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}
