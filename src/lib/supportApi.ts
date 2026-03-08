import { supabase } from "@/integrations/supabase/client";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export async function fetchUserTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as SupportTicket[]) || [];
}

export async function fetchAllTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as SupportTicket[]) || [];
}

export async function createTicket(subject: string, description: string, priority: string = 'medium'): Promise<SupportTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('support_tickets' as any)
    .insert({ user_id: user.id, subject, description, priority } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SupportTicket;
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === 'closed') updates.closed_at = new Date().toISOString();
  
  const { error } = await supabase
    .from('support_tickets' as any)
    .update(updates)
    .eq('id', ticketId);
  if (error) throw error;
}

export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages' as any)
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as TicketMessage[]) || [];
}

export async function sendTicketMessage(ticketId: string, message: string, senderRole: string = 'user'): Promise<TicketMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('ticket_messages' as any)
    .insert({ ticket_id: ticketId, sender_id: user.id, sender_role: senderRole, message } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TicketMessage;
}
