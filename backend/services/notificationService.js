const admin = require('firebase-admin');
const db = require('../db/db');
// Initialize Firebase Admin SDK
// You need to set these environment variables or use a service account JSON file
let firebaseApp;

try {
  // Initialize with Environment Variables (Secure)
  if (process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle newlines in private key correctly
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      })
    });
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    console.warn('⚠️ FIREBASE_PRIVATE_KEY not found. Notifications disabled.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// Notification types and templates
const NOTIFICATION_TYPES = {
  QUOTE_RECEIVED: {
    title: '💰 New Quote Received',
    getBody: (data) => `${data.artisan_name} quoted GHS ${(data.amount / 100).toFixed(2)} for your job`
  },
  QUOTE_ACCEPTED: {
    title: '✅ Your Quote Was Accepted!',
    getBody: (data) => `Client accepted your quote of GHS ${(data.amount / 100).toFixed(2)}. They will pay soon.`
  },
  QUOTE_REJECTED: {
    title: '❌ Quote Not Selected',
    getBody: (data) => `Client chose another artisan. ${data.reason || 'Keep trying!'}`
  },
  PAYMENT_SECURED: {
    title: '💰 Payment Secured - Start Work!',
    getBody: (data) => `GHS ${(data.amount / 100).toFixed(2)} secured in escrow. You can start working now.`
  },
  WORK_COMPLETED: {
    title: '✅ Work Completed',
    getBody: (data) => `${data.artisan_name} completed your job. Review and approve to release payment.`
  },
  PAYMENT_RELEASED: {
    title: '🎉 Payment Released!',
    getBody: (data) => `GHS ${(data.amount / 100).toFixed(2)} has been sent to your wallet.`
  },
  JOB_EXPIRED: {
    title: '⏰ Job Expired',
    getBody: (data) => `Your job "${data.job_description?.substring(0, 50)}..." was cancelled. ${data.reason}`
  },
  COUNTER_OFFER: {
    title: '💬 Counter-Offer Received',
    getBody: (data) => `${data.sender_name} proposed GHS ${(data.amount / 100).toFixed(2)}. Review and respond.`
  }
};

/**
 * Send a push notification via FCM
 * @param {string} fcmToken - Device FCM token
 * @param {string} notificationType - Type from NOTIFICATION_TYPES
 * @param {object} data - Notification data
 * @returns {Promise<string>} Message ID
 */
async function sendPushNotification(fcmToken, notificationType, data) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized. Skipping notification.');
    return null;
  }
  
  if (!fcmToken) {
    console.warn('No FCM token provided. Skipping notification.');
    return null;
  }
  
  const template = NOTIFICATION_TYPES[notificationType];
  if (!template) {
    throw new Error(`Unknown notification type: ${notificationType}`);
  }
  
  const message = {
    notification: {
      title: template.title,
      body: template.getBody(data)
    },
    data: {
      type: notificationType,
      ...data,
      click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
      timestamp: new Date().toISOString()
    },
    token: fcmToken,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'zolid_notifications'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };
  
  try {
    const response = await admin.messaging().send(message);
    console.log(`📬 Notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to send notification:', error.message);
    // Handle token errors (invalid, expired)
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn(`⚠️  Invalid FCM token: ${fcmToken}. Should be removed from database.`);
      // TODO: Remove invalid token from database
    }
    throw error;
  }
}

/**
 * Send notification to a user (looks up their FCM token)
 * @param {object} db - Database client
 * @param {string} userId - User ID
 * @param {string} userType - 'artisan' or 'client'
 * @param {string} notificationType - Type from NOTIFICATION_TYPES
 * @param {object} data - Notification data
 */
async function notifyUser(db, userId, userType, notificationType, data) {
  try {
    // Get user's FCM token
    const tableName = userType === 'artisan' ? 'artisan_profiles' : 'client_profiles';
    const result = await db.query(
      `SELECT fcm_token FROM ${tableName} WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.warn(`User ${userId} not found`);
      return null;
    }
    
    const fcmToken = result.rows[0].fcm_token;
    if (!fcmToken) {
      console.warn(`User ${userId} has no FCM token registered`);
      return null;
    }
    
    // Send notification
    const messageId = await sendPushNotification(fcmToken, notificationType, data);
    
    // Log notification in database
    await db.query(
      `INSERT INTO notifications (user_id, user_type, notification_type, title, body, data, fcm_message_id, delivered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        userType,
        notificationType,
        NOTIFICATION_TYPES[notificationType].title,
        NOTIFICATION_TYPES[notificationType].getBody(data),
        JSON.stringify(data),
        messageId,
        !!messageId
      ]
    );
    
    return messageId;
  } catch (error) {
    console.error(`Failed to notify user ${userId}:`, error.message);
    // Don't throw - notification failure shouldn't break the main flow
    return null;
  }
}

/**
 * Send notifications to multiple users
 * @param {object} db - Database client
 * @param {Array} recipients - Array of {userId, userType}
 * @param {string} notificationType - Type from NOTIFICATION_TYPES
 * @param {object} data - Notification data
 */
async function notifyMultipleUsers(db, recipients, notificationType, data) {
  const promises = recipients.map(recipient => 
    notifyUser(db, recipient.userId, recipient.userType, notificationType, data)
  );
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  
  console.log(`📬 Sent ${successful}/${recipients.length} notifications`);
  return results;
}

/**
 * Register/update a user's FCM token
 * @param {object} db - Database client
 * @param {string} userId - User ID
 * @param {string} userType - 'artisan' or 'client'
 * @param {string} fcmToken - FCM token from device
 */
async function registerFCMToken(db, userId, userType, fcmToken) {
  const tableName = userType === 'artisan' ? 'artisan_profiles' : 'client_profiles';
  
  await db.query(
    `UPDATE ${tableName} 
     SET fcm_token = $1, fcm_token_updated_at = NOW() 
     WHERE id = $2`,
    [fcmToken, userId]
  );
  
  console.log(`✅ FCM token registered for ${userType} ${userId}`);
}

/**
 * Remove a user's FCM token (logout, token expired)
 * @param {object} db - Database client
 * @param {string} userId - User ID
 * @param {string} userType - 'artisan' or 'client'
 */
async function removeFCMToken(db, userId, userType) {
  const tableName = userType === 'artisan' ? 'artisan_profiles' : 'client_profiles';
  
  await db.query(
    `UPDATE ${tableName} 
     SET fcm_token = NULL, fcm_token_updated_at = NOW() 
     WHERE id = $1`,
    [userId]
  );
  
  console.log(`✅ FCM token removed for ${userType} ${userId}`);
}

module.exports = {
  NOTIFICATION_TYPES,
  sendPushNotification,
  notifyUser,
  notifyMultipleUsers,
  registerFCMToken,
  removeFCMToken
};
