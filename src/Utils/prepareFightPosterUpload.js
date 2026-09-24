// Keep multipart requests below the hosting platform's 4.5 MB body limit.
const MAX_REQUEST_IMAGE_BYTES = 3 * 1024 * 1024;

export async function prepareFightPosterUpload(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a PNG, JPEG, or WebP image.');
  }
  if (file.size <= MAX_REQUEST_IMAGE_BYTES) return file;

  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This image could not be opened. Try another PNG, JPEG, or WebP file.'));
      image.src = source;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image has no usable dimensions.');
    for (const maxSide of [2400, 1800, 1400, 1100]) {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not prepare this poster.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.88, 0.75, 0.6]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_REQUEST_IMAGE_BYTES) {
          return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
        }
      }
    }
    throw new Error('This poster is too large to upload. Try a smaller image.');
  } finally {
    URL.revokeObjectURL(source);
  }
}
