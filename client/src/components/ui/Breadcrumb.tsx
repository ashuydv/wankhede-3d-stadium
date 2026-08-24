import { useAppStore } from "../../store/useAppStore";
import type { Stand, Block } from "../../types";

interface BreadcrumbProps {
  stands: Stand[];
  blocks: Block[];
}

export function Breadcrumb({ stands, blocks }: BreadcrumbProps) {
  const viewLevel = useAppStore((s) => s.viewLevel);
  const selectedStandId = useAppStore((s) => s.selectedStandId);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);
  const goToOverview = useAppStore((s) => s.goToOverview);
  const goToStand = useAppStore((s) => s.goToStand);
  const goToBlock = useAppStore((s) => s.goToBlock);

  if (viewLevel === "overview") return null;

  const stand = stands.find((s) => s.id === selectedStandId);
  const block = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="pointer-events-auto absolute left-6 top-24 flex items-center gap-2 rounded-lg bg-black/70 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm">
      <button onClick={goToOverview} className="font-medium text-white hover:text-emerald-400">
        Stadium
      </button>
      {stand && (
        <>
          <span className="text-gray-500">/</span>
          <button
            onClick={() => goToStand(stand.id)}
            className={
              viewLevel === "stand" ? "font-medium text-white" : "text-gray-300 hover:text-emerald-400"
            }
          >
            {stand.shortName}
          </button>
        </>
      )}
      {block && (viewLevel === "block" || viewLevel === "seats") && (
        <>
          <span className="text-gray-500">/</span>
          <button
            onClick={() => goToBlock(block.id)}
            className={
              viewLevel === "block" ? "font-medium text-white" : "text-gray-300 hover:text-emerald-400"
            }
          >
            {block.name}
          </button>
        </>
      )}

      <button
        onClick={() => {
          if (viewLevel === "seats") goToBlock(selectedBlockId!);
          else if (viewLevel === "block") goToStand(selectedStandId!);
          else goToOverview();
        }}
        className="ml-3 rounded-md border border-gray-600 px-3 py-1 text-xs font-medium text-gray-200 hover:border-emerald-500 hover:text-emerald-400"
      >
        ← Back
      </button>
    </div>
  );
}
