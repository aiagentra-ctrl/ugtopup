import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Upload,
  Search,
  AlertTriangle,
  Package,
  CheckCircle,
  Clock,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface VoucherCode {
  id: string;
  product_name: string;
  game: string;
  package_id: string | null;
  code: string;
  status: string;
  order_id: string | null;
  added_at: string;
  used_at: string | null;
}

const PAGE_SIZE = 50;
const LOW_STOCK_THRESHOLD = 5;

export function VoucherInventory() {
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Add single
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newGame, setNewGame] = useState("unipin");
  const [newPackageId, setNewPackageId] = useState("");
  const [newCode, setNewCode] = useState("");

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkProductName, setBulkProductName] = useState("");
  const [bulkGame, setBulkGame] = useState("unipin");
  const [bulkPackageId, setBulkPackageId] = useState("");
  const [bulkCodes, setBulkCodes] = useState("");

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("voucher_codes" as any)
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch vouchers");
      console.error(error);
    } else {
      setVouchers((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVouchers();

    const channel = supabase
      .channel("voucher_codes_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "voucher_codes" },
        (payload) => {
          setVouchers((prev) => [payload.new as VoucherCode, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "voucher_codes" },
        (payload) => {
          setVouchers((prev) =>
            prev.map((v) => (v.id === (payload.new as VoucherCode).id ? (payload.new as VoucherCode) : v))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "voucher_codes" },
        (payload) => {
          setVouchers((prev) => prev.filter((v) => v.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    // Polling fallback every 30s
    const interval = setInterval(fetchVouchers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchVouchers]);

  const stats = useMemo(() => {
    const available = vouchers.filter((v) => v.status === "available").length;
    const used = vouchers.filter((v) => v.status === "used").length;
    const today = new Date().toDateString();
    const usedToday = vouchers.filter(
      (v) => v.used_at && new Date(v.used_at).toDateString() === today
    ).length;
    return { available, used, usedToday, total: vouchers.length };
  }, [vouchers]);

  const gameStats = useMemo(() => {
    const map: Record<string, { available: number; used: number; total: number }> = {};
    vouchers.forEach((v) => {
      if (!map[v.game]) map[v.game] = { available: 0, used: 0, total: 0 };
      map[v.game].total++;
      if (v.status === "available") map[v.game].available++;
      else map[v.game].used++;
    });
    return map;
  }, [vouchers]);

  const lowStockGames = useMemo(
    () => Object.entries(gameStats).filter(([, s]) => s.available < LOW_STOCK_THRESHOLD),
    [gameStats]
  );

  const games = useMemo(
    () => [...new Set(vouchers.map((v) => v.game))],
    [vouchers]
  );

  const filtered = useMemo(() => {
    return vouchers.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (gameFilter !== "all" && v.game !== gameFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.product_name.toLowerCase().includes(q) ||
          v.code.toLowerCase().includes(q) ||
          v.game.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, statusFilter, gameFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, gameFilter, searchQuery]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const handleAddSingle = async () => {
    if (!newProductName || !newCode || !newGame) {
      toast.error("Product name, game, and code are required");
      return;
    }
    const { error } = await supabase.from("voucher_codes" as any).insert({
      product_name: newProductName,
      game: newGame,
      package_id: newPackageId || null,
      code: newCode.trim(),
    } as any);

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Code already exists" : error.message);
    } else {
      toast.success("Voucher code added");
      setNewCode("");
      setShowAddForm(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkProductName || !bulkGame || !bulkCodes.trim()) {
      toast.error("Product name, game, and codes are required");
      return;
    }
    const codes = bulkCodes.split("\n").map((c) => c.trim()).filter((c) => c.length > 0);
    if (codes.length === 0) { toast.error("No valid codes found"); return; }

    const rows = codes.map((code) => ({
      product_name: bulkProductName,
      game: bulkGame,
      package_id: bulkPackageId || null,
      code,
    }));
    const { error } = await supabase.from("voucher_codes" as any).insert(rows as any);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${codes.length} voucher codes imported`);
      setBulkCodes("");
      setShowBulkImport(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("voucher_codes" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Voucher deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockGames.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Low Voucher Stock Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              {lowStockGames.map(([game, s]) => (
                <span key={game} className="mr-3">
                  <strong className="capitalize">{game}</strong>: {s.available} available
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Package className="h-5 w-5 text-primary" />} label="Total Codes" value={stats.total} />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="Available"
          value={stats.available}
          progress={stats.total > 0 ? (stats.available / stats.total) * 100 : 0}
        />
        <StatCard icon={<Clock className="h-5 w-5 text-yellow-500" />} label="Used" value={stats.used} />
        <StatCard icon={<Clock className="h-5 w-5 text-muted-foreground" />} label="Used Today" value={stats.usedToday} />
      </div>

      {/* Per-Game Stats */}
      {Object.keys(gameStats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(gameStats).map(([game, s]) => (
            <div
              key={game}
              className={`rounded-lg border p-3 ${
                s.available < LOW_STOCK_THRESHOLD ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-semibold capitalize text-foreground">{game}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{s.available}/{s.total}</span>
                <Progress value={s.total > 0 ? (s.available / s.total) * 100 : 0} className="h-2 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Code
        </Button>
        <Button onClick={() => setShowBulkImport(true)} size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-1" /> Bulk Import
        </Button>
        <Button onClick={fetchVouchers} size="sm" variant="ghost">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-48"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {games.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Spreadsheet Table */}
      <div className="rounded-lg border border-border overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Product Name</TableHead>
              <TableHead className="font-semibold">Game</TableHead>
              <TableHead className="font-semibold">Package ID</TableHead>
              <TableHead className="font-semibold">Voucher Code</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Order ID</TableHead>
              <TableHead className="font-semibold">Date Added</TableHead>
              <TableHead className="font-semibold">Date Used</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No voucher codes found</TableCell>
              </TableRow>
            ) : (
              paged.map((v, idx) => (
                <TableRow key={v.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <TableCell className="font-medium">{v.product_name}</TableCell>
                  <TableCell className="capitalize">{v.game}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{v.package_id || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{v.code}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(v.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === "available" ? "default" : "secondary"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {v.order_id || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{new Date(v.added_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{v.used_at ? new Date(v.used_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    {v.status === "available" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteTarget(v.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Page {currentPage} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voucher Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this voucher code from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Single Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Voucher Code</DialogTitle>
            <DialogDescription>Add a single voucher code to inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Product Name (e.g. UniPin 2000 UC)" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
            <Select value={newGame} onValueChange={setNewGame}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unipin">UniPin</SelectItem>
                <SelectItem value="garena">Garena</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="smilecoin">SmileCoin</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Package ID (optional, for auto-matching)" value={newPackageId} onChange={(e) => setNewPackageId(e.target.value)} />
            <Input placeholder="Voucher Code" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            <Button onClick={handleAddSingle} className="w-full">Add Code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Voucher Codes</DialogTitle>
            <DialogDescription>Paste one code per line</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Product Name (e.g. UniPin 500 UC)" value={bulkProductName} onChange={(e) => setBulkProductName(e.target.value)} />
            <Select value={bulkGame} onValueChange={setBulkGame}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unipin">UniPin</SelectItem>
                <SelectItem value="garena">Garena</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="smilecoin">SmileCoin</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Package ID (optional)" value={bulkPackageId} onChange={(e) => setBulkPackageId(e.target.value)} />
            <Textarea
              placeholder={"HFHEW123\nABCD456\nXYZ789"}
              value={bulkCodes}
              onChange={(e) => setBulkCodes(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {bulkCodes.split("\n").filter((c) => c.trim()).length} codes detected
            </p>
            <Button onClick={handleBulkImport} className="w-full">
              <Upload className="h-4 w-4 mr-2" /> Import All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
  progress?: number;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-2 ${
        highlight ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>
            {value}
          </p>
        </div>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1.5" />
      )}
    </div>
  );
}
