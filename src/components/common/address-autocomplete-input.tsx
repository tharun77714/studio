"use client";

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  address: string;
  latitude: number;
  longitude: number;
  pincode?: string;
}

interface AddressAutocompleteInputProps {
  onPlaceSelectedAction: (placeDetails: AddressSuggestion | null) => void;
  initialValue?: string;
  className?: string;
  placeholder?: string;
}

export function AddressAutocompleteInput({
  onPlaceSelectedAction,
  initialValue = '',
  className,
  placeholder = 'Search an address or place...',
}: AddressAutocompleteInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSuggestions() {
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }

      const trimmed = query.trim();
      if (trimmed.length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/geo/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setIsOpen(true);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    const timer = window.setTimeout(loadSuggestions, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          if (!nextValue.trim()) {
            onPlaceSelectedAction(null);
          }
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className="pl-9"
      />

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
              {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching locations...</div>}
              {!isLoading &&
                suggestions.map((suggestion) => (
                  <button
                key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.address}`}
                type="button"
                className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                onClick={() => {
                  skipNextFetchRef.current = true;
                  setQuery(suggestion.address);
                  setSuggestions([]);
                  setIsOpen(false);
                  onPlaceSelectedAction(suggestion);
                }}
              >
                {suggestion.address}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
