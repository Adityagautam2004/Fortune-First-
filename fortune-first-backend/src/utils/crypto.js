const crypto = require('crypto');

/**
 * AES-256-GCM field-level encryption for sensitive KYC data (PAN, bank account
 * numbers), per NFR-SEC-06. The key is derived from AES_ENCRYPTION_KEY so any
 * passphrase length works; GCM's auth tag is stored alongside the ciphertext
 * so tampering/corruption is detected on decrypt rather than silently returning garbage.
 */
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto
  .createHash('sha256')
  .update(process.env.AES_ENCRYPTION_KEY || 'insecure_dev_key_change_in_production')
  .digest();

const encrypt = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (cipherText) => {
  if (!cipherText) return null;
  const raw = Buffer.from(cipherText, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

// Shared masking rules so the customer's own profile view and the admin KYC
// review view render PAN/account numbers identically.
const maskPan = (pan) => (pan ? `${pan.substring(0, 5)}****${pan.substring(9)}` : null);
const maskAccountNumber = (acc) => (acc ? '*'.repeat(Math.max(acc.length - 4, 0)) + acc.slice(-4) : null);

module.exports = { encrypt, decrypt, maskPan, maskAccountNumber };
