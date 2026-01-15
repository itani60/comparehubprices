/* User Support Logic */
const API_URL = 'https://hub.comparehubprices.co.za/admin/support-management';

document.addEventListener('DOMContentLoaded', () => {

    updateAuthDisplay();

    /* --- Filter Dropdown Logic --- */
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
    });

    /* --- Ticket Submission --- */
    const submitBtn = document.getElementById('submit-ticket-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const subject = document.getElementById('ticket-subject').value;
            const description = document.getElementById('ticket-description').value;
            // Custom Dropdown Logic for Category & Priority
            const categoryText = document.getElementById('ticket-category-display').innerText;
            const priorityText = document.getElementById('ticket-priority-display').innerText;

            const category = (categoryText === 'Select a topic...') ? '' : categoryText;
            const priority = priorityText.split(' ')[0]; // Extract 'Medium' from 'Medium (Standard)'

            if (!category) {
                alert('Please select a category.');
                return;
            }

            if (!subject || !description) {
                alert('Please fill in all required fields.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            let ticketId = null;
            let attachments = [];

            try {
                // 1. Handle File Upload (Optional)
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    // Get Presigned URL
                    const uploadInfo = await fetch(API_URL, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getUploadUrl',
                            fileName: file.name,
                            fileType: file.type
                        })
                    }).then(r => r.json());

                    if (uploadInfo.uploadUrl) {
                        ticketId = uploadInfo.ticketId; // Capture allocated ID

                        // Upload to S3
                        const uploadRes = await fetch(uploadInfo.uploadUrl, {
                            method: 'PUT',
                            body: file,
                            headers: { 'Content-Type': file.type }
                        });

                        if (!uploadRes.ok) throw new Error('File upload failed');

                        // Store Full URL
                        attachments.push(uploadInfo.fileUrl || `https://assets.comparehubprices.co.za/${uploadInfo.key}`);
                    }
                }

                // 2. Create Ticket
                const payload = {
                    action: 'createTicket',
                    subject: subject,
                    description: description, // Matches backend 'description'
                    category: category,
                    priority: priority,
                    ticketId: ticketId,       // Pass draft ID if exists
                    attachments: attachments
                };

                const response = await fetch(API_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Ticket Submitted Successfully! Reference: ' + result.ticketId);

                    // Close Modal
                    const modalEl = document.getElementById('newTicketModal');
                    if (modalEl) {
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }

                    // Reset Form
                    document.getElementById('ticket-subject').value = '';
                    document.getElementById('ticket-description').value = '';
                    if (fileInput) fileInput.value = '';

                    // Refresh List
                    fetchUserTickets();
                } else {
                    alert('Error: ' + (result.error || 'Failed to submit ticket'));
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit Ticket';
            }
        });
    }

    // Expose selectFilter to window for onclick handlers
    window.selectFilter = function (type, value) {
        const dropdown = document.querySelector(`#${type}Dropdown`);
        if (dropdown) {
            dropdown.querySelector('.selected-text').textContent = value;
            dropdown.classList.add('active');
            setTimeout(() => dropdown.classList.remove('active'), 150);
        }
    };

    // Expose selectFormOption for the New Ticket Modal Dropdowns
    window.selectFormOption = function (type, text, value) {
        const dropdown = document.getElementById(`${type}Dropdown`);
        const display = document.getElementById(`${type === 'ticketCategory' ? 'ticket-category-display' : 'ticket-priority-display'}`);
        // const hidden = document.getElementById(`${type === 'ticketCategory' ? 'ticket-category-value' : 'ticket-priority-value'}`); 

        if (dropdown && display) {
            display.innerText = text;
            // hidden.value = value; // If we need the code separate from text, use this. Currently logic uses text.
            dropdown.classList.remove('active');
        }
    };

    // Initial Fetch
    fetchUserTickets();
});

async function fetchUserTickets() {
    // Session is managed via HttpOnly cookies (regular_sessionid), so no localStorage token needed.
    // However, we rely on the auth display logic to determine if we should fetch (i.e. if user logged in).
    // Ideally, we just try to fetch. If 401, we handle it.

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // critical for sending HttpOnly cookies
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getUserTickets' })
        });

        if (response.status === 401 || response.status === 403) {
            // Not logged in or session expired
            return;
        }

        const result = await response.json();
        if (result.tickets) {
            renderUserTickets(result.tickets);
        }
    } catch (e) {
        console.log('Error fetching user tickets:', e);
    }
}

