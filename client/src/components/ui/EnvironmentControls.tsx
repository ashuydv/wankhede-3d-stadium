import { useAppStore } from "../../store/useAppStore";
import { formatHour } from "../../lib/sunPosition";

export function EnvironmentControls() {
  const matchModeOn = useAppStore((s) => s.matchModeOn);
  const setMatchModeOn = useAppStore((s) => s.setMatchModeOn);
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const setTimeOfDay = useAppStore((s) => s.setTimeOfDay);

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 flex flex-col gap-3 rounded-lg bg-black/70 p-4 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live Match</div>
          <div className="text-[11px] text-gray-500">See players on the pitch</div>
        </div>
        <button
          onClick={() => setMatchModeOn(!matchModeOn)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            matchModeOn ? "bg-emerald-500" : "bg-gray-600"
          }`}
          aria-label="Toggle live match mode"
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              matchModeOn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Time of Day</div>
          <div className="text-xs text-amber-300">{formatHour(timeOfDay)}</div>
        </div>
        <input
          type="range"
          min={5}
          max={22}
          step={0.25}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
          className="w-56 accent-amber-400"
        />
        <div className="mt-0.5 flex justify-between text-[10px] text-gray-500">
          <span>5 AM</span>
          <span>Noon</span>
          <span>10 PM</span>
        </div>
      </div>
    </div>
  );
}
