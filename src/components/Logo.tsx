export function Logo({ className = "" }: { className?: string }) {
  return <img src="/image.png" alt="Mindloop" className={className || "h-7 w-auto"} />;
}
