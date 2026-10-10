import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { keywordFormSchema } from '../schemas/keywordSchema';
import { useSEOStore } from '../store/seoStore';
import toast from 'react-hot-toast';

export function useKeywordForm({ onSuccess, onAddAnother } = {}) {
  const { getSelectedWebsite, addKeyword, keywords, selectedWebsiteId } = useSEOStore();
  const currentWebsite = getSelectedWebsite();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultUrl = currentWebsite?.domain ? `https://${currentWebsite.domain}/` : '';
  const defaultLocation = currentWebsite?.targetCountry || 'United States';

  const form = useForm({
    resolver: zodResolver(keywordFormSchema),
    mode: 'onChange',
    defaultValues: {
      keyword: '',
      targetUrl: defaultUrl,
      notRanking: false,
      position: '',
      volume: '',
      group: 'Core SaaS',
      device: 'desktop',
      searchEngine: 'Google',
      location: defaultLocation,
      backfillHistory: false,
      monthlyPositions: {
        '2026-05': '',
        '2026-06': '',
        '2026-07': '',
        '2026-08': '',
        '2026-09': '',
        '2026-10': '',
      }
    }
  });

  const { watch, setValue, reset, handleSubmit, formState: { errors, isValid } } = form;

  const watchedNotRanking = watch('notRanking');
  const watchedPosition = watch('position');
  const watchedBackfill = watch('backfillHistory');

  // Sync current month (Oct '26) with Current Position
  useEffect(() => {
    if (watchedNotRanking) {
      setValue('monthlyPositions.2026-10', '', { shouldValidate: true });
    } else {
      setValue('monthlyPositions.2026-10', watchedPosition ? Number(watchedPosition) : '', { shouldValidate: true });
    }
  }, [watchedNotRanking, watchedPosition, setValue]);

  // Clear past months when backfill toggle is turned OFF
  useEffect(() => {
    if (!watchedBackfill) {
      setValue('monthlyPositions.2026-05', '');
      setValue('monthlyPositions.2026-06', '');
      setValue('monthlyPositions.2026-07', '');
      setValue('monthlyPositions.2026-08', '');
      setValue('monthlyPositions.2026-09', '');
    }
  }, [watchedBackfill, setValue]);

  const processSubmit = async (data, isAddAnotherAction = false) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate (same keyword + device + location in this website)
      const normalizedQuery = data.keyword.trim().toLowerCase();
      const duplicate = keywords.find(
        (k) =>
          k.websiteId === selectedWebsiteId &&
          k.keyword.trim().toLowerCase() === normalizedQuery &&
          k.device === data.device &&
          k.location.toLowerCase() === data.location.toLowerCase()
      );

      if (duplicate) {
        toast.error(`"${data.keyword}" is already being tracked on ${data.device} in ${data.location}!`);
        setIsSubmitting(false);
        return;
      }

      const finalPosition = data.notRanking ? null : Number(data.position);
      const finalVolume = Number(data.volume);

      // Build monthly positions
      const cleanMonthly = {};
      if (finalPosition !== null) {
        cleanMonthly['2026-10'] = finalPosition;
      }

      if (data.backfillHistory && data.monthlyPositions) {
        const pastMonths = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
        for (const m of pastMonths) {
          const val = data.monthlyPositions[m];
          if (val !== undefined && val !== null && val !== '') {
            cleanMonthly[m] = Number(val);
          }
        }
      }

      const createdKeyword = addKeyword({
        keyword: data.keyword.trim(),
        targetUrl: data.targetUrl.trim(),
        position: finalPosition,
        volume: finalVolume,
        group: data.group,
        device: data.device,
        searchEngine: data.searchEngine,
        location: data.location,
        backfillHistory: data.backfillHistory,
        monthlyPositions: cleanMonthly,
        notRanking: data.notRanking,
      });

      if (isAddAnotherAction) {
        reset({
          keyword: '',
          targetUrl: defaultUrl,
          notRanking: false,
          position: '',
          volume: '',
          group: data.group, // keep previous group for convenience
          device: data.device,
          searchEngine: data.searchEngine,
          location: data.location,
          backfillHistory: false,
          monthlyPositions: {
            '2026-05': '',
            '2026-06': '',
            '2026-07': '',
            '2026-08': '',
            '2026-09': '',
            '2026-10': '',
          }
        });
        toast.success(`Keyword "${data.keyword}" added! Ready for next keyword.`);
        if (onAddAnother) onAddAnother(createdKeyword);
      } else {
        toast.success(`Keyword "${data.keyword}" successfully added!`);
        if (onSuccess) onSuccess(createdKeyword);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add keyword. Please check input values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    isValid,
    errors,
    watchedNotRanking,
    watchedPosition,
    watchedBackfill,
    onSubmit: handleSubmit((data) => processSubmit(data, false)),
    onAddAnotherSubmit: handleSubmit((data) => processSubmit(data, true)),
  };
}
