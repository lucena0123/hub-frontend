import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ThumbsUp, MessageSquare, Share2, Globe } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

interface FacebookFeedProps {
    username?: string;
    avatarUrl?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    primaryText?: string;
    headline?: string;
    ctaText?: string;
    ctaType?: string; // e.g., WHATSAPP_MESSAGE
}

export function FacebookFeed({
    username = 'Costa & Lucena Advogados Associados',
    avatarUrl,
    imageUrl,
    videoUrl,
    primaryText,
    headline,
    ctaText = 'WhatsApp',
}: FacebookFeedProps) {
    const displayHeadline = headline || 'Saber agora';
    const displayCta = ctaText || 'WhatsApp';

    return (
        <div className="w-full max-w-[375px] bg-white border border-gray-200 mx-auto font-sans text-sm rounded-sm mb-4">
            {/* Header */}
            <div className="flex items-start justify-between p-3 pb-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10 cursor-pointer border border-gray-200">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gray-800 text-white font-bold text-xs">CL</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-[14px] text-gray-900 leading-tight hover:underline cursor-pointer">
                            {username}
                        </span>
                        <div className="flex items-center gap-1 text-[12px] text-gray-500">
                            <span>Patrocinado</span>
                            <span>·</span>
                            <Globe className="h-3 w-3" />
                        </div>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500 cursor-pointer" />
            </div>

            {/* Primary Text (Above Media) */}
            {primaryText && (
                <div className="px-3 pb-2 text-[14px] text-gray-900 whitespace-pre-line leading-normal">
                    {primaryText}
                </div>
            )}

            {/* Media */}
            <div className="relative bg-gray-100 flex items-center justify-center overflow-hidden">
                {videoUrl ? (
                    <video src={videoUrl} controls className="w-full h-auto object-cover" />
                ) : imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Ad Visual"
                        width={1200}
                        height={630}
                        className="w-full h-auto object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="h-64 w-full flex items-center justify-center text-gray-400">
                        Mídia indisponível
                    </div>
                )}
            </div>

            {/* CTA Bar / Link Preview */}
            <div className="bg-gray-100 px-3 py-2 flex items-center justify-between border-b border-gray-200">
                <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                        WhatsApp
                    </span>
                    <span className="text-[14px] font-semibold text-gray-900 truncate">
                        {displayHeadline}
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">
                        WhatsApp Messenger
                    </span>
                </div>
                <Button variant="outline" size="sm" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black h-8 shrink-0 gap-1.5 px-3">
                    <SiWhatsapp className="h-3.5 w-3.5" />
                    {displayCta}
                </Button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-2 py-2">
                {/* Simple Engagement Counts (Fake for preview) */}
            </div>
            <div className="flex items-center justify-between px-2 pb-1 border-t border-gray-100 pt-2">
                <Button variant="ghost" className="flex-1 text-gray-600 gap-2 h-8 text-[13px] font-medium hover:bg-gray-100">
                    <ThumbsUp className="h-4 w-4" />
                    Curtir
                </Button>
                <Button variant="ghost" className="flex-1 text-gray-600 gap-2 h-8 text-[13px] font-medium hover:bg-gray-100">
                    <MessageSquare className="h-4 w-4" />
                    Comentar
                </Button>
                <Button variant="ghost" className="flex-1 text-gray-600 gap-2 h-8 text-[13px] font-medium hover:bg-gray-100">
                    <Share2 className="h-4 w-4 " />
                    Compartilhar
                </Button>
            </div>
        </div>
    );
}
