import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const PERMISSION_STORAGE_KEY = 'notification_permission_asked';

type PermissionState = 'pending' | 'allowed' | 'denied' | 'dismissed';

export const NotificationPermissionModal = () => {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    
    const askedBefore = localStorage.getItem(PERMISSION_STORAGE_KEY);
    
    if (askedBefore || permission !== 'default') {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  const handleAllow = async () => {
    setIsRequesting(true);
    
    try {
      const result = await requestPermission();
      
      const state: PermissionState = result === 'granted' ? 'allowed' : 'denied';
      localStorage.setItem(PERMISSION_STORAGE_KEY, state);
      
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to request permission:', error);
      localStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
      setIsVisible(false);
    }
    
    setIsRequesting(false);
  };

  const handleNotNow = () => {
    localStorage.setItem(PERMISSION_STORAGE_KEY, 'dismissed');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={handleNotNow}
      />
      
      <div className="relative bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleNotNow}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Stay Updated
          </h3>
          <p className="text-sm text-muted-foreground">
            Get instant updates about orders, credits, and important actions — even when the app is closed.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAllow}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? 'Enabling...' : 'Allow Notifications'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleNotNow}
            disabled={isRequesting}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
};
