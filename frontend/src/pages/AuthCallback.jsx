import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAuthService } from '../services/customerAuthService';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('customerToken', token);
      
      // Fetch user profile
      customerAuthService.getProfile()
        .then((profile) => {
          updateUser(profile);
          navigate('/account/profile');
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          navigate('/login?error=profile_fetch_failed');
        });
    } else {
      navigate('/login?error=missing_token');
    }
  }, [searchParams, navigate, updateUser]);

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
