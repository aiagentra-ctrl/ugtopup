import { useState, useEffect } from 'react';
import { Bell, CheckCheck, ArrowLeft, Shield, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  UserNotification,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notificationApi';
import { format } from 'date-fns';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const UserNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [adminNotifications, setAdminNotifications] = useState<UserNotification[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'general'>('admin');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [adminData, generalData] = await Promise.all([
        fetchUserNotifications('admin'),
        fetchUserNotifications('general'),
      ]);
      setAdminNotifications(adminData);
      setGeneralNotifications(generalData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();

      const channel = supabase
        .channel(`user-notifications-page-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const handleMarkAsRead = async (notification: UserNotification) => {
    if (notification.is_read) return;

    try {
      await markNotificationAsRead(notification.id);
      const updateList = (list: UserNotification[]) =>
        list.map(n => n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n);
      
      setAdminNotifications(updateList);
      setGeneralNotifications(updateList);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(activeTab);
      const markAllRead = (list: UserNotification[]) => 
        list.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }));
      
      if (activeTab === 'admin') {
        setAdminNotifications(markAllRead);
      } else {
        setGeneralNotifications(markAllRead);
      }
      toast({ title: 'Success', description: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const currentNotifications = activeTab === 'admin' ? adminNotifications : generalNotifications;
  const unreadCount = currentNotifications.filter(n => !n.is_read).length;
  const totalUnread = adminNotifications.filter(n => !n.is_read).length + generalNotifications.filter(n => !n.is_read).length;

  const renderNotificationCard = (userNotification: UserNotification) => {
    const notification = userNotification.notification;
    if (!notification) return null;

    return (
      <Card
        key={userNotification.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          !userNotification.is_read ? 'border-primary/50 bg-primary/5' : ''
        }`}
        onClick={() => handleMarkAsRead(userNotification)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {notification.image_url && (
              <img
                src={notification.image_url}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  {!userNotification.is_read && (
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                  )}
                  {notification.title}
                </h3>
                <Badge 
                  variant={userNotification.is_read ? 'secondary' : 'default'} 
                  className="shrink-0 text-xs"
                >
                  {userNotification.is_read ? 'Read' : 'New'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                📅 {format(new Date(userNotification.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: 'admin' | 'general') => (
    <Card>
      <CardContent className="p-8 sm:p-12 text-center">
        {type === 'admin' ? (
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
        ) : (
          <Megaphone className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
        )}
        <h3 className="text-lg font-medium mb-2">
          No {type === 'admin' ? 'Admin' : 'General'} Notifications
        </h3>
        <p className="text-muted-foreground text-sm">
          {type === 'admin' 
            ? 'No notifications from admin yet. Check back later!' 
            : 'No system notifications at the moment.'}
        </p>
      </CardContent>
    </Card>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-muted rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Your Notifications
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalUnread > 0 ? `${totalUnread} unread notification${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'admin' | 'general')} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 h-auto">
              <TabsTrigger value="admin" className="gap-2 py-2.5 px-4">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
                {adminNotifications.filter(n => !n.is_read).length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {adminNotifications.filter(n => !n.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="general" className="gap-2 py-2.5 px-4">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
                {generalNotifications.filter(n => !n.is_read).length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {generalNotifications.filter(n => !n.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead} 
                className="gap-2 w-full sm:w-auto"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>

          <TabsContent value="admin" className="mt-0">
            {loading ? (
              renderLoadingSkeleton()
            ) : adminNotifications.length === 0 ? (
              renderEmptyState('admin')
            ) : (
              <div className="space-y-3">
                {adminNotifications.map(renderNotificationCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="general" className="mt-0">
            {loading ? (
              renderLoadingSkeleton()
            ) : generalNotifications.length === 0 ? (
              renderEmptyState('general')
            ) : (
              <div className="space-y-3">
                {generalNotifications.map(renderNotificationCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserNotifications;
