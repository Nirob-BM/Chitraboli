import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const navLinks = [{
  name: "Home",
  path: "/"
}, {
  name: "Shop",
  path: "/shop"
}, {
  name: "Collections",
  path: "/collections"
}, {
  name: "About",
  path: "/about"
}, {
  name: "Contact",
  path: "/contact"
}];
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start">

Chitraboli
চিত্রাবলী ✨<span className="font-display text-2xl font-semibold text-gold tracking-wide">
              Chitraboli
            </span>
            <span className="font-display text-sm text-gold-light opacity-80">চিত্রাবলী ✨</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={cn("font-body text-sm tracking-wide transition-colors duration-300", location.pathname === link.path ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                {link.name}
              </Link>)}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost-gold" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                0
              </span>
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && <div className="md:hidden py-4 border-t border-border/50 animate-fade-up">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={cn("font-body text-sm tracking-wide transition-colors py-2", location.pathname === link.path ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {link.name}
                </Link>)}
            </div>
          </div>}
      </div>
    </nav>;
}