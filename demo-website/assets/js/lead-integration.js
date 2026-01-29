/**
 * Lead Integration System - AMP
 * Connects website forms to Make.com webhooks
 */

const LEAD_CONFIG = {
    // Replace with your actual Make.com Webhook URL
    WEBHOOK_URL: 'https://hook.make.com/YOUR_WEBHOOK_URL',

    // Custom headers if needed
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

class LeadIntegration {
    constructor() {
        this.forms = document.querySelectorAll('form[data-integration="true"]');
        this.init();
    }

    init() {
        if (this.forms.length === 0) return;

        console.log(`Lead Integration: Found ${this.forms.length} integrated forms.`);

        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e, form));
        });
    }

    async handleSubmit(e, form) {
        e.preventDefault();

        // UI Feedback - Loading
        const submitBtn = form.querySelector('[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const payload = this.buildPayload(form);
            console.log('Lead Integration: Sending payload', payload);

            // In a real scenario, this would be a fetch call.
            // For now, we simulate success or log if URL is still placeholder.
            if (LEAD_CONFIG.WEBHOOK_URL.includes('YOUR_WEBHOOK_URL')) {
                console.warn('Lead Integration: Webhook URL is placeholder. Data not sent.', payload);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
                // We act like it succeeded for the user demo
                this.showSuccess(form);
            } else {
                const response = await fetch(LEAD_CONFIG.WEBHOOK_URL, {
                    method: 'POST',
                    headers: LEAD_CONFIG.HEADERS,
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.showSuccess(form);
                } else {
                    throw new Error('Webhook submission failed');
                }
            }

        } catch (error) {
            console.error('Lead Integration Error:', error);
            alert('Sorry, there was an issue sending your inquiry. Please try again or contact us via LINE.');
        } finally {
            // Restore button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }

    buildPayload(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const source = form.dataset.source || 'Website_Form';

        // Basic structure matching Make.com expectation
        const payload = {
            source: source,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            lead: {
                name: data.name,
                phone: data.phone,
                email: data.email || null, // Email might be optional on some forms
                message: data.message || null,
                interest_type: data.interest || null // Buy/Rent toggle
            }
        };

        // Add property ID if available (for detail page)
        if (source === 'Property_Inquiry' || form.querySelector('[name="property_id"]')) {
            // Try to get from URL first (detail page standard)
            const urlParams = new URLSearchParams(window.location.search);
            const propertyId = urlParams.get('id');

            if (propertyId) {
                payload.property = { id: propertyId };
            }
        }

        return payload;
    }

    showSuccess(form) {
        // Replace form content with success message
        const successHTML = `
      <div class="success-message" style="text-align: center; padding: 20px;">
        <div style="color: #2ecc71; font-size: 48px; margin-bottom: 10px;">✓</div>
        <h3 style="margin-bottom: 10px;">Message Sent!</h3>
        <p>Thank you for your inquiry. Our team will contact you shortly.</p>
        <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
          For urgent matters, please contact us via <a href="https://line.me/ti/p/~@554dksqb">LINE</a>.
        </p>
      </div>
    `;

        form.innerHTML = successHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LeadIntegration();
});
