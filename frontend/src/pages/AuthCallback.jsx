import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { customerAuthService } from '../services/customerAuthService';
import { getStoredRedirectPath, clearRedirectPath } from '../utils/redirect';
import { consumeBuyNowIntent } from '../utils/buyNowIntent';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const storedRedirect = getStoredRedirectPath();
    const from = searchParams.get('from') || location.state?.from || storedRedirect || '/account/profile';

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('customerToken', token);
      
      // Fetch user profile
      customerAuthService.getProfile()
        .then(async (profile) => {
          updateUser(profile);

          // If there is a pending Buy Now intent, add that item to cart first
          const intent = consumeBuyNowIntent();
          if (intent) {
            try {
              await addToCart(intent.productId, intent.quantity, intent.variantId || undefined);
            } catch (addError) {
              console.error('Failed to apply Buy Now intent after OAuth login:', addError);
            }
          }

          clearRedirectPath();
          // Redirect to intended route or default to profile
          navigate(from, { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          navigate('/login?error=profile_fetch_failed');
        });
    } else {
      navigate('/login?error=missing_token');
    }
  }, [searchParams, navigate, updateUser, location]);

  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
