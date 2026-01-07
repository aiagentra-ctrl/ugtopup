import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllBannerSlides,
  createBannerSlide,
  updateBannerSlide,
  deleteBannerSlide,
  uploadBannerImage,
  deleteBannerImage,
  getNextDisplayOrder,
  BannerSlide,
} from "@/lib/bannerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Link,
  ImageIcon,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

export const BannerManager = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<BannerSlide | null>(null);
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSlides = async () => {
    try {
      const data = await fetchAllBannerSlides();
      setSlides(data);
    } catch (error) {
      console.error("Error loading slides:", error);
      toast.error("Failed to load banner slides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();

    // Real-time subscription
    const channel = supabase
      .channel("admin-banner-slides")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "banner_slides",
        },
        () => {
          loadSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setUploadMethod("upload");
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
    setTitle("");
    setSubtitle("");
    setCtaText("");
    setDisplayOrder(1);
    setIsActive(true);
    setEditingSlide(null);
  };

  const openAddDialog = async () => {
    resetForm();
    try {
      const nextOrder = await getNextDisplayOrder();
      setDisplayOrder(nextOrder);
    } catch {
      setDisplayOrder(slides.length + 1);
    }
    setDialogOpen(true);
  };

  const openEditDialog = (slide: BannerSlide) => {
    setEditingSlide(slide);
    setImageUrl(slide.image_url);
    setPreviewUrl(slide.image_url);
    setUploadMethod("url");
    setTitle(slide.title || "");
    setSubtitle(slide.subtitle || "");
    setCtaText(slide.cta_text || "");
    setDisplayOrder(slide.display_order);
    setIsActive(slide.is_active);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Invalid file type. Please use JPG, PNG, or WebP.");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
    setSelectedFile(null);
  };

  const handleSave = async () => {
    // Validate image
    if (!selectedFile && !imageUrl) {
      toast.error("Please provide an image");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        finalImageUrl = await uploadBannerImage(selectedFile);
        setUploading(false);
      }

      const slideData = {
        image_url: finalImageUrl,
        title: title || null,
        subtitle: subtitle || null,
        cta_text: ctaText || null,
        display_order: displayOrder,
        is_active: isActive,
      };

      if (editingSlide) {
        // If image changed and old one was from storage, delete it
        if (editingSlide.image_url !== finalImageUrl && editingSlide.image_url.includes("banner-images")) {
          await deleteBannerImage(editingSlide.image_url);
        }
        await updateBannerSlide(editingSlide.id, slideData);
        toast.success("Banner updated successfully");
      } else {
        await createBannerSlide(slideData);
        toast.success("Banner created successfully");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;

    try {
      // Delete image from storage if it's a stored image
      if (slideToDelete.image_url.includes("banner-images")) {
        await deleteBannerImage(slideToDelete.image_url);
      }
      await deleteBannerSlide(slideToDelete.id);
      toast.success("Banner deleted successfully");
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    } finally {
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
    }
  };

  const toggleActive = async (slide: BannerSlide) => {
    try {
      await updateBannerSlide(slide.id, { is_active: !slide.is_active });
      toast.success(slide.is_active ? "Banner hidden" : "Banner visible");
    } catch (error) {
      console.error("Error toggling banner:", error);
      toast.error("Failed to update banner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banner Management</h1>
          <p className="text-muted-foreground">
            Manage your website slider banners. Recommended size: 1920×1080px (16:9 ratio)
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {/* Banner List */}
      {slides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No banners yet. Add your first banner!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => (
            <Card key={slide.id} className={!slide.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-40 shrink-0">
                    <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                      <img
                        src={slide.image_url}
                        alt={slide.title || "Banner"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </AspectRatio>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Order: {slide.display_order}
                      </span>
                      {slide.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          <Eye className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{slide.title || "(No title)"}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {slide.subtitle || "(No subtitle)"}
                    </p>
                    {slide.cta_text && (
                      <p className="text-xs text-primary mt-1">CTA: {slide.cta_text}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(slide)}
                      title={slide.is_active ? "Hide banner" : "Show banner"}
                    >
                      {slide.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(slide)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSlideToDelete(slide);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Guidelines */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">📐 Image Guidelines</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Aspect Ratio: <strong>16:9</strong></li>
                <li>• Recommended Size: <strong>1920 × 1080 pixels</strong></li>
                <li>• Max File Size: <strong>5MB</strong></li>
                <li>• Formats: <strong>JPG, PNG, WebP</strong></li>
              </ul>
            </div>

            {/* Upload Method */}
            <div className="space-y-3">
              <Label>Upload Method</Label>
              <RadioGroup
                value={uploadMethod}
                onValueChange={(v) => setUploadMethod(v as "upload" | "url")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="upload" />
                  <Label htmlFor="upload" className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" /> Upload Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label htmlFor="url" className="flex items-center gap-2 cursor-pointer">
                    <Link className="h-4 w-4" /> Image URL
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Upload Section */}
            {uploadMethod === "upload" ? (
              <div className="space-y-2">
                <Label>Select Image</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <p className="text-sm text-foreground">{selectedFile.name}</p>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview (16:9)</Label>
                <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </AspectRatio>
              </div>
            )}

            {/* Optional Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  placeholder="Enter banner title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Text (optional)</Label>
                <Input
                  placeholder="e.g., Order Now"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subtitle (optional)</Label>
              <Input
                placeholder="Enter subtitle text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm">
                    {isActive ? "Active (visible)" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Banner"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannerManager;
