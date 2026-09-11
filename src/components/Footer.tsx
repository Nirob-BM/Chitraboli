import { Link, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Facebook, Instagram } from "lucide-react";

export function Footer() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  // Minimal footer for admin page
  if (isAdminPage) {
    return (
      <footer className="bg-card border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Chitraboli চিত্রাবলী. Admin Panel.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card border-t border-border relative">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex flex-col items-start mb-4">
              <span className="font-display text-3xl font-semibold text-gold tracking-wide">Chitraboli</span>
              <span className="font-display text-lg text-gold-light opacity-80">চিত্রাবলী ✨</span>
            </Link>
            <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-md">
              Handmade with Love, Crafted with Passion. Every piece of Chitraboli jewellery is inspired by art,
              tradition, and passion. We create unique pieces to make you shine.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href={`https://wa.me/8801308697630?text=${encodeURIComponent("Hi Chitraboli! I have a question.")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/chitraboli1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/chitraboli1/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Instagram page"
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Quick Links</h2>
            <ul className="space-y-3">
              {[
                { label: "Shop", path: "/shop" },
                { label: "Collections", path: "/collections" },
                { label: "About Us", path: "/about" },
                { label: "Contact", path: "/contact" },
                { label: "Track Order", path: "/track-order" },
                { label: "Trust & Security", path: "/trust" },
                {
                  label: "Identifying Handcrafted Jewelry",
                  path: "/blog/identifying-handcrafted-jewelry",
                },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Contact Us</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <a
                  href={`https://wa.me/8801308697630?text=${encodeURIComponent("Hi Chitraboli! I have a question.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  +880 1308-697630 (WhatsApp)
                </a>
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

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Chitraboli - চিত্রাবলী. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
