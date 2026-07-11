import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostFilterTabsProps {
    defaultValue: string;
    search?: string;
}

export function PostFilterTabs({ defaultValue, search = "" }: PostFilterTabsProps) {
    const params = search ? `&q=${encodeURIComponent(search)}` : "";

    return (
        <Tabs defaultValue={defaultValue} className="w-full max-w-[560px]">
            <TabsList>
                <TabsTrigger value="all" asChild>
                    <a href={`/admin/posts${search ? `?q=${encodeURIComponent(search)}` : ""}`}>全部</a>
                </TabsTrigger>
                <TabsTrigger value="published" asChild>
                    <a href={`/admin/posts?status=published${params}`}>已发布</a>
                </TabsTrigger>
                <TabsTrigger value="draft" asChild>
                    <a href={`/admin/posts?status=draft${params}`}>草稿箱</a>
                </TabsTrigger>
                <TabsTrigger value="scheduled" asChild>
                    <a href={`/admin/posts?status=scheduled${params}`}>定时发布</a>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
