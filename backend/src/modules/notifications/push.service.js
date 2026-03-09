const supabase = require('../../config/supabase');
let admin;

try {
  admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase service account not configured. Push notifications will be disabled.');
    }
  }
} catch (error) {
  console.warn('Firebase Admin initialization skipped:', error.message);
  admin = null;
}

class PushService {
  async registerToken(userId, token, deviceInfo = {}) {
    try {
      const tokenData = {
        user_id: userId,
        token: token,
        device: deviceInfo.device || null,
        browser: deviceInfo.browser || null,
        os: deviceInfo.os || null,
        is_active: true,
        last_used_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('token', token)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('push_tokens')
          .update({ ...tokenData, id: existing.id })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('push_tokens')
        .insert([tokenData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  async unregisterToken(token) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('token', token);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }

  async getActiveTokens(audience = 'all', customFilter = null) {
    try {
      let query = supabase
        .from('push_tokens')
        .select('*, auth.users!inner(id, email, raw_user_meta_data)')
        .eq('is_active', true);

      switch (audience) {
        case 'logged_in':
          query = query.not('user_id', 'is', null);
          break;
        case 'vip':
          query = query.not('user_id', 'is', null);
          break;
        case 'cart_abandoners':
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
          const { data: abandonedCarts } = await supabase
            .from('cart_activity')
            .select('user_id')
            .lt('last_activity', twoHoursAgo)
            .not('user_id', 'is', null);
          
          if (abandonedCarts && abandonedCarts.length > 0) {
            const userIds = abandonedCarts.map(c => c.user_id);
            query = query.in('user_id', userIds);
          } else {
            return [];
          }
          break;
        case 'custom':
          if (customFilter) {
          }
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active tokens:', error);
      throw error;
    }
  }

  async sendPushNotification(tokens, title, message, data = {}) {
    if (!admin || !admin.apps.length) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return { success: false, error: 'Firebase not configured', sent: 0, failed: tokens.length };
    }

    try {
      const messaging = admin.messaging();
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };

      const messages = tokens.map(token => ({
        token: typeof token === 'string' ? token : token.token,
        notification: {
          title: title,
          body: message,
          ...(data.image && { imageUrl: data.image })
        },
        data: {
          ...(data.redirect_url && { url: data.redirect_url }),
          ...data
        },
        webpush: data.image ? {
          headers: {
            TTL: '86400'
          },
          notification: {
            icon: data.image
          }
        } : undefined
      }));

      const batchSize = 500;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        try {
          const response = await messaging.sendEach(batch);
          results.sent += response.successCount;
          results.failed += response.failureCount;

          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              results.errors.push({
                token: batch[idx].token,
                error: resp.error?.message || 'Unknown error'
              });
            }
          });
        } catch (error) {
          console.error('Error sending batch:', error);
          results.failed += batch.length;
        }
      }

      return { success: true, ...results };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { success: false, error: error.message, sent: 0, failed: tokens.length };
    }
  }

  async createCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('push_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating push campaign:', error);
      throw error;
    }
  }

  async updateCampaign(id, campaignData) {
    try {
      const { data, error } = await supabase
        .from('push_campaigns')
        .update(campaignData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating push campaign:', error);
      throw error;
    }
  }

  async getCampaigns({ page = 1, limit = 10, status }) {
    try {
      let query = supabase
        .from('push_campaigns')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        campaigns: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching push campaigns:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId) {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('push_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      if (campaign.status === 'sent') {
        throw new Error('Campaign already sent');
      }

      const tokens = await this.getActiveTokens(campaign.audience, campaign.custom_audience_filter);

      if (tokens.length === 0) {
        throw new Error('No active tokens found for the selected audience');
      }

      const result = await this.sendPushNotification(
        tokens,
        campaign.title,
        campaign.message,
        {
          image: campaign.image,
          redirect_url: campaign.redirect_url
        }
      );

      await supabase
        .from('push_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: result.sent
        })
        .eq('id', campaignId);

      for (const token of tokens) {
        const isError = result.errors.some(e => e.token === (typeof token === 'string' ? token : token.token));
        await supabase
          .from('push_logs')
          .insert([{
            campaign_id: campaignId,
            user_id: typeof token === 'object' ? token.user_id : null,
            token_id: typeof token === 'object' ? token.id : null,
            status: isError ? 'failed' : 'sent',
            error_message: isError ? result.errors.find(e => e.token === (typeof token === 'string' ? token : token.token))?.error : null
          }]);
      }

      return { success: true, sent: result.sent, failed: result.failed };
    } catch (error) {
      console.error('Error sending campaign:', error);
      
      await supabase
        .from('push_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

      throw error;
    }
  }

  async getCampaignAnalytics() {
    try {
      const { data, error } = await supabase
        .from('push_campaign_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  async trackClick(campaignId, userId) {
    try {
      await supabase
        .from('push_logs')
        .update({ 
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId);

      const { data: campaign } = await supabase
        .from('push_campaigns')
        .select('click_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await supabase
          .from('push_campaigns')
          .update({ click_count: (campaign.click_count || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('Error tracking push click:', error);
    }
  }
}

module.exports = new PushService();
