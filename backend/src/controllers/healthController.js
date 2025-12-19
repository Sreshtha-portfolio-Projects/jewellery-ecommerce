const supabase = require('../config/supabase');
const razorpay = require('../config/razorpay');

/**
 * Comprehensive health check for backend, database, and critical services
 * @returns {Object} Health status with detailed checks
 */
const checkHealth = async () => {
  const startTime = Date.now();
  const checks = {
    backend: { status: 'ok', message: 'Backend is running' },
    database: { status: 'unknown', message: 'Not checked', responseTime: null },
    razorpay: { status: 'unknown', message: 'Not checked', responseTime: null }
  };

  // Check database connectivity
  try {
    const dbStartTime = Date.now();
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    const dbResponseTime = Date.now() - dbStartTime;
    
    if (error) {
      // Don't expose detailed error messages in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Database connection failed' 
        : `Database connection failed: ${error.message}`;
      checks.database = {
        status: 'error',
        message: errorMessage,
        responseTime: dbResponseTime
      };
    } else {
      checks.database = {
        status: 'ok',
        message: 'Database is reachable',
        responseTime: dbResponseTime
      };
    }
    } catch (error) {
      // Don't expose detailed error messages in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Database check failed' 
        : `Database check failed: ${error.message}`;
      checks.database = {
        status: 'error',
        message: errorMessage,
        responseTime: null
      };
    }

  // Check Razorpay service (if configured)
  // Note: Razorpay is optional - failure doesn't affect overall health status
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const razorpayStartTime = Date.now();
      // Test Razorpay connectivity with a timeout
      // Using a lightweight API call to verify connectivity
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Razorpay check timeout')), 5000)
      );
      
      await Promise.race([
        razorpay.orders.all({ count: 1 }),
        timeoutPromise
      ]);
      
      const razorpayResponseTime = Date.now() - razorpayStartTime;
      
      checks.razorpay = {
        status: 'ok',
        message: 'Razorpay service is reachable',
        responseTime: razorpayResponseTime
      };
    } catch (error) {
      // Razorpay failure is non-critical - mark as degraded but don't fail overall
      // Don't expose detailed error messages in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Razorpay service unavailable' 
        : `Razorpay service unavailable: ${error.message}`;
      checks.razorpay = {
        status: 'degraded',
        message: errorMessage,
        responseTime: null
      };
    }
  } else {
    checks.razorpay = {
      status: 'skipped',
      message: 'Razorpay not configured (optional service)',
      responseTime: null
    };
  }

  // Calculate overall status
  // Only database and backend are critical - Razorpay failures are acceptable
  const criticalChecks = [checks.backend, checks.database];
  const hasCriticalFailure = criticalChecks.some(check => check.status === 'error');
  const hasDegradedService = Object.values(checks).some(
    check => check.status === 'degraded'
  );
  
  const overallStatus = hasCriticalFailure ? 'error' : 
                        hasDegradedService ? 'degraded' : 'ok';

  const totalResponseTime = Date.now() - startTime;

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks,
    responseTime: totalResponseTime
  };
};

/**
 * Express route handler for health check endpoint
 */
const getHealth = async (req, res) => {
  try {
    const health = await checkHealth();
    
    // Return 200 for ok/degraded, 503 for critical failures
    const statusCode = health.status === 'ok' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    // Log error but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Health check error:', error);
    } else {
      console.error('Health check error: [error details hidden in production]');
    }
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Simple liveness probe - just checks if server is responding
 */
const getLiveness = (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe - checks if server is ready to accept traffic
 */
const getReadiness = async (req, res) => {
  try {
    const health = await checkHealth();
    
    // Readiness requires database to be available
    const isReady = health.checks.database.status === 'ok';
    
    if (isReady) {
      res.json({
        status: 'ready',
        message: 'Server is ready to accept traffic',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: 'Server is not ready (database unavailable)',
        timestamp: new Date().toISOString(),
        checks: {
          database: health.checks.database
        }
      });
    }
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not_ready',
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Simplified health check for /api/health endpoint
 * Returns: status (ok/degraded), api: up, database: up/down, timestamp
 */
const getSimpleHealth = async (req, res) => {
  try {
    // Always return API as up (if we're responding, API is up)
    let apiStatus = 'up';
    let databaseStatus = 'down';
    let overallStatus = 'degraded';

    // Check database connectivity
    try {
      const { error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (!error) {
        databaseStatus = 'up';
        overallStatus = 'ok';
      }
    } catch (error) {
      // Database check failed
      databaseStatus = 'down';
      overallStatus = 'degraded';
    }

    res.json({
      status: overallStatus,
      api: apiStatus,
      database: databaseStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Even if health check fails, return degraded status (never crash)
    // Don't expose error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Health check error:', error);
    } else {
      console.error('Health check error: [error details hidden in production]');
    }
    res.json({
      status: 'degraded',
      api: 'up',
      database: 'down',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getHealth,
  getLiveness,
  getReadiness,
  checkHealth,
  getSimpleHealth
};