function renderUserTickets(tickets) {
    const tbody = document.getElementById('user-tickets-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">
                <div class="fw-bold text-dark">${t.Subject}</div>
                <div class="small text-secondary text-truncate" style="max-width: 300px;">${t.Category}</div>
            </td>
            <td class="text-secondary fw-semibold">#${t.TicketID}</td>
            <td><span class="badge bg-secondary bg-opacity-10 text-dark border">${t.Category}</span></td>
            <td class="text-secondary small">${new Date(t.Timestamp).toLocaleDateString()}</td>
            <td><span class="ticket-status status-${t.Status.toLowerCase()}">${t.Status}</span></td>
            <td class="pe-4 text-end">
                <a href="user-support-view.html?id=${t.TicketID}" class="btn btn-sm btn-light border">View</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateAuthDisplay() {
    const container = document.getElementById('user-auth-display');
    if (!container) return;

    // Helper to wait for services to be available
    const waitForServices = async () => {
        let retries = 0;
        while ((!window.awsAuthService && !window.businessAWSAuthService) && retries < 20) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }
    };

    await waitForServices();

    let profile = null;
    let isBusiness = false;

    // 1. Try Regular User via AWSAuthService (Cookie-based)
    if (window.awsAuthService) {
        try {
            const info = await window.awsAuthService.getUserInfo();
            if (info && info.success && info.user) {
                profile = info.user;
                isBusiness = false;
            }
        } catch (err) {
            // Not a regular user or error
        }
    }

    // 2. Try Business User if no regular user found
    if (!profile && window.businessAWSAuthService) {
        try {
            const info = await window.businessAWSAuthService.getUserInfo();
            if (info && info.success && info.user) {
                profile = info.user;
                isBusiness = true;
            }
        } catch (err) {
            // Not a business user
        }
    }

    if (profile) {
        const initials = getInitials(profile);
        const givenName = (profile.givenName || profile.given_name) || '';
        const familyName = (profile.familyName || profile.family_name) || '';
        const displayName = (givenName || profile.email?.split('@')[0] || 'User').replace(/['"]+/g, '');
        const fullName = (givenName && familyName) ? `${givenName} ${familyName}` : displayName;
        const role = isBusiness ? 'Business Account' : 'Standard Account';
        container.innerHTML = `
            <div class="dropdown">
                <div class="d-flex align-items-center gap-3 cursor-pointer" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                    <div class="avatar-initials shadow text-white" 
                         style="background-color: #dc2626;">
                        ${initials}
                    </div>
                    <div class="d5-user-block d-none d-md-block">
                        <div class="d5-name">${fullName}</div>
                        <div class="d5-role">${role}</div>
                    </div>
                    <i class="fas fa-chevron-down text-secondary small d-none d-md-block"></i>
                </div>
                
                <div class="dropdown-menu dropdown-menu-end dd-d2 border-0 shadow-lg">
                    <div class="dd-d2-header">
                        <div class="dd-d2-avatar">${initials}</div>
                        <div>
                            <div class="fw-bold text-dark">${fullName}</div>
                            <div class="small text-muted">${role}</div>
                        </div>
                    </div>
                    <div class="dd-d2-list">
                        <a href="${isBusiness ? 'business_management.html' : 'my_account.html'}" class="dd-d2-item">
                            <span><i class="fas fa-user-circle me-2"></i> My Account</span>
                        </a>
                        <a href="#" class="dd-d2-item">
                            <span><i class="fas fa-heart me-2"></i> Wishlist</span>
                        </a>
                        <a href="#" class="dd-d2-item">
                            <span><i class="fas fa-question-circle me-2"></i> Help</span>
                        </a>
                        <hr class="dropdown-divider my-2">
                        <a href="#" class="dd-d2-item text-danger" onclick="handleLogout()">
                            <span><i class="fas fa-power-off me-2"></i> Logout</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `<a href="login.html" class="btn btn-primary rounded-pill px-4">Login</a>`;
    }
}

function getInitials(profile) {
    try {
        const given = (profile && (profile.givenName || profile.given_name)) || '';
        const family = (profile && (profile.familyName || profile.family_name)) || '';
        const email = (profile && profile.email) || '';

        let initials = '';
        if (given || family) {
            initials = (given.charAt(0) + (family.charAt(0) || '')).toUpperCase();
        } else if (email) {
            const namePart = email.split('@')[0] || '';
            const parts = namePart.split(/[._-]+/).filter(Boolean);
            if (parts.length >= 2) {
                initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            } else {
                initials = (namePart.slice(0, 2)).toUpperCase();
            }
        }
        return initials || 'U';
    } catch { return 'U'; }
}

async function handleLogout() {
    if (window.awsAuthService) await window.awsAuthService.logout();
    if (window.businessAWSAuthService) await window.businessAWSAuthService.logout();
    window.location.reload();
}
