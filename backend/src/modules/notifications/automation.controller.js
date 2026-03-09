const automationService = require('./automation.service');

const getAutomationRules = async (req, res) => {
  try {
    const rules = await automationService.getAutomationRules();
    res.json(rules);
  } catch (error) {
    console.error('Error in getAutomationRules:', error);
    res.status(500).json({ message: 'Error fetching automation rules', error: error.message });
  }
};

const createAutomationRule = async (req, res) => {
  try {
    const rule = await automationService.createAutomationRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error in createAutomationRule:', error);
    res.status(500).json({ message: 'Error creating automation rule', error: error.message });
  }
};

const updateAutomationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await automationService.updateAutomationRule(id, req.body);
    res.json(rule);
  } catch (error) {
    console.error('Error in updateAutomationRule:', error);
    res.status(500).json({ message: 'Error updating automation rule', error: error.message });
  }
};

const deleteAutomationRule = async (req, res) => {
  try {
    const { id } = req.params;
    await automationService.deleteAutomationRule(id);
    res.json({ message: 'Automation rule deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAutomationRule:', error);
    res.status(500).json({ message: 'Error deleting automation rule', error: error.message });
  }
};

const getAutomationLogs = async (req, res) => {
  try {
    const { page, limit, ruleId, status } = req.query;
    const result = await automationService.getAutomationLogs({ page, limit, ruleId, status });
    res.json(result);
  } catch (error) {
    console.error('Error in getAutomationLogs:', error);
    res.status(500).json({ message: 'Error fetching automation logs', error: error.message });
  }
};

module.exports = {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationLogs
};
