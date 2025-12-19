const supabase = require('../config/supabase');

/**
 * Get audit logs (Admin only)
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ message: 'Error fetching audit logs' });
    }

    // Enrich logs with user email if available
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        if (log.user_id) {
          try {
            const { data: user } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', log.user_id)
              .single();
            
            return {
              ...log,
              user_email: user?.email || null
            };
          } catch (err) {
            // If user lookup fails, return log without email
            return log;
          }
        }
        return log;
      })
    );

    res.json({
      logs: enrichedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get audit log by ID (Admin only)
 * GET /api/admin/audit-logs/:id
 */
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: log, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    // Enrich with user email if available
    if (log.user_id) {
      try {
        const { data: user } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', log.user_id)
          .single();
        
        log.user_email = user?.email || null;
      } catch (err) {
        log.user_email = null;
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Error in getAuditLogById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get audit logs for a specific entity (Admin only)
 * GET /api/admin/audit-logs/entity/:entityType/:entityId
 */
const getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entity audit logs:', error);
      return res.status(500).json({ message: 'Error fetching audit logs' });
    }

    // Enrich logs with user emails
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        if (log.user_id) {
          try {
            const { data: user } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', log.user_id)
              .single();
            
            return {
              ...log,
              user_email: user?.email || null
            };
          } catch (err) {
            return log;
          }
        }
        return log;
      })
    );

    res.json({ logs: enrichedLogs });
  } catch (error) {
    console.error('Error in getEntityAuditLogs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get audit log statistics (Admin only)
 * GET /api/admin/audit-logs/stats
 */
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('action, entity_type, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching audit stats:', error);
      return res.status(500).json({ message: 'Error fetching audit stats' });
    }

    // Calculate statistics
    const stats = {
      total: logs?.length || 0,
      byAction: {},
      byEntityType: {},
      byDate: {}
    };

    (logs || []).forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by entity type
      stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;

      // Count by date
      const date = new Date(log.created_at).toISOString().split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error in getAuditStats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  getAuditStats
};
