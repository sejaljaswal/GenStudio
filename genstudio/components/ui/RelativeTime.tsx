"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function RelativeTime({ date }: { date: Date | string }) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => setTime(formatDistanceToNow(new Date(date), { addSuffix: true }));
    updateTime();
    
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, [date]);

  // Return a stable placeholder during initial SSR render to avoid hydration mismatch
  if (!time) return <span className="opacity-0 inline-block min-w-[50px]">...</span>;

  return <span>{time}</span>;
}
