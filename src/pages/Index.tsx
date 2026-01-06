import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { SpecialOffersSection } from "@/components/SpecialOffersSection";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Award } from "lucide-react";
import { getFeaturedProducts } from "@/data/products";
import heroImage from "@/assets/hero-jewelry.jpg";

const Index = () => {
  const featuredProducts = getFeaturedProducts();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden gradient-hero">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Handmade jewelry" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-secondary/20 blur-3xl animate-float" style={{
        animationDelay: "2s"
      }} />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-foreground mb-4 animate-fade-up">
            Handmade with{" "}
            <span className="text-gold font-medium">Love</span>
          </h1>
          <p className="font-display text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>
            Crafted with Passion
          </p>
          <p className="font-body text-muted-foreground max-w-xl mx-auto mb-12 animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
            Every piece of Chitraboli jewellery is inspired by art, tradition, and passion. 
            Discover unique handcrafted pieces that make you shine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{
          animationDelay: "0.6s"
        }}>
            <Button variant="hero-solid" size="xl" asChild>
              <Link to="/shop">
                Explore Jewellery
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero" size="xl" asChild>
              <Link to="/collections">
                View Collections
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-shimmer" />
          </div>
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
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <SpecialOffersSection />

      {/* New Arrivals Section */}
      <NewArrivalsSection />

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => <ProductCard key={product.id} {...product} />)}
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
              Follow us on social media for the latest collections, special offers, and behind-the-scenes content.
            </p>
            <a href="https://www.facebook.com/chitraboli1" target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                Follow on Facebook
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
