import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowLeft, MessageSquare, Ticket } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchAllTickets, updateTicketStatus, fetchTicketMessages, sendTicketMessage,
  type SupportTicket, type TicketMessage
} from "@/lib/supportApi";

export function TicketManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadTickets = async () => {
    try {
      const data = await fetchAllTickets();
      setTickets(data);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const msgs = await fetchTicketMessages(ticket.id);
      setMessages(msgs);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoadingMessages(false); }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      toast.success('Status updated');
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await sendTicketMessage(selectedTicket.id, newMessage, 'admin');
      setNewMessage('');
      const msgs = await fetchTicketMessages(selectedTicket.id);
      setMessages(msgs);
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-500/10 text-blue-500';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500';
      case 'resolved': return 'bg-green-500/10 text-green-500';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket.description}</p>
              </div>
              <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender_role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-[10px] font-medium opacity-70 mb-1">{msg.sender_role === 'admin' ? 'Admin' : 'User'}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">{format(new Date(msg.created_at), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2 mt-4">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Reply as admin..." onKeyDown={e => e.key === 'Enter' && handleSend()} />
              <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Support Tickets</h2>
          <Badge variant="outline">{tickets.length}</Badge>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : filteredTickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tickets found</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map(ticket => (
            <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openTicket(ticket)}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(ticket.created_at), 'MMM dd, yyyy')} · {ticket.priority}</p>
                </div>
                <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
