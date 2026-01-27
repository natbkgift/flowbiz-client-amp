// Analytics - Log page load
console.log('Coming Soon Page Loaded', {
    timestamp: new Date().toISOString(),
    page: 'coming_soon_page'
});

// DOM Elements
const leadForm = document.getElementById('leadForm');
const successMessage = document.getElementById('successMessage');

// Lead Form Submission Handler
leadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(leadForm);
    const honeypot = formData.get('hp');
    
    // Anti-Spam: Check honeypot field
    if (honeypot) {
        console.warn('Spam submission detected', {
            timestamp: new Date().toISOString(),
            honeypot: honeypot
        });
        // Silently reject spam - don't show any error to the bot
        return;
    }
    
    // Collect lead data
    const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        source: 'coming_soon_page',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Store lead in localStorage
        storeLead(leadData);
        
        // Hide form and show success message
        leadForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Log successful submission
        console.log('Lead captured successfully', leadData);
        
    } catch (error) {
        console.error('Error storing lead', error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
});

// Store lead in localStorage
function storeLead(leadData) {
    // Get existing leads from localStorage
    let leads = [];
    const storedLeads = localStorage.getItem('early_leads');
    
    if (storedLeads) {
        try {
            leads = JSON.parse(storedLeads);
            if (!Array.isArray(leads)) {
                leads = [];
            }
        } catch (error) {
            console.error('Error parsing stored leads', error);
            leads = [];
        }
    }
    
    // Add new lead
    leads.push(leadData);
    
    // Store back to localStorage
    localStorage.setItem('early_leads', JSON.stringify(leads));
    
    console.log('Total leads stored:', leads.length);
}
