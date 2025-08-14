import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

export class EncryptionUtils {
  /**
   * Generate encryption key pair for E2E encryption
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate symmetric encryption key
   */
  static generateSymmetricKey(): string {
    return crypto.randomBytes(config.encryption.keyLength).toString('base64');
  }

  /**
   * Encrypt message with symmetric key
   */
  static encryptMessage(message: string, key: string): {
    encryptedData: string;
    iv: string;
    tag: string;
  } {
    try {
      if (!config.encryption.enabled) {
        return {
          encryptedData: Buffer.from(message).toString('base64'),
          iv: '',
          tag: '',
        };
      }

      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(config.encryption.ivLength);
      const cipher = crypto.createCipher(config.encryption.algorithm, keyBuffer);
      
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // For GCM mode, get the authentication tag
      const tag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : '';

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag,
      };
    } catch (error) {
      logger.error('Message encryption failed', { error: (error as Error).message });
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message with symmetric key
   */
  static decryptMessage(
    encryptedData: string,
    key: string,
    iv: string,
    tag?: string
  ): string {
    try {
      if (!config.encryption.enabled) {
        return Buffer.from(encryptedData, 'base64').toString('utf8');
      }

      const keyBuffer = Buffer.from(key, 'base64');
      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = crypto.createDecipher(config.encryption.algorithm, keyBuffer);
      
      if (tag && decipher.setAuthTag) {
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
      }

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Message decryption failed', { error: (error as Error).message });
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt symmetric key with public key (for key exchange)
   */
  static encryptKey(symmetricKey: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(symmetricKey, 'base64')
      );

      return encrypted.toString('base64');
    } catch (error) {
      logger.error('Key encryption failed', { error: (error as Error).message });
      throw new Error('Failed to encrypt key');
    }
  }

  /**
   * Decrypt symmetric key with private key
   */
  static decryptKey(encryptedKey: string, privateKey: string): string {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedKey, 'base64')
      );

      return decrypted.toString('base64');
    } catch (error) {
      logger.error('Key decryption failed', { error: (error as Error).message });
      throw new Error('Failed to decrypt key');
    }
  }

  /**
   * Generate message hash for integrity verification
   */
  static generateMessageHash(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Verify message hash
   */
  static verifyMessageHash(message: string, hash: string): boolean {
    const calculatedHash = this.generateMessageHash(message);
    return calculatedHash === hash;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Derive key from password (for additional security)
   */
  static deriveKey(password: string, salt: string): string {
    const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    return derived.toString('base64');
  }

  /**
   * Generate salt for key derivation
   */
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
