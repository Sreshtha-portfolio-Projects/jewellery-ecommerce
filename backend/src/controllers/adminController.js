const supabase = require('../config/supabase');

const checkHealth = async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase.from('products').select('id').limit(1);

    if (error) {
      return res.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: 'ok',
      message: 'API and database are operational',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { checkHealth };

