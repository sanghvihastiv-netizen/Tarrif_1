export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Settings</h1>
      <p className="mb-8 text-base-muted">Preferences for your shipping cost calculations</p>

      <div className="rounded-xl border border-base-border bg-base-panel p-6">
        <p className="text-sm text-base-muted">
          Calculations are stored locally in your browser. Clearing your browser data will remove
          saved calculations.
        </p>
      </div>
    </div>
  );
}
