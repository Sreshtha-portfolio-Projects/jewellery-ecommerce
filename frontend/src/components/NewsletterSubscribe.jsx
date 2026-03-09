import { useState } from 'react';

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          source: 'newsletter'
        })
      });

      if (!response.ok) throw new Error('Failed to subscribe');

      setSuccess(true);
      setMessage('Thank you for subscribing! Check your inbox for updates.');
      setEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage('Failed to subscribe. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-rose-600 to-rose-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="font-serif text-3xl font-bold text-white mb-2">
            Stay Connected
          </h2>
          <p className="text-rose-100">
            Subscribe to our newsletter for exclusive offers, style tips, and new arrivals
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-center text-sm ${success ? 'text-white' : 'text-rose-100'}`}>
              {message}
            </p>
          )}
        </form>

        <p className="text-center text-rose-100 text-xs mt-4">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
};

export default NewsletterSubscribe;
