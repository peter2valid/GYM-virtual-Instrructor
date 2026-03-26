"use client";

interface ExerciseGifDisplayProps {
  demoUrl: string;
  loopUrl: string;
  name: string;
}

export function ExerciseGifDisplay({ demoUrl, loopUrl, name }: ExerciseGifDisplayProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={demoUrl}
      alt={name}
      className="h-full w-full object-contain bg-muted"
      onError={(e) => {
        if (e.currentTarget.src !== loopUrl) {
          e.currentTarget.src = loopUrl;
        }
      }}
    />
  );
}
