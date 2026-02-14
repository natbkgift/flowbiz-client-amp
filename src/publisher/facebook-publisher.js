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
 * Publish a post to Facebook Page
 * @param {string} postId - ContentPost ID
 * @returns {Promise<Object>} Published post result
 */
async function publishPost(postId) {
  try {
    console.log(`📤 Publishing post: ${postId}`);
    
    // Load content post
    const post = await ContentPost.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Check if post is approved
    if (post.status !== 'approved') {
      throw new Error(`Post status is ${post.status}, must be approved`);
    }
    
    // Prepare Facebook post data
    const fbData = await prepareFacebookPost(post);
    
    // Publish to Facebook
    const fbPostId = await publishToFacebook(fbData);
    
    // Update content post
    post.status = 'published';
    post.published_at = new Date();
    post.fb_post_id = fbPostId;
    await post.save();
    
    console.log(`✅ Post published successfully: ${fbPostId}`);
    
    return {
      success: true,
      postId: post._id,
      fbPostId
    };
    
  } catch (error) {
    console.error(`❌ Publishing error:`, error);
    
    // Update post status to failed
    try {
      const post = await ContentPost.findById(postId);
      if (post) {
        post.status = 'failed';
        post.error_log = error.message;
        await post.save();
      }
    } catch (updateError) {
      console.error('Error updating failed post:', updateError);
    }
    
    throw error;
  }
}

/**
 * Prepare Facebook post data
 * @param {Object} post - ContentPost document
 * @returns {Promise<Object>} Facebook post data
 */
async function prepareFacebookPost(post) {
  const fullText = `${post.content_text}\n\n${post.hashtags.join(' ')}`;
  
  const fbData = {
    message: fullText
  };
  
  // Add photos if available
  if (post.media_urls && post.media_urls.length > 0) {
    fbData.attached_media = await uploadPhotos(post.media_urls);
  }
  
  return fbData;
}

/**
 * Upload photos to Facebook and get media IDs
 * @param {Array<string>} photoUrls - Array of photo URLs
 * @returns {Promise<Array>} Array of {media_fbid}
 */
async function uploadPhotos(photoUrls) {
  const uploadedPhotos = [];
  
  for (const photoUrl of photoUrls) {
    try {
      // Upload photo as unpublished
      const response = await axios.post(
        `${FB_GRAPH_URL}/${config.pageId}/photos`,
        {
          url: photoUrl,
          published: false,
          access_token: config.accessToken
        }
      );
      
      uploadedPhotos.push({
        media_fbid: response.data.id
      });
      
      console.log(`📷 Photo uploaded: ${response.data.id}`);
      
      // Small delay between uploads
      await delay(1000);
      
    } catch (error) {
      console.error(`Error uploading photo ${photoUrl}:`, error.message);
    }
  }
  
  return uploadedPhotos;
}

/**
 * Publish post to Facebook Page
 * @param {Object} fbData - Facebook post data
 * @returns {Promise<string>} Facebook post ID
 */
async function publishToFacebook(fbData) {
  try {
    const endpoint = `${FB_GRAPH_URL}/${config.pageId}/feed`;
    
    const params = {
      ...fbData,
      access_token: config.accessToken
    };
    
    const response = await axios.post(endpoint, params);
    
    return response.data.id;
    
  } catch (error) {
    console.error('Facebook API error:', error.response?.data || error.message);
    throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Auto-publish scheduler - checks every 15 minutes
 * Publishes approved posts whose publish time has passed
 */
function startAutoPublisher() {
  console.log('🕐 Starting auto-publisher scheduler (every 15 minutes)');
  
  // Run every 15 minutes: */15 * * * *
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('⏰ Running scheduled publishing check...');
      
      // Find approved posts ready to publish
      // Limit to 5 posts per run to avoid queue buildup while maintaining reasonable throughput
      // (5 posts × 5s delay = ~25s processing time, allowing up to 20 posts/hour if needed)
      const now = new Date();
      const posts = await ContentPost.find({
        status: 'approved',
        suggested_publish_time: { $lte: now }
      }).sort({ suggested_publish_time: 1 }).limit(5);
      
      if (posts.length === 0) {
        console.log('📭 No posts ready to publish');
        return;
      }
      
      console.log(`📬 Found ${posts.length} posts ready to publish`);
      
      // Publish each post with delay
      for (const post of posts) {
        try {
          await publishPost(post._id);
          
          // 5-second delay between posts to avoid rate limiting
          await delay(5000);
          
        } catch (error) {
          console.error(`Failed to publish post ${post._id}:`, error.message);
          // Continue with next post
        }
      }
      
      console.log('✅ Scheduled publishing completed');
      
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  });
  
  console.log('✅ Auto-publisher scheduler started');
}

/**
 * Manually approve a post for publishing
 * @param {string} postId - ContentPost ID
 * @returns {Promise<Object>}
 */
async function approvePost(postId) {
  const post = await ContentPost.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }
  
  if (post.status !== 'drafted') {
    throw new Error(`Post status is ${post.status}, can only approve drafted posts`);
  }
  
  post.status = 'approved';
  await post.save();
  
  console.log(`✅ Post approved: ${postId}`);
  
  return { success: true, postId: post._id };
}

/**
 * Get posts ready for review
 * @param {number} limit - Maximum number of posts
 * @returns {Promise<Array>}
 */
async function getPostsForReview(limit = 20) {
  return await ContentPost.find({
    status: 'drafted'
  })
  .populate('property_id')
  .sort({ createdAt: -1 })
  .limit(limit);
}

/**
 * Utility: delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  publishPost,
  startAutoPublisher,
  approvePost,
  getPostsForReview
};
