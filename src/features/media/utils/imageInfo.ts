export function imageInfo(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file),
      image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة / Invalid image"));
    };
    image.src = url;
  });
}
export function validateProgramCover(
  file: { size: number },
  dimensions: { width: number; height: number },
) {
  const { width, height } = dimensions;
  if (
    file.size > 5 * 1024 * 1024 ||
    width < 800 ||
    height < 450 ||
    Math.abs(width / height - 16 / 9) > 0.01
  )
    throw new Error(
      "غلاف البرنامج: 16:9، حد أدنى 800×450، حتى 5MB. يوصى بـ1600×900 / Program cover: 16:9, min 800×450, max 5MB; recommended 1600×900.",
    );
}
