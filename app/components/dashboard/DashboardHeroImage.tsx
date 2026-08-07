"use client";

export interface DashboardHeroImageProps {
  type: "image" | "video";
  src: string;
  poster?: string;
  onEnded?(): void;
  onError?(): void;
}

export default function DashboardHeroImage({
  type,
  src,
  poster,
  onEnded,
  onError,
}: DashboardHeroImageProps) {
  return (
    <div className="eds-dashboard-hero-image">
      {type === "video" ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={onEnded}
          onError={onError}
        />
      ) : (
        <img
          src={src}
          alt=""
          onError={onError}
        />
      )}
      <span className="eds-dashboard-hero-shade" />
    </div>
  );
}
