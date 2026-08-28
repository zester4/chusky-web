"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Sign-in is ready to connect to your Chusky auth provider.");
  };

  return (
    <form onSubmit={handleSubmit} className="border border-foreground/10 p-8 lg:p-10 bg-background shadow-sm">
      <div className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full h-12 border border-foreground/15 bg-transparent px-4 outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Forgot password?</a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full h-12 border border-foreground/15 bg-transparent px-4 outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <Button type="submit" className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm">
          Sign in <ArrowRight className="w-4 h-4" />
        </Button>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
      </div>
    </form>
  );
}
