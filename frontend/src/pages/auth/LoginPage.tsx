import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sprout, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, googleLogin, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState<boolean>(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

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

  const handleSuccessfulAuth = (user: any) => {
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
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      setIsUnverified(false);
      setResendSuccess(false);
      const user = await login(data.email, data.password);
      handleSuccessfulAuth(user);
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message || err.response?.data?.detail || '';
      
      if (code === 'email_not_verified' || msg.toLowerCase().includes('verify your email')) {
        setIsUnverified(true);
        setUnverifiedEmail(data.email);
        setServerError('Your email address has not been verified yet. Please check your inbox.');
      } else {
        setServerError(msg || 'Invalid email or password. Please try again.');
      }
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      setServerError(null);
      const user = await googleLogin(idToken);
      handleSuccessfulAuth(user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Google Sign-In failed.';
      setServerError(msg);
    }
  };

  const handleResendLink = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await resendVerification(unverifiedEmail);
      setResendSuccess(true);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-soft">
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

        {/* Google Sign In Component */}
        <div className="space-y-3">
          <GoogleSignInButton onSuccess={handleGoogleSuccess} text="signin_with" />
          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-stone-400 font-bold uppercase tracking-wider">or sign in with email</span>
            <div className="border-t border-stone-200 w-full" />
          </div>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>

            {isUnverified && (
              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                {resendSuccess ? (
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Link sent to your inbox!
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendLink}
                    disabled={isResending}
                    className="text-[11px] font-bold text-forest-700 hover:text-forest-800 underline"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Link'}
                  </button>
                )}
              </div>
            )}
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
            className="w-full rounded-2xl font-bold"
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
              onClick={() => handleQuickFill('customer@example.com', 'SecureKhmer@2026!')}
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
