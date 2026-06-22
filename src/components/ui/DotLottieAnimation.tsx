"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/cn";

type DotLottieAnimationProps = {
  src: string;
  label: string;
  className?: string;
  loop?: boolean;
};

export function DotLottieAnimation({
  src,
  label,
  className,
  loop = false,
}: DotLottieAnimationProps) {
  return (
    <div className={cn(className)} role="img" aria-label={label}>
      <DotLottieReact
        src={src}
        autoplay
        loop={loop}
        style={{
          display: "block",
          height: "100%",
          width: "100%",
        }}
      />
    </div>
  );
}
