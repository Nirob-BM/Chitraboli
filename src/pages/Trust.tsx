import { SEO } from "@/components/SEO";
import { Shield, Lock, Eye, FileCheck, Mail, KeyRound } from "lucide-react";

const sections = [
  {
    icon: Lock,
    title: "Data Protection",
    body: "All connections to Chitraboli are encrypted end-to-end with TLS. Sensitive customer data — names, addresses, phone numbers, and order history — is stored in an isolated backend with strict per-user access rules (Row Level Security) so customers can only ever see their own data.",
  },
  {
    icon: KeyRound,
    title: "Authentication & Accounts",
    body: "We use industry-standard authentication. Passwords are never stored in plain text. You can sign in with email or Google, manage active sessions from your profile, and revoke devices at any time. Admin actions are protected by role checks enforced on the server.",
  },
  {
    icon: Eye,
    title: "What We Collect",
    body: "We collect only what is needed to fulfil your order: contact details, delivery address, items purchased, and payment confirmation. We do not sell or rent your data to third parties. Manual mobile-banking payments are confirmed by transaction ID — we never store full card numbers.",
  },
  {
    icon: FileCheck,
    title: "Order Tracking & Privacy",
    body: "Order tracking requires both your order ID and the phone number used at checkout. This dual check prevents anyone from guessing or enumerating orders. Riders only see the delivery details for orders assigned to them.",
  },
  {
    icon: Shield,
    title: "Operational Security",
    body: "Our edge functions are rate-limited and validate every input server-side. Admin activity is logged for audit. Backups are stored in a private bucket and accessible only to administrators. We patch dependencies regularly and run automated security scans.",
  },
  {
    icon: Mail,
    title: "Contact & Disclosure",
    body: "Found a security issue or have a privacy question? Email info.chitraboli@gmail.com or WhatsApp +880 1308-697630. We respond to responsible disclosure reports promptly and will work with you to resolve any concern.",
  },
];

export default function Trust() {
  return (
    <>
      <SEO
        title="Trust & Security"
        description="How Chitraboli protects your data, secures your orders, and respects your privacy."
        url="/trust"
      />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="text-center mb-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-3">
            Trust &amp; Security
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your trust is the foundation of everything we craft. Here is a plain-language overview
            of how we keep your data, your account, and your orders safe.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, body }) => (
            <section
              key={title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-10">
          This page describes our current practices and is updated as our systems evolve. It is
          provided for transparency and is not a legal warranty or independent certification.
        </p>
      </div>
    </>
  );
}
