import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Eye,
  Heart,
  Lock,
  Mail,
  Search,
  ShoppingBasket,
} from "lucide-react";

import { Avatar } from "@renderer/components/ui/Avatar";
import { Button } from "@renderer/components/ui/Button";
import { Card } from "@renderer/components/ui/Card";
import { IconButton } from "@renderer/components/ui/IconButton";
import { Input } from "@renderer/components/ui/Input";
import { ModeToggle } from "@renderer/components/ui/ModeToggle";

export const Route = createFileRoute("/design")({
  component: DesignCheck,
});

const SWATCHES = [
  { name: "bg", cls: "bg-bg", hex: "#0F0116" },
  { name: "surface-1", cls: "bg-surface-1", hex: "#1A0020" },
  { name: "surface-2", cls: "bg-surface-2", hex: "#26084A" },
  { name: "surface-3", cls: "bg-surface-3", hex: "#2A1050" },
  { name: "brand-900", cls: "bg-brand-900", hex: "#26084A" },
  { name: "brand-700 (primary)", cls: "bg-brand-700", hex: "#51119D" },
  { name: "brand-500", cls: "bg-brand-500", hex: "#5A13B0" },
  { name: "brand-300 (lilac)", cls: "bg-brand-300", hex: "#907AB7" },
  { name: "cta", cls: "bg-cta", hex: "#5C6AFF" },
  { name: "success", cls: "bg-success", hex: "#25DE00" },
  { name: "danger", cls: "bg-danger", hex: "#EF4444" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold tracking-[0.15em] text-brand-300 uppercase">
        {title}
      </h2>
      <div className="p-6 rounded-xl bg-surface-1 border border-border">
        {children}
      </div>
    </section>
  );
}

function DesignCheck() {
  return (
    <div className="min-h-screen bg-bg p-10 space-y-10 overflow-auto">
      <header>
        <h1 className="font-display font-black text-5xl leading-none">
          DESIGN CHECK
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Tokens + primitives sanity page. Not routed in production.
        </p>
      </header>

      <Section title="Color swatches">
        <div className="grid grid-cols-4 gap-3">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 p-3 rounded-md bg-bg/40 border border-border"
            >
              <div
                className={`size-10 rounded-md ${s.cls} border border-border-strong`}
              />
              <div className="text-xs">
                <div className="font-semibold">{s.name}</div>
                <div className="text-text-muted font-mono">{s.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography — Transducer">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1">
              Display Black 56 (Extended)
            </div>
            <div className="font-display font-black text-[56px] leading-none">
              NO CODE STUDIO
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1">
              Display Bold 32
            </div>
            <div className="font-display font-bold text-[32px] leading-none">
              EDIT SAVED
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1">
              Sans Bold 18
            </div>
            <div className="font-sans font-bold text-lg">
              Heading — Bold 700
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1">
              Sans Medium 14
            </div>
            <div className="font-sans font-medium text-sm">
              Sidebar label — Medium 500
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1">
              Sans Regular 14
            </div>
            <div className="font-sans text-sm">
              Body text — click to upload your thumbnail image in the format of
              .jpg, .png.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Gradients">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 rounded-lg bg-login-gradient flex items-center justify-center">
            <span className="font-display font-bold">bg-login-gradient</span>
          </div>
          <div className="h-40 rounded-lg bg-sidebar-gradient flex items-center justify-center">
            <span className="font-display font-bold">bg-sidebar-gradient</span>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="cta">Login</Button>
          <Button variant="cta" size="sm">
            Publish now
          </Button>
          <Button variant="brand">Brand purple</Button>
          <Button variant="outline">Edit</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="cta" loading>
            Loading
          </Button>
          <Button variant="cta" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Icon buttons">
        <div className="flex items-center gap-2">
          <IconButton>
            <Search size={18} />
          </IconButton>
          <IconButton>
            <Heart size={18} />
          </IconButton>
          <IconButton>
            <ShoppingBasket size={18} />
          </IconButton>
          <IconButton badge={3}>
            <Bell size={18} />
          </IconButton>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="space-y-3 max-w-md">
          <Input
            placeholder="Enter username or email"
            leftIcon={<Mail size={16} />}
          />
          <Input
            placeholder="Enter password"
            type="password"
            leftIcon={<Lock size={16} />}
            rightIcon={<Eye size={16} />}
          />
          <Input placeholder="Title name to publish" />
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-6">
          <Avatar name="Sarthak" online size={32} />
          <Avatar name="Sarthak" online size={44} />
          <Avatar name="Sarthak" online={false} size={56} />
          <Avatar size={44} />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="aspect-video bg-surface-3" />
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm font-medium">The castle maze</div>
              <Button size="sm" variant="cta">
                Publish now
              </Button>
            </div>
          </Card>
          <Card>
            <div className="aspect-video bg-surface-3" />
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm font-medium">Empty card</div>
            </div>
          </Card>
          <Card>
            <div className="aspect-video bg-surface-3" />
          </Card>
        </div>
      </Section>

      <Section title="Mode toggle">
        <div className="flex items-center gap-4">
          <ModeToggle />
          <span className="text-sm text-text-muted">
            Click to swap player ↔ creator. State persists across restarts.
          </span>
        </div>
      </Section>
    </div>
  );
}
