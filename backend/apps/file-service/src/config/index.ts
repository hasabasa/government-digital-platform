import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cube_demper',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    cachePrefix: 'file:',
    cacheTtl: 3600,
  },

  // Auth Service Configuration
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
  },

  // S3/MinIO Configuration
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
    bucket: process.env.S3_BUCKET || 'cube-demper-files',
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    allowedMimeTypes: [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      // Media
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    ],
    virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true',
  },

  // Image Processing Configuration
  imageProcessing: {
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 800, height: 600 },
    },
    quality: 85,
    format: 'jpeg',
  },

  // Video Processing Configuration
  videoProcessing: {
    thumbnailTime: '00:00:01',
    previewDuration: 30, // seconds
    maxResolution: '1920x1080',
    codec: 'libx264',
  },

  // Document Processing Configuration
  documentProcessing: {
    pdfPreviewPages: 3,
    imagePreviewDpi: 150,
    maxPreviewSize: 5 * 1024 * 1024, // 5MB
  },

  // Security Configuration
  security: {
    encryptionEnabled: process.env.FILE_ENCRYPTION_ENABLED !== 'false',
    encryptionAlgorithm: 'aes-256-gcm',
    checksumAlgorithm: 'sha256',
    signedUrlExpiration: 3600, // 1 hour
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    uploadRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxUploads: 10,
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Cleanup Configuration
  cleanup: {
    tempFileRetention: 24 * 60 * 60 * 1000, // 24 hours
    deletedFileRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
    orphanedFileCheck: 60 * 60 * 1000, // 1 hour
  },
};
