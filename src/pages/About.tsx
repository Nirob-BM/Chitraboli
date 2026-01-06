import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Sparkles, Award, Users } from "lucide-react";
import { ReviewsSection } from "@/components/ReviewsSection";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/hero-jewelry.jpg";

const About = () => {
  return (
    <Layout>
      <SEO 
        title="About Us" 
        description="Learn about Chitraboli - where tradition meets artistry. Every piece of our handmade jewellery tells a story of passion and craftsmanship."
      />
      {/* Hero */}
      <section className="relative py-24 bg-card overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroImage} alt="Jewelry crafting" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-6xl font-light text-foreground mb-4">
              About <span className="text-gold">Chitraboli</span>
            </h1>
            <p className="font-display text-2xl text-gold-light mb-6">চিত্রাবলী ✨</p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Where tradition meets artistry, and every piece tells a story.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8 text-center">
              Our <span className="text-gold">Story</span>
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Chitraboli – চিত্রাবলী was born from a deep love for traditional Bengali artistry 
                and a passion for creating beautiful, meaningful jewellery. The name "Chitraboli" 
                comes from the Bengali words for "art" and "expression" – reflecting our belief 
                that jewellery is a form of self-expression.
              </p>
              <p>
                Every piece in our collection is handcrafted with meticulous attention to detail, 
                combining traditional techniques passed down through generations with contemporary 
                designs that appeal to modern sensibilities.
              </p>
              <p>
                We believe that jewellery should not just be worn, but cherished. Each piece from 
                Chitraboli carries with it the love and dedication of our artisans, making it not 
                just an accessory, but a treasure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-12 text-center">
            Our <span className="text-gold">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Passion",
                description: "Every piece is crafted with genuine love and dedication"
              },
              {
                icon: Sparkles,
                title: "Artistry",
                description: "We blend traditional techniques with modern aesthetics"
              },
              {
                icon: Award,
                title: "Quality",
                description: "Only the finest materials make it into our creations"
              },
              {
                icon: Users,
                title: "Community",
                description: "Supporting local artisans and preserving craft traditions"
              }
            ].map((value) => (
              <div
                key={value.title}
                className="text-center p-6 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Explore our collection and discover jewellery that speaks to your soul.
          </p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/shop">
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
