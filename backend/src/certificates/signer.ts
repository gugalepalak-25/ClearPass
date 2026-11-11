import crypto from 'node:crypto';
import { config } from '../config.js';
import { VerificationCertificate } from '../types/index.js';

export interface CanonicalPayload {
  certificateId: string;
  walletAddress: string;
  network: string;
  outcome: string;
  riskScore: number;
  assessmentTimestamp: string;
  expiryTimestamp: string;
  hopDepth: number;
  riskListVersion: string;
  issuerIdentity: string;
}

export function createCanonicalHash(payload: CanonicalPayload): string {
  // Deterministic JSON stringification
  const canonicalString = JSON.stringify({
    certificateId: payload.certificateId,
    walletAddress: payload.walletAddress.toLowerCase().trim(),
    network: payload.network,
    outcome: payload.outcome,
    riskScore: payload.riskScore,
    assessmentTimestamp: payload.assessmentTimestamp,
    expiryTimestamp: payload.expiryTimestamp,
    hopDepth: payload.hopDepth,
    riskListVersion: payload.riskListVersion,
    issuerIdentity: payload.issuerIdentity,
  });

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

export function signCertificatePayload(payload: CanonicalPayload): { certHash: string; signature: string } {
  const certHash = createCanonicalHash(payload);
  const dataToSign = Buffer.from(certHash, 'utf8');

  // Sign with server's Ed25519 private key
  const signature = crypto.sign(null, dataToSign, config.issuerPrivateKey).toString('hex');

  return { certHash, signature };
}

export function verifyCertificateSignature(
  certificate: VerificationCertificate,
  publicKeyPem?: string
): { isValid: boolean; reason?: string } {
  try {
    const payload: CanonicalPayload = {
      certificateId: certificate.certificateId,
      walletAddress: certificate.walletAddress,
      network: certificate.network,
      outcome: certificate.outcome,
      riskScore: certificate.riskScore,
      assessmentTimestamp: certificate.assessmentTimestamp,
      expiryTimestamp: certificate.expiryTimestamp,
      hopDepth: certificate.hopDepth,
      riskListVersion: certificate.riskListVersion,
      issuerIdentity: certificate.issuerIdentity,
    };

    const expectedHash = createCanonicalHash(payload);
    if (expectedHash !== certificate.certHash) {
      return {
        isValid: false,
        reason: 'Certificate hash mismatch: Data has been tampered with or modified.',
      };
    }

    const keyToUse = publicKeyPem || certificate.issuerPublicKey || config.issuerPublicKey;
    const dataToVerify = Buffer.from(expectedHash, 'utf8');
    const signatureBuffer = Buffer.from(certificate.digitalSignature, 'hex');

    const isValid = crypto.verify(null, dataToVerify, keyToUse, signatureBuffer);
    if (!isValid) {
      return {
        isValid: false,
        reason: 'Cryptographic signature verification failed: Invalid digital signature for issuer key.',
      };
    }

    return { isValid: true };
  } catch (err: any) {
    return {
      isValid: false,
      reason: `Signature verification exception: ${err?.message || 'Malformed signature or key'}`,
    };
  }
}

