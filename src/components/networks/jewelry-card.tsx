import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Gem, Palette, Tag, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define a type for JewelryItem, consistent with what BusinessNetworkView saves
export interface JewelryItem {
  id: string;
  name: string;
  type: string; // Type of jewelry, e.g., Necklace, Ring (can be 'Assorted' for business items if not specified)
  style: string;
  material: string;
  description: string;
  imageUrl: string;
  dataAiHint?: string; // Optional, more relevant for AI suggestions
}

interface JewelryCardProps extends JewelryItem {
  className?: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/600x400.png?text=Jewelry';

function normalizeImageUrl(rawUrl: string) {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith('data:image/')) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'google.com' && url.pathname === '/imgres') {
      const imgUrlParam = url.searchParams.get('imgurl');
      if (imgUrlParam) {
        return imgUrlParam;
      }
    }
    return trimmed;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export function JewelryCard({ id, name, type, style, material, description, imageUrl, dataAiHint, className }: JewelryCardProps) {
  const normalizedImageUrl = normalizeImageUrl(imageUrl);
  const { toast } = useToast();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a shareable URL that points to this specific item
    const url = new URL(window.location.href);
    url.searchParams.set('item', id);
    const shareUrl = url.toString();

    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Check out this beautiful ${name}!`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "The link to this jewelry item has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="h-full">
      <Card className={cn("overflow-hidden flex flex-col h-full relative group bg-black/40 backdrop-blur-2xl border border-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]", className)}>
        <CardHeader className="p-0">
          <div className="aspect-[3/2] relative w-full bg-black/60 overflow-hidden luxury-glare-container">
            <img
              src={normalizedImageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                if (target.src !== FALLBACK_IMAGE) {
                  target.src = FALLBACK_IMAGE;
                }
              }}
            />
            {/* Share Button placed on the image */}
            <button
              onClick={handleShare}
              className="absolute right-3 bottom-3 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-primary hover:text-primary-foreground z-10 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 duration-300"
              aria-label="Share item"
              title="Share this item"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow bg-gradient-to-t from-background/80 to-transparent">
          <CardTitle className="font-headline text-xl mb-1 leading-tight tracking-wide">{name}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mb-3 font-light leading-relaxed">{description}</CardDescription>
          
          <div className="flex flex-wrap gap-1 mt-2 text-xs">
            <Badge variant="secondary" className="flex items-center gap-1 bg-secondary/50 hover:bg-secondary/80 font-medium"><Gem className="h-3 w-3"/> {material}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1 bg-secondary/50 hover:bg-secondary/80 font-medium"><Palette className="h-3 w-3"/> {style}</Badge>
            {type && <Badge variant="secondary" className="flex items-center gap-1 bg-secondary/50 hover:bg-secondary/80 font-medium"><Tag className="h-3 w-3"/> {type}</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
