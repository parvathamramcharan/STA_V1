import PropTypes from "prop-types";
import { WorldMapLeaflet } from "./WorldMapLeaflet";

export function WorldMapPlaceholder() {
  return (
    <div className="w-full h-[500px] bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_70%)] pointer-events-none z-10" />

      <WorldMapLeaflet />
    </div>
  );
}

MapNode.propTypes = {
  x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  y: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  count: PropTypes.number,
  color: PropTypes.string,
  delay: PropTypes.number,
};

function MapNode({ x, y, count, color, delay }) {
  const colorMap = {
    orange: "bg-orange-500 shadow-orange-500/50",
    red: "bg-red-500 shadow-red-500/50",
    blue: "bg-blue-500 shadow-blue-500/50",
    rose: "bg-rose-500 shadow-rose-500/50",
    green: "bg-green-500 shadow-green-500/50",
    indigo: "bg-indigo-500 shadow-indigo-500/50",
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.8, type: "spring" }}
      className="absolute cursor-pointer group/node"
      style={{ left: x, top: y }}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${colorMap[color]} transition-transform group-hover/node:scale-125`}
      >
        {count}
      </div>
      <div
        className={`absolute inset-0 rounded-full animate-ping opacity-20 ${colorMap[color]}`}
      />
    </motion.div>
  );
}
