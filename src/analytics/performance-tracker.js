const axios = require('axios');
const cron = require('node-cron');
const ContentPost = require('../models/ContentPost');

const FB_API_VERSION = 'v19.0';
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// Facebook API configuration
const config = {
  pageId: process.env.FB_PAGE_ID,
  accessToken: process.env.FB_PAGE_ACCESS_TOKEN
};

/**
 * Fetch Facebook post insights
 * @param {string} fbPostId - Facebook post ID
 * @returns {Promise<Object>} Post insights
 */
async function fetchPostInsights(fbPostId) {
  try {
    // Request post insights
    const response = await axios.get(
      `${FB_GRAPH_URL}/${fbPostId}/insights`,
      {
        params: {
          metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total',
          access_token: config.accessToken
        }
      }
    );
    
    const insights = response.data.data || [];
    
    // Also get post engagement data
    const postData = await axios.get(
      `${FB_GRAPH_URL}/${fbPostId}`,
      {
        params: {
          fields: 'shares,comments',
          access_token: config.accessToken
        }
      }
    );
    
    // Parse insights
    const analytics = parseInsights(insights, postData.data);
    
    return analytics;
    
  } catch (error) {
    console.error(`Error fetching insights for ${fbPostId}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Parse Facebook insights data
 * @param {Array} insights - Raw insights data
 * @param {Object} postData - Post data (shares, comments)
 * @returns {Object} Parsed analytics
 */
function parseInsights(insights, postData) {
  const analytics = {
    reach: 0,
    engagement: 0,
    clicks: 0,
    reactions: 0,
    shares: postData.shares?.count || 0,
    comments: postData.comments?.summary?.total_count || 0
  };
  
  insights.forEach(metric => {
    const value = metric.values[0]?.value || 0;
    
    switch (metric.name) {
      case 'post_impressions':
        analytics.reach = value;
        break;
      case 'post_engaged_users':
        analytics.engagement = value;
        break;
      case 'post_clicks':
        analytics.clicks = value;
        break;
      case 'post_reactions_by_type_total':
        // Sum all reaction types, guarding against non-object values
        analytics.reactions = (typeof value === 'object' && value)
          ? Object.values(value).reduce((sum, count) => sum + count, 0)
          : 0;
        break;
    }
  });
  
  return analytics;
}

/**
 * Update analytics for a single post
 * @param {string} postId - ContentPost ID
 * @returns {Promise<Object>}
 */
async function updatePostAnalytics(postId) {
  try {
    const post = await ContentPost.findById(postId);
    
    if (!post || post.status !== 'published' || !post.fb_post_id) {
      return { success: false, reason: 'Post not published' };
    }
    
    // Fetch insights from Facebook
    const analytics = await fetchPostInsights(post.fb_post_id);
    
    if (!analytics) {
      return { success: false, reason: 'Failed to fetch insights' };
    }
    
    // Update post analytics
    post.analytics = analytics;
    await post.save();
    
    console.log(`✅ Analytics updated for post: ${postId}`);
    
    return { success: true, analytics };
    
  } catch (error) {
    console.error(`Error updating analytics for ${postId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Auto-update analytics for recent posts
 * Runs every 6 hours, updates posts from last 7 days
 */
function startInsightsTracker() {
  console.log('📊 Starting insights tracker (every 6 hours)');
  
  // Run every 6 hours: 0 */6 * * *
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('⏰ Running scheduled insights update...');
      
      // Find published posts from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const posts = await ContentPost.find({
        status: 'published',
        published_at: { $gte: sevenDaysAgo },
        fb_post_id: { $exists: true, $ne: null }
      });
      
      console.log(`📈 Updating analytics for ${posts.length} posts`);
      
      // Update analytics for each post
      for (const post of posts) {
        await updatePostAnalytics(post._id);
        
        // Small delay to avoid rate limiting
        await delay(2000);
      }
      
      console.log('✅ Insights update completed');
      
    } catch (error) {
      console.error('❌ Insights tracker error:', error);
    }
  });
  
  console.log('✅ Insights tracker started');
}

/**
 * Generate weekly performance report
 * @param {Date} startDate - Start date (default: 7 days ago)
 * @param {Date} endDate - End date (default: now)
 * @returns {Promise<Object>} Performance report
 */
async function generateWeeklyReport(startDate, endDate) {
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  }
  
  if (!endDate) {
    endDate = new Date();
  }
  
  console.log(`📊 Generating report from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  
  // Find all published posts in date range
  const posts = await ContentPost.find({
    status: 'published',
    published_at: { $gte: startDate, $lte: endDate }
  }).populate('property_id');
  
  // Calculate total metrics
  const totals = {
    posts: posts.length,
    reach: 0,
    engagement: 0,
    clicks: 0,
    reactions: 0,
    shares: 0,
    comments: 0,
    leads: 0
  };
  
  // Category breakdown
  const byCategory = {};
  const byLanguage = {};
  
  posts.forEach(post => {
    // Add to totals
    totals.reach += post.analytics.reach || 0;
    totals.engagement += post.analytics.engagement || 0;
    totals.clicks += post.analytics.clicks || 0;
    totals.reactions += post.analytics.reactions || 0;
    totals.shares += post.analytics.shares || 0;
    totals.comments += post.analytics.comments || 0;
    totals.leads += post.analytics.leads_generated || 0;
    
    // Category breakdown
    if (!byCategory[post.category]) {
      byCategory[post.category] = {
        count: 0,
        reach: 0,
        engagement: 0
      };
    }
    byCategory[post.category].count++;
    byCategory[post.category].reach += post.analytics.reach || 0;
    byCategory[post.category].engagement += post.analytics.engagement || 0;
    
    // Language breakdown
    if (!byLanguage[post.language]) {
      byLanguage[post.language] = {
        count: 0,
        reach: 0,
        engagement: 0
      };
    }
    byLanguage[post.language].count++;
    byLanguage[post.language].reach += post.analytics.reach || 0;
    byLanguage[post.language].engagement += post.analytics.engagement || 0;
  });
  
  // Calculate engagement rate
  const engagementRate = totals.reach > 0 
    ? ((totals.engagement / totals.reach) * 100).toFixed(2)
    : 0;
  
  // Top 5 performing posts
  const topPosts = posts
    .sort((a, b) => (b.analytics.engagement || 0) - (a.analytics.engagement || 0))
    .slice(0, 5)
    .map(post => ({
      id: post._id,
      category: post.category,
      language: post.language,
      engagement: post.analytics.engagement,
      reach: post.analytics.reach,
      published_at: post.published_at
    }));
  
  const report = {
    period: {
      start: startDate,
      end: endDate
    },
    totals,
    engagementRate: `${engagementRate}%`,
    byCategory,
    byLanguage,
    topPosts
  };
  
  console.log('✅ Report generated');
  console.log(`📊 Total Posts: ${totals.posts}`);
  console.log(`👥 Total Reach: ${totals.reach.toLocaleString()}`);
  console.log(`💬 Total Engagement: ${totals.engagement.toLocaleString()}`);
  console.log(`📈 Engagement Rate: ${engagementRate}%`);
  
  return report;
}

/**
 * Utility: delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  fetchPostInsights,
  updatePostAnalytics,
  startInsightsTracker,
  generateWeeklyReport
};
