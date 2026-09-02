import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (err: any) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const loadScript = () => {
      if (window.google?.accounts?.id) {
        initializeGoogleButton();
        return;
      }

      const existingScript = document.getElementById('google-jssdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleButton;
        document.body.appendChild(script);
      }
    };

    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else if (onError) {
              onError(new Error('No credential returned from Google'));
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text,
          shape: 'pill',
          width: buttonRef.current.clientWidth || 320,
          logo_alignment: 'left',
        });
      } catch (err) {
        if (onError) onError(err);
      }
    };

    loadScript();
  }, [clientId, text, onSuccess, onError]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={`w-full flex justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div ref={buttonRef} className="w-full flex justify-center min-h-[40px]" />
    </div>
  );
};
