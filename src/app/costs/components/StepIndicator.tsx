const STEPS = ["Route", "Product", "Shipment", "Review"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive || isDone
                    ? "bg-white text-black"
                    : "bg-base-card text-base-muted"
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`text-xs ${
                  isActive ? "text-white" : "text-base-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div
                className={`mx-3 mb-5 h-px w-16 ${
                  isDone ? "bg-white" : "bg-base-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
