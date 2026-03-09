const supabase = require('../../config/supabase');
const emailService = require('../email/email.service');
const pushService = require('./push.service');

class AutomationService {
  async getActiveRules(triggerType) {
    try {
      const { data, error } = await supabase
        .from('marketing_automation_rules')
        .select('*')
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      return [];
    }
  }

  async triggerAutomation(triggerType, triggerData) {
    try {
      const rules = await this.getActiveRules(triggerType);

      if (rules.length === 0) {
        console.log(`No active automation rules for trigger: ${triggerType}`);
        return;
      }

      for (const rule of rules) {
        if (rule.delay_minutes > 0) {
          await this.scheduleAutomation(rule, triggerData);
        } else {
          await this.executeAutomation(rule, triggerData);
        }
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
    }
  }

  async scheduleAutomation(rule, triggerData) {
    try {
      await supabase
        .from('automation_logs')
        .insert([{
          rule_id: rule.id,
          trigger_data: triggerData,
          user_id: triggerData.user_id || null,
          status: 'pending'
        }]);

      console.log(`Automation scheduled: ${rule.name} (delay: ${rule.delay_minutes} minutes)`);
    } catch (error) {
      console.error('Error scheduling automation:', error);
    }
  }

  async executeAutomation(rule, triggerData) {
    try {
      const logData = {
        rule_id: rule.id,
        trigger_data: triggerData,
        user_id: triggerData.user_id || null,
        status: 'executed',
        executed_at: new Date().toISOString()
      };

      if (rule.action_type === 'send_email' || rule.action_type === 'both') {
        await this.executeEmailAction(rule, triggerData);
      }

      if (rule.action_type === 'send_push' || rule.action_type === 'both') {
        await this.executePushAction(rule, triggerData);
      }

      await supabase
        .from('automation_logs')
        .insert([logData]);

      console.log(`Automation executed: ${rule.name}`);
    } catch (error) {
      console.error('Error executing automation:', error);
      
      await supabase
        .from('automation_logs')
        .insert([{
          rule_id: rule.id,
          trigger_data: triggerData,
          user_id: triggerData.user_id || null,
          status: 'failed',
          error_message: error.message
        }]);
    }
  }

  async executeEmailAction(rule, triggerData) {
    try {
      if (!rule.email_template_id) {
        console.warn('No email template configured for rule:', rule.name);
        return;
      }

      const template = await emailService.getTemplateById(rule.email_template_id);
      
      if (!template) {
        console.warn('Email template not found:', rule.email_template_id);
        return;
      }

      let recipients = [];

      switch (rule.trigger_type) {
        case 'user_signup':
          if (triggerData.email) {
            recipients.push(triggerData.email);
          }
          break;

        case 'blog_published':
          const { data: subscribers } = await supabase
            .from('email_subscribers')
            .select('email')
            .eq('status', 'active');
          
          if (subscribers) {
            recipients = subscribers.map(s => s.email);
          }
          break;

        case 'cart_abandoned':
          if (triggerData.email) {
            recipients.push(triggerData.email);
          }
          break;

        default:
          console.warn('Unknown trigger type for email:', rule.trigger_type);
          return;
      }

      const variables = this.buildEmailVariables(rule.trigger_type, triggerData);

      for (const email of recipients) {
        const subject = emailService.replaceVariables(template.subject, variables);
        const html = emailService.replaceVariables(template.html, variables);
        await emailService.sendEmail(email, subject, html);
      }

      console.log(`Email sent to ${recipients.length} recipients for rule: ${rule.name}`);
    } catch (error) {
      console.error('Error executing email action:', error);
      throw error;
    }
  }

  async executePushAction(rule, triggerData) {
    try {
      if (!rule.push_title || !rule.push_message) {
        console.warn('No push notification configured for rule:', rule.name);
        return;
      }

      let audience = 'all';

      switch (rule.trigger_type) {
        case 'user_signup':
          if (triggerData.user_id) {
            const { data: tokens } = await supabase
              .from('push_tokens')
              .select('token')
              .eq('user_id', triggerData.user_id)
              .eq('is_active', true);

            if (tokens && tokens.length > 0) {
              await pushService.sendPushNotification(
                tokens.map(t => t.token),
                rule.push_title,
                rule.push_message,
                {
                  image: rule.push_image,
                  redirect_url: rule.push_redirect_url
                }
              );
            }
          }
          return;

        case 'blog_published':
          audience = 'all';
          break;

        case 'cart_abandoned':
          if (triggerData.user_id) {
            const { data: tokens } = await supabase
              .from('push_tokens')
              .select('token')
              .eq('user_id', triggerData.user_id)
              .eq('is_active', true);

            if (tokens && tokens.length > 0) {
              await pushService.sendPushNotification(
                tokens.map(t => t.token),
                rule.push_title,
                rule.push_message,
                {
                  image: rule.push_image,
                  redirect_url: rule.push_redirect_url
                }
              );
            }
          }
          return;

        default:
          console.warn('Unknown trigger type for push:', rule.trigger_type);
          return;
      }

      const tokens = await pushService.getActiveTokens(audience);
      
      if (tokens.length > 0) {
        const variables = this.buildPushVariables(rule.trigger_type, triggerData);
        const title = this.replaceVariables(rule.push_title, variables);
        const message = this.replaceVariables(rule.push_message, variables);

        await pushService.sendPushNotification(
          tokens,
          title,
          message,
          {
            image: rule.push_image,
            redirect_url: rule.push_redirect_url
          }
        );

        console.log(`Push notification sent to ${tokens.length} devices for rule: ${rule.name}`);
      }
    } catch (error) {
      console.error('Error executing push action:', error);
      throw error;
    }
  }

  buildEmailVariables(triggerType, triggerData) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    switch (triggerType) {
      case 'user_signup':
        return {
          customer_name: triggerData.name || 'Valued Customer',
          discount_code: triggerData.discount_code || 'WELCOME10'
        };

      case 'blog_published':
        return {
          blog_title: triggerData.blog_title || '',
          blog_excerpt: triggerData.blog_excerpt || '',
          blog_url: `${baseUrl}/blog/${triggerData.blog_slug}`
        };

      case 'cart_abandoned':
        return {
          customer_name: triggerData.customer_name || 'Valued Customer',
          cart_url: `${baseUrl}/cart`
        };

      default:
        return {};
    }
  }

  buildPushVariables(triggerType, triggerData) {
    switch (triggerType) {
      case 'blog_published':
        return {
          blog_title: triggerData.blog_title || ''
        };

      default:
        return {};
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

  async getAutomationRules() {
    try {
      const { data, error } = await supabase
        .from('marketing_automation_rules')
        .select('*, email_templates(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      throw error;
    }
  }

  async updateAutomationRule(id, ruleData) {
    try {
      const { data, error } = await supabase
        .from('marketing_automation_rules')
        .update(ruleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating automation rule:', error);
      throw error;
    }
  }

  async createAutomationRule(ruleData) {
    try {
      const { data, error } = await supabase
        .from('marketing_automation_rules')
        .insert([ruleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating automation rule:', error);
      throw error;
    }
  }

  async deleteAutomationRule(id) {
    try {
      const { error } = await supabase
        .from('marketing_automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      throw error;
    }
  }

  async getAutomationLogs({ page = 1, limit = 50, ruleId, status }) {
    try {
      let query = supabase
        .from('automation_logs')
        .select('*, marketing_automation_rules(name)', { count: 'exact' });

      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }

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
        logs: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching automation logs:', error);
      throw error;
    }
  }
}

module.exports = new AutomationService();
