const blogService = require('./blog.service');
const automationService = require('../notifications/automation.service');

const getAllBlogs = async (req, res) => {
  try {
    const { page, limit, status, category, search } = req.query;
    const result = await blogService.getAllBlogs({ page, limit, status, category, search });
    res.json(result);
  } catch (error) {
    console.error('Error in getAllBlogs:', error);
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

const getPublicBlogs = async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await blogService.getPublicBlogs({ page, limit, category, search });
    res.json(result);
  } catch (error) {
    console.error('Error in getPublicBlogs:', error);
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await blogService.getBlogBySlug(slug);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (req.user) {
      await blogService.trackBlogAnalytics(blog.id, req.user.userId, 'view', {
        session_id: req.headers['x-session-id'],
        referrer: req.headers['referer'],
        device: req.headers['user-agent']
      });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error in getBlogBySlug:', error);
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
};

const createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      author_id: req.user.userId,
      publish_date: req.body.publish_date || (req.body.status === 'published' ? new Date().toISOString() : null)
    };

    const blog = await blogService.createBlog(blogData);

    if (blog.status === 'published' && blog.publish_date <= new Date().toISOString()) {
      await automationService.triggerAutomation('blog_published', {
        blog_id: blog.id,
        blog_title: blog.title,
        blog_slug: blog.slug,
        blog_excerpt: blog.meta_description || blog.content.substring(0, 200)
      });
    }

    res.status(201).json(blog);
  } catch (error) {
    console.error('Error in createBlog:', error);
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const existingBlog = await blogService.getBlogById(id);

    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const wasPublished = existingBlog.status === 'published';
    const isNowPublished = req.body.status === 'published';

    const blog = await blogService.updateBlog(id, req.body);

    if (!wasPublished && isNowPublished && blog.publish_date <= new Date().toISOString()) {
      await automationService.triggerAutomation('blog_published', {
        blog_id: blog.id,
        blog_title: blog.title,
        blog_slug: blog.slug,
        blog_excerpt: blog.meta_description || blog.content.substring(0, 200)
      });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error in updateBlog:', error);
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.deleteBlog(id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
};

const getBlogCategories = async (req, res) => {
  try {
    const categories = await blogService.getBlogCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error in getBlogCategories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

const createBlogCategory = async (req, res) => {
  try {
    const category = await blogService.createBlogCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error in createBlogCategory:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

const updateBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await blogService.updateBlogCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error('Error in updateBlogCategory:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

const deleteBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.deleteBlogCategory(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBlogCategory:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

const getBlogAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await blogService.getBlogAnalytics(id);
    res.json(analytics || { views: 0, unique_visitors: 0, avg_time_spent: 0 });
  } catch (error) {
    console.error('Error in getBlogAnalytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

module.exports = {
  getAllBlogs,
  getPublicBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogAnalytics
};
