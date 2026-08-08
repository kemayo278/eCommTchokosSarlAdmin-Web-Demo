"use client";

import { useState } from "react";
import { Package } from "lucide-react";

export function ProductThumbnail({
  src = null,
  name = "",
  size = "h-10 w-10",
}: {
  src?: string | null;
  name?: string;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400`}
      >
        <Package className="h-4 w-4" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`${size} shrink-0 rounded-lg object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
