import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blogs/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setBlog(null);
        } else {
          throw new Error('Failed to fetch blog');
        }
        return;
      }

      const data = await response.json();
      setBlog(data);

      if (data.category) {
        fetchRelatedBlogs(data.category, data.id);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/blogs?category=${category}&limit=3`
      );

      if (response.ok) {
        const data = await response.json();
        setRelatedBlogs((data.blogs || []).filter(b => b.id !== currentBlogId));
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/blog"
          className="text-rose-600 hover:text-rose-700 font-medium mb-6 inline-block"
        >
          ← Back to Blog
        </Link>

        {blog.category && (
          <span className="inline-block text-sm font-medium text-rose-600 uppercase tracking-wider mb-4">
            {blog.category}
          </span>
        )}

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {blog.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
          <span>
            {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          {blog.views > 0 && (
            <>
              <span>•</span>
              <span>{blog.views} views</span>
            </>
          )}
        </div>

        {blog.thumbnail && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full h-auto"
            />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t border-beige-200">
            <span className="text-sm font-medium text-gray-700">Tags:</span>
            {blog.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-beige-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {relatedBlogs.length > 0 && (
          <div className="mt-12 pt-12 border-t border-beige-200">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {relatedBlog.thumbnail && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={relatedBlog.thumbnail}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">
                      {relatedBlog.title}
                    </h3>
                    {relatedBlog.meta_description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {relatedBlog.meta_description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogDetail;
