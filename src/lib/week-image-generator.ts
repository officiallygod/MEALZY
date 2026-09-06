import { MealItem, MealType } from '@/types/meal';
import { cleanMealTitle } from './curated-foods';

export interface ExportDayData {
  dateString: string;
  dayName: string;
  dayNumber: number;
  fullDateFormatted: string;
  isToday: boolean;
}

export type ExportLayout = 'phone' | 'grid';
export type ExportTheme = 'cream' | 'dark';

interface GeneratorOptions {
  days: ExportDayData[];
  meals: MealItem[];
  calorieTarget?: number;
  layout?: ExportLayout;
  theme?: ExportTheme;
}

const SLOT_COLORS: Record<MealType, { bg: string; text: string; label: string }> = {
  breakfast: { bg: '#FFE600', text: '#000000', label: 'BFAST' },
  lunch: { bg: '#00E5FF', text: '#000000', label: 'LUNCH' },
  dinner: { bg: '#FF5500', text: '#FFFFFF', label: 'DINNER' },
  snack: { bg: '#D4FF00', text: '#000000', label: 'SNACK' },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function wrapOrTruncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number = 2): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const combined = lines.join(' ');
  if (combined.length < text.length && lines.length > 0) {
    lines[lines.length - 1] = truncateText(ctx, lines[lines.length - 1], maxWidth);
  }

  return lines;
}

