import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export function VoucherInventory() {
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");

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

  const fetchVouchers = async () => {
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
  };

  useEffect(() => {
    fetchVouchers();

    const channel = supabase
      .channel("voucher_codes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "voucher_codes" },
        () => fetchVouchers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const available = vouchers.filter((v) => v.status === "available").length;
    const used = vouchers.filter((v) => v.status === "used").length;
    const today = new Date().toDateString();
    const usedToday = vouchers.filter(
      (v) => v.used_at && new Date(v.used_at).toDateString() === today
    ).length;
    return { available, used, usedToday, total: vouchers.length };
  }, [vouchers]);

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

    const codes = bulkCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      toast.error("No valid codes found");
      return;
    }

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
    const { error } = await supabase
      .from("voucher_codes" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Voucher deleted");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="h-5 w-5 text-primary" />}
          label="Total Codes"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="Available"
          value={stats.available}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          label="Used Today"
          value={stats.usedToday}
        />
        <StatCard
          icon={
            stats.available < 5 ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            )
          }
          label="Stock Status"
          value={
            stats.available === 0
              ? "Empty!"
              : stats.available < 5
              ? "Low Stock"
              : "OK"
          }
          highlight={stats.available < 5}
        />
      </div>

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
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {games.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Package ID</TableHead>
              <TableHead>Voucher Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Date Used</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No voucher codes found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.product_name}</TableCell>
                  <TableCell>{v.game}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{v.package_id || "—"}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                      {v.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === "available" ? "default" : "secondary"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {v.order_id || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(v.added_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.used_at ? new Date(v.used_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {v.status === "available" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(v.id)}
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

      {/* Add Single Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Voucher Code</DialogTitle>
            <DialogDescription>Add a single voucher code to inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Product Name (e.g. UniPin 2000 UC)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
            <Select value={newGame} onValueChange={setNewGame}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unipin">UniPin</SelectItem>
                <SelectItem value="garena">Garena</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Package ID (optional, for auto-matching)"
              value={newPackageId}
              onChange={(e) => setNewPackageId(e.target.value)}
            />
            <Input
              placeholder="Voucher Code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <Button onClick={handleAddSingle} className="w-full">
              Add Code
            </Button>
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
            <Input
              placeholder="Product Name (e.g. UniPin 500 UC)"
              value={bulkProductName}
              onChange={(e) => setBulkProductName(e.target.value)}
            />
            <Select value={bulkGame} onValueChange={setBulkGame}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unipin">UniPin</SelectItem>
                <SelectItem value="garena">Garena</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Package ID (optional)"
              value={bulkPackageId}
              onChange={(e) => setBulkPackageId(e.target.value)}
            />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex items-center gap-3 ${
        highlight ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
