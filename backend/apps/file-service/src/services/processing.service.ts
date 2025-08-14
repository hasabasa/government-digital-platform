import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { config } from '../config';
import { logger } from '../utils/logger';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class ProcessingService {
  /**
   * Generate image thumbnail
   */
  async generateThumbnail(
    buffer: Buffer,
    mimeType: string,
    size: 'small' | 'medium' | 'large'
  ): Promise<Buffer> {
    try {
      const dimensions = config.imageProcessing.thumbnailSizes[size];
      
      const thumbnail = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: config.imageProcessing.quality,
        })
        .toBuffer();

      logger.debug('Image thumbnail generated', {
        size,
        dimensions,
        originalSize: buffer.length,
        thumbnailSize: thumbnail.length,
      });

      return thumbnail;
    } catch (error) {
      logger.error('Image thumbnail generation failed', {
        error: (error as Error).message,
        mimeType,
        size,
      });
      throw new Error(`Failed to generate thumbnail: ${(error as Error).message}`);
    }
  }

  /**
   * Generate video thumbnail
   */
  async generateVideoThumbnail(buffer: Buffer, time: string = '00:00:01'): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const outputBuffer: Buffer[] = [];

        ffmpeg()
          .input(buffer)
          .seekInput(time)
          .outputOptions([
            '-vframes 1',
            '-f image2pipe',
            '-vcodec mjpeg',
            '-s 800x600',
          ])
          .on('error', (error) => {
            logger.error('Video thumbnail generation failed', {
              error: (error as Error).message,
              time,
            });
            reject(new Error(`Failed to generate video thumbnail: ${(error as Error).message}`));
          })
          .on('end', () => {
            const thumbnail = Buffer.concat(outputBuffer);
            logger.debug('Video thumbnail generated', {
              time,
              thumbnailSize: thumbnail.length,
            });
            resolve(thumbnail);
          })
          .pipe()
          .on('data', (chunk: Buffer) => {
            outputBuffer.push(chunk);
          });
      });
    } catch (error) {
      logger.error('Video thumbnail processing error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate document preview
   */
  async generateDocumentPreview(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.generatePdfPreview(buffer);
      }

      if (mimeType.includes('word') || mimeType.includes('document')) {
        return await this.generateWordPreview(buffer);
      }

      // For other document types, return null
      return null;
    } catch (error) {
      logger.error('Document preview generation failed', {
        error: (error as Error).message,
        mimeType,
      });
      return null;
    }
  }

  /**
   * Generate PDF preview
   */
  private async generatePdfPreview(buffer: Buffer): Promise<Buffer> {
    try {
      // Use pdf-poppler for PDF to image conversion
      const poppler = require('pdf-poppler');
      
      const options = {
        format: 'jpeg',
        out_dir: '/tmp',
        out_prefix: `pdf_preview_${Date.now()}`,
        page: 1, // First page only
        scale: config.documentProcessing.imagePreviewDpi,
      };

      // Write buffer to temp file (required by pdf-poppler)
      const fs = require('fs');
      const path = require('path');
      const tempPdfPath = path.join('/tmp', `temp_${Date.now()}.pdf`);
      
      fs.writeFileSync(tempPdfPath, buffer);

      try {
        const result = await poppler.convert(tempPdfPath, options);
        
        if (result && result.length > 0) {
          const previewPath = result[0];
          const previewBuffer = fs.readFileSync(previewPath);
          
          // Clean up temp files
          fs.unlinkSync(tempPdfPath);
          fs.unlinkSync(previewPath);
          
          return previewBuffer;
        }
      } catch (popplerError) {
        // Clean up temp file
        fs.unlinkSync(tempPdfPath);
        throw popplerError;
      }

      throw new Error('No preview generated');
    } catch (error) {
      logger.error('PDF preview generation failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate Word document preview
   */
  private async generateWordPreview(buffer: Buffer): Promise<Buffer | null> {
    try {
      // Use mammoth for Word document conversion
      const mammoth = require('mammoth');
      
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.substring(0, 1000); // First 1000 characters

      // Create a simple image with the text preview
      const textImage = await this.generateTextImage(text);
      
      return textImage;
    } catch (error) {
      logger.error('Word preview generation failed', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Generate image from text
   */
  private async generateTextImage(text: string): Promise<Buffer> {
    try {
      // Create SVG with text
      const width = 800;
      const height = 600;
      const lines = this.wrapText(text, 80);
      const lineHeight = 20;
      
      let svgContent = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <style>
            .text { font-family: Arial, sans-serif; font-size: 14px; fill: black; }
          </style>
      `;

      lines.slice(0, 25).forEach((line, index) => {
        svgContent += `<text x="20" y="${30 + index * lineHeight}" class="text">${this.escapeXml(line)}</text>`;
      });

      svgContent += '</svg>';

      // Convert SVG to image
      const imageBuffer = await sharp(Buffer.from(svgContent))
        .png()
        .toBuffer();

      return imageBuffer;
    } catch (error) {
      logger.error('Text image generation failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Wrap text to specified length
   */
  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Escape XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Compress image
   */
  async compressImage(buffer: Buffer, quality: number = 85): Promise<Buffer> {
    try {
      const compressed = await sharp(buffer)
        .jpeg({ quality })
        .toBuffer();

      logger.debug('Image compressed', {
        originalSize: buffer.length,
        compressedSize: compressed.length,
        compressionRatio: (compressed.length / buffer.length * 100).toFixed(2) + '%',
      });

      return compressed;
    } catch (error) {
      logger.error('Image compression failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      logger.error('Get image metadata failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(buffer: Buffer): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(buffer)
          .ffprobe((error, metadata) => {
            if (error) {
              reject(new Error(`Failed to get video metadata: ${(error as Error).message}`));
              return;
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            
            resolve({
              duration: metadata.format.duration || 0,
              width: videoStream?.width || 0,
              height: videoStream?.height || 0,
              format: metadata.format.format_name || 'unknown',
              size: buffer.length,
            });
          });
      });
    } catch (error) {
      logger.error('Get video metadata failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Convert image format
   */
  async convertImageFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp'
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      switch (targetFormat) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: config.imageProcessing.quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png();
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: config.imageProcessing.quality });
          break;
      }

      const converted = await sharpInstance.toBuffer();

      logger.debug('Image format converted', {
        targetFormat,
        originalSize: buffer.length,
        convertedSize: converted.length,
      });

      return converted;
    } catch (error) {
      logger.error('Image format conversion failed', {
        error: (error as Error).message,
        targetFormat,
      });
      throw error;
    }
  }
}
