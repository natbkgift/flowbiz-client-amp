/**
 * LineIntegration.gs
 * 
 * LINE Messaging API Integration
 * ส่งรายงานและการแจ้งเตือนผ่าน LINE
 */

/**
 * Get LINE configuration from Script Properties
 * 
 * @returns {Object} LINE configuration object
 * @throws {Error} If configuration not found
 */
function getLINEConfig() {
  loadConfig(); // Load from Script Properties
  
  if (!CONFIG.LINE.CHANNEL_ACCESS_TOKEN || !CONFIG.LINE.GROUP_ID) {
    throw new Error('LINE configuration not found. Please set LINE_CHANNEL_ACCESS_TOKEN and LINE_GROUP_ID in Script Properties.');
  }
  
  return {
    channelAccessToken: CONFIG.LINE.CHANNEL_ACCESS_TOKEN,
    groupId: CONFIG.LINE.GROUP_ID,
    apiEndpoint: CONFIG.LINE.API_ENDPOINT
  };
}

/**
 * Set LINE configuration programmatically
 * 
 * @param {string} token - LINE Channel Access Token
 * @param {string} groupId - LINE Group ID
 */
function setLINEConfig(token, groupId) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('LINE_CHANNEL_ACCESS_TOKEN', token);
  props.setProperty('LINE_GROUP_ID', groupId);
  
  Logger.log('✓ LINE configuration updated');
}

/**
 * Send plain text message to LINE
 * 
 * @param {string} message - Message text to send
 * @returns {boolean} True if successful
 */
function sendLINEMessage(message) {
  try {
    const config = getLINEConfig();
    
    const payload = {
      to: config.groupId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + config.channelAccessToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(config.apiEndpoint, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      debugLog('LINE message sent successfully');
      return true;
    } else {
      Logger.log('LINE API error: ' + responseCode);
      Logger.log('Response: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('Error sending LINE message: ' + error.message);
    return false;
  }
}

/**
 * Send Flex Message to LINE
 * 
 * @param {string} altText - Alternative text for notification
 * @param {Object} flexContent - Flex Message JSON content
 * @returns {boolean} True if successful
 */
function sendLINEFlexMessage(altText, flexContent) {
  try {
    const config = getLINEConfig();
    
    const payload = {
      to: config.groupId,
      messages: [
        {
          type: 'flex',
          altText: altText,
          contents: flexContent
        }
      ]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + config.channelAccessToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(config.apiEndpoint, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      debugLog('LINE Flex message sent successfully');
      return true;
    } else {
      Logger.log('LINE API error: ' + responseCode);
      Logger.log('Response: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('Error sending LINE Flex message: ' + error.message);
    return false;
  }
}

/**
 * Send daily report to LINE
 * 
 * @param {Object} reportData - Report data object
 * @returns {boolean} True if successful
 */
function sendDailyReportToLINE(reportData) {
  try {
    const today = formatThaiDate(new Date());
    
    // Create Flex Message
    const flexContent = {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 รายงานประจำวัน',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: today,
            size: 'sm',
            color: '#ffffff',
            margin: 'sm'
          }
        ],
        backgroundColor: '#0066FF',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🆕 Leads ใหม่เมื่อวาน',
                weight: 'bold',
                size: 'md',
                color: '#111111'
              },
              {
                type: 'text',
                text: reportData.newLeadsYesterday + ' leads',
                size: 'xxl',
                weight: 'bold',
                color: '#0066FF',
                margin: 'sm'
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '📋 Follow-up วันนี้',
                weight: 'bold',
                size: 'md',
                margin: 'lg'
              },
              {
                type: 'text',
                text: reportData.todayFollowUps + ' leads',
                size: 'xl',
                weight: 'bold',
                color: '#FF6B00',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🔥 Hot Leads',
                weight: 'bold',
                size: 'md',
                margin: 'lg'
              },
              {
                type: 'text',
                text: reportData.hotLeadsCount + ' leads',
                size: 'xl',
                weight: 'bold',
                color: '#FF0000',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: 'Total Active:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: reportData.totalActiveLeads + ' leads',
                size: 'sm',
                color: '#111111',
                align: 'end'
              }
            ],
            margin: 'lg'
          }
        ],
        paddingAll: '15px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Have a productive day! 💪',
            size: 'xs',
            color: '#888888',
            align: 'center'
          }
        ],
        backgroundColor: '#f5f5f5',
        paddingAll: '10px'
      }
    };
    
    return sendLINEFlexMessage('รายงานประจำวัน - ' + today, flexContent);
  } catch (error) {
    Logger.log('Error sending daily report to LINE: ' + error.message);
    return false;
  }
}

