import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CreateIncidentInput, IncidentCategory, IncidentDetail } from '@/data';
import { Button } from '@/design-system/Button';
import { Chip } from '@/design-system/Chip';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES: IncidentCategory[] = ['elevator', 'plumbing', 'electrical', 'other'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type IncidentFormProps = {
  onSubmit: (input: CreateIncidentInput) => Promise<IncidentDetail>;
  onCreated: (incident: IncidentDetail) => void;
};

export function IncidentForm({ onSubmit, onCreated }: IncidentFormProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [photo, setPhoto] = useState<CreateIncidentInput['photo']>();
  const [photoUri, setPhotoUri] = useState<string>();
  const [validationVisible, setValidationVisible] = useState(false);
  const [error, setError] = useState<string>();
  const [photoError, setPhotoError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const pending = useRef(false);
  const valid =
    title.trim().length >= 3 &&
    location.trim().length >= 2 &&
    description.trim().length >= 10 &&
    category !== null;

  async function pickPhoto() {
    if (pickingPhoto || pending.current) return;
    setPickingPhoto(true);
    setPhotoError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) {
        setPhotoError(t('incidentFlow.photoError'));
        return;
      }
      const mimeType = asset.base64.startsWith('/9j/')
        ? 'image/jpeg'
        : asset.base64.startsWith('iVBORw0KGgo')
          ? 'image/png'
          : asset.base64.startsWith('UklGR')
            ? 'image/webp'
            : null;
      if (!mimeType) {
        setPhotoError(t('incidentFlow.photoError'));
        return;
      }
      const padding = asset.base64.endsWith('==') ? 2 : asset.base64.endsWith('=') ? 1 : 0;
      const byteLength = Math.floor((asset.base64.length * 3) / 4) - padding;
      if (byteLength > MAX_PHOTO_BYTES) {
        setPhotoError(t('incidentFlow.photoTooLarge'));
        return;
      }
      setPhoto({ base64: asset.base64, mimeType });
      setPhotoUri(`data:${mimeType};base64,${asset.base64}`);
    } catch {
      setPhotoError(t('incidentFlow.photoError'));
    } finally {
      setPickingPhoto(false);
    }
  }

  async function submit() {
    if (pending.current || pickingPhoto) return;
    setValidationVisible(true);
    if (!valid || category === null) return;
    pending.current = true;
    setSubmitting(true);
    setError(undefined);
    try {
      const incident = await onSubmit({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        category,
        ...(photo ? { photo } : {}),
      });
      onCreated(incident);
    } catch {
      setError(t('incidentFlow.submitError'));
      pending.current = false;
      setSubmitting(false);
    }
  }

  const fields = [
    { key: 'title', value: title, setValue: setTitle, maxLength: 120, minLength: 3 },
    { key: 'location', value: location, setValue: setLocation, maxLength: 160, minLength: 2 },
    {
      key: 'description',
      value: description,
      setValue: setDescription,
      maxLength: 4000,
      minLength: 10,
    },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-12"
      >
        <View className="gap-5 px-5 pt-5">
          <Text className="font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
            {t('incidentFlow.formIntro')}
          </Text>
          <View className="gap-3">
            <Text className="font-label text-[13px] text-ink dark:text-ink-dark">
              {t('incidentFlow.fields.category')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  selected={category === item}
                  disabled={submitting}
                  onPress={() => setCategory(item)}
                >
                  {t(`incidentFlow.categories.${item}`)}
                </Chip>
              ))}
            </View>
            {validationVisible && category === null ? (
              <Text accessibilityRole="alert" className="font-body text-[12px] text-danger">
                {t('incidentFlow.validation.category')}
              </Text>
            ) : null}
          </View>
          <View className="gap-3">
            <Text className="font-label text-[13px] text-ink dark:text-ink-dark">
              {t('incidentFlow.fields.photo')}
            </Text>
            {photoUri ? (
              <>
                <Image
                  accessibilityLabel={t('incidentFlow.photoPreview')}
                  source={{ uri: photoUri }}
                  style={{ height: 200, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Button
                  variant="outline"
                  loading={pickingPhoto}
                  disabled={submitting}
                  onPress={pickPhoto}
                >
                  {t('incidentFlow.changePhoto')}
                </Button>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('incidentFlow.addPhoto')}
                accessibilityHint={t('incidentFlow.photoPickerHint')}
                accessibilityState={{ disabled: submitting || pickingPhoto, busy: pickingPhoto }}
                disabled={submitting || pickingPhoto}
                onPress={() => void pickPhoto()}
                className={`min-h-28 flex-row items-center justify-center gap-3 rounded-lg border-2 border-dashed border-outline bg-surface px-5 py-6 active:bg-surface-hi dark:border-outline-dark dark:bg-surface-dark dark:active:bg-surface-dark-hi ${submitting || pickingPhoto ? 'opacity-40' : ''}`}
              >
                {pickingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Camera color={colors.primary} size={26} />
                )}
                <Text className="shrink font-body text-[15px] leading-[22px] text-ink-soft dark:text-ink-dark-soft">
                  {t(pickingPhoto ? 'incidentFlow.pickingPhoto' : 'incidentFlow.addPhoto')}
                </Text>
              </Pressable>
            )}
            {photo ? (
              <Button
                variant="ghost"
                disabled={submitting || pickingPhoto}
                onPress={() => {
                  setPhoto(undefined);
                  setPhotoUri(undefined);
                  setPhotoError(undefined);
                }}
              >
                {t('incidentFlow.removePhoto')}
              </Button>
            ) : null}
            <Text className="font-body text-[12px] text-ink-soft dark:text-ink-dark-soft">
              {t('incidentFlow.photoHint')}
            </Text>
            {photoError ? (
              <Text accessibilityRole="alert" className="font-body text-[13px] text-danger">
                {photoError}
              </Text>
            ) : null}
          </View>
          {fields.map((field) => (
            <View className="gap-2" key={field.key}>
              <Text className="font-label text-[13px] text-ink dark:text-ink-dark">
                {t(`incidentFlow.fields.${field.key}`)}
              </Text>
              <TextInput
                accessibilityLabel={t(`incidentFlow.fields.${field.key}`)}
                placeholder={t(`incidentFlow.placeholders.${field.key}`)}
                value={field.value}
                onChangeText={field.setValue}
                editable={!submitting}
                maxLength={field.maxLength}
                multiline={field.key === 'description'}
                textAlignVertical="top"
                autoCapitalize="sentences"
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                className={`rounded-sm border border-outline bg-surface px-4 py-3 font-body text-[15px] text-ink dark:border-outline-dark dark:bg-surface-dark dark:text-ink-dark ${field.key === 'description' ? 'min-h-32' : 'min-h-12'}`}
              />
              {validationVisible && field.value.trim().length < field.minLength ? (
                <Text
                  accessibilityRole="alert"
                  className="font-body text-[12px] text-danger dark:text-danger-soft"
                >
                  {t(`incidentFlow.validation.${field.key}`)}
                </Text>
              ) : null}
            </View>
          ))}
          {error ? (
            <Text accessibilityRole="alert" className="font-body text-[14px] text-danger">
              {error}
            </Text>
          ) : null}
          <Button
            loading={submitting}
            disabled={pickingPhoto}
            onPress={() => {
              void submit();
            }}
          >
            {t('incidentFlow.submit')}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
