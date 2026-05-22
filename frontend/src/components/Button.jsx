export default function Button({ text, size, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`font-medium rounded-md transition-all active:scale-95 ${
        size === "small"
          ? "px-3 py-1.5 text-xs bg-red-600/10 text-red-400 border border-red-900 hover:bg-red-600/20"
          : "w-full px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white"
      }`}
    >
      {text}
    </button>
  );
}
