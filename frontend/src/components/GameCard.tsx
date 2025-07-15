import { Download, Settings } from "lucide-react";

interface GameCardProps {
  thumbnail: string;
  title: string;
  onDownload: () => void;
  onSettings: () => void;
  isDownloaded: boolean;
  isDownloading: boolean;
}

export default function GameCard({
  thumbnail,
  title,
  onDownload,
  onSettings,
  isDownloaded,
  isDownloading,
}: GameCardProps) {
  return (
    <div className="group w-64 space-y-3">
      <div className="relative h-48 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl" />
        <div className="relative h-full overflow-hidden">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={onSettings}
            className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg
        bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
      >
        {isDownloading ? (
          <span>Downloading...</span>
        ) : isDownloaded ? (
          <>
            <Download size={16} />
            <span>Play</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Download</span>
          </>
        )}
      </button>
    </div>
  );
}
