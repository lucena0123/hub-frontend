import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreHorizontal, Send, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstagramFeedAdProps {
    username?: string;
    avatarUrl?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    caption?: string;
    ctaText?: string;
    ctaType?: string;
    headline?: string;
}

export function InstagramFeedAd({
    username = 'costalucenaadvogados',
    avatarUrl,
    imageUrl,
    videoUrl,
    caption,
    ctaText = 'Saiba mais',
    ctaType,
    headline, // Often mapped to the CTA bar text in some placements, or omitted in feed
}: InstagramFeedAdProps) {

    // Instagram Feed Logic:
    // - Top: Profile header
    // - Middle: Media
    // - CTA Bar: Often appears as a distinct bar for ads ("Converse no WhatsApp >")
    // - Bottom: Actions + Caption

    const displayCta = ctaText || 'Saiba mais';

    // Map internal CTA types to display text if needed, or use what comes from API
    // In the user's screenshot, it says "Converse no WhatsApp" with an arrow.
    // This usually happens when the CTA is "WhatsApp Message" or destination is WA.
    const isWhatsApp = ctaType === 'WHATSAPP_MESSAGE' || ctaText?.toLowerCase().includes('whatsapp');

    return (
        <div className="w-full max-w-[375px] bg-white border border-gray-200 mx-auto font-sans text-sm rounded-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-tr from-amber-400 to-orange-600 text-[10px] text-white font-bold">
                            {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                        <span className="font-semibold text-[13px] text-black cursor-pointer hover:opacity-70">
                            {username}
                        </span>
                        <span className="text-[11px] text-gray-500">Patrocinado</span>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-600 cursor-pointer" />
            </div>

            {/* Media */}
            <div className="relative bg-gray-100 min-h-[300px] flex items-center justify-center overflow-hidden">
                {videoUrl ? (
                    <video src={videoUrl} controls className="w-full h-auto object-cover" />
                ) : imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Ad Visual"
                        fill
                        className="object-cover"
                        sizes="(max-width: 375px) 100vw, 375px"
                        unoptimized
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-400 gap-2 p-8 text-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
                        <span className="text-xs">Mídia indisponível</span>
                    </div>
                )}
            </div>

            {/* CTA Bar (Native-like) */}
            <div className="bg-secondary/60 border-t border-b border-gray-100 px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-secondary transition-colors">
                <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", isWhatsApp ? "text-emerald-600" : "text-primary")}>
                        {headline || displayCta}
                    </span>
                </div>
                <div className="text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-4">
                    <Heart className="h-6 w-6 text-black cursor-pointer hover:text-gray-500 stroke-[1.5px]" />
                    <MessageCircle className="h-6 w-6 text-black cursor-pointer hover:text-gray-500 stroke-[1.5px] -scale-x-100" />
                    <Send className="h-6 w-6 text-black cursor-pointer hover:text-gray-500 stroke-[1.5px]" />
                </div>
                <Bookmark className="h-6 w-6 text-black cursor-pointer hover:text-gray-500 stroke-[1.5px]" />
            </div>

            {/* Likes & Caption */}
            <div className="px-3 pb-4 space-y-1.5">
                <div className="font-semibold text-[13px] text-black">
                    1.234 curtidas
                </div>
                <div className="text-[13px]">
                    <span className="font-semibold mr-1.5">{username}</span>
                    <span className="text-gray-900 whitespace-pre-line">{caption}</span>
                </div>
            </div>
        </div>
    );
}
