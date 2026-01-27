// AMP Demo Website - Admin Mock Data
// Mock data for admin dashboard, leads, activities, and QA reports

const ADMIN_STATS = {
  total_properties: 24,
  active_properties: 18,
  inactive_properties: 4,
  draft_properties: 2,
  leads_today: 5,
  leads_week: 12,
  leads_month: 45,
  leads_total: 128
};

const MOCK_LEADS = [
  {
    lead_id: 'LEAD-001',
    name: 'คุณสมชาย ใจดี',
    phone: '081-234-5678',
    email: 'somchai@example.com',
    property_id: 'PROP-DEMO-001',
    property_title: 'Sea View Condo 1BR',
    message: 'สนใจเช่าคอนโดนี้ครับ ขอดูห้องได้ไหมครับ',
    status: 'new',
    created_at: '2026-01-27T10:30:00Z',
    utm_source: 'facebook',
    utm_campaign: 'jan_2026'
  },
  {
    lead_id: 'LEAD-002',
    name: 'John Smith',
    phone: '+66-89-123-4567',
    email: 'john.smith@example.com',
    property_id: 'PROP-DEMO-005',
    property_title: 'Luxury Villa 4BR',
    message: 'Interested in buying this villa. Can we schedule a viewing?',
    status: 'assigned',
    created_at: '2026-01-27T09:15:00Z',
    utm_source: 'google',
    utm_campaign: 'villa_sale'
  },
  {
    lead_id: 'LEAD-003',
    name: 'คุณสุดา แสงทอง',
    phone: '062-555-8888',
    email: 'suda.s@example.com',
    property_id: 'PROP-DEMO-003',
    property_title: 'Garden View Condo 2BR',
    message: 'สนใจครับ ต้องการดูห้อง สะดวกเมื่อไหร่ครับ',
    status: 'contacted',
    created_at: '2026-01-27T08:45:00Z',
    utm_source: 'line',
    utm_campaign: 'organic'
  },
  {
    lead_id: 'LEAD-004',
    name: 'Michael Wong',
    phone: '+66-92-777-6666',
    email: 'michael.w@example.com',
    property_id: 'PROP-DEMO-012',
    property_title: 'Modern Townhouse 3BR',
    message: 'Looking for long-term rental. Is this available from March?',
    status: 'new',
    created_at: '2026-01-27T07:20:00Z',
    utm_source: 'google',
    utm_campaign: 'townhouse_rent'
  },
  {
    lead_id: 'LEAD-005',
    name: 'คุณนิภา วงศ์สุวรรณ',
    phone: '085-444-3333',
    email: 'nipa.w@example.com',
    property_id: 'PROP-DEMO-018',
    property_title: 'Sea View Villa 5BR',
    message: 'สนใจซื้อวิลล่านี้ค่ะ ราคาเท่าไหร่คะ ต่อรองได้ไหมคะ',
    status: 'new',
    created_at: '2026-01-27T06:10:00Z',
    utm_source: 'facebook',
    utm_campaign: 'luxury_sale'
  },
  {
    lead_id: 'LEAD-006',
    name: 'David Chen',
    phone: '+66-81-999-8888',
    email: 'david.chen@example.com',
    property_id: 'PROP-DEMO-002',
    property_title: 'Studio Condo City Center',
    message: 'Is this property still available? I need to move in by mid-February.',
    status: 'assigned',
    created_at: '2026-01-26T15:30:00Z',
    utm_source: 'website',
    utm_campaign: 'direct'
  },
  {
    lead_id: 'LEAD-007',
    name: 'คุณปรีชา สุขใจ',
    phone: '098-222-1111',
    email: 'preecha.s@example.com',
    property_id: 'PROP-DEMO-015',
    property_title: 'Pool Villa 4BR',
    message: 'ต้องการเช่าระยะยาว 1 ปี เริ่มมีนาคม สนใจดูห้องครับ',
    status: 'contacted',
    created_at: '2026-01-26T14:15:00Z',
    utm_source: 'line',
    utm_campaign: 'villa_rental'
  },
  {
    lead_id: 'LEAD-008',
    name: 'Sarah Johnson',
    phone: '+66-95-666-5555',
    email: 'sarah.j@example.com',
    property_id: 'PROP-DEMO-007',
    property_title: 'Family House 3BR',
    message: 'Perfect for my family! Can we view this weekend?',
    status: 'closed',
    created_at: '2026-01-26T11:20:00Z',
    utm_source: 'facebook',
    utm_campaign: 'family_homes'
  },
  {
    lead_id: 'LEAD-009',
    name: 'คุณวิชัย มั่นคง',
    phone: '091-333-2222',
    email: 'wichai.m@example.com',
    property_id: 'PROP-DEMO-010',
    property_title: 'Modern House 4BR',
    message: 'สนใจเช่าบ้านหลังนี้ครับ ราคาต่อรองได้ไหมครับ',
    status: 'assigned',
    created_at: '2026-01-26T10:05:00Z',
    utm_source: 'google',
    utm_campaign: 'house_rental'
  },
  {
    lead_id: 'LEAD-010',
    name: 'Emily Watson',
    phone: '+66-87-444-3333',
    email: 'emily.w@example.com',
    property_id: 'PROP-DEMO-020',
    property_title: 'Beach House 4BR',
    message: 'Interested in purchasing. What is the best price you can offer?',
    status: 'contacted',
    created_at: '2026-01-25T16:40:00Z',
    utm_source: 'google',
    utm_campaign: 'beach_sale'
  },
  {
    lead_id: 'LEAD-011',
    name: 'คุณอนันต์ ศรีสุข',
    phone: '084-111-9999',
    email: 'anan.s@example.com',
    property_id: 'PROP-DEMO-024',
    property_title: 'Luxury Pool Villa 5BR',
    message: 'สนใจซื้อวิลล่าหรูหลังนี้ครับ ดูห้องได้เมื่อไหร่ครับ',
    status: 'new',
    created_at: '2026-01-25T14:25:00Z',
    utm_source: 'line',
    utm_campaign: 'luxury_villa'
  },
  {
    lead_id: 'LEAD-012',
    name: 'Robert Anderson',
    phone: '+66-93-777-8888',
    email: 'robert.a@example.com',
    property_id: 'PROP-DEMO-011',
    property_title: 'Detached House 3BR',
    message: 'Looking to rent for 6 months. Is short-term rental available?',
    status: 'closed',
    created_at: '2026-01-25T09:50:00Z',
    utm_source: 'facebook',
    utm_campaign: 'short_term'
  },
  {
    lead_id: 'LEAD-013',
    name: 'คุณมานี พรหมสุข',
    phone: '086-888-7777',
    email: 'manee.p@example.com',
    property_id: 'PROP-DEMO-006',
    property_title: 'City View Studio',
    message: 'สนใจเช่าสตูดิโอนี้ค่ะ ราคาเดือนละเท่าไหร่คะ',
    status: 'assigned',
    created_at: '2026-01-24T13:15:00Z',
    utm_source: 'website',
    utm_campaign: 'studio_rent'
  },
  {
    lead_id: 'LEAD-014',
    name: 'Thomas Lee',
    phone: '+66-89-555-4444',
    email: 'thomas.l@example.com',
    property_id: 'PROP-DEMO-016',
    property_title: 'Modern Villa 3BR',
    message: 'Interested in long-term rental. Can I get a discount for 2-year contract?',
    status: 'contacted',
    created_at: '2026-01-24T11:30:00Z',
    utm_source: 'google',
    utm_campaign: 'longterm_rental'
  },
  {
    lead_id: 'LEAD-015',
    name: 'คุณศิริพร จันทร์สว่าง',
    phone: '082-666-5555',
    email: 'siriporn.j@example.com',
    property_id: 'PROP-DEMO-021',
    property_title: 'Sea Front Villa 4BR',
    message: 'สนใจซื้อวิลล่าหลังนี้มากค่ะ ขอข้อมูลเพิ่มเติมได้ไหมคะ',
    status: 'closed',
    created_at: '2026-01-23T15:45:00Z',
    utm_source: 'line',
    utm_campaign: 'seafront_sale'
  }
];

