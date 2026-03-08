import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  type Announcement
} from "@/lib/announcementApi";

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('banner');

  const load = async () => {
    try { setAnnouncements(await fetchAllAnnouncements()); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setCreating(true);
    try {
      await createAnnouncement({ title, message, type });
      toast.success('Created!');
      setTitle(''); setMessage(''); setDialogOpen(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setCreating(false); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await updateAnnouncement(id, { is_active: active }); load(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAnnouncement(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Announcements</h2>
          <Badge variant="outline">{announcements.length}</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="modal">Modal</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.created_at), 'MMM dd, yyyy')} · {a.type}</p>
                </div>
                <Switch checked={a.is_active} onCheckedChange={v => handleToggle(a.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
