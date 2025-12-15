import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
export function Footer() {
  return <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex flex-col items-start mb-4">
              <span className="font-display text-3xl font-semibold text-gold tracking-wide">
                Chitraboli
              </span>
              <span className="font-display text-lg text-gold-light opacity-80">চিত্রাবলী ✨</span>
            </Link>
            <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-md">
              Handmade with Love, Crafted with Passion. Every piece of Chitraboli jewellery is inspired by art, 
              tradition, and passion. We create unique pieces to make you shine.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.facebook.com/chitraboli1" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {["Shop", "Collections", "About Us", "Contact"].map(item => <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(" ", "-")}`} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>+880 1308697630</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-right text-xs">info.chitraboli@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Chitraboli চিত্রাবলী. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
}