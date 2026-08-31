"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "About", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Developers", href: "/developers" },
  { name: "Docs", href: "/docs" },
  { name: "Pricing", href: "/pricing" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-4 right-4" 
          : "top-0 left-0 right-0"
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-3 sm:px-6 lg:px-7 ${
            isScrolled ? "h-12" : "h-16"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className={`font-display tracking-tight transition-all duration-500 ${isScrolled ? "text-xl" : "text-2xl"}`}>Chusky</span>
            <span className={`text-muted-foreground font-mono transition-all duration-500 ${isScrolled ? "text-[10px] mt-0.5" : "text-xs mt-1"}`}>TM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in" className={`text-foreground/70 hover:text-foreground transition-all duration-500 ${isScrolled ? "text-xs" : "text-sm"}`}>
              Sign in
            </Link>
            <Button asChild
              size="sm"
              className={`bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all duration-500 ${isScrolled ? "px-4 h-8 text-xs" : "px-6"}`}
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex min-h-9 min-w-9 items-center justify-center md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

      </nav>
      
      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
          <div className="flex h-full flex-col px-5 pt-24 pb-6 sm:px-8 sm:pt-28 sm:pb-8">
          {/* Navigation Links */}
          <div className="flex flex-1 flex-col justify-center gap-6">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-4xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 sm:text-5xl ${
                  isMobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          {/* Bottom CTAs */}
          <div className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
            isMobileMenuOpen 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <Button 
              variant="outline" 
              className="h-12 flex-1 rounded-full text-sm"
              asChild
            >
              <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>Sign in</Link>
            </Button>
            <Button asChild
              className="h-12 flex-1 rounded-full bg-foreground text-sm text-background"
            >
              <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
