import { useTranslation } from 'react-i18next';

export function useLengthMessages() {
  const { t } = useTranslation();
  return {
    required: t('crud.required'),
    tooLong: (max: number) => t('crud.tooLong', { max }),
  };
}
