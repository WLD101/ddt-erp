import React from "react";
import { ContactForm } from "@/components/marketing/lead-forms";
import { MessageSquare, Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <section className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Info */}
            <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  <MessageSquare className="w-3.5 h-3.5" /> Contact Support & Sales
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                  Get in <span className="text-primary italic">Touch</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Whether you have a technical question or need a custom enterprise quote, 
                  our team is ready to help you optimize your business operations.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Us</p>
                        <p className="text-white font-bold">sales@whatsquery.example.com</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Call Directly</p>
                        <p className="text-white font-bold">Contact sales through your configured support line</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global HQ</p>
                        <p className="text-white font-bold">123 Tech Avenue, San Francisco, CA</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-xl p-8 md:p-12 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
               <ContactForm />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
