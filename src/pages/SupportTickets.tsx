import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserTickets, createTicket, fetchTicketMessages, sendTicketMessage,
  type SupportTicket, type TicketMessage
} from "@/lib/supportApi";

const SupportTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadTickets = async () => {
    try {
      const data = await fetchUserTickets();
      setTickets(data);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim()) { toast.error('Fill all fields'); return; }
    setCreating(true);
    try {
      await createTicket(subject, description, priority);
      toast.success('Ticket created!');
      setSubject(''); setDescription(''); setPriority('medium');
      setCreateDialogOpen(false);
      loadTickets();
    } catch { toast.error('Failed to create ticket'); }
    finally { setCreating(false); }
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const msgs = await fetchTicketMessages(ticket.id);
      setMessages(msgs);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoadingMessages(false); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSendingMessage(true);
    try {
      await sendTicketMessage(selectedTicket.id, newMessage, 'user');
      setNewMessage('');
      const msgs = await fetchTicketMessages(selectedTicket.id);
      setMessages(msgs);
    } catch { toast.error('Failed to send message'); }
    finally { setSendingMessage(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500';
      case 'resolved': return 'bg-green-500/10 text-green-500';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tickets
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                  <CardDescription>{selectedTicket.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender_role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1">{format(new Date(msg.created_at), 'MMM dd, HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">Get help from our support team</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
                <Textarea placeholder="Describe your issue..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No tickets yet</h3>
              <p className="text-muted-foreground text-sm">Create a ticket to get support</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openTicket(ticket)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')} · {ticket.priority} priority
                    </p>
                  </div>
                  <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportTickets;
