import { Platform } from 'react-native';
import type { PickedImage } from '../types/product';

export async function appendPickedImage(form: FormData, field: string, image: PickedImage): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(image.uri);
    const blob = await response.blob();
    form.append(field, blob, image.fileName);
    return;
  }
  form.append(field, {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as unknown as Blob);
}
