export function TrackingBar() {
  return (
    <div className="w-full flex h-3" aria-hidden="true">
      <div className="w-1/3 bg-protein-coral h-full" />
      <div className="w-1/3 bg-carbs-amber h-full" />
      <div className="w-1/3 bg-fats-indigo h-full" />
    </div>
  );
}
