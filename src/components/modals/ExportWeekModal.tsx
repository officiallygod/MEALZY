'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  Copy,
  Smartphone,
  LayoutGrid,
  Check,
  Sparkles,
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';
import { MealItem } from '@/types/meal';
import {
  generateWeekPlanImage,
  ExportDayData,
  ExportLayout,
  ExportTheme,
} from '@/lib/week-image-generator';
import confetti from 'canvas-confetti';

interface ExportWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: ExportDayData[];
  meals: MealItem[];
  calorieTarget?: number;
}

export default function ExportWeekModal({
  isOpen,
  onClose,
  days,
  meals,
  calorieTarget = 2200,
}: ExportWeekModalProps) {
  const [layout, setLayout] = useState<ExportLayout>('phone');
  const [themeTone, setThemeTone] = useState<ExportTheme>('cream');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check if browser supports Web Share API with files
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      try {
        const testFile = new File(['test'], 'test.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [testFile] })) {
          setCanNativeShare(true);
        }
      } catch {
        setCanNativeShare(false);
      }
    }
  }, []);

  // Re-generate image whenever modal opens or options change
  useEffect(() => {
    if (!isOpen || days.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    const render = async () => {
      try {
        const result = await generateWeekPlanImage({
          days,
          meals,
          calorieTarget,
          layout,
          theme: themeTone,
        });

        if (isMounted) {
          setImageUrl(result.dataUrl);
          setImageBlob(result.blob);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate week plan image:', err);
        if (isMounted) setIsGenerating(false);
      }
    };

    render();

    return () => {
      isMounted = false;
    };
  }, [isOpen, days, meals, calorieTarget, layout, themeTone]);

  if (!isOpen) return null;

  const startDay = days[0];
  const endDay = days[days.length - 1];

  // Save to Photos (Native Share sheet on iOS/Android or direct download fallback)
  const handleSaveToPhone = async () => {
    if (!imageBlob || !imageUrl) return;

    const fileName = `mealzy-week-plan-${startDay?.dateString || 'current'}.png`;

    // Try Web Share API for native "Save Image" option on mobile
    if (canNativeShare) {
      try {
        const file = new File([imageBlob], fileName, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Mealzy Weekly Plan',
          text: `My meal plan from ${startDay?.dayName} ${startDay?.dayNumber} to ${endDay?.dayName} ${endDay?.dayNumber}`,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF5500', '#D4FF00', '#00E5FF'],
        });
        return;
      } catch (err: any) {
        // User aborted share or share failed; fallback to download
        if (err.name === 'AbortError') return;
      }
    }

    // Direct Browser Download
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF5500', '#D4FF00', '#00E5FF'],
    });
  };

  // Copy Image to Clipboard
  const handleCopy = async () => {
    if (!imageBlob) return;
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': imageBlob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-5 sm:p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] flex flex-col transition-colors overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all z-10"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pb-3 border-b-2 border-black/10 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded border border-black shadow-neo-sm">
              ✦ MOBILE EXPORT
            </span>
          </div>
          <h3 className="font-funky font-black text-xl text-gray-900 dark:text-white">
            SAVE WEEK PLAN IMAGE
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
            Current 7 rolling days from Today:{' '}
            <span className="text-black dark:text-white font-black">
              {startDay?.dayName} ({startDay?.dayNumber}) to {endDay?.dayName} ({endDay?.dayNumber})
            </span>
          </p>
        </div>

        {/* Customization Options Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap flex-shrink-0">
          {/* Format Selector: Phone Wallpaper vs Bento Grid */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#20222E] p-1 rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
            <button
              onClick={() => setLayout('phone')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                layout === 'phone'
                  ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone (9:16)</span>
            </button>

            <button
              onClick={() => setLayout('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                layout === 'grid'
                  ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Card</span>
            </button>
          </div>

          {/* Theme Color Tone */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#20222E] p-1 rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
            <button
              onClick={() => setThemeTone('cream')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                themeTone === 'cream'
                  ? 'bg-amber-100 text-amber-900 border-2 border-black shadow-neo-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Cream</span>
            </button>

            <button
              onClick={() => setThemeTone('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                themeTone === 'dark'
                  ? 'bg-black text-white border-2 border-black shadow-neo-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-yellow-300" />
              <span>Obsidian</span>
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-y-auto scrollbar-none bg-[#FAF8F5] dark:bg-[#101217] rounded-2xl border-2 border-black dark:border-gray-800 p-4 flex items-center justify-center min-h-[260px] relative shadow-inner">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5500]" />
              <span className="text-xs font-black uppercase tracking-wider">
                Generating high-res image...
              </span>
            </div>
          ) : imageUrl ? (
            <div className="relative max-h-[50vh] flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Mealzy 7-Day Week Plan"
                className="max-h-[48vh] w-auto rounded-xl border-2 border-black shadow-neo object-contain select-none cursor-pointer"
                title="Tap & hold on mobile to save to photos"
              />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 text-center block">
                ✦ Mobile tip: You can also tap and hold (long-press) the image above to save directly to Photos.
              </span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-4 pt-3 border-t-2 border-black/10 dark:border-gray-800 flex items-center gap-2.5 flex-shrink-0">
          {/* Direct Mobile Save / Share Button */}
          <button
            onClick={handleSaveToPhone}
            disabled={isGenerating || !imageUrl}
            className="flex-1 py-3.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {canNativeShare ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{canNativeShare ? 'SAVE TO PHONE / SHARE' : 'DOWNLOAD IMAGE (PNG)'}</span>
          </button>

          {/* Copy Image Button */}
          <button
            onClick={handleCopy}
            disabled={isGenerating || !imageBlob}
            className="py-3.5 px-4 bg-white dark:bg-[#1E202A] hover:bg-black hover:text-white dark:hover:bg-[#FFE600] dark:hover:text-black text-gray-900 dark:text-white font-black text-xs uppercase rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Copy image to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED!' : 'COPY'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
