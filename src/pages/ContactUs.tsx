import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create WhatsApp message
    const whatsappMessage = `*New Contact Request*\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`;
    
    // WhatsApp URL with pre-filled message
    const whatsappUrl = `https://wa.me/9779708562001?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    setFormData({ name: "", email: "", phone: "", message: "" });
    toast.success("Opening WhatsApp...");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-red-950/20 to-black py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.1),transparent)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              We'd love to hear from you. Reach out to us anytime!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Location Card */}
            <div className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Our Location</h3>
              <p className="text-muted-foreground">
                Janakpur Dham<br />
                Ward No. 14<br />
                Nepal
              </p>
            </div>

            {/* Phone Card */}
            <div className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Phone Number</h3>
              <a 
                href="tel:+9779708562001" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                +977 970-8562001
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">WhatsApp</h3>
              <a 
                href="https://wa.me/9779708562001" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                +977 970-8562001
              </a>
            </div>

            {/* Business Hours Card */}
            <div className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Business Hours</h3>
              <p className="text-muted-foreground">
                24/7 Support<br />
                Available
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Send Us a <span className="text-primary">Message</span>
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+977 9XX-XXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Your Message
                </label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold neon-button"
              >
                Send via WhatsApp
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Find Us on <span className="text-primary">Map</span>
          </h2>
          
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56684.08829475673!2d85.89287144863281!3d26.729074600000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ec1694ab5f0f0d%3A0xb7d9d6c1f7c7f1f1!2sJanakpur%20Dham%2C%20Nepal!5e0!3m2!1sen!2snp!4v1234567890123!5m2!1sen!2snp"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="UGTOPUPS Location - Janakpur Dham, Nepal"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
