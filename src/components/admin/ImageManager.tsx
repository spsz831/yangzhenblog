import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Copy, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface ImageItem {
    key: string;
    size: number;
    uploadedAt: string;
    url: string;
}

export function ImageManager() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/images");
            const data = await res.json() as { images: ImageItem[] };
            setImages(data.images);
        } catch (error) {
            console.error("Failed to fetch images", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("文件大小不能超过 10MB");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/images", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            await fetchImages();
        } catch (error) {
            alert("上传失败，请重试");
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm("确定要删除这张图片吗？")) return;

        try {
            const res = await fetch(`/api/admin/images/${key}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            setImages(images.filter((img) => img.key !== key));
        } catch (error) {
            alert("删除失败");
        }
    };

    const handleCopy = (url: string) => {
        const fullUrl = window.location.origin + url;
        navigator.clipboard.writeText(fullUrl);
        alert("链接已复制到剪贴板");
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative">
                    <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <Label htmlFor="image-upload">
                        <Button asChild disabled={uploading} className="cursor-pointer">
                            <span>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                上传图片
                            </span>
                        </Button>
                    </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                    共 {images.length} 张图片
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>暂无图片，点击上方按钮上传</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {images.map((img) => (
                        <Card key={img.key} className="overflow-hidden group">
                            <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                                <img
                                    src={img.url}
                                    alt={img.key}
                                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                            <CardContent className="p-2">
                                <p className="text-[10px] font-medium truncate" title={img.key}>
                                    {img.key}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatSize(img.size)}
                                </p>
                            </CardContent>
                            <CardFooter className="p-2 pt-0 flex justify-between gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleCopy(img.url)}
                                    title="复制链接"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDelete(img.key)}
                                    title="删除图片"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
