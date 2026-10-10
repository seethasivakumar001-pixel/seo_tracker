import { z } from 'zod';

export const keywordFormSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(2, { message: 'Keyword query must be at least 2 characters.' }),
  targetUrl: z
    .string()
    .trim()
    .min(1, { message: 'Target landing page URL is required.' })
    .refine((val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, { message: 'Please enter a valid URL (e.g. https://example.com/landing-page).' }),
  notRanking: z.boolean().default(false),
  position: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional(),
  volume: z
    .union([z.number(), z.string()])
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, { message: 'Search volume must be a number 0 or greater.' }),
  group: z.string().default('Core SaaS'),
  device: z.enum(['desktop', 'mobile', 'both']).default('desktop'),
  searchEngine: z.string().default('Google'),
  location: z.string().default('United States'),
  backfillHistory: z.boolean().default(false),
  monthlyPositions: z.object({
    '2026-05': z.union([z.number(), z.string(), z.null()]).optional(),
    '2026-06': z.union([z.number(), z.string(), z.null()]).optional(),
    '2026-07': z.union([z.number(), z.string(), z.null()]).optional(),
    '2026-08': z.union([z.number(), z.string(), z.null()]).optional(),
    '2026-09': z.union([z.number(), z.string(), z.null()]).optional(),
    '2026-10': z.union([z.number(), z.string(), z.null()]).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (!data.notRanking) {
    const posNum = Number(data.position);
    if (!data.position || isNaN(posNum) || posNum < 1 || posNum > 100 || !Number.isInteger(posNum)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['position'],
        message: 'Enter a valid ranking position between 1 and 100.',
      });
    }
  }

  if (data.backfillHistory && data.monthlyPositions) {
    const pastMonths = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
    for (const m of pastMonths) {
      const val = data.monthlyPositions[m];
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 1 || num > 100 || !Number.isInteger(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['monthlyPositions', m],
            message: 'Rank must be 1–100.',
          });
        }
      }
    }
  }
});
