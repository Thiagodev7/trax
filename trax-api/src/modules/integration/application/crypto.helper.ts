/**
 * AES-256-GCM helpers para criptografia de credenciais de integração.
 *
 * Variável de ambiente: CREDENTIALS_ENCRYPTION_KEY (qualquer string — será derivada via SHA-256).
 * Alias aceito por compatibilidade: ENCRYPTION_KEY.
 *
 * ATENÇÃO: não altere a chave em produção sem antes migrar as credenciais existentes.
 * Use o endpoint PATCH /integrations/:id para reconectar integrações após troca de chave.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  // Aceita CREDENTIALS_ENCRYPTION_KEY (nome original no código)
  // ou ENCRYPTION_KEY (nome documentado em .env.example)
  const secret =
    process.env.CREDENTIALS_ENCRYPTION_KEY ??
    process.env.ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      'Nenhuma chave de criptografia configurada. ' +
      'Defina CREDENTIALS_ENCRYPTION_KEY ou ENCRYPTION_KEY no .env.',
    );
  }
  // Deriva 32 bytes via SHA-256 para garantir o tamanho correto independente do input
  return createHash('sha256').update(secret).digest();
}

export function encryptCredentials(plain: Record<string, string>): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(plain);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  });
}

export function decryptCredentials(enc: string): Record<string, string> {
  const key = getKey();
  const { iv, authTag, data } = JSON.parse(enc) as {
    iv: string;
    authTag: string;
    data: string;
  };
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8'));
}