export async function generateWeekPlanImage({
  days,
  meals,
  calorieTarget = 2200,
  layout = 'phone',
  theme = 'cream',
}: GeneratorOptions): Promise<{ dataUrl: string; blob: Blob }> {
  // 1. Determine canvas resolution based on layout
  // Phone layout: 1080 x 1920 (Standard 9:16 mobile wallpaper)
  // Grid layout: 1200 x 1500 (Clean bento card)
  const width = layout === 'phone' ? 1080 : 1200;
  const height = layout === 'phone' ? 1920 : 1500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable');

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0D0E12' : '#F7F4EE';
  const cardBg = isDark ? '#16171E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#2D303E' : '#000000';
  const shadowColor = isDark ? 'rgba(0,0,0,0.6)' : '#000000';

  // 2. Draw Background Canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient glow
  const glowGrad = ctx.createRadialGradient(width * 0.8, 0, 50, width * 0.8, 0, 700);
  glowGrad.addColorStop(0, isDark ? 'rgba(255, 85, 0, 0.12)' : 'rgba(255, 85, 0, 0.08)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Top Header Strip (Neon Orange Ticker)
  ctx.fillStyle = '#FF5500';
  ctx.fillRect(0, 0, width, 52);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 16px "Inter", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    '✦ 7-DAY ROLLING TIMELINE ✦ ZERO FOOD SPOILAGE ✦ NEO-BENTO PLANNING ✦ MACROS TRACKED ✦',
    width / 2,
    33
  );

  // 4. Main App Branding Header
  const startDay = days[0];
  const endDay = days[days.length - 1];
  const dateRangeText = `${startDay.dayName.toUpperCase()} ${startDay.dayNumber} — ${endDay.dayName.toUpperCase()} ${endDay.dayNumber}`;

  // Logo: MEAL in solid, ZY in orange
  ctx.textAlign = 'left';
  ctx.font = '900 48px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText('MEAL', 60, 125);
  const mealWidth = ctx.measureText('MEAL').width;
  ctx.fillStyle = '#FF5500';
  ctx.fillText('ZY', 60 + mealWidth, 125);

  // Subtitle / Date Range Badge
  ctx.save();
  ctx.translate(60 + mealWidth + 85, 105);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = '#000000';
  roundRect(ctx, 3, 3, 210, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#FFE600';
  roundRect(ctx, 0, 0, 210, 32, 10);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.font = '900 13px "Inter", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ 7-DAY BENTO PLAN', 105, 21);
  ctx.restore();

  // Target Calorie Badge (Right Side)
  ctx.textAlign = 'right';
  ctx.font = '700 14px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = subtextColor;
  ctx.fillText(`Target: ~${calorieTarget} kcal/day`, width - 60, 105);
  ctx.font = '900 18px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText(dateRangeText, width - 60, 130);

  // Divider Line
  ctx.strokeStyle = isDark ? '#262938' : '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 155);
  ctx.lineTo(width - 60, 155);
  ctx.stroke();

  // 5. Draw Days
  if (layout === 'phone') {
    // 7 Days stacked vertically in phone mode
    const startY = 175;
    const availableHeight = height - startY - 110;
    const cardHeight = Math.floor(availableHeight / 7) - 10;
    const cardWidth = width - 120;

    days.forEach((day, index) => {
      const y = startY + index * (cardHeight + 10);
      const dayMeals = meals.filter((m) => m.dateScheduled === day.dateString);
      const dayCals = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const dayProtein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);

      // 1. Card Shadow
      ctx.fillStyle = shadowColor;
      roundRect(ctx, 60 + 4, y + 4, cardWidth, cardHeight, 18);
      ctx.fill();

      // 2. Card Body + Clipped Accent Stripe (Stops color from overflowing rounded corners)
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, 60, y, cardWidth, cardHeight, 18);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.clip();

      // Left Accent Stripe strictly clipped inside card rounded corners
      const accentColors = ['#FF5500', '#FFE600', '#00E5FF', '#D4FF00', '#A855F7', '#EC4899', '#10B981'];
      ctx.fillStyle = accentColors[index % accentColors.length];
      ctx.fillRect(60, y, 12, cardHeight);

      ctx.restore();

      // 3. Card Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isDark ? 2.5 : 2.5;
      roundRect(ctx, 60, y, cardWidth, cardHeight, 18);
      ctx.stroke();

      // Day Badge (e.g. MON 7 or TODAY 6) - No repetitive • TODAY
      const isToday = day.isToday;
      const dayLabel = isToday
        ? `TODAY ${day.dayNumber}`
        : `${day.dayName.toUpperCase()} ${day.dayNumber}`;

      ctx.textAlign = 'left';
      ctx.font = '900 16px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = isToday ? '#FF5500' : textColor;
      ctx.fillText(dayLabel, 86, y + 25);

      // Daily macro metrics
      ctx.textAlign = 'right';
      ctx.font = '800 13px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = subtextColor;
      ctx.fillText(
        dayCals > 0 ? `${dayCals} kcal • ${dayProtein}g Protein` : 'No meals planned',
        width - 76,
        y + 25
      );

      // 4 Slot mini-cards
      const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
      const slotWidth = Math.floor((cardWidth - 50) / 4);
      const slotHeight = cardHeight - 40;
      const slotY = y + 32;

      slots.forEach((slot, sIdx) => {
        const slotX = 86 + sIdx * (slotWidth + 8);
        const rawMeal = dayMeals.find((m) => m.mealType === slot);
        const slotConfig = SLOT_COLORS[slot];

        // Slot mini-card background
        ctx.fillStyle = isDark ? '#1E202A' : '#FAF8F5';
        roundRect(ctx, slotX, slotY, slotWidth, slotHeight, 12);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#2D303E' : '#E5E7EB';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Slot Header Pill
        ctx.fillStyle = slotConfig.bg;
        roundRect(ctx, slotX + 8, slotY + 8, 56, 18, 5);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = slotConfig.text;
        ctx.font = '900 10px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slotConfig.label, slotX + 36, slotY + 21);

        if (rawMeal) {
          // Calories badge on top right of mini-card
          ctx.textAlign = 'right';
          ctx.font = '800 11px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = isDark ? '#34D399' : '#059669';
          ctx.fillText(`${rawMeal.calories} kcal`, slotX + slotWidth - 10, slotY + 21);

          // Meal Title (clean, up to 2 lines)
          const title = cleanMealTitle(rawMeal.title);
          ctx.textAlign = 'left';
          ctx.font = '700 13px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = textColor;

          const titleLines = wrapOrTruncate(ctx, title, slotWidth - 18, 2);
          titleLines.forEach((line, lIdx) => {
            ctx.fillText(line, slotX + 10, slotY + 44 + lIdx * 18);
          });

          // Badges: Leftover & Portions
          const badgeY = slotY + 44 + titleLines.length * 18 + 6;
          if (rawMeal.isLeftover) {
            ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF';
            roundRect(ctx, slotX + 10, badgeY, 62, 16, 4);
            ctx.fill();
            ctx.strokeStyle = isDark ? '#A855F7' : '#C084FC';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = isDark ? '#D8B4FE' : '#6B21A8';
            ctx.font = '900 8px "Inter", -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LEFTOVER', slotX + 41, badgeY + 11);
          }

          if (rawMeal.portions && rawMeal.portions > 1) {
            const portionX = rawMeal.isLeftover ? slotX + 78 : slotX + 10;
            ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7';
            roundRect(ctx, portionX, badgeY, 32, 16, 4);
            ctx.fill();
            ctx.strokeStyle = isDark ? '#F59E0B' : '#FCD34D';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = isDark ? '#FDE68A' : '#92400E';
            ctx.font = '900 8px "Inter", -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${rawMeal.portions}x`, portionX + 16, badgeY + 11);
          }

          // Bottom Macro Bar inside mini-card
          ctx.textAlign = 'left';
          ctx.font = '600 11px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = subtextColor;
          const metaText = `${rawMeal.protein || 0}g protein${rawMeal.prepTimeMinutes ? ` • ${rawMeal.prepTimeMinutes}m prep` : ''}`;
          ctx.fillText(truncateText(ctx, metaText, slotWidth - 18), slotX + 10, slotY + slotHeight - 12);
        } else {
          // Empty Slot
          ctx.textAlign = 'left';
          ctx.font = '600 12px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = isDark ? '#4B5563' : '#9CA3AF';
          ctx.fillText('— Unscheduled', slotX + 10, slotY + 48);

          ctx.font = '500 10px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = isDark ? '#374151' : '#CBD5E1';
          ctx.fillText('Tap to plan', slotX + 10, slotY + 66);
        }
      });
    });
  } else {
    // Bento Grid Layout (1200 x 1500)
    // 7 days distributed across cards
    const startY = 175;
    const cardWidth = 515;
    const cardHeight = 270;
    const gapX = 30;
    const gapY = 25;

    days.forEach((day, index) => {
      // 2 columns
      const col = index % 2;
      const row = Math.floor(index / 2);
      // For the 7th card, span across or center
      const isLastOdd = index === 6;
      const x = isLastOdd ? (width - cardWidth) / 2 : 70 + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const dayMeals = meals.filter((m) => m.dateScheduled === day.dateString);
      const dayCals = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const dayProtein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);

      // Shadow
      ctx.fillStyle = shadowColor;
      roundRect(ctx, x + 4, y + 4, cardWidth, cardHeight, 20);
      ctx.fill();

      // Body + Clipped Header (No color overflow)
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, x, y, cardWidth, cardHeight, 20);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.clip();

      // Top Accent Header
      ctx.fillStyle = day.isToday ? '#FFE600' : isDark ? '#262938' : '#FAF8F5';
      ctx.fillRect(x, y, cardWidth, 48);

      ctx.restore();

      // Card Border + Header Divider Line
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.5;
      roundRect(ctx, x, y, cardWidth, cardHeight, 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + 48);
      ctx.lineTo(x + cardWidth, y + 48);
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      // Day Title (no repetitive • TODAY)
      const bentoDayLabel = day.isToday
        ? `TODAY ${day.dayNumber}`
        : `${day.dayName.toUpperCase()} ${day.dayNumber}`;

      ctx.textAlign = 'left';
      ctx.font = '900 16px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = day.isToday ? '#000000' : textColor;
      ctx.fillText(bentoDayLabel, x + 18, y + 31);

      ctx.textAlign = 'right';
      ctx.font = '800 13px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = day.isToday ? '#000000' : subtextColor;
      ctx.fillText(`${dayCals} kcal • ${dayProtein}g P`, x + cardWidth - 18, y + 31);

      // Meal items in 2x2 grid inside day card
      const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
      const slotW = (cardWidth - 46) / 2;
      const slotH = 92;

      slots.forEach((slot, sIdx) => {
        const sCol = sIdx % 2;
        const sRow = Math.floor(sIdx / 2);
        const sX = x + 16 + sCol * (slotW + 14);
        const sY = y + 60 + sRow * (slotH + 12);
        const meal = dayMeals.find((m) => m.mealType === slot);
        const slotConfig = SLOT_COLORS[slot];

        ctx.fillStyle = isDark ? '#1E202A' : '#FFFFFF';
        roundRect(ctx, sX, sY, slotW, slotH, 12);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#2D303E' : '#E5E7EB';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Slot Pill
        ctx.fillStyle = slotConfig.bg;
        roundRect(ctx, sX + 10, sY + 10, 56, 18, 6);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = slotConfig.text;
        ctx.font = '900 10px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slotConfig.label, sX + 38, sY + 23);

        if (meal) {
          ctx.textAlign = 'right';
          ctx.font = '800 11px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = isDark ? '#34D399' : '#059669';
          ctx.fillText(`${meal.calories} kcal`, sX + slotW - 10, sY + 23);
        }

        // Meal Name
        ctx.textAlign = 'left';
        ctx.font = '700 13px "Inter", -apple-system, sans-serif';
        ctx.fillStyle = meal ? textColor : (isDark ? '#4B5563' : '#9CA3AF');
        const mTitle = meal ? cleanMealTitle(meal.title) : '— Empty';
        ctx.fillText(truncateText(ctx, mTitle, slotW - 20), sX + 10, sY + 54);

        if (meal && meal.protein) {
          ctx.font = '600 11px "Inter", -apple-system, sans-serif';
          ctx.fillStyle = subtextColor;
          ctx.fillText(`${meal.protein}g protein`, sX + 10, sY + 74);
        }
      });
    });
  }

  // 6. Bottom Branding Footer
  ctx.fillStyle = borderColor;
  ctx.fillRect(0, height - 60, width, 60);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 13px "Inter", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    '✦ MEALZY • ZERO FOOD SPOILAGE • SAVED DIRECTLY TO PHONE ✦',
    width / 2,
    height - 25
  );

  // 7. Generate Data URL and Blob
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create PNG blob'))), 'image/png', 0.95);
  });

  return { dataUrl, blob };
}
