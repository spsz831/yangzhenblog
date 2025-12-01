import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Settings, LogOut } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Yang Zhen Blog
                    </h2>
                    <div className="space-y-1">
                        <Button variant="secondary" className="w-full justify-start" asChild>
                            <a href="/admin">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/posts">
                                <FileText className="mr-2 h-4 w-4" />
                                Posts
                            </a>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href="/admin/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="px-3 py-2">
                <form action="/api/auth/logout" method="POST">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100" type="submit">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </div>
        </div>
    );
}
