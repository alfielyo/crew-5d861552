import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

export type LocationResult = {
  displayName: string;
  city: string;
  country: string;
  area: string;
};

type NominatimResult = {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
    country?: string;
    suburb?: string;
    neighbourhood?: string;
    borough?: string;
  };
};

interface LocationSearchProps {
  value: string;
  onSelect: (location: LocationResult) => void;
  onChange: (value: string) => void;
}

const LocationSearch = ({ value, onSelect, onChange }: LocationSearchProps) => {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      const mapped = data.map((r) => {
        const addr = r.address;
        const city = addr.city || addr.town || addr.village || addr.hamlet || "";
        const area = addr.suburb || addr.neighbourhood || addr.borough || addr.county || addr.state || "";
        return {
          displayName: [city, area, addr.country].filter(Boolean).join(", "),
          city,
          country: addr.country || "",
          area,
        };
      });
      setResults(mapped);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (loc: LocationResult) => {
    onSelect(loc);
    onChange(loc.displayName);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          autoFocus
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="border-border bg-secondary text-lg pl-10"
          placeholder="Search any city or area…"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover overflow-hidden">
          {results.map((loc, i) => (
            <li
              key={i}
              onClick={() => handleSelect(loc)}
              className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-accent transition-colors"
            >
              <MapPin size={14} className="shrink-0 text-muted-foreground" />
              <span className="text-foreground">{loc.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