/**
 * Send weekly report to LINE
 * 
 * @param {Object} metrics - Weekly metrics object
 * @returns {boolean} True if successful
 */
function sendWeeklyReportToLINE(metrics) {
  try {
    const weekRange = getLastWeekRange();
    const weekText = formatThaiDate(weekRange.start, false) + ' - ' + formatThaiDate(weekRange.end);
    
    // Create Flex Message
    const flexContent = {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📈 รายงานประจำสัปดาห์',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: weekText,
            size: 'sm',
            color: '#ffffff',
            margin: 'sm'
          }
        ],
        backgroundColor: '#27AE60',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: 'Leads ใหม่:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: metrics.newLeads + ' leads',
                size: 'sm',
                color: '#111111',
                weight: 'bold',
                align: 'end'
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: 'Converted:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: metrics.converted + ' leads',
                size: 'sm',
                color: '#27AE60',
                weight: 'bold',
                align: 'end'
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: 'Conversion Rate:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: metrics.conversionRate,
                size: 'sm',
                color: '#111111',
                weight: 'bold',
                align: 'end'
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'text',
            text: '👥 Top Performers',
            weight: 'bold',
            size: 'md',
            margin: 'lg'
          },
          ...createTopPerformersContent(metrics.topAgents),
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'text',
            text: '📱 Top Sources',
            weight: 'bold',
            size: 'md',
            margin: 'lg'
          },
          ...createTopSourcesContent(metrics.topSources)
        ],
        paddingAll: '15px'
      }
    };
    
    return sendLINEFlexMessage('รายงานประจำสัปดาห์', flexContent);
  } catch (error) {
    Logger.log('Error sending weekly report to LINE: ' + error.message);
    return false;
  }
}

/**
 * Helper: Create top performers content for Flex Message
 * 
 * @param {Array} topAgents - Array of top agents
 * @returns {Array} Flex Message box contents
 */
function createTopPerformersContent(topAgents) {
  if (!topAgents || topAgents.length === 0) {
    return [
      {
        type: 'text',
        text: 'ไม่มีข้อมูล',
        size: 'sm',
        color: '#666666',
        margin: 'sm'
      }
    ];
  }
  
  return topAgents.slice(0, 3).map((agent, index) => ({
    type: 'box',
    layout: 'baseline',
    contents: [
      {
        type: 'text',
        text: (index + 1) + '. ' + agent.name,
        size: 'sm',
        color: '#111111',
        flex: 2
      },
      {
        type: 'text',
        text: agent.leads + ' leads',
        size: 'sm',
        color: '#666666',
        align: 'end',
        flex: 1
      }
    ],
    margin: 'sm'
  }));
}

/**
 * Helper: Create top sources content for Flex Message
 * 
 * @param {Array} topSources - Array of top sources
 * @returns {Array} Flex Message box contents
 */
function createTopSourcesContent(topSources) {
  if (!topSources || topSources.length === 0) {
    return [
      {
        type: 'text',
        text: 'ไม่มีข้อมูล',
        size: 'sm',
        color: '#666666',
        margin: 'sm'
      }
    ];
  }
  
  return topSources.slice(0, 3).map((source, index) => ({
    type: 'box',
    layout: 'baseline',
    contents: [
      {
        type: 'text',
        text: (index + 1) + '. ' + source.name,
        size: 'sm',
        color: '#111111',
        flex: 2
      },
      {
        type: 'text',
        text: source.count + ' leads',
        size: 'sm',
        color: '#666666',
        align: 'end',
        flex: 1
      }
    ],
    margin: 'sm'
  }));
}

/**
 * Send overdue leads alert to LINE
 * 
 * @param {Array} overdueLeads - Array of overdue lead objects
 * @returns {boolean} True if successful
 */
function sendOverdueAlert(overdueLeads) {
  try {
    if (!overdueLeads || overdueLeads.length === 0) {
      Logger.log('No overdue leads to alert');
      return true;
    }
    
    const today = formatThaiDate(new Date());
    const count = overdueLeads.length;
    
    // Create Flex Message
    const flexContent = {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⚠️ Overdue Follow-ups',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: today,
            size: 'sm',
            color: '#ffffff',
            margin: 'sm'
          }
        ],
        backgroundColor: '#FF3333',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'มี ' + count + ' leads ที่เลยกำหนด follow-up',
            weight: 'bold',
            size: 'lg',
            color: '#FF3333',
            wrap: true
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          ...createOverdueLeadsContent(overdueLeads.slice(0, 5))
        ],
        paddingAll: '15px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: count > 5 ? 'แสดง 5 leads แรก' : 'แสดงทั้งหมด',
            size: 'xs',
            color: '#888888',
            align: 'center'
          }
        ],
        backgroundColor: '#f5f5f5',
        paddingAll: '10px'
      }
    };
    
    return sendLINEFlexMessage('⚠️ Overdue Leads Alert', flexContent);
  } catch (error) {
    Logger.log('Error sending overdue alert: ' + error.message);
    return false;
  }
}

