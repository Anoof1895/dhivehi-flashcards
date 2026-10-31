"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { Check, Heart } from "lucide-react";
import {
  FlashcardItem,
  CardSide,
  getTextDir,
} from "@/data/decks";

interface Flashcard3DProps {
  card: FlashcardItem;
  frontSide: CardSide;
  isFlipped: boolean;
  onFlip: () => void;
  isMemorized: boolean;
  isFavorite: boolean;
  onToggleMemorized: () => void;
  onToggleFavorite: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  cardIndex: number;
  totalCards: number;
  lang?: "en" | "dv";
}

export const Flashcard3D: React.FC<Flashcard3DProps> = ({
  card,
  frontSide,
  isFlipped,
  onFlip,
  isMemorized,
  isFavorite,
  onToggleMemorized,
  onToggleFavorite,
  onSwipeLeft,
  onSwipeRight,
  lang = "en",
}) => {
  // Mobile touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  // Magnetic cursor-tracking & tilt
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 280, damping: 26 });
  const rotateY = useSpring(rawRotateY, { stiffness: 280, damping: 26 });

  // Modern subtle indigo border reveal
  const borderGlow = useMotionTemplate`radial-gradient(380px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.35), transparent 70%)`;

  // Surface spotlight overlay
  const surfaceSpotlight = useMotionTemplate`radial-gradient(480px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.06), transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);

    // Subtle magnetic 3D tilt capped at ±4 degrees
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 4;
    const tiltY = ((x - centerX) / centerX) * 4;
    rawRotateX.set(Math.max(-4, Math.min(4, tiltX)));
    rawRotateY.set(Math.max(-4, Math.min(4, tiltY)));
  };

  const handleMouseLeave = () => {
    mouseX.set(-1000);
    mouseY.set(-1000);
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setSwipeOffset(deltaX * 0.35);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      setSwipeOffset(0);
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;
    setSwipeOffset(0);

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  };

  const frontText = frontSide === "term" ? card.term : card.definition;
  const backTopText = frontSide === "term" ? card.term : card.definition;
  const backMainText = frontSide === "term" ? card.definition : card.term;

  const frontDir = getTextDir(frontText);
  const backTopDir = getTextDir(backTopText);
  const backMainDir = getTextDir(backMainText);

  const backLines = backMainText.split("\n").filter((l) => l.trim().length > 0);
  const formattedId = String(card.id).padStart(2, "0");

  const frontSizeClass =
    frontSide === "definition" && frontText.length > 40
      ? "text-2xl sm:text-4xl font-bold leading-[1.85]"
      : "text-5xl sm:text-6xl font-bold leading-[1.8]";

  return (
    <div
      className="relative w-full max-w-3xl h-[380px] sm:h-[420px] mx-auto select-none focus:outline-none focus-visible:outline-none outline-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* 3D Scene Viewport */}
      <div
        className="perspective-1200 relative w-full h-[380px] sm:h-[420px] cursor-pointer group focus:outline-none focus-visible:outline-none outline-none"
        onClick={onFlip}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${frontText}. Click to flip.`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Tilt Wrapper */}
        <motion.div
          className="w-full h-full preserve-3d"
          style={{
            rotateX,
            rotateY,
          }}
        >
          {/* Flip Container */}
          <motion.div
            className="relative w-full h-full preserve-3d"
            animate={{
              rotateY: isFlipped ? 180 : 0,
              x: swipeOffset,
            }}
            transition={{
              rotateY: { type: "spring", stiffness: 240, damping: 24 },
              x: { type: "spring", stiffness: 300, damping: 25 },
            }}
            style={{
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* ============================================================== */}
            {/* FRONT FACE: Modern Clean Study Card (iOS Safari fix intact)    */}
            {/* ============================================================== */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl p-[1px] bg-line transition-all duration-300 shadow-2xl ${
                isMemorized ? "ring-1 ring-success/40" : ""
              }`}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(0deg) translateZ(1px)",
                WebkitTransform: "rotateY(0deg) translateZ(1px)",
                opacity: isFlipped ? 0 : 1,
                visibility: isFlipped ? "hidden" : "visible",
                pointerEvents: isFlipped ? "none" : "auto",
                transition: "opacity 0.15s ease 0.1s, visibility 0.15s ease 0.1s",
              }}
            >
              {/* Border Glow on Hover */}
              <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: borderGlow }}
              />

              {/* Surface */}
              <div
                className="relative w-full h-full rounded-[calc(1.5rem-1px)] p-7 sm:p-9 flex flex-col justify-between overflow-hidden bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                {/* Surface Spotlight */}
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-[calc(1.5rem-1px)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: surfaceSpotlight }}
                />

                {/* Top Header Row */}
                <div className="relative z-10 flex items-center justify-between w-full" dir="ltr">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-semibold tracking-wider text-muted font-mono">
                      #{formattedId}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-elevated border border-line text-muted">
                      {frontSide === "term"
                        ? lang === "dv"
                          ? "ބަސް"
                          : "Term"
                        : lang === "dv"
                        ? "މާނަ"
                        : "Definition"}
                    </span>
                  </div>

                  {/* Top Actions: Favorite (Amber) & Memorized (Emerald) */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={onToggleFavorite}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        isFavorite
                          ? "text-warn bg-warn/15 border border-warn/30"
                          : "text-muted hover:text-warn hover:bg-elevated"
                      }`}
                      aria-label="Toggle Favorite"
                      title={isFavorite ? "Favorited" : "Favorite"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-warn" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={onToggleMemorized}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        isMemorized
                          ? "text-success bg-success/15 border border-success/35 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                          : "text-muted hover:text-success hover:bg-elevated"
                      }`}
                      aria-label="Toggle Memorized"
                      title={
                        isMemorized
                          ? lang === "dv"
                            ? "ހިތުދަސްވެފައި"
                            : "Memorized"
                          : lang === "dv"
                          ? "ހިތުދަސްކުރަން"
                          : "Mark as Memorized"
                      }
                    >
                      <Check className={`w-4 h-4 ${isMemorized ? "stroke-[2.8]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Center Word: Large, Crisp Faruma Typography */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto py-2">
                  <div className="w-full text-center">
                    <h2
                      lang={frontDir === "rtl" ? "dv" : "en"}
                      dir={frontDir}
                      className={`font-faruma ${frontSizeClass} text-fg text-center px-6 sm:px-10 drop-shadow-sm select-text break-words`}
                    >
                      {frontText}
                    </h2>
                  </div>
                </div>

                <div className="relative z-10 h-3" />
              </div>
            </div>

            {/* ============================================================== */}
            {/* BACK FACE: Modern Clean Meaning Card (iOS Safari fix intact)  */}
            {/* ============================================================== */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-[1px] bg-line transition-all duration-300 shadow-2xl ${
                isMemorized ? "ring-1 ring-success/40" : ""
              }`}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(1px)",
                WebkitTransform: "rotateY(180deg) translateZ(1px)",
                opacity: isFlipped ? 1 : 0,
                visibility: isFlipped ? "visible" : "hidden",
                pointerEvents: isFlipped ? "auto" : "none",
                transition: "opacity 0.15s ease 0.1s, visibility 0.15s ease 0.1s",
              }}
            >
              {/* Border Glow */}
              <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: borderGlow }}
              />

              {/* Surface */}
              <div
                className="relative w-full h-full rounded-[calc(1.5rem-1px)] p-7 sm:p-9 flex flex-col justify-between overflow-hidden bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-[calc(1.5rem-1px)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: surfaceSpotlight }}
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-center justify-between w-full" dir="ltr">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-semibold tracking-wider text-muted font-mono">
                      #{formattedId}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-accent-glow border border-accent/25 text-accent-soft">
                      {frontSide === "term"
                        ? lang === "dv"
                          ? "މާނަ"
                          : "Definition"
                        : lang === "dv"
                        ? "ބަސް"
                        : "Term"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={onToggleFavorite}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        isFavorite
                          ? "text-warn bg-warn/15 border border-warn/30"
                          : "text-muted hover:text-warn hover:bg-elevated"
                      }`}
                      aria-label="Toggle Favorite"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-warn" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={onToggleMemorized}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        isMemorized
                          ? "text-success bg-success/15 border border-success/35 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                          : "text-muted hover:text-success hover:bg-elevated"
                      }`}
                      aria-label="Toggle Memorized"
                    >
                      <Check className={`w-4 h-4 ${isMemorized ? "stroke-[2.8]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Center Back: Top Prompt + Divider + Large Definition */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto overflow-y-auto py-2">
                  <div className="text-center w-full px-6 mb-1.5">
                    <div
                      lang={backTopDir === "rtl" ? "dv" : "en"}
                      dir={backTopDir}
                      className="font-faruma text-base sm:text-lg font-semibold text-accent-soft leading-[1.8] line-clamp-2 select-text"
                    >
                      {backTopText}
                    </div>
                    <div className="h-px w-20 mx-auto bg-line mt-2 mb-3" />
                  </div>

                  <div
                    className={`font-faruma text-2xl sm:text-3xl md:text-4xl ${
                      frontSide === "definition" ? "font-bold text-fg" : "font-medium text-fg-soft"
                    } leading-[2.1] text-center px-6 sm:px-10 max-w-2xl mx-auto space-y-2`}
                    lang={backMainDir === "rtl" ? "dv" : "en"}
                    dir={backMainDir}
                  >
                    {backLines.map((line, idx) => (
                      <p key={idx} className="select-text break-words">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 h-3" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
