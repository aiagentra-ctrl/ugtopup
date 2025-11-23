import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, HardDrive, ImageIcon, AlertTriangle } from "lucide-react";
import { fetchSupabaseLimits, type SupabaseLimits } from "@/lib/supabaseLimitsApi";
import { toast } from "sonner";

export function SupabaseLimits() {
  const [limits, setLimits] = useState<SupabaseLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLimits = async () => {
    setLoading(true);
    try {
      const data = await fetchSupabaseLimits();
      if (data) {
        setLimits(data);
        toast.success("Usage stats updated");
      } else {
        toast.error("Failed to fetch usage stats");
      }
    } catch (error) {
      console.error("Error loading limits:", error);
      toast.error("Failed to load Supabase limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLimits();
  }, []);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatMB = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supabase Usage Limits</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your Supabase Free Plan resources
          </p>
        </div>
        <Button onClick={loadLimits} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !limits ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : limits ? (
        <>
          {/* Storage Usage */}
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle>Total File Storage</CardTitle>
              </div>
              <CardDescription>
                Current usage in payment screenshots bucket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatMB(limits.storage.used_mb)} / {formatMB(limits.storage.limit_mb)}
                </span>
                <span className={`text-sm font-bold ${getStatusColor(limits.storage.percentage)}`}>
                  {limits.storage.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(limits.storage.percentage)}`}
                  style={{ width: `${Math.min(limits.storage.percentage, 100)}%` }}
                />
              </div>
              {limits.storage.percentage >= 70 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-500">
                    {limits.storage.percentage >= 90
                      ? "Critical: Storage almost full! Delete unused screenshots to free up space."
                      : "Warning: Storage usage is high. Consider cleaning up old files."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Size */}
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Database Size</CardTitle>
              </div>
              <CardDescription>
                Estimated database usage (approximate)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatMB(limits.database.used_mb)} / {formatMB(limits.database.limit_mb)}
                </span>
                <span className={`text-sm font-bold ${getStatusColor(limits.database.percentage)}`}>
                  {limits.database.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(limits.database.percentage)}`}
                  style={{ width: `${Math.min(limits.database.percentage, 100)}%` }}
                />
              </div>
              {limits.database.percentage >= 70 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-500">
                    {limits.database.percentage >= 90
                      ? "Critical: Database almost full! Archive or delete old records."
                      : "Warning: Database usage is increasing. Monitor your data closely."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Screenshots Bucket */}
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Payment Screenshots Bucket</CardTitle>
              </div>
              <CardDescription>
                Bucket-specific storage details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Files Stored</p>
                  <p className="text-2xl font-bold text-foreground">
                    {limits.payment_screenshots_bucket.file_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bucket Usage</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatMB(limits.payment_screenshots_bucket.used_mb)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatMB(limits.payment_screenshots_bucket.used_mb)} / {formatMB(limits.payment_screenshots_bucket.limit_mb)}
                </span>
                <span className={`text-sm font-bold ${getStatusColor(limits.payment_screenshots_bucket.percentage)}`}>
                  {limits.payment_screenshots_bucket.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(limits.payment_screenshots_bucket.percentage)}`}
                  style={{ width: `${Math.min(limits.payment_screenshots_bucket.percentage, 100)}%` }}
                />
              </div>
              {limits.payment_screenshots_bucket.percentage >= 70 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-500">
                    {limits.payment_screenshots_bucket.percentage >= 90
                      ? "Critical: Bucket almost full! Delete fake or old payment requests."
                      : "Warning: Bucket usage is high. Clean up unnecessary screenshots."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-xs text-muted-foreground">
            Last updated: {new Date(limits.last_updated).toLocaleString()}
          </div>
        </>
      ) : (
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Failed to load usage statistics</p>
            <Button onClick={loadLimits} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