/**
 * Helper: Create overdue leads content for Flex Message
 * 
 * @param {Array} leads - Array of overdue leads (max 5)
 * @returns {Array} Flex Message box contents
 */
function createOverdueLeadsContent(leads) {
  return leads.map(lead => ({
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: '🔴 ' + lead.name,
        weight: 'bold',
        size: 'sm',
        color: '#111111'
      },
      {
        type: 'text',
        text: 'Priority: ' + lead.priority + ' | Agent: ' + lead.agent,
        size: 'xs',
        color: '#666666',
        margin: 'xs'
      },
      {
        type: 'text',
        text: 'Overdue: ' + lead.daysOverdue + ' days',
        size: 'xs',
        color: '#FF3333',
        margin: 'xs'
      }
    ],
    margin: 'lg',
    paddingAll: '10px',
    backgroundColor: '#FFF5F5',
    cornerRadius: '5px'
  }));
}

/**
 * Send error notification to LINE
 * 
 * @param {Error|string} error - Error object or message
 * @returns {boolean} True if successful
 */
function sendErrorNotification(error) {
  try {
    if (!CONFIG.FEATURES.ENABLE_ERROR_NOTIFICATIONS) {
      return false;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    const message = '🚨 *System Error*\n\n' +
      '*Time:* ' + timestamp + '\n' +
      '*Error:* ' + errorMessage + '\n\n' +
      'Please check Apps Script execution logs.';
    
    return sendLINEMessage(message);
  } catch (err) {
    Logger.log('Error sending error notification: ' + err.message);
    return false;
  }
}

/**
 * Test LINE connection
 * Sends a simple test message to verify configuration
 * 
 * @returns {boolean} True if successful
 */
function testLINEConnection() {
  try {
    Logger.log('Testing LINE connection...');
    
    const config = getLINEConfig();
    Logger.log('✓ Configuration loaded');
    Logger.log('  - Group ID: ' + config.groupId);
    
    const testMessage = '✅ LINE Integration Test\n\n' +
      'การเชื่อมต่อ LINE ทำงานเรียบร้อย!\n' +
      'ระบบพร้อมส่งรายงานอัตโนมัติ\n\n' +
      'Time: ' + formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    const result = sendLINEMessage(testMessage);
    
    if (result) {
      Logger.log('✓ Test message sent successfully');
      Logger.log('Please check your LINE group for the test message');
    } else {
      Logger.log('✗ Failed to send test message');
      Logger.log('Please check your configuration and try again');
    }
    
    return result;
  } catch (error) {
    Logger.log('✗ LINE connection test failed: ' + error.message);
    return false;
  }
}

/**
 * TEST FUNCTION: Test daily report with sample data
 */
function testDailyReportMessage() {
  const sampleData = {
    newLeadsYesterday: 12,
    todayFollowUps: 8,
    hotLeadsCount: 5,
    totalActiveLeads: 47
  };
  
  Logger.log('Sending test daily report...');
  return sendDailyReportToLINE(sampleData);
}

/**
 * TEST FUNCTION: Test weekly report with sample data
 */
function testWeeklyReportMessage() {
  const sampleMetrics = {
    newLeads: 45,
    converted: 3,
    conversionRate: '6.7%',
    topAgents: [
      { name: 'Somchai S.', leads: 15 },
      { name: 'Nittaya P.', leads: 12 },
      { name: 'David L.', leads: 10 }
    ],
    topSources: [
      { name: 'Facebook', count: 18 },
      { name: 'Google Ads', count: 12 },
      { name: 'LINE', count: 8 }
    ]
  };
  
  Logger.log('Sending test weekly report...');
  return sendWeeklyReportToLINE(sampleMetrics);
}

/**
 * TEST FUNCTION: Test overdue alert with sample data
 */
function testOverdueAlertMessage() {
  const sampleLeads = [
    {
      name: 'John Smith',
      priority: 'Hot',
      agent: 'Somchai S.',
      daysOverdue: 3
    },
    {
      name: 'Jane Doe',
      priority: 'Warm',
      agent: 'Nittaya P.',
      daysOverdue: 5
    }
  ];
  
  Logger.log('Sending test overdue alert...');
  return sendOverdueAlert(sampleLeads);
}
