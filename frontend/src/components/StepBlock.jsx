export default function StepBlock({ step, index, isSelected, onSelect, onRemove }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-950/50 border-indigo-500 shadow-sm shadow-indigo-500/10"
          : "bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
      }`}
    >
      <span className="text-xs font-mono text-slate-500 w-6 text-right shrink-0">
        {index + 1}
      </span>
      <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-indigo-400" : "bg-slate-600"}`} />
      <span className={`flex-1 text-sm ${isSelected ? "text-indigo-200 font-medium" : "text-slate-300"}`}>
        {step.text}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 hover:!opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded"
        style={{ opacity: undefined }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = ''}
      >
        <svg className="w-4 h-4 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
