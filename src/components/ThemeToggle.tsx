import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-16 h-8 rounded-full transition-all duration-500",
        "bg-gradient-to-r from-gold/20 to-purple-accent/20",
        "border border-gold/30 hover:border-gold/50",
        "flex items-center px-1",
        "shadow-[0_0_15px_rgba(212,175,55,0.2)]"
      )}
      aria-label="Toggle theme"
    >
      <div
        className={cn(
          "absolute w-6 h-6 rounded-full transition-all duration-500",
          "flex items-center justify-center",
          "bg-gradient-to-br shadow-lg",
          theme === "dark"
            ? "left-1 from-indigo-500 to-purple-600 shadow-purple-500/30"
            : "left-8 from-amber-400 to-orange-500 shadow-amber-500/30"
        )}
      >
        {theme === "dark" ? (
          <Moon className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </div>
    </button>
  );
};
