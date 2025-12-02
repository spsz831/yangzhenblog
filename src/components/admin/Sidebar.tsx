import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Image, BarChart, UserCog, LogOut } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 min-h-screen border-r bg-muted/40", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-6 px-4 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-xs text-primary">YZ</span>
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            杨振博客
                        </h2>
                    </div>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                仪表盘
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/posts">
                                <FileText className="mr-2 h-4 w-4" />
                                文章管理
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/images">
                                <Image className="mr-2 h-4 w-4" />
                                图片管理
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/analytics">
                                <BarChart className="mr-2 h-4 w-4" />
                                数据分析
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/settings">
                                <UserCog className="mr-2 h-4 w-4" />
                                账号设置
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="px-3 py-2 mt-auto">
                <form action="/api/auth/logout" method="POST">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100" type="submit">
                        <LogOut className="mr-2 h-4 w-4" />
                        退出登录
                    </Button>
                </form>
            </div>
        </div>
    );
}
