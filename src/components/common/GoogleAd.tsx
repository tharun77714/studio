"use client";
import { useEffect } from "react";

export function GoogleAd({ slotId }: { slotId: string }) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error", err);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center my-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-md">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1519210527641884"
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
