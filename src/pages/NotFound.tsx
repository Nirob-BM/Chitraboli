import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <Layout>
      <SEO title="Page Not Found" description="The page you were looking for could not be found. Browse Chitraboli's handcrafted jewellery collection instead." />
      <section className="min-h-[70vh] flex items-center justify-center gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-8xl md:text-9xl font-bold text-gold mb-4">
            404
          </h1>
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to our beautiful collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="lg" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="hero" size="lg" asChild>
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Shop
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
