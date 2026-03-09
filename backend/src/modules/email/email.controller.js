const emailService = require('./email.service');

const subscribe = async (req, res) => {
  try {
    const { email, source, tags } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userId = req.user?.userId || null;
    const subscriber = await emailService.addSubscriber(email, userId, source || 'newsletter', tags || []);

    res.json({ message: 'Subscribed successfully', data: subscriber });
  } catch (error) {
    console.error('Error in subscribe:', error);
    res.status(500).json({ message: 'Error subscribing', error: error.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await emailService.unsubscribe(email);
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    res.status(500).json({ message: 'Error unsubscribing', error: error.message });
  }
};

const getSubscribers = async (req, res) => {
  try {
    const { page, limit, status, source, search } = req.query;
    const result = await emailService.getSubscribers({ page, limit, status, source, search });
    res.json(result);
  } catch (error) {
    console.error('Error in getSubscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
  }
};

const getSubscriberStats = async (req, res) => {
  try {
    const stats = await emailService.getSubscriberStats();
    res.json(stats);
  } catch (error) {
    console.error('Error in getSubscriberStats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

const getTemplates = async (req, res) => {
  try {
    const templates = await emailService.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await emailService.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = await emailService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error in createTemplate:', error);
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await emailService.updateTemplate(id, req.body);
    res.json(template);
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await emailService.deleteTemplate(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      created_by: req.user.userId,
      status: req.body.status || 'draft'
    };

    const campaign = await emailService.createCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error in createCampaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await emailService.updateCampaign(id, req.body);
    res.json(campaign);
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    res.status(500).json({ message: 'Error updating campaign', error: error.message });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await emailService.getCampaigns({ page, limit, status });
    res.json(result);
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
};

const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await emailService.sendCampaign(id);
    res.json({ message: 'Campaign sent successfully', ...result });
  } catch (error) {
    console.error('Error in sendCampaign:', error);
    res.status(500).json({ message: 'Error sending campaign', error: error.message });
  }
};

const getCampaignAnalytics = async (req, res) => {
  try {
    const analytics = await emailService.getCampaignAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error in getCampaignAnalytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers,
  getSubscriberStats,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createCampaign,
  updateCampaign,
  getCampaigns,
  sendCampaign,
  getCampaignAnalytics
};
