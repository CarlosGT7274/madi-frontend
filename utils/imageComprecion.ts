// utils/image-compression.ts
export const comprimirImagenOptimizada = (
  file: File, 
  maxWidth = 800, 
  calidad = 0.6
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si el archivo es menor a 500KB, no comprimir
    if (file.size <= 500 * 1024) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Reducir tamaño manteniendo aspect ratio
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Mejorar calidad de compresión
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'medium';
      
      ctx!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Verificar que la compresión sea significativa
            if (blob.size >= file.size * 0.9) {
              // Si no hay mucha reducción, usar el original
              resolve(file);
            } else {
              const fileComprimido = new File(
                [blob], 
                file.name.replace(/\.[^/.]+$/, ".jpg"), // Cambiar extensión a jpg
                { 
                  type: 'image/jpeg',
                  lastModified: new Date().getTime() 
                }
              );
              resolve(fileComprimido);
            }
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        },
        'image/jpeg',
        calidad
      );
    };

    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(file);
  });
};

export const optimizarImagenParaSubida = async (file: File): Promise<File> => {
  // No comprimir si es muy pequeño
  if (file.size < 300 * 1024) {
    return file;
  }

  // Comprimir según el tamaño original
  let maxWidth = 800;
  let calidad = 0.6;

  if (file.size > 2 * 1024 * 1024) { // > 2MB
    maxWidth = 600;
    calidad = 0.5;
  } else if (file.size > 1 * 1024 * 1024) { // > 1MB
    maxWidth = 700;
    calidad = 0.55;
  }

  return await comprimirImagenOptimizada(file, maxWidth, calidad);
};
