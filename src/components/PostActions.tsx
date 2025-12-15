import React, { useState, useEffect } from 'react';
import { Heart, Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { QRCodeSVG } from 'qrcode.react';
import { cn } from "@/lib/utils";

interface PostActionsProps {
    postId: number;
    initialLikes: number;
    postUrl: string;
}

export function PostActions({ postId, initialLikes, postUrl }: PostActionsProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
        if (likedPosts[postId]) {
            setIsLiked(true);
        }
    }, [postId]);

    const handleLike = async () => {
        if (isLiked) return;

        // Optimistic update
        setLikes(prev => prev + 1);
        setIsLiked(true);

        try {
            const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to like post');
            }

            // Update local storage
            const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
            likedPosts[postId] = true;
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        } catch (error) {
            console.error('Like failed:', error);
            // Revert optimistic update
            setLikes(prev => prev - 1);
            setIsLiked(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(postUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-col items-center gap-6 py-8 md:py-12 border-t mt-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                        "rounded-full gap-2 min-w-[120px] transition-all duration-300",
                        isLiked && "bg-pink-50 text-pink-500 border-pink-200 hover:bg-pink-100 hover:text-pink-600"
                    )}
                    onClick={handleLike}
                    disabled={isLiked}
                >
                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                    <span>{likes}</span>
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="lg" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
                            <Share2 className="w-5 h-5" />
                            <span>分享</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="center">
                        <div className="flex flex-col gap-4">
                            <Button variant="ghost" className="justify-start gap-3 h-auto py-2" onClick={handleCopyLink}>
                                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                <span className="text-sm">复制链接</span>
                            </Button>

                            <div className="flex flex-col items-center gap-2 p-2 bg-white rounded-lg border">
                                <QRCodeSVG value={postUrl} size={120} />
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" /> 微信扫一扫
                                </span>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
