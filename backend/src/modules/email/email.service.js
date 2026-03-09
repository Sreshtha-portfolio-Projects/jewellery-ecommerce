const supabase = require('../../config/supabase');
const { Resend } = require('resend');

let resend;
try {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resend = new Resend(apiKey);
    console.log('Resend email service initialized successfully');
  } else {
    console.warn('RESEND_API_KEY not configured. Email marketing will be disabled.');
  }
} catch (error) {
  console.warn('Resend initialization skipped:', error.message);
  resend = null;
}

class EmailService {
  async addSubscriber(email, userId = null, source = 'manual', tags = []) {
    try {
      const subscriberData = {
        email: email.toLowerCase(),
        user_id: userId,
        source: source,
        tags: tags,
        status: 'active'
      };

      const { data: existing } = await supabase
        .from('email_subscribers')
        .select('id, status')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        if (existing.status === 'unsubscribed') {
          const { data, error } = await supabase
            .from('email_subscribers')
            .update({ 
              status: 'active', 
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null,
              tags: tags
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
        return existing;
      }

      const { data, error } = await supabase
        .from('email_subscribers')
        .insert([subscriberData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }

  async unsubscribe(email) {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase())
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  async getSubscribers({ page = 1, limit = 50, status, source, search }) {
    try {
      let query = supabase
        .from('email_subscribers')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (source) {
        query = query.eq('source', source);
      }

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        subscribers: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
  }

  async getTemplates() {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async getTemplateById(id) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id, templateData) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const { data: template } = await supabase
        .from('email_templates')
        .select('is_system')
        .eq('id', id)
        .single();

      if (template && template.is_system) {
        throw new Error('Cannot delete system templates');
      }

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async createCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async updateCampaign(id, campaignData) {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(campaignData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  async getCampaigns({ page = 1, limit = 10, status }) {
    try {
      let query = supabase
        .from('email_campaigns')
        .select('*, email_templates(name)', { count: 'exact' });

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
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, html, from = null) {
    if (!resend) {
      console.warn('Resend not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html
      });

      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCampaign(campaignId) {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*, email_templates(*)')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      if (campaign.status === 'sent') {
        throw new Error('Campaign already sent');
      }

      await supabase
        .from('email_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      let query = supabase
        .from('email_subscribers')
        .select('id, email, user_id')
        .eq('status', 'active');

      switch (campaign.audience) {
        case 'customers':
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
            throw new Error('No cart abandoners found');
          }
          break;
      }

      const { data: subscribers, error: subError } = await query;

      if (subError) throw subError;

      if (!subscribers || subscribers.length === 0) {
        throw new Error('No subscribers found for the selected audience');
      }

      const htmlContent = campaign.html_content || campaign.email_templates?.html || '';
      let sentCount = 0;
      let bouncedCount = 0;

      for (const subscriber of subscribers) {
        const result = await this.sendEmail(
          subscriber.email,
          campaign.subject,
          htmlContent
        );

        const logData = {
          campaign_id: campaignId,
          subscriber_id: subscriber.id,
          email: subscriber.email,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null
        };

        await supabase.from('email_logs').insert([logData]);

        if (result.success) {
          sentCount++;
        } else {
          bouncedCount++;
        }
      }

      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          bounced_count: bouncedCount
        })
        .eq('id', campaignId);

      return { success: true, sent: sentCount, bounced: bouncedCount };
    } catch (error) {
      console.error('Error sending campaign:', error);
      
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

      throw error;
    }
  }

  async getCampaignAnalytics() {
    try {
      const { data, error } = await supabase
        .from('email_campaign_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  async trackEmailOpen(campaignId, subscriberId) {
    try {
      await supabase
        .from('email_logs')
        .update({ 
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('subscriber_id', subscriberId)
        .eq('status', 'sent');

      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('opened_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await supabase
          .from('email_campaigns')
          .update({ opened_count: (campaign.opened_count || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  async trackEmailClick(campaignId, subscriberId) {
    try {
      await supabase
        .from('email_logs')
        .update({ 
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('subscriber_id', subscriberId);

      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('clicked_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await supabase
          .from('email_campaigns')
          .update({ clicked_count: (campaign.clicked_count || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('Error tracking email click:', error);
    }
  }

  replaceVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  async sendTemplateEmail(to, templateName, variables = {}) {
    try {
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .single();

      if (error) throw error;

      const subject = this.replaceVariables(template.subject, variables);
      const html = this.replaceVariables(template.html, variables);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending template email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, customerName, discountCode) {
    return await this.sendTemplateEmail(email, 'Welcome Email', {
      customer_name: customerName,
      discount_code: discountCode
    });
  }

  async sendBlogNotification(email, blogTitle, blogExcerpt, blogUrl) {
    return await this.sendTemplateEmail(email, 'New Blog Notification', {
      blog_title: blogTitle,
      blog_excerpt: blogExcerpt,
      blog_url: blogUrl
    });
  }

  async sendAbandonedCartEmail(email, customerName, cartUrl) {
    return await this.sendTemplateEmail(email, 'Abandoned Cart Reminder', {
      customer_name: customerName,
      cart_url: cartUrl
    });
  }

  async getSubscriberStats() {
    try {
      const { data: stats, error } = await supabase
        .from('email_subscribers')
        .select('status, source')
        .then(result => {
          if (result.error) throw result.error;
          
          const data = result.data || [];
          const grouped = {
            total: data.length,
            active: data.filter(s => s.status === 'active').length,
            unsubscribed: data.filter(s => s.status === 'unsubscribed').length,
            bounced: data.filter(s => s.status === 'bounced').length,
            bySource: {}
          };

          data.forEach(sub => {
            if (sub.source) {
              grouped.bySource[sub.source] = (grouped.bySource[sub.source] || 0) + 1;
            }
          });

          return { data: grouped, error: null };
        });

      if (error) throw error;
      return stats;
    } catch (error) {
      console.error('Error fetching subscriber stats:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
