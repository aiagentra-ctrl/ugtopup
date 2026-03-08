import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, MessageSquare, Loader2, TrendingUp } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  message_id: string;
  session_id: string;
  user_message: string | null;
  bot_response: string | null;
  rating: string;
  comment: string | null;
  created_at: string;
}

export const ChatbotFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chatbot_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) toast.error('Failed to load feedback');
    else setEntries((data || []) as unknown as FeedbackEntry[]);
    setLoading(false);
  };

  const totalCount = entries.length;
  const helpfulCount = entries.filter(e => e.rating === 'helpful').length;
  const notHelpfulCount = entries.filter(e => e.rating === 'not_helpful').length;
  const helpfulPct = totalCount > 0 ? Math.round((helpfulCount / totalCount) * 100) : 0;

  const filtered = filter === 'all' ? entries : entries.filter(e => e.rating === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Chatbot Feedback
        </h2>
        <p className="text-sm text-muted-foreground mt-1">User ratings on chatbot responses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{helpfulCount}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ThumbsUp className="h-3 w-3" /> Helpful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{notHelpfulCount}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ThumbsDown className="h-3 w-3" /> Not Helpful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{helpfulPct}%</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" /> Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex justify-end">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Feedback</SelectItem>
            <SelectItem value="helpful">Helpful Only</SelectItem>
            <SelectItem value="not_helpful">Not Helpful Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No feedback yet. Users can rate chatbot responses with thumbs up/down.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {entry.user_message && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">User asked:</p>
                        <p className="text-sm text-foreground line-clamp-2">{entry.user_message}</p>
                      </div>
                    )}
                    {entry.bot_response && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Bot replied:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{entry.bot_response}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={entry.rating === 'helpful' ? 'default' : 'destructive'} className="shrink-0">
                    {entry.rating === 'helpful' ? <><ThumbsUp className="h-3 w-3 mr-1" /> Helpful</> : <><ThumbsDown className="h-3 w-3 mr-1" /> Not Helpful</>}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
