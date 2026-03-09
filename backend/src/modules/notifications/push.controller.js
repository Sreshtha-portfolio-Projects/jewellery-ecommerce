const pushService = require('./push.service');

const registerToken = async (req, res) => {
  try {
    const { token, device, browser, os } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const userId = req.user?.userId || null;
    const result = await pushService.registerToken(userId, token, { device, browser, os });

    res.json({ message: 'Token registered successfully', data: result });
  } catch (error) {
    console.error('Error in registerToken:', error);
    res.status(500).json({ message: 'Error registering token', error: error.message });
  }
};

const unregisterToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    await pushService.unregisterToken(token);
    res.json({ message: 'Token unregistered successfully' });
  } catch (error) {
    console.error('Error in unregisterToken:', error);
    res.status(500).json({ message: 'Error unregistering token', error: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      created_by: req.user.userId,
      status: req.body.status || 'draft'
    };

    const campaign = await pushService.createCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error in createCampaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await pushService.updateCampaign(id, req.body);
    res.json(campaign);
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    res.status(500).json({ message: 'Error updating campaign', error: error.message });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await pushService.getCampaigns({ page, limit, status });
    res.json(result);
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
};

const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pushService.sendCampaign(id);
    res.json({ message: 'Campaign sent successfully', ...result });
  } catch (error) {
    console.error('Error in sendCampaign:', error);
    res.status(500).json({ message: 'Error sending campaign', error: error.message });
  }
};

const sendImmediate = async (req, res) => {
  try {
    const { title, message, image, redirect_url, audience } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const campaignData = {
      title,
      message,
      image: image || null,
      redirect_url: redirect_url || null,
      audience: audience || 'all',
      status: 'draft',
      created_by: req.user.userId
    };

    const campaign = await pushService.createCampaign(campaignData);
    const result = await pushService.sendCampaign(campaign.id);

    res.json({ message: 'Notification sent successfully', campaignId: campaign.id, ...result });
  } catch (error) {
    console.error('Error in sendImmediate:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

const getCampaignAnalytics = async (req, res) => {
  try {
    const analytics = await pushService.getCampaignAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error in getCampaignAnalytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

const trackClick = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (userId) {
      await pushService.trackClick(campaignId, userId);
    }

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error in trackClick:', error);
    res.status(500).json({ message: 'Error tracking click', error: error.message });
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  createCampaign,
  updateCampaign,
  getCampaigns,
  sendCampaign,
  sendImmediate,
  getCampaignAnalytics,
  trackClick
};
