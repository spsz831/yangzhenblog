import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Copy, Upload, Loader2, Image as ImageIcon, Search, Eye, RefreshCw } from "lucide-react";
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
    const [search, setSearch] = useState("");
    const [sortMode, setSortMode] = useState<"newest" | "oldest" | "name">("newest");
    const [page, setPage] = useState(1);
    const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const pageSize = 12;

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
        setUploadProgress(0);
        const formData = new FormData();
        formData.append("file", file);

        try {
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/admin/images");
                xhr.upload.addEventListener("progress", (event) => {
                    if (!event.lengthComputable) return;
                    setUploadProgress(Math.round((event.loaded / event.total) * 100));
                });
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                        return;
                    }
                    reject(new Error("Upload failed"));
                };
                xhr.onerror = () => reject(new Error("Upload failed"));
                xhr.send(formData);
            });
            await fetchImages();
        } catch (error) {
            alert("上传失败，请重试");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            e.target.value = "";
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm("确定要删除这张图片吗？")) return;

        try {
            const res = await fetch(`/api/admin/images`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
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

    const groupedImages = useMemo(() => {
        const filtered = images
            .filter((img) => img.key.toLowerCase().includes(search.trim().toLowerCase()))
            .sort((a, b) => {
                if (sortMode === "name") return a.key.localeCompare(b.key, "zh-CN");
                const left = new Date(a.uploadedAt).getTime();
                const right = new Date(b.uploadedAt).getTime();
                return sortMode === "oldest" ? left - right : right - left;
            });

        const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
        return {
            total: filtered.length,
            pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
            items: paged.reduce<Record<string, ImageItem[]>>((acc, item) => {
                const key = format(new Date(item.uploadedAt), "yyyy 年 MM 月");
                acc[key] ||= [];
                acc[key].push(item);
                return acc;
            }, {}),
        };
    }, [images, page, search, sortMode]);

    useEffect(() => {
        setPage(1);
    }, [search, sortMode]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border bg-background p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold">媒体库</h3>
                        <p className="text-sm text-muted-foreground">支持搜索、排序、分页和大图预览。</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        共 {images.length} 张图片
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="搜索文件名"
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={sortMode}
                        onChange={(event) => setSortMode(event.target.value as "newest" | "oldest" | "name")}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="newest">最新优先</option>
                        <option value="oldest">最早优先</option>
                        <option value="name">名称排序</option>
                    </select>
                    <Button variant="outline" onClick={fetchImages} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        刷新
                    </Button>
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
                {uploading && (
                    <div className="space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">上传进度 {uploadProgress}%</p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : groupedImages.total === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>{search ? "没有匹配的图片" : "暂无图片，点击上方按钮上传"}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedImages.items).map(([group, groupItems]) => (
                        <section key={group} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold tracking-wide text-muted-foreground">{group}</h4>
                                <span className="text-xs text-muted-foreground">{groupItems.length} 张</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                                {groupItems.map((img) => (
                                    <Card key={img.key} className="overflow-hidden group rounded-2xl border-border/70">
                                        <button
                                            type="button"
                                            className="aspect-square relative block w-full overflow-hidden bg-muted"
                                            onClick={() => setPreviewImage(img)}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.key}
                                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </button>
                                        <CardContent className="space-y-1 p-3">
                                            <p className="text-xs font-medium truncate" title={img.key}>
                                                {img.key}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">{formatSize(img.size)}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {format(new Date(img.uploadedAt), "yyyy-MM-dd HH:mm")}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="grid grid-cols-3 gap-2 p-3 pt-0">
                                            <Button variant="outline" size="icon" className="h-8 w-full" onClick={() => setPreviewImage(img)} title="预览">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-full" onClick={() => handleCopy(img.url)} title="复制链接">
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-8 w-full" onClick={() => handleDelete(img.key)} title="删除图片">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            第 {page} / {groupedImages.pages} 页，共 {groupedImages.total} 张
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                                上一页
                            </Button>
                            <Button variant="outline" disabled={page >= groupedImages.pages} onClick={() => setPage((current) => current + 1)}>
                                下一页
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="max-h-full w-full max-w-4xl overflow-hidden rounded-3xl border bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h4 className="text-base font-semibold">{previewImage.key}</h4>
                                <p className="text-sm text-muted-foreground">{format(new Date(previewImage.uploadedAt), "yyyy-MM-dd HH:mm")}</p>
                            </div>
                            <Button variant="outline" onClick={() => setPreviewImage(null)}>
                                关闭
                            </Button>
                        </div>
                        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="bg-muted/20 p-4">
                                <img src={previewImage.url} alt={previewImage.key} className="max-h-[70vh] w-full rounded-2xl object-contain" />
                            </div>
                            <div className="space-y-4 p-6">
                                <div>
                                    <p className="text-sm font-medium">文件大小</p>
                                    <p className="text-sm text-muted-foreground">{formatSize(previewImage.size)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">图片链接</p>
                                    <p className="break-all text-sm text-muted-foreground">{window.location.origin + previewImage.url}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handleCopy(previewImage.url)}>复制链接</Button>
                                    <Button variant="destructive" onClick={() => {
                                        handleDelete(previewImage.key);
                                        setPreviewImage(null);
                                    }}>删除图片</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
