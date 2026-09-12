import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { SpecialOffersSection } from "@/components/SpecialOffersSection";
import { SEO } from "@/components/SEO";
import { LiveChatWidget } from "@/components/LiveChatWidget";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Award } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ProductGridSkeleton } from "@/components/PageSkeleton";
import heroProduct from "@/assets/hero-product.png.asset.json";

const whatsappChatUrl = `https://wa.me/8801308697630?text=${encodeURIComponent(
  "Hi Chitraboli! I'd love to know more about your jewellery."
)}`;

const Index = () => {
  const { getFeaturedProducts, products, loading } = useProducts();
  const featured = getFeaturedProducts();
  const featuredProducts = (featured.length > 0 ? featured : products).slice(0, 4);
  return (
    <Layout>
      <SEO
        title="Handmade with Love"
        description="Discover Chitraboli — handcrafted jewellery made with love in Bangladesh. Unique artisan rings, necklaces, earrings & bangles for every special moment."
      />
      {/* Hero Section */}
      <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-center overflow-hidden gradient-hero">
        {/* Artistic bokeh / textured lighting */}
        <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-primary/25 blur-[100px] animate-float pointer-events-none" />
        <div
          className="absolute top-1/3 right-1/3 w-56 h-56 rounded-full bg-gold/15 blur-[90px] animate-float pointer-events-none"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-0 right-10 w-80 h-80 rounded-full bg-rose-gold/10 blur-[110px] animate-float pointer-events-none"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        {/* Content grid */}
        <div className="container relative z-10 mx-auto px-4 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground mb-3 leading-[1.08] text-balance animate-fade-up">
                Handmade with <span className="text-gold font-medium italic">Love</span>
              </h1>
              <p
                className="font-display text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Crafted with Passion
              </p>
              <p
                className="font-body text-sm sm:text-base text-muted-foreground/90 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed animate-fade-up"
                style={{ animationDelay: "0.4s" }}
              >
                A unique fusion of heritage and artistry. Discover our exclusive handmade
                jewellery collections, created for your moments of elegance.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up"
                style={{ animationDelay: "0.6s" }}
              >
                <Button variant="hero-solid" size="xl" asChild>
                  <Link to="/shop">
                    Explore Jewellery
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="hero-gold-outline" size="xl" asChild>
                  <Link to="/collections">View Collections</Link>
                </Button>
              </div>
            </div>

            {/* Right: product image with 3D depth */}
            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-up">
              <div className="relative w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-none aspect-square">
                {/* Soft radial halo behind product */}
                <div
                  className="absolute inset-[8%] rounded-full blur-3xl opacity-75"
                  style={{
                    background:
                      "radial-gradient(circle at center, hsl(var(--gold) / 0.38), hsl(var(--primary) / 0.18) 45%, transparent 70%)",
                  }}
                />
                <img
                  src={heroProduct.url}
                  alt="Handcrafted Chitraboli necklace with clay sitar motif, orange flowers and matching stud earrings"
                  width={880}
                  height={1180}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] lg:rotate-[-3deg] transition-transform duration-700 hover:rotate-0 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2 animate-bounce">
            <div className="w-1 h-2 bg-primary rounded-full" />
          </div>
          <span className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground/70">
            Explore
          </span>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
            icon: Sparkles,
            title: "Handcrafted",
            description: "Every piece is carefully handmade by skilled artisans"
          }, {
            icon: Heart,
            title: "Made with Love",
            description: "We pour passion and care into every creation"
          }, {
            icon: Award,
            title: "Premium Quality",
            description: "Only the finest materials for lasting beauty"
          }].map((feature, index) => <div key={feature.title} className="text-center p-8 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <NewArrivalsSection />

      {/* Special Offers Section */}
      <SpecialOffersSection />

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
              Featured <span className="text-gold">Jewellery</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover our most loved pieces, crafted with care and designed to make you shine.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.slice(0, 4).map((product, i) => (
              <div key={product.id} className={i === 3 ? "md:max-lg:hidden" : ""}>
                <ProductCard {...product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg" asChild>
              <Link to="/shop">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
              Join Our Community
            </h2>
            <p className="text-muted-foreground mb-8">
              Chat with us on WhatsApp for the latest collections, special offers, and quick support.
            </p>
            <a href={whatsappChatUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                Chat on WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Live chat inbox — real WhatsApp handoff, floats bottom-left */}
      <LiveChatWidget />
    </Layout>
  );
};

export default Index;
