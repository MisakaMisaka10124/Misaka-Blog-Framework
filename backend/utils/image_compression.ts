import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_IMAGE_BYTES = 1024 * 1024 - 1;

export async function compressUploadedImage(file: Express.Multer.File): Promise<void> {
  const extension = path.extname(file.originalname).toLowerCase();
  const isRasterImage = file.mimetype.startsWith('image/') || /\.(jpe?g|png|gif|webp|tiff?|avif|bmp)$/i.test(file.originalname);
  if (!isRasterImage || extension === '.svg') return;
  if ((file.mimetype === 'image/gif' || extension === '.gif') && file.size < MAX_IMAGE_BYTES) return;
  if ((file.mimetype === 'image/jpeg' || extension === '.jpg' || extension === '.jpeg') && file.size < 180 * 1024) return;

  let dimension = 1600;
  let quality = 78;
  let buffer: Buffer | null = null;

  for (let attempt = 0; attempt < 48; attempt += 1) {
    buffer = await sharp(file.path, { animated: false })
      .rotate()
      .resize({ width: dimension, height: dimension, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();

    if (buffer.length < MAX_IMAGE_BYTES) break;

    if (quality > 40) {
      quality = Math.max(40, quality - 8);
    } else if (dimension > 192) {
      dimension = Math.max(192, Math.round(dimension * 0.8));
      quality = 78;
    } else if (quality > 20) {
      quality = Math.max(20, quality - 5);
    } else {
      throw new Error('图片无法压缩到 1 MB 以下');
    }
  }

  if (!buffer || buffer.length >= MAX_IMAGE_BYTES) {
    throw new Error('图片无法压缩到 1 MB 以下');
  }

  const filename = `${path.parse(file.filename).name}.jpg`;
  const destination = path.join(file.destination, filename);
  const temporaryPath = `${destination}.compressed`;
  await fs.writeFile(temporaryPath, buffer);
  await fs.rename(temporaryPath, destination);
  if (file.path !== destination) await fs.rm(file.path, { force: true });

  file.filename = filename;
  file.path = destination;
  file.mimetype = 'image/jpeg';
  file.size = buffer.length;
}
