"use client";

import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Reply } from "lucide-react";

export type ReplyQuote = { author: string; text: string };
const PREFIX = "[Replying to ";
export function composeReply(text: string, quote?: ReplyQuote) {
  return quote ? `${PREFIX}${quote.author}]\n${quote.text.split("\n").map((line) => `> ${line}`).join("\n")}\n\n${text}` : text;
}
export function parseReply(text: string): { quote?: ReplyQuote; text: string } {
  const match = text.match(/^\[Replying to (You|Chusky)\]\n((?:> [^\n]*\n)+)\n([\s\S]*)$/);
  return match ? { quote: { author: match[1], text: match[2].trimEnd().split("\n").map((line) => line.slice(2)).join("\n") }, text: match[3] } : { text };
}

export function SwipeReply({ children, onReply, enabled, className, onClick, id }: { children: ReactNode; onReply: () => void; enabled: boolean; className: string; onClick: () => void; id: string }) {
  const drag = useRef<{ x: number; y: number; axis?: "x" | "y"; distance: number } | undefined>(undefined);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = drag.current;
    drag.current = undefined;
    setDragging(false);
    setOffset(0);
    if (current?.axis === "x") {
      suppressClick.current = true;
      if (!cancelled && current.distance >= 64) onReply();
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div id={id} className={`${className} chat-swipe-message`} onClickCapture={(event) => {
    if (suppressClick.current) { suppressClick.current = false; event.preventDefault(); event.stopPropagation(); }
  }} onClick={onClick} onPointerDown={(event) => {
    suppressClick.current = false;
    if (!enabled || event.pointerType !== "touch" || !event.isPrimary || event.clientX < 24 || (event.target as HTMLElement).closest("button,a,input,textarea,select,summary,pre,table,video,audio,[data-no-swipe],.generated-image-gallery") || window.getSelection()?.toString()) return;
    drag.current = { x: event.clientX, y: event.clientY, distance: 0 };
  }} onPointerMove={(event) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
      current.axis = dx > 0 && dx > Math.abs(dy) * 1.4 ? "x" : "y";
      if (current.axis === "x") { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }
    }
    if (current.axis !== "x") return;
    current.distance = Math.max(0, dx);
    setOffset(Math.min(80, current.distance * 0.75));
  }} onPointerUp={(event) => finish(event)} onPointerCancel={(event) => finish(event, true)}>
    <span className="chat-swipe-indicator" style={{ opacity: Math.min(1, offset / 40), transform: `translateX(${Math.min(offset / 3, 20)}px) scale(${0.7 + Math.min(offset / 160, 0.3)})` }} aria-hidden="true"><Reply size={17} /></span>
    <div className="chat-swipe-surface" data-dragging={dragging} style={{ transform: `translate3d(${offset}px,0,0)` }}>{children}</div>
  </div>;
}

export function useChatViewport(threadId?: string) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const jumpToLatest = () => {
    following.current = true;
    setShowLatest(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  useEffect(() => {
    following.current = true;
    setShowLatest(false);
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { if (following.current) scroller.scrollTop = scroller.scrollHeight; });
    };
    const scroll = () => {
      following.current = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 72;
      setShowLatest(!following.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(content);
    observer.observe(scroller);
    scroller.addEventListener("scroll", scroll, { passive: true });
    resize();
    return () => { observer.disconnect(); scroller.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [threadId]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = rootRef.current;
    if (!viewport || !root) return;
    const update = () => {
      if (viewport.scale !== 1) return;
      const available = viewport.height - Math.max(0, root.getBoundingClientRect().top - viewport.offsetTop);
      root.style.setProperty("--chat-viewport-height", `${Math.max(160, available)}px`);
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); window.removeEventListener("resize", update); root.style.removeProperty("--chat-viewport-height"); };
  }, []);
  return { rootRef, scrollRef, contentRef, showLatest, jumpToLatest };
}
