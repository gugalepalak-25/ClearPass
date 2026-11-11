import crypto from 'node:crypto';
import {
  SelectiveDisclosurePackage,
  SelectiveDisclosurePermissions,
  VerificationCertificate,
} from '../types/index.js';
import { getCertificateById } from '../certificates/manager.js';
import { config } from '../config.js';

const shareStore = new Map<string, SelectiveDisclosurePackage>();

export interface ShareCreationRequest {
  certificateId: string;
  recipientName: string;
  expiresInDays: number;
  permissions: SelectiveDisclosurePermissions;
  accessCode?: string; // Optional access code or passphrase
}

export function createSelectiveDisclosureShare(request: ShareCreationRequest): {
  share: SelectiveDisclosurePackage;
  accessCode: string;
} {
  const cert = getCertificateById(request.certificateId);
  if (!cert) {
    throw new Error(`Certificate '${request.certificateId}' not found.`);
  }

  const shareId = `share_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
  const accessCode = request.accessCode || crypto.randomBytes(4).toString('hex').toUpperCase();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (request.expiresInDays || 7) * 24 * 60 * 60 * 1000);

  // Filter payload strictly according to selective disclosure permissions
  const disclosedReport: Record<string, any> = {
    certificateId: cert.certificateId,
    network: cert.network,
    assessmentTimestamp: cert.assessmentTimestamp,
    expiryTimestamp: cert.expiryTimestamp,
    issuerIdentity: cert.issuerIdentity,
    certHash: cert.certHash,
    digitalSignature: cert.digitalSignature,
  };

  if (request.permissions.discloseOutcome) {
    disclosedReport.outcome = cert.outcome;
  }

  if (request.permissions.discloseRiskScore) {
    disclosedReport.riskScore = cert.riskScore;
  }

  if (request.permissions.discloseScopeAndHopDepth) {
    disclosedReport.hopDepth = cert.hopDepth;
    disclosedReport.riskListVersion = cert.riskListVersion;
    disclosedReport.assessmentScope = {
      nativeNear: cert.assessmentScope.nativeNear,
      nep141Tokens: cert.assessmentScope.nep141Tokens,
      maxHopDepth: cert.assessmentScope.maxHopDepth,
      evaluatedTxCount: cert.assessmentScope.evaluatedTxCount,
      dataCompleteness: cert.assessmentScope.dataCompleteness,
    };
  }

  // Raw counterparty transactions are explicitly OMITTED unless user explicitly enabled discloseRawCounterparties
  if (request.permissions.discloseRawCounterparties) {
    disclosedReport.note = 'User permitted limited counterparty visibility';
  } else {
    disclosedReport.confidentialityNotice =
      'Complete wallet transaction history is hidden under ClearPass zero-knowledge selective disclosure protocol.';
  }

  // Encrypt disclosedReport using AES-256-GCM with accessCode derived key
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(accessCode, salt, 32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(disclosedReport), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Payload includes salt prefix so accessCode can derive key
  const finalEncryptedPayload = `${salt.toString('hex')}:${encrypted}`;

  const sharePackage: SelectiveDisclosurePackage = {
    shareId,
    certificateId: cert.certificateId,
    walletAddress: cert.walletAddress,
    recipientName: request.recipientName,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    permissions: request.permissions,
    encryptedPayload: finalEncryptedPayload,
    authTag,
    iv: iv.toString('hex'),
    issuerPublicKey: cert.issuerPublicKey,
    status: 'ACTIVE',
  };

  shareStore.set(shareId, sharePackage);

  return { share: sharePackage, accessCode };
}

export function inspectSelectiveDisclosureShare(
  shareId: string,
  accessCode: string
): {
  success: boolean;
  share?: SelectiveDisclosurePackage;
  decryptedData?: Record<string, any>;
  error?: string;
} {
  const share = shareStore.get(shareId);
  if (!share) {
    return { success: false, error: 'Share link or ID not found.' };
  }

  if (share.status === 'REVOKED') {
    return { success: false, error: 'Access to this selective disclosure report was revoked by the certificate owner.' };
  }

  const now = new Date();
  if (now > new Date(share.expiresAt)) {
    share.status = 'EXPIRED';
    return { success: false, error: 'This selective disclosure report link has expired.' };
  }

  try {
    const [saltHex, encryptedHex] = share.encryptedPayload.split(':');
    if (!saltHex || !encryptedHex) {
      return { success: false, error: 'Invalid encrypted payload format.' };
    }

    const salt = Buffer.from(saltHex, 'hex');
    const key = crypto.scryptSync(accessCode.trim(), salt, 32);
    const iv = Buffer.from(share.iv, 'hex');
    const authTag = Buffer.from(share.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const decryptedData = JSON.parse(decrypted);

    return {
      success: true,
      share,
      decryptedData,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Decryption failed: Incorrect access code or tampered payload.',
    };
  }
}

export function revokeSelectiveDisclosureShare(shareId: string): boolean {
  const share = shareStore.get(shareId);
  if (!share) return false;
  share.status = 'REVOKED';
  shareStore.set(shareId, share);
  return true;
}

export function getAllShares(): SelectiveDisclosurePackage[] {
  return Array.from(shareStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

