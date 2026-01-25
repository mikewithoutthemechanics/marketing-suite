const crypto = require('crypto');

const MASTER_KEY = process.env.MASTER_KEY || 'dev_key_change_me';

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(blob) {
  if (!blob) return null;
  const parts = blob.split(':');
  if (parts.length !== 3) return null;
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]);
  return out.toString('utf8');
}

module.exports = { encrypt, decrypt };
