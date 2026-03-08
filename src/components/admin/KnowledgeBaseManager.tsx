import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookOpen, Search, Upload, Loader2 } from 'lucide-react';

interface KBEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['general', 'faq', 'product', 'support', 'policy', 'payment', 'order', 'account'];

const emptyEntry = { title: '', content: '', category: 'general', tags: [] as string[], is_active: true };

export const KnowledgeBaseManager = () => {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEntry);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [bulkText, setBulkText] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Failed to load knowledge base');
    else setEntries((data || []) as unknown as KBEntry[]);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyEntry);
    setTagInput('');
    setDialogOpen(true);
  };

  const openEdit = (entry: KBEntry) => {
    setEditingId(entry.id);
    setForm({ title: entry.title, content: entry.content, category: entry.category, tags: entry.tags || [], is_active: entry.is_active });
    setTagInput((entry.tags || []).join(', '));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { title: form.title.trim(), content: form.content.trim(), category: form.category, tags, is_active: form.is_active };

    if (editingId) {
      const { error } = await supabase.from('knowledge_base').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', editingId);
      if (error) toast.error('Failed to update');
      else toast.success('Entry updated');
    } else {
      const { error } = await supabase.from('knowledge_base').insert(payload as any);
      if (error) toast.error('Failed to create');
      else toast.success('Entry created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge base entry?')) return;
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchEntries(); }
  };

  const handleBulkImport = async () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    const items: { title: string; content: string; category: string; tags: string[]; is_active: boolean }[] = [];
    let currentTitle = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('Q:') || line.startsWith('##')) {
        if (currentTitle && currentContent.length > 0) {
          items.push({ title: currentTitle, content: currentContent.join('\n').trim(), category: 'faq', tags: [], is_active: true });
        }
        currentTitle = line.replace(/^(Q:|##)\s*/, '').trim();
        currentContent = [];
      } else if (line.startsWith('A:')) {
        currentContent.push(line.replace(/^A:\s*/, ''));
      } else {
        currentContent.push(line);
      }
    }
    if (currentTitle && currentContent.length > 0) {
      items.push({ title: currentTitle, content: currentContent.join('\n').trim(), category: 'faq', tags: [], is_active: true });
    }

    if (items.length === 0) {
      toast.error('No valid entries found. Use format: Q: question\\nA: answer');
      return;
    }

    const { error } = await supabase.from('knowledge_base').insert(items as any);
    if (error) toast.error('Import failed: ' + error.message);
    else { toast.success(`Imported ${items.length} entries`); setBulkDialogOpen(false); setBulkText(''); fetchEntries(); }
  };

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || e.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Knowledge Base
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} entries — used by AI chatbot for RAG responses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Bulk Import</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Bulk Import FAQs</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Paste Q&A pairs. Format: <code>Q: question</code> on one line, <code>A: answer</code> on the next.</p>
              <Textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={12} placeholder="Q: How do I top up?\nA: Go to the product page and select your package.\n\nQ: How long is delivery?\nA: Most orders are delivered in 5-10 minutes." />
              <Button onClick={handleBulkImport} disabled={!bulkText.trim()}>Import</Button>
            </DialogContent>
          </Dialog>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Entry</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No entries found. Add knowledge base content to improve chatbot responses.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <Card key={entry.id} className={!entry.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{entry.category}</Badge>
                    {!entry.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {entry.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Entry' : 'Add Knowledge Base Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to top up credits" className="mt-1" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Detailed answer or information..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="pricing, credits" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
