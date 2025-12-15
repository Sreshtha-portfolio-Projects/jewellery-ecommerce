const supabase = require('../config/supabase');

/**
 * Get reviews for a product
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        user:auth.users!user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ message: 'Error fetching reviews' });
    }

    // Get average rating
    const { data: ratingStats } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId);

    const totalReviews = ratingStats?.length || 0;
    const averageRating = totalReviews > 0
      ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Count by rating
    const ratingCounts = {
      5: ratingStats?.filter(r => r.rating === 5).length || 0,
      4: ratingStats?.filter(r => r.rating === 4).length || 0,
      3: ratingStats?.filter(r => r.rating === 3).length || 0,
      2: ratingStats?.filter(r => r.rating === 2).length || 0,
      1: ratingStats?.filter(r => r.rating === 1).length || 0,
    };

    res.json({
      reviews: reviews || [],
      summary: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingCounts
      }
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a review (requires authentication)
 */
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('product_reviews')
        .update({
          rating,
          review_text: reviewText || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return res.status(500).json({ message: 'Error updating review' });
      }

      return res.json({ message: 'Review updated successfully', review: data });
    }

    // Check if user has purchased this product (for verified purchase badge)
    const { data: orders } = await supabase
      .from('order_items')
      .select('order_id, orders!inner(user_id, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .in('orders.status', ['paid', 'shipped', 'delivered'])
      .limit(1);

    const isVerifiedPurchase = orders && orders.length > 0;

    // Create new review
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        review_text: reviewText || null,
        is_verified_purchase: isVerifiedPurchase
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ message: 'Error creating review' });
    }

    res.status(201).json({ message: 'Review created successfully', review: data });
  } catch (error) {
    console.error('Error in createReview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete own review
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ message: 'Error deleting review' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error in deleteReview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
};

