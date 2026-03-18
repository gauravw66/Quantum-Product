import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  user?: AuthUser;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data?.user || res.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation<LoginResponse, unknown, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      const loginUser = data.user || {
        id: data.userId,
        email: data.email,
        name: data.email ? data.email.split('@')[0] : 'User'
      };
      queryClient.setQueryData(['user'], loginUser);
      router.push('/dashboard');
    },
  });

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['user'], null);
    router.push('/login');
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
