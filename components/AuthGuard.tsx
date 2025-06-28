import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { account } from '~/appwrite/client';
import { getExistingUser, storeUserData } from '~/appwrite/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false 
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await account.get();
        
        if (!currentUser?.$id) {
          if (requireAuth) {
            navigate('/sign-in');
            return;
          }
          setUser(null);
          setIsLoading(false);
          return;
        }

        const existingUser = await getExistingUser(currentUser.$id);
        
        if (requireAdmin && existingUser?.status === 'user') {
          navigate('/');
          return;
        }

        setUser(existingUser || await storeUserData());
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (requireAuth) {
          navigate('/sign-in');
          return;
        }
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, requireAuth, requireAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard; 