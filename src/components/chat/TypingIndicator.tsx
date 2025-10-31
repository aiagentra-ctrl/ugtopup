export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 max-w-[70%] rounded-2xl rounded-bl-md bg-card border border-border">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
      </div>
      <span className="text-xs text-muted-foreground">AI is thinking...</span>
    </div>
  );
};
