const supabase = require('../../config/supabase');

class BlogService {
  async getAllBlogs({ page = 1, limit = 10, status, category, search }) {
    try {
      let query = supabase
        .from('blogs')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`);
      }

      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        blogs: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  }

  async getPublicBlogs({ page = 1, limit = 10, category, search }) {
    try {
      let query = supabase
        .from('blogs')
        .select('id, title, slug, thumbnail, tags, category, publish_date, meta_description, created_at', { count: 'exact' })
        .eq('status', 'published')
        .lte('publish_date', new Date().toISOString());

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
      }

      const offset = (page - 1) * limit;
      query = query
        .order('publish_date', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        blogs: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching public blogs:', error);
      throw error;
    }
  }

  async getBlogBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (data && data.status === 'published') {
        await this.incrementViews(data.id);
      }

      return data;
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      throw error;
    }
  }

  async getBlogById(id) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching blog by id:', error);
      throw error;
    }
  }

  async createBlog(blogData) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .insert([blogData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  async updateBlog(id, blogData) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .update(blogData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  }

  async deleteBlog(id) {
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  }

  async incrementViews(blogId) {
    try {
      const { error } = await supabase.rpc('increment_blog_views', { blog_id: blogId });
      
      if (error) {
        const { data, error: fetchError } = await supabase
          .from('blogs')
          .select('views')
          .eq('id', blogId)
          .single();

        if (!fetchError && data) {
          await supabase
            .from('blogs')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', blogId);
        }
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async trackBlogAnalytics(blogId, userId, eventType, data = {}) {
    try {
      const analyticsData = {
        blog_id: blogId,
        user_id: userId || null,
        event_type: eventType,
        ...data
      };

      const { error } = await supabase
        .from('blog_analytics')
        .insert([analyticsData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking blog analytics:', error);
    }
  }

  async getBlogCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      throw error;
    }
  }

  async createBlogCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating blog category:', error);
      throw error;
    }
  }

  async updateBlogCategory(id, categoryData) {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating blog category:', error);
      throw error;
    }
  }

  async deleteBlogCategory(id) {
    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting blog category:', error);
      throw error;
    }
  }

  async getBlogAnalytics(blogId) {
    try {
      const { data, error } = await supabase
        .from('blog_performance')
        .select('*')
        .eq('id', blogId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching blog analytics:', error);
      throw error;
    }
  }
}

module.exports = new BlogService();
