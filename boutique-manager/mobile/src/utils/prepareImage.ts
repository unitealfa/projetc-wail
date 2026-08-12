import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { PickedImage } from '../types/product';

const MAX_DIMENSION = 1600;

export async function prepareImage(asset: ImagePickerAsset, prefix = 'image'): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_DIMENSION) {
    if (asset.width >= asset.height) context.resize({ width: MAX_DIMENSION, height: null });
    else context.resize({ width: null, height: MAX_DIMENSION });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return {
    uri: saved.uri,
    fileName: `${prefix}-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
  };
}
