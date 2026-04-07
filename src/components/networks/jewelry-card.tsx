
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Gem, Palette, Tag } from 'lucide-react';

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

function canUseNextImage(src: string) {
  if (src.startsWith('data:image/')) {
    return false;
  }
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, '');
    return host === 'placehold.co' || host === 'media.istockphoto.com';
  } catch {
    return false;
  }
}

export function JewelryCard({ name, type, style, material, description, imageUrl, dataAiHint, className }: JewelryCardProps) {
  const normalizedImageUrl = normalizeImageUrl(imageUrl);
  const useNextImage = canUseNextImage(normalizedImageUrl);

  return (
    <Card className={cn("overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full", className)}>
      <CardHeader className="p-0">
        <div className="aspect-[3/2] relative w-full">
          {useNextImage ? (
            <Image
              src={normalizedImageUrl}
              alt={name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={dataAiHint || name.toLowerCase().split(' ').slice(0, 2).join(' ')}
            />
          ) : (
            <img
              src={normalizedImageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                if (target.src !== FALLBACK_IMAGE) {
                  target.src = FALLBACK_IMAGE;
                }
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg mb-1 leading-tight">{name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mb-2">{description}</CardDescription>
        
        <div className="flex flex-wrap gap-1 mt-2 text-xs">
          <Badge variant="secondary" className="flex items-center gap-1"><Gem className="h-3 w-3"/> {material}</Badge>
          <Badge variant="secondary" className="flex items-center gap-1"><Palette className="h-3 w-3"/> {style}</Badge>
          {type && <Badge variant="secondary" className="flex items-center gap-1"><Tag className="h-3 w-3"/> {type}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}


    
