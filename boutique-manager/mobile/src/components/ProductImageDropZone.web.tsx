import { useState, type DragEvent } from 'react';
import type { PickedImage } from '../types/product';
import { prepareImageUri } from '../utils/prepareImage';

export function ProductImageDropZone({ disabled, remaining, onImages }: {
  disabled: boolean;
  remaining: number;
  onImages: (images: PickedImage[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  if (remaining <= 0) return null;

  const drop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files)
      .filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      .slice(0, remaining);
    const images = await Promise.all(files.map(async (file, index) => {
      const uri = URL.createObjectURL(file);
      return prepareImageUri(uri, `produit-${index + 1}`);
    }));
    onImages(images);
  };

  return <div
    onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
    onDragOver={(event) => event.preventDefault()}
    onDragLeave={() => setDragging(false)}
    onDrop={(event) => void drop(event)}
    style={{
      border: `2px dashed ${dragging ? '#1D4ED8' : '#CBD5E1'}`,
      borderRadius: 10,
      padding: 18,
      textAlign: 'center',
      color: '#64748B',
      background: dragging ? '#DBEAFE' : '#F8FAFC',
      opacity: disabled ? 0.55 : 1,
    }}
  >
    Glissez-déposez ici jusqu’à {remaining} image{remaining > 1 ? 's' : ''}
  </div>;
}
