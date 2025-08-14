import crypto from 'crypto';
import forge from 'node-forge';
import { config } from '../config';

export class CryptoUtils {
  /**
   * Verify digital signature using GOST algorithm
   */
  static async verifyDigitalSignature(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // In real implementation, use actual GOST cryptographic library
      // For now, we'll simulate verification
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      const expectedSignature = crypto.createHash('sha256').update(hash + publicKey).digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Digital signature verification failed:', error);
      return false;
    }
  }

  /**
   * Extract user information from digital certificate
   */
  static extractCertificateInfo(certificate: string): {
    subject: string;
    issuer: string;
    serialNumber: string;
    validFrom: Date;
    validTo: Date;
    publicKey: string;
  } | null {
    try {
      // Parse certificate using node-forge
      const cert = forge.pki.certificateFromPem(certificate);
      
      return {
        subject: cert.subject.getField('CN')?.value || '',
        issuer: cert.issuer.getField('CN')?.value || '',
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        publicKey: forge.pki.publicKeyToPem(cert.publicKey),
      };
    } catch (error) {
      console.error('Certificate parsing failed:', error);
      return null;
    }
  }

  /**
   * Validate certificate against CRL and trusted CA
   */
  static async validateCertificate(certificate: string): Promise<boolean> {
    try {
      const certInfo = this.extractCertificateInfo(certificate);
      if (!certInfo) return false;

      // Check certificate validity period
      const now = new Date();
      if (now < certInfo.validFrom || now > certInfo.validTo) {
        return false;
      }

      // TODO: Check against CRL (Certificate Revocation List)
      // TODO: Verify against trusted CA

      return true;
    } catch (error) {
      console.error('Certificate validation failed:', error);
      return false;
    }
  }

  /**
   * Generate secure token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
