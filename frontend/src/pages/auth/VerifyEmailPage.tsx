import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSent, setResendSent] = useState<boolean>(false);

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error');
      setErrorMessage('Missing verification parameters in the link.');
      return;
    }

    let isMounted = true;
    verifyEmail(uid, token)
      .then((user) => {
        if (!isMounted) return;
        setStatus('success');
        setTimeout(() => {
          if (user.role === 'FARMER') {
            navigate('/farmer/dashboard');
          } else if (user.role === 'ADMIN') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }, 2500);
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        const msg = err.response?.data?.detail || err.response?.data?.message || 'Verification link is invalid or has expired.';
        setErrorMessage(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [uid, token, verifyEmail, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    try {
      await resendVerification(resendEmail.trim());
      setResendSent(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-soft-lg text-center space-y-6">
        {status === 'verifying' && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-display">Verifying Your Email...</h2>
            <p className="text-xs text-stone-500">Please wait while we confirm your credentials with FarmerDirect.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 font-display">Email Verified!</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your email has been confirmed and your account is active. Redirecting you to the marketplace...
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="primary" className="w-full font-bold">
                  <span>Continue to Marketplace</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <XCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-display">Verification Failed</h2>
              <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
            </div>

            {resendSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1 text-left">
                <p className="font-bold">✓ Verification Link Resent</p>
                <p className="text-[11px] text-emerald-700">Please check your email inbox and spam folder for the new link.</p>
              </div>
            ) : (
              <form onSubmit={handleResend} className="pt-2 space-y-3 text-left">
                <label className="block text-xs font-bold text-stone-700">Request New Verification Link</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your registered email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-forest-600 font-medium"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" isLoading={isResending} className="font-bold text-xs">
                    Resend
                  </Button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-4 text-xs font-semibold">
              <Link to="/login" className="text-forest-700 hover:text-forest-800">
                Back to Sign In
              </Link>
              <span className="text-stone-300">•</span>
              <Link to="/register" className="text-stone-500 hover:text-stone-700">
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

