import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostFilterTabsProps {
    defaultValue: string;
}

export function PostFilterTabs({ defaultValue }: PostFilterTabsProps) {
    return (
        <Tabs defaultValue={defaultValue} className="w-[400px]">
            <TabsList>
                <TabsTrigger value="all" asChild>
                    <a href="/admin/posts">全部</a>
                </TabsTrigger>
                <TabsTrigger value="published" asChild>
                    <a href="/admin/posts?status=published">已发布</a>
                </TabsTrigger>
                <TabsTrigger value="draft" asChild>
                    <a href="/admin/posts?status=draft">草稿箱</a>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