const MOCK_QA_ISSUES = [
  {
    property_id: 'PROP-DEMO-099',
    reason_code: 'MISSING_MEDIA',
    severity: 'blocker',
    message: 'At least one photo is required',
    detected_at: '2026-01-27T08:00:00Z'
  },
  {
    property_id: 'PROP-DEMO-088',
    reason_code: 'MISSING_PRICE',
    severity: 'blocker', 
    message: 'At least one price (rent or sale) is required',
    detected_at: '2026-01-27T08:00:00Z'
  },
  {
    property_id: 'PROP-DEMO-077',
    reason_code: 'MISSING_DATE_UPDATED',
    severity: 'warn',
    message: 'Date updated was auto-set',
    detected_at: '2026-01-27T08:00:00Z'
  },
  {
    property_id: 'PROP-DEMO-066',
    reason_code: 'INVALID_AREA',
    severity: 'warn',
    message: 'Area value not in standard list',
    detected_at: '2026-01-27T08:00:00Z'
  },
  {
    property_id: 'PROP-DEMO-055',
    reason_code: 'MISSING_DESCRIPTION',
    severity: 'warn',
    message: 'Property description is empty or too short',
    detected_at: '2026-01-27T08:00:00Z'
  }
];

const MOCK_ACTIVITIES = [
  { 
    type: 'property_update', 
    message: 'Property PROP-DEMO-024 updated',
    user: 'Admin',
    time: '2 mins ago',
    timestamp: '2026-01-27T14:28:00Z'
  },
  { 
    type: 'lead_new', 
    message: 'New lead from Sea View Condo 1BR',
    user: 'System',
    time: '15 mins ago',
    timestamp: '2026-01-27T14:15:00Z'
  },
  { 
    type: 'sync_complete', 
    message: 'Google Sheet sync completed (18 updated)',
    user: 'System',
    time: '1 hour ago',
    timestamp: '2026-01-27T13:30:00Z'
  },
  { 
    type: 'lead_status', 
    message: 'Lead LEAD-002 marked as Assigned',
    user: 'Admin',
    time: '2 hours ago',
    timestamp: '2026-01-27T12:30:00Z'
  },
  { 
    type: 'property_publish', 
    message: 'Property PROP-DEMO-023 published',
    user: 'Admin',
    time: '3 hours ago',
    timestamp: '2026-01-27T11:30:00Z'
  },
  { 
    type: 'lead_new', 
    message: 'New lead from Luxury Villa 4BR',
    user: 'System',
    time: '4 hours ago',
    timestamp: '2026-01-27T10:30:00Z'
  },
  { 
    type: 'property_update', 
    message: 'Property PROP-DEMO-015 price updated',
    user: 'Admin',
    time: '5 hours ago',
    timestamp: '2026-01-27T09:30:00Z'
  },
  { 
    type: 'qa_report', 
    message: 'QA Report generated - 3 issues found',
    user: 'System',
    time: '6 hours ago',
    timestamp: '2026-01-27T08:30:00Z'
  }
];

// Helper functions for admin data
function getLeadsByStatus(status) {
  return MOCK_LEADS.filter(lead => lead.status === status);
}

function getRecentLeads(count = 5) {
  return MOCK_LEADS.slice(0, count);
}

function getLeadById(leadId) {
  return MOCK_LEADS.find(lead => lead.lead_id === leadId);
}

function getQAIssuesBySeverity(severity) {
  return MOCK_QA_ISSUES.filter(issue => issue.severity === severity);
}

function formatLeadStatus(status) {
  const statusMap = {
    'new': { label: 'New', class: 'status-new' },
    'assigned': { label: 'Assigned', class: 'status-assigned' },
    'contacted': { label: 'Contacted', class: 'status-contacted' },
    'closed': { label: 'Closed', class: 'status-closed' }
  };
  return statusMap[status] || { label: status, class: 'status-default' };
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Export for use in admin pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ADMIN_STATS,
    MOCK_LEADS,
    MOCK_QA_ISSUES,
    MOCK_ACTIVITIES,
    getLeadsByStatus,
    getRecentLeads,
    getLeadById,
    getQAIssuesBySeverity,
    formatLeadStatus,
    formatDateTime
  };
}
