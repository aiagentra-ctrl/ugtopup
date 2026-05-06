import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SupabaseStatus } from "@/hooks/useSupabaseStatus";

interface Props {
  status: SupabaseStatus;
  showWhenHealthy?: boolean;
}

export function SupabaseStatusBanner({ status, showWhenHealthy = false }: Props) {
  if (status.loading) return null;

  if (status.suspended) {
    const isEgress = status.reason === "exceed_cached_egress_quota";
    return (
      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Supabase project is suspended — cleanup actions disabled
        </AlertTitle>
        <AlertDescription className="space-y-2 text-sm">
          {isEgress ? (
            <p>
              Reason: <strong>exceed_cached_egress_quota</strong> — your project
              has exceeded the Free plan bandwidth limit (5 GB/month). All
              database writes (cleanup, migrations, deletes) are blocked until
              the quota resets or the project is unlocked.
            </p>
          ) : (
            <p>Reason: project restricted by Supabase.</p>
          )}
          <p className="text-xs opacity-90">
            Unlock options: wait for monthly reset (Dashboard → Settings →
            Billing) or email{" "}
            <a
              href="https://supabase.help"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              supabase.help
            </a>{" "}
            for a one-time grace unlock.
          </p>
          {status.message && (
            <details className="text-xs opacity-75">
              <summary className="cursor-pointer">Raw response</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all">
                {status.message}
              </pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (showWhenHealthy) {
    return (
      <Alert className="border-green-500/40">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Supabase project is healthy</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Last checked: {status.checkedAt?.toLocaleTimeString()}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
