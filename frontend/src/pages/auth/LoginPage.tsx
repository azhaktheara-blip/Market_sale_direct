import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sprout, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      const user = await login(data.email, data.password);
      
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'FARMER') {
        navigate('/farmer/dashboard', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else if (err.response?.data?.detail) {
        setServerError(err.response.data.detail);
      } else {
        setServerError('Invalid email or password. Please try again.');
      }
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-soft">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-600 text-white shadow-sm mb-2">
            <Sprout className="w-7 h-7 stroke-[2.2]" />
          </Link>
          <h2 className="text-2xl font-extrabold text-stone-900 font-display">
            Welcome back
          </h2>
          <p className="text-xs text-stone-500">
            Sign in to access your direct farm orders, wishlist, or grower dashboard.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="your.email@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full rounded-2xl"
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Fast Logins for Pairing / Testing */}
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block text-center">
            Quick Test Autofill
          </span>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('customer@example.com', 'customer123456')}
              className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 font-semibold text-stone-700 text-center transition-colors"
            >
              👤 Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('sokha.farm@farmerdirect.com', 'farmer123456')}
              className="p-2 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200 font-semibold text-forest-800 text-center transition-colors"
            >
              🚜 Farmer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@farmerdirect.com', 'admin123456')}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 font-semibold text-purple-800 text-center transition-colors"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-forest-700 hover:text-forest-800">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

