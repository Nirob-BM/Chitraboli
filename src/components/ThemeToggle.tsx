import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
export const ThemeToggle = () => {
 const {theme,toggleTheme}=useTheme();
 return <Button variant="ghost-gold" size="icon" className="h-11 w-11 rounded-full border border-gold/30" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light theme":"Switch to dark theme"}>{theme==="dark"?<Moon/>:<Sun/>}</Button>;
};
