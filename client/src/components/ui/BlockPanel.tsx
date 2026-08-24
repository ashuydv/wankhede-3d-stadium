import { useAppStore } from "../../store/useAppStore";
import type { Block } from "../../types";

interface BlockPanelProps {
  blocks: Block[];
}

export function BlockPanel({ blocks }: BlockPanelProps) {
  const goToBlock = useAppStore((s) => s.goToBlock);

  if (blocks.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute right-6 top-24 w-64 rounded-lg bg-black/70 p-3 text-white backdrop-blur-sm">
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Select a block
      </div>
      <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {blocks.map((block) => (
          <button
            key={block.id}
            onClick={() => goToBlock(block.id)}
            disabled={block.seatsAvailable === 0}
            className="flex items-center justify-between rounded-md border border-gray-700 px-3 py-2 text-left text-sm hover:border-emerald-500 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div>
              <div className="font-medium">{block.name}</div>
              <div className="text-xs text-gray-400">Rows 1–{block.rows}</div>
            </div>
            <div className="text-xs text-emerald-400">{block.seatsAvailable} left</div>
          </button>
        ))}
      </div>
    </div>
  );
}
