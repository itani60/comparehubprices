// Price Alert Modal Component for CompareHub - Modern Redesign
class PriceAlertModal {
    constructor() {
        this.modal = null;
        this.currentProduct = null;
        this.init();
    }

    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }

    createModalHTML() {
        // Create modal HTML structure with modern design
        const modalHTML = `
            <div class="modal fade" id="priceAlertModal" tabindex="-1" aria-labelledby="priceAlertModalLabel" aria-hidden="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content price-alert-modal-content">
                        <div class="modal-header price-alert-header">
                            <div class="header-content">
                                <div class="header-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="header-text">
                                    <h5 class="modal-title" id="priceAlertModalLabel">Set Price Alert</h5>
                                    <p class="header-subtitle">Get notified when the price drops</p>
                                </div>
                            </div>
                            <button type="button" class="btn-close-modal" data-bs-dismiss="modal" aria-label="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <!-- Product Info Card -->
                            <div class="product-card">
                                <div class="product-image-wrapper">
                                    <img id="alertProductImage" src="" alt="Product" class="product-image">
                                    <div class="product-badge">
                                        <i class="fas fa-tag"></i>
                                    </div>
                                </div>
                                <div class="product-details">
                                    <div class="product-brand" id="alertProductBrand">Brand</div>
                                    <h6 class="product-name" id="alertProductName">Product Name</h6>
                                    <div class="product-price-section">
                                        <span class="price-label">Current Price</span>
                                        <span class="product-price" id="alertCurrentPrice">R 0</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Alert Form -->
                            <form id="priceAlertForm" class="alert-form">
                                <div class="form-section">
                                    <div class="section-header">
                                        <i class="fas fa-bullseye"></i>
                                        <span>Target Price</span>
                                    </div>
                                    <div class="input-wrapper">
                                        <div class="input-group-modern">
                                            <span class="input-prefix">R</span>
                                            <input type="number" class="form-input" id="targetPrice" name="targetPrice" 
                                                   placeholder="Enter your target price" min="1" step="0.01" required>
                                        </div>
                                        <div class="input-hint">
                                            <i class="fas fa-info-circle"></i>
                                            We'll notify you when the price reaches this amount or below
                                        </div>
                                    </div>
                                </div>

                                <div class="form-section">
                                    <div class="section-header">
                                        <i class="fas fa-bell"></i>
                                        <span>Notification Method</span>
                                    </div>
                                    <div class="notification-options">
                                        <label class="notification-option">
                                            <input type="radio" name="notificationMethod" value="email" required>
                                            <div class="option-content">
                                                <span>Email</span>
                                            </div>
                                        </label>
                                        <label class="notification-option">
                                            <input type="radio" name="notificationMethod" value="browser">
                                            <div class="option-content">
                                                <span>Browser</span>
                                            </div>
                                        </label>
                                        <label class="notification-option">
                                            <input type="radio" name="notificationMethod" value="both">
                                            <div class="option-content">
                                                <span>Both</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div class="form-section" id="emailSection" style="display: none;">
                                    <div class="section-header">
                                        <i class="fas fa-envelope"></i>
                                        <span>Email Address</span>
                                        <span class="required-badge">Required</span>
                                    </div>
                                    <div class="input-wrapper">
                                        <input type="email" class="form-input" id="emailAddress" name="emailAddress" 
                                               placeholder="your.email@example.com">
                                        <div class="input-hint" id="emailHelpText">
                                            We'll send price alerts to this email
                                        </div>
                                    </div>
                                </div>

                                <div class="form-section">
                                    <div class="section-header">
                                        <i class="fas fa-edit"></i>
                                        <span>Alert Name <span class="optional-badge">Optional</span></span>
                                    </div>
                                    <div class="input-wrapper">
                                        <input type="text" class="form-input" id="alertName" name="alertName" 
                                               placeholder="e.g., iPhone 15 Pro Max Alert">
                                    </div>
                                </div>

                                <div class="form-section">
                                    <label class="checkbox-modern">
                                        <input type="checkbox" id="priceIncreaseAlert" name="priceIncreaseAlert">
                                        <span class="checkbox-label">
                                            <i class="fas fa-arrow-up"></i>
                                            Also notify me if the price increases significantly
                                        </span>
                                    </label>
                                </div>

                                <div class="info-card">
                                    <div class="info-icon">
                                        <i class="fas fa-lightbulb"></i>
                                    </div>
                                    <div class="info-content">
                                        <strong>How it works:</strong>
                                        <p>We monitor this product's price across all retailers and send you a notification when it reaches your target price.</p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer price-alert-footer">
                            <button type="button" class="btn-cancel" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="button" class="btn-save" id="savePriceAlertBtn">
                                Set Price Alert
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add CSS styles
        this.addModalStyles();

        // Get modal reference
        this.modal = document.getElementById('priceAlertModal');
    }

    addModalStyles() {
        const styles = `
            <style id="price-alert-modal-styles">
                /* Modern Price Alert Modal Styles */
                #priceAlertModal .price-alert-modal-content {
                    border-radius: 24px;
                    border: none;
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    z-index: 1055 !important;
                    max-height: 90vh;
                    background: #ffffff;
                }

                /* Header */
                #priceAlertModal .price-alert-header {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    padding: 2rem;
                    border: none;
                    position: relative;
                }

                #priceAlertModal .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                #priceAlertModal .header-icon {
                    width: 56px;
                    height: 56px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                #priceAlertModal .header-icon i {
                    font-size: 24px;
                    color: #ffffff;
                }

                #priceAlertModal .header-text {
                    flex: 1;
                }

                #priceAlertModal .modal-title {
                    color: #ffffff;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    line-height: 1.2;
                }

                #priceAlertModal .header-subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.9rem;
                    margin: 0.25rem 0 0 0;
                }

                #priceAlertModal .btn-close-modal {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: #ffffff;
                    backdrop-filter: blur(10px);
                }

                #priceAlertModal .btn-close-modal:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }

                #priceAlertModal .btn-close-modal i {
                    font-size: 18px;
                }

                /* Body */
                #priceAlertModal .modal-body {
                    padding: 2rem;
                    max-height: calc(90vh - 200px);
                    overflow-y: auto;
                }

                /* Product Card */
                #priceAlertModal .product-card {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    border: 1px solid #e9ecef;
                }

                #priceAlertModal .product-image-wrapper {
                    position: relative;
                    flex-shrink: 0;
                }

                #priceAlertModal .product-image {
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                    border-radius: 12px;
                    background: #ffffff;
                    padding: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                #priceAlertModal .product-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                }

                #priceAlertModal .product-badge i {
                    color: #ffffff;
                    font-size: 14px;
                }

                #priceAlertModal .product-details {
                    flex: 1;
                }

                #priceAlertModal .product-brand {
                    font-size: 0.85rem;
                    color: #6c757d;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.5rem;
                }

                #priceAlertModal .product-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #212529;
                    margin: 0 0 0.75rem 0;
                    line-height: 1.3;
                }

                #priceAlertModal .product-price-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                #priceAlertModal .price-label {
                    font-size: 0.8rem;
                    color: #6c757d;
                    font-weight: 500;
                }

                #priceAlertModal .product-price {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #28a745;
                }

                /* Form Sections */
                #priceAlertModal .alert-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                #priceAlertModal .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                #priceAlertModal .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    color: #212529;
                    font-size: 1rem;
                }

                #priceAlertModal .section-header i {
                    color: #28a745;
                    font-size: 1.1rem;
                }

                #priceAlertModal .required-badge {
                    background: #dc3545;
                    color: #ffffff;
                    font-size: 0.7rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-weight: 600;
                    margin-left: auto;
                }

                #priceAlertModal .optional-badge {
                    color: #6c757d;
                    font-size: 0.85rem;
                    font-weight: 400;
                }

                /* Input Styles */
                #priceAlertModal .input-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                #priceAlertModal .input-group-modern {
                    display: flex;
                    align-items: center;
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                #priceAlertModal .input-group-modern:focus-within {
                    border-color: #28a745;
                    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.1);
                    background: #ffffff;
                }

                #priceAlertModal .input-prefix {
                    padding: 0.875rem 1rem;
                    background: #e9ecef;
                    color: #495057;
                    font-weight: 600;
                    font-size: 1rem;
                }

                #priceAlertModal .form-input {
                    flex: 1;
                    border: none;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    background: transparent;
                    outline: none;
                    color: #212529;
                }

                #priceAlertModal .form-input::placeholder {
                    color: #adb5bd;
                }

                #priceAlertModal .form-input.is-invalid {
                    border-color: #dc3545;
                }

                #priceAlertModal .input-hint {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #6c757d;
                    margin-top: 0.25rem;
                }

                #priceAlertModal .input-hint i {
                    font-size: 0.75rem;
                    color: #28a745;
                }

                /* Notification Options */
                #priceAlertModal .notification-options {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                }

                #priceAlertModal .notification-option {
                    position: relative;
                    cursor: pointer;
                }

                #priceAlertModal .notification-option input[type="radio"] {
                    position: absolute;
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                #priceAlertModal .option-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                #priceAlertModal .option-content span {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #495057;
                }

                #priceAlertModal .notification-option input[type="radio"]:checked + .option-content {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border-color: #28a745;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }

                #priceAlertModal .notification-option input[type="radio"]:checked + .option-content span {
                    color: #ffffff;
                }

                #priceAlertModal .notification-option:hover .option-content {
                    border-color: #28a745;
                    transform: translateY(-2px);
                }

                /* Checkbox */
                #priceAlertModal .checkbox-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 12px;
                    border: 2px solid #e9ecef;
                    transition: all 0.3s ease;
                }

                #priceAlertModal .checkbox-modern:hover {
                    border-color: #28a745;
                    background: #ffffff;
                }

                #priceAlertModal .checkbox-modern input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: #28a745;
                }

                #priceAlertModal .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                    color: #495057;
                    margin: 0;
                }

                #priceAlertModal .checkbox-label i {
                    color: #28a745;
                }

                /* Info Card */
                #priceAlertModal .info-card {
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    gap: 1rem;
                    border: 1px solid #90caf9;
                }

                #priceAlertModal .info-icon {
                    width: 40px;
                    height: 40px;
                    background: #2196f3;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                #priceAlertModal .info-icon i {
                    color: #ffffff;
                    font-size: 1.1rem;
                }

                #priceAlertModal .info-content {
                    flex: 1;
                }

                #priceAlertModal .info-content strong {
                    color: #1565c0;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                #priceAlertModal .info-content p {
                    color: #0d47a1;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                /* Footer */
                #priceAlertModal .price-alert-footer {
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    background: #f8f9fa;
                }

                #priceAlertModal .btn-cancel {
                    padding: 0.875rem 1.75rem;
                    background: #ffffff;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    color: #495057;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                #priceAlertModal .btn-cancel:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                    transform: translateY(-2px);
                }

                #priceAlertModal .btn-save {
                    padding: 0.875rem 1.75rem;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border: none;
                    border-radius: 12px;
                    color: #ffffff;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }

                #priceAlertModal .btn-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                }

                #priceAlertModal .btn-save:active {
                    transform: translateY(0);
                }

                /* Custom Scrollbar */
                #priceAlertModal .modal-body::-webkit-scrollbar {
                    width: 6px;
                }

                #priceAlertModal .modal-body::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                #priceAlertModal .modal-body::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border-radius: 3px;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    #priceAlertModal .modal-dialog {
                        margin: 0.5rem;
                        max-width: calc(100% - 1rem);
                    }

                    #priceAlertModal .price-alert-header {
                        padding: 1.5rem;
                    }

                    #priceAlertModal .header-icon {
                        width: 48px;
                        height: 48px;
                    }

                    #priceAlertModal .header-icon i {
                        font-size: 20px;
                    }

                    #priceAlertModal .modal-title {
                        font-size: 1.25rem;
                    }

                    #priceAlertModal .modal-body {
                        padding: 1.5rem;
                    }

                    #priceAlertModal .product-card {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.25rem;
                    }

                    #priceAlertModal .product-image {
                        width: 80px;
                        height: 80px;
                    }

                    #priceAlertModal .notification-options {
                        grid-template-columns: 1fr;
                    }

                    #priceAlertModal .price-alert-footer {
                        flex-direction: column;
                        padding: 1rem 1.5rem;
                    }

                    #priceAlertModal .btn-cancel,
                    #priceAlertModal .btn-save {
                        width: 100%;
                        justify-content: center;
                    }
                }

                /* Animation */
                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                #priceAlertModal.modal.show .modal-dialog {
                    animation: modalFadeIn 0.3s ease-out;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEventListeners() {
        // Save button event listener
        const saveButton = document.getElementById('savePriceAlertBtn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.handlePriceAlertSubmission());
        }

        // Form submission event listener
        const form = document.getElementById('priceAlertForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePriceAlertSubmission();
            });
        }

        // Real-time validation for target price
        const targetPriceInput = document.getElementById('targetPrice');
        if (targetPriceInput) {
            targetPriceInput.addEventListener('input', () => this.validateTargetPrice());
        }

        // Notification method change listener - toggle email requirement
        const notificationMethodInputs = document.querySelectorAll('#priceAlertModal input[name="notificationMethod"]');
        notificationMethodInputs.forEach(input => {
            input.addEventListener('change', () => this.handleNotificationMethodChange());
        });

        // Modal accessibility event listeners
        this.modal.addEventListener('show.bs.modal', () => {
            this.modal.setAttribute('aria-hidden', 'false');
            this.modal.removeAttribute('inert');
        });

        this.modal.addEventListener('hide.bs.modal', () => {
            this.modal.setAttribute('aria-hidden', 'true');
            this.modal.setAttribute('inert', '');
        });

        this.modal.addEventListener('hidden.bs.modal', () => {
            // Clean up any lingering backdrop elements
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Remove modal-open class from body if no other modals are open
            if (!document.querySelector('.modal.show')) {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        });

        this.modal.addEventListener('shown.bs.modal', () => {
            // Focus the first focusable element when modal is shown
            const firstFocusable = this.modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        });

        // Keyboard navigation support
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = bootstrap.Modal.getInstance(this.modal);
                if (modal) {
                    modal.hide();
                }
            }
        });

        // Trap focus within modal when it's open
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusableElements = this.modal.querySelectorAll(
                    'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    show(product) {
        console.log('PriceAlertModal.show called with product:', product);
        
        if (!this.modal) {
            console.error('Modal element not found');
            return;
        }
        
        this.currentProduct = product;
        this.populateModal(product);
        
        try {
            // Show the modal
            const bootstrapModal = new bootstrap.Modal(this.modal);
            bootstrapModal.show();
            console.log('Modal shown successfully');
        } catch (error) {
            console.error('Error showing modal:', error);
            console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
            console.log('Modal element:', this.modal);
        }
    }

    populateModal(product) {
        // Get modal elements
        const productImage = document.getElementById('alertProductImage');
        const productName = document.getElementById('alertProductName');
        const productBrand = document.getElementById('alertProductBrand');
        const currentPrice = document.getElementById('alertCurrentPrice');
        const targetPriceInput = document.getElementById('targetPrice');
        const alertNameInput = document.getElementById('alertName');
        const emailAddressInput = document.getElementById('emailAddress');
        const priceIncreaseCheckbox = document.getElementById('priceIncreaseAlert');
        
        // Set product information
        const imageUrl = product.imageUrl || product.image || product.img || 'https://via.placeholder.com/150?text=No+Image';
        const productNameText = product.model || product.title || 'Unknown Product';
        const brandName = product.brand || 'Unknown Brand';
        const lowestPrice = this.getLowestPrice(product);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        
        productImage.src = imageUrl;
        productImage.alt = productNameText;
        productName.textContent = productNameText;
        productBrand.textContent = brandName;
        currentPrice.textContent = formattedPrice;
        
        // Clear form first
        document.getElementById('priceAlertForm').reset();
        
        // Reset email field requirement state
        const emailSection = document.getElementById('emailSection');
        const emailHelpText = document.getElementById('emailHelpText');
        
        if (emailAddressInput) {
            emailAddressInput.removeAttribute('required');
            emailAddressInput.classList.remove('is-invalid');
            emailAddressInput.setCustomValidity('');
        }
        if (emailSection) {
            emailSection.style.display = 'none';
        }
        if (emailHelpText) {
            emailHelpText.textContent = 'We\'ll send price alerts to this email';
        }
        
        // Check if we're updating an existing alert
        if (this.existingAlertData) {
            // Pre-fill with existing alert data
            targetPriceInput.value = this.existingAlertData.targetPrice || '';
            const notificationMethod = this.existingAlertData.notificationMethod || '';
            const notificationInput = document.querySelector(`input[name="notificationMethod"][value="${notificationMethod}"]`);
            if (notificationInput) {
                notificationInput.checked = true;
            }
            alertNameInput.value = this.existingAlertData.alertName || '';
            emailAddressInput.value = this.existingAlertData.emailAddress || '';
            priceIncreaseCheckbox.checked = this.existingAlertData.priceIncreaseAlert || false;
            
            // Update email field requirement based on notification method
            this.handleNotificationMethodChange();
            
            // Change modal title to indicate update mode
            const modalTitle = document.getElementById('priceAlertModalLabel');
            if (modalTitle) {
                modalTitle.textContent = 'Update Price Alert';
            }
            
            // Clear the existing alert data after use
            this.existingAlertData = null;
        } else {
            // New alert - set suggested target price (10% below current price)
            if (lowestPrice > 0) {
                const suggestedTargetPrice = Math.round(lowestPrice * 0.9);
                targetPriceInput.value = suggestedTargetPrice;
            }
            
            // Reset modal title to default
            const modalTitle = document.getElementById('priceAlertModalLabel');
            if (modalTitle) {
                modalTitle.textContent = 'Set Price Alert';
            }
        }
        
        targetPriceInput.setAttribute('data-product-id', product.product_id || product.id);
    }

    validateTargetPrice() {
        const targetPriceInput = document.getElementById('targetPrice');
        const currentPriceText = document.getElementById('alertCurrentPrice').textContent;
        
        // Extract current price from formatted text
        const currentPriceMatch = currentPriceText.match(/[\d,]+/);
        if (currentPriceMatch) {
            const currentPrice = parseFloat(currentPriceMatch[0].replace(/,/g, ''));
            const targetPrice = parseFloat(targetPriceInput.value);
            
            if (targetPrice > currentPrice) {
                targetPriceInput.setCustomValidity('Target price should be lower than current price');
                targetPriceInput.classList.add('is-invalid');
            } else if (targetPrice <= 0) {
                targetPriceInput.setCustomValidity('Target price must be greater than 0');
                targetPriceInput.classList.add('is-invalid');
            } else {
                targetPriceInput.setCustomValidity('');
                targetPriceInput.classList.remove('is-invalid');
            }
        }
    }

    handleNotificationMethodChange() {
        const notificationMethodInputs = document.querySelectorAll('#priceAlertModal input[name="notificationMethod"]:checked');
        const emailSection = document.getElementById('emailSection');
        const emailAddressInput = document.getElementById('emailAddress');
        const emailHelpText = document.getElementById('emailHelpText');
        
        if (!notificationMethodInputs.length || !emailSection || !emailAddressInput) return;
        
        const selectedMethod = notificationMethodInputs[0].value;
        
        // If browser only, email is not required
        if (selectedMethod === 'browser') {
            emailAddressInput.removeAttribute('required');
            emailAddressInput.classList.remove('is-invalid');
            emailAddressInput.setCustomValidity('');
            emailSection.style.display = 'none';
            if (emailHelpText) {
                emailHelpText.textContent = 'Not required for browser notifications only';
            }
            emailAddressInput.value = '';
        } 
        // If email or both, email is required
        else if (selectedMethod === 'email' || selectedMethod === 'both') {
            emailAddressInput.setAttribute('required', 'required');
            emailSection.style.display = 'block';
            if (emailHelpText) {
                emailHelpText.textContent = 'We\'ll send price alerts to this email';
            }
        }
        // If no method selected yet
        else {
            emailAddressInput.removeAttribute('required');
            emailAddressInput.classList.remove('is-invalid');
            emailAddressInput.setCustomValidity('');
            emailSection.style.display = 'none';
            if (emailHelpText) {
                emailHelpText.textContent = 'Select notification method first';
            }
        }
    }

    async handlePriceAlertSubmission() {
        const form = document.getElementById('priceAlertForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Get form data
        const targetPrice = parseFloat(formData.get('targetPrice'));
        const notificationMethod = formData.get('notificationMethod');
        const alertName = formData.get('alertName') || '';
        const emailAddress = formData.get('emailAddress');
        const priceIncreaseAlert = formData.has('priceIncreaseAlert');
        const productId = document.getElementById('targetPrice').getAttribute('data-product-id');
        
        // Validate email based on notification method
        if (notificationMethod === 'email' || notificationMethod === 'both') {
            if (!emailAddress || emailAddress.trim() === '') {
                const emailInput = document.getElementById('emailAddress');
                emailInput.classList.add('is-invalid');
                emailInput.setCustomValidity('Email address is required for email notifications');
                form.classList.add('was-validated');
                this.showNotification('Please enter an email address for email notifications', 'error');
                return;
            }
        }
        
        if (!this.currentProduct) {
            this.showNotification('Error: Product not found', 'error');
            return;
        }

        // Check if we're updating an existing alert
        const isUpdate = this.existingAlertData && this.existingAlertData.alertId;
        const API_BASE_URL = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
        const url = isUpdate ? `${API_BASE_URL}/update` : `${API_BASE_URL}/add`;

        // Create alert object
        const alertData = {
            productId: productId,
            productName: this.currentProduct.model || this.currentProduct.title || 'Unknown',
            productBrand: this.currentProduct.brand || 'Unknown',
            productImage: this.currentProduct.imageUrl || this.currentProduct.image || this.currentProduct.img || '',
            currentPrice: this.getLowestPrice(this.currentProduct),
            targetPrice: targetPrice,
            notificationMethod: notificationMethod,
            alertName: alertName,
            emailAddress: notificationMethod === 'browser' ? '' : (emailAddress || ''),
            priceIncreaseAlert: priceIncreaseAlert
        };

        // Add alertId if updating
        if (isUpdate) {
            alertData.alertId = this.existingAlertData.alertId;
        }

        try {
            // Save the alert to server
            const response = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save price alert');
            }

            const data = await response.json();
            
            if (data.success) {
                // Show success message
                this.showNotification(
                    isUpdate 
                        ? `Price alert updated for ${alertData.productName}!` 
                        : `Price alert set for ${alertData.productName}!`, 
                    'success'
                );
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(this.modal);
                if (modal) {
                    modal.hide();
                }

                // Update bell icon state
                this.updateBellIconState(productId, true);
                
                // Refresh price alerts page if we're on it
                if (window.location.pathname.includes('price-alerts.html') && window.priceAlertsManager) {
                    await window.priceAlertsManager.refreshAlerts();
                }
                
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('priceAlertsUpdated'));
            } else {
                throw new Error(data.message || 'Failed to save price alert');
            }
        } catch (error) {
            console.error('Error saving price alert:', error);
            this.showNotification(error.message || 'Failed to save price alert. Please try again.', 'error');
        }
    }

    updateBellIconState(productId, isActive) {
        const bellElement = document.querySelector(`[data-product-id="${productId}"].price-alert-bell`);
        if (bellElement) {
            if (isActive) {
                bellElement.classList.add('active');
                bellElement.title = 'Price alert active - Click to remove';
            } else {
                bellElement.classList.remove('active');
                bellElement.title = 'Set Price Alert';
            }
        }
    }

    showNotification(message, type = 'info') {
        // Use the new toast notification system
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else if (typeof showSuccessToast === 'function' && type === 'success') {
            showSuccessToast(message);
        } else if (typeof showErrorToast === 'function' && (type === 'error' || type === 'danger')) {
            showErrorToast(message);
        } else if (typeof showWarningToast === 'function' && type === 'warning') {
            showWarningToast(message);
        } else if (typeof showInfoToast === 'function' && type === 'info') {
            showInfoToast(message);
        } else {
            // Fallback to console if toast functions not available
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    getLowestPrice(product) {
        if (!product.offers || product.offers.length === 0) return 0;
        return Math.min(...product.offers.map(offer => offer.price).filter(price => typeof price === 'number' && price > 0));
    }

    async loadExistingAlerts() {
        // Load existing price alerts from server and update bell icons
        try {
            const API_BASE_URL = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.alerts) {
                    data.alerts.forEach(alert => {
                        if (alert.status === 'active') {
                            this.updateBellIconState(alert.productId, true);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading existing alerts:', error);
        }
    }

    // Public methods for external control
    hide() {
        const modal = bootstrap.Modal.getInstance(this.modal);
        if (modal) {
            modal.hide();
        }
        
        // Clean up backdrop and body styles after a short delay
        setTimeout(() => {
            this.cleanupBackdrop();
        }, 300);
    }

    cleanupBackdrop() {
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.remove();
        });
        
        // Remove modal-open class and styles from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Remove any inline styles that might be blocking interaction
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (!modal.classList.contains('show')) {
                modal.style.display = 'none';
            }
        });
    }

    destroy() {
        // Remove modal from DOM
        if (this.modal) {
            this.modal.remove();
        }
        
        // Remove styles
        const styles = document.getElementById('price-alert-modal-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing price alert modal...');
    
    // Only initialize if modal doesn't already exist
    if (!document.getElementById('priceAlertModal')) {
        try {
            window.priceAlertModal = new PriceAlertModal();
            console.log('Price alert modal initialized successfully');
        } catch (error) {
            console.error('Error initializing price alert modal:', error);
        }
    } else {
        console.log('Price alert modal already exists');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceAlertModal;
}

