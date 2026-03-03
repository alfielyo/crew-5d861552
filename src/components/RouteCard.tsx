import type { RouteWaypoint } from "@/hooks/use-my-group";
import { Coffee } from "lucide-react";

interface RouteCardProps {
  name: string;
  distanceKm: number;
  meetingPoint: string;
  postRunCafe: string;
  waypoints: RouteWaypoint[];
}

export function RouteCard({
  name,
  distanceKm,
  meetingPoint,
  postRunCafe,
  waypoints,
}: RouteCardProps) {
  const sorted = [...waypoints].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-serif text-lg">{name}</h3>
        <p className="text-sm text-muted-foreground">{distanceKm} km</p>
      </div>

      {/* Meeting point */}
      <div className="flex items-start gap-2 text-sm">
        <svg
          className="mt-0.5 shrink-0 text-primary"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 0a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
        <div>
          <p className="text-muted-foreground">Meet at</p>
          <p className="font-medium">{meetingPoint}</p>
        </div>
      </div>

      {/* Route waypoints */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Route</p>
        <ol className="space-y-1.5">
          {sorted.map((wp) => (
            <li key={wp.order} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {wp.order}
              </span>
              <span>{wp.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Post-run café */}
      <div className="flex items-start gap-2 text-sm">
        <Coffee size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-muted-foreground">Post-run</p>
          <p className="font-medium">{postRunCafe}</p>
        </div>
      </div>
    </div>
  );
}
