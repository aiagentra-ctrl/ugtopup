import { useState, useEffect } from 'react';
import { Bell, Plus, Pencil, Trash2, Users, User, Image, X, Search, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Notification,
  NotificationStats,
  fetchAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  getNotificationStats,
  uploadNotificationImage,
  deleteNotificationImage,
} from '@/lib/notificationApi';
import { format } from 'date-fns';

const NotificationsManager = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Record<string, NotificationStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formTargetType, setFormTargetType] = useState<'all' | 'specific'>('all');
  const [formTargetEmails, setFormTargetEmails] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchAllNotifications();
      setNotifications(data);

      // Load stats for each notification
      const statsMap: Record<string, NotificationStats> = {};
      await Promise.all(
        data.map(async (n) => {
          statsMap[n.id] = await getNotificationStats(n.id);
        })
      );
      setStats(statsMap);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormTargetType('all');
    setFormTargetEmails('');
    setFormImageFile(null);
    setFormImagePreview(null);
    setExistingImageUrl(null);
    setEditingNotification(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (notification: Notification) => {
    setEditingNotification(notification);
    setFormTitle(notification.title);
    setFormMessage(notification.message);
    setFormTargetType(notification.target_type);
    setFormTargetEmails(notification.target_emails?.join(', ') || '');
    setExistingImageUrl(notification.image_url);
    setFormImagePreview(notification.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      setFormImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormImageFile(null);
    setFormImagePreview(null);
    setExistingImageUrl(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }

    if (formTargetType === 'specific' && !formTargetEmails.trim()) {
      toast({ title: 'Error', description: 'Please enter target emails', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = existingImageUrl;

      // Upload new image if selected
      if (formImageFile) {
        imageUrl = await uploadNotificationImage(formImageFile);
        // Delete old image if replacing
        if (existingImageUrl && editingNotification) {
          await deleteNotificationImage(existingImageUrl);
        }
      }

      const targetEmails = formTargetType === 'specific'
        ? formTargetEmails.split(',').map(e => e.trim()).filter(e => e)
        : null;

      if (editingNotification) {
        await updateNotification(editingNotification.id, {
          title: formTitle,
          message: formMessage,
          image_url: imageUrl,
          target_type: formTargetType,
          target_emails: targetEmails,
        });
        toast({ title: 'Success', description: 'Notification updated successfully' });
      } else {
        await createNotification({
          title: formTitle,
          message: formMessage,
          image_url: imageUrl,
          target_type: formTargetType,
          target_emails: targetEmails,
        });
        toast({ title: 'Success', description: 'Notification sent successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      loadNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({ title: 'Error', description: 'Failed to save notification', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      if (notification.image_url) {
        await deleteNotificationImage(notification.image_url);
      }
      await deleteNotification(notification.id);
      toast({ title: 'Success', description: 'Notification deleted successfully' });
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications Manager
          </h2>
          <p className="text-muted-foreground">Create and manage notifications for users</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Notification
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadNotifications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className={!notification.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {notification.image_url && (
                    <img
                      src={notification.image_url}
                      alt=""
                      className="w-full sm:w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" />
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <Badge variant={notification.target_type === 'all' ? 'default' : 'secondary'}>
                        {notification.target_type === 'all' ? (
                          <><Users className="h-3 w-3 mr-1" /> All Users</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" /> Specific ({notification.target_emails?.length || 0})</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>📅 {format(new Date(notification.created_at), 'MMM d, yyyy')}</span>
                      {stats[notification.id] && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {stats[notification.id].read_count}/{stats[notification.id].sent_count} read
                        </span>
                      )}
                      {!notification.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(notification)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(notification)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter notification title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your notification message here..."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              {formImagePreview ? (
                <div className="relative inline-block">
                  <img src={formImagePreview} alt="Preview" className="w-full max-w-xs rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-primary hover:underline">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Target Audience *</Label>
              <RadioGroup
                value={formTargetType}
                onValueChange={(value) => setFormTargetType(value as 'all' | 'specific')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" /> All Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" /> Specific Users
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formTargetType === 'specific' && (
              <div className="space-y-2">
                <Label htmlFor="emails">Enter user emails (comma separated)</Label>
                <Textarea
                  id="emails"
                  placeholder="user1@email.com, user2@email.com"
                  value={formTargetEmails}
                  onChange={(e) => setFormTargetEmails(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingNotification ? 'Update Notification' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsManager;
