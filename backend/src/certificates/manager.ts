import crypto from 'node:crypto';
import { config } from '../config.js';
import { AssessmentResult, VerificationCertificate } from '../types/index.js';
import { CanonicalPayload, signCertificatePayload, verifyCertificateSignature } from './signer.js';

// In-memory store of issued certificates
const certificateStore = new Map<string, VerificationCertificate>();

export function issueCertificate(assessment: AssessmentResult): VerificationCertificate {
  const certificateId = `cp_cert_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.defaultCertValidityDays * 24 * 60 * 60 * 1000);

  const payload: CanonicalPayload = {
    certificateId,
    walletAddress: assessment.walletAddress,
    network: assessment.network,
    outcome: assessment.outcome,
    riskScore: assessment.riskScore,
    assessmentTimestamp: assessment.assessmentTimestamp,
    expiryTimestamp: expiresAt.toISOString(),
    hopDepth: assessment.scope.maxHopDepth,
    riskListVersion: assessment.riskListVersion,
    issuerIdentity: config.issuerName,
  };

  const { certHash, signature } = signCertificatePayload(payload);

  // Compute simulated or prospective on-chain record transaction hash
  const onChainTxHash = `near_tx_${crypto.createHash('sha256').update(certificateId + certHash).digest('hex').substring(0, 44)}`;

  const certificate: VerificationCertificate = {
    certificateId,
    walletAddress: assessment.walletAddress,
    network: assessment.network,
    outcome: assessment.outcome,
    riskScore: assessment.riskScore,
    assessmentTimestamp: assessment.assessmentTimestamp,
    expiryTimestamp: expiresAt.toISOString(),
    assessmentScope: assessment.scope,
    hopDepth: assessment.scope.maxHopDepth,
    riskListVersion: assessment.riskListVersion,
    issuerIdentity: config.issuerName,
    issuerPublicKey: config.issuerPublicKey,
    certHash,
    digitalSignature: signature,
    onChainTxHash,
    onChainContractId: config.nearContractId,
    revoked: false,
    attestationReference: {
      type: 'ed25519_signature',
      status: 'ACTIVE_DIGITAL_SIGNATURE',
      note: 'Cryptographically signed via Ed25519 authority key. Transparent digital signature verification. Hardware TEE not enabled in this deployment.',
    },
  };

  certificateStore.set(certificateId, certificate);
  return certificate;
}

export function getCertificateById(certificateId: string): VerificationCertificate | undefined {
  return certificateStore.get(certificateId);
}

export function getAllCertificates(): VerificationCertificate[] {
  return Array.from(certificateStore.values()).sort(
    (a, b) => new Date(b.assessmentTimestamp).getTime() - new Date(a.assessmentTimestamp).getTime()
  );
}

export function verifyCertificate(certificateId: string): {
  isValid: boolean;
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'INVALID_SIGNATURE';
  certificate?: VerificationCertificate;
  reason?: string;
} {
  const cert = certificateStore.get(certificateId);
  if (!cert) {
    return {
      isValid: false,
      status: 'NOT_FOUND',
      reason: `Certificate '${certificateId}' was not found in the registry.`,
    };
  }

  // 1. Check revocation
  if (cert.revoked) {
    return {
      isValid: false,
      status: 'REVOKED',
      certificate: cert,
      reason: `Certificate was revoked on ${cert.revokedAt || 'prior date'}. Reason: ${cert.revocationReason || 'Unspecified'}`,
    };
  }

  // 2. Check expiration
  const now = new Date();
  const expiry = new Date(cert.expiryTimestamp);
  if (now > expiry) {
    return {
      isValid: false,
      status: 'EXPIRED',
      certificate: cert,
      reason: `Certificate expired on ${cert.expiryTimestamp}.`,
    };
  }

  // 3. Check digital signature
  const sigCheck = verifyCertificateSignature(cert);
  if (!sigCheck.isValid) {
    return {
      isValid: false,
      status: 'INVALID_SIGNATURE',
      certificate: cert,
      reason: sigCheck.reason,
    };
  }

  return {
    isValid: true,
    status: 'VALID',
    certificate: cert,
    reason: 'Certificate is valid, unrevoked, unexpired, and signature verified by issuer authority.',
  };
}

export function revokeCertificate(
  certificateId: string,
  reason: string
): { success: boolean; certificate?: VerificationCertificate; error?: string } {
  const cert = certificateStore.get(certificateId);
  if (!cert) {
    return { success: false, error: 'Certificate not found' };
  }

  if (cert.revoked) {
    return { success: false, error: 'Certificate is already revoked', certificate: cert };
  }

  cert.revoked = true;
  cert.revocationReason = reason || 'Revoked by authorized issuer or certificate holder.';
  cert.revokedAt = new Date().toISOString();

  certificateStore.set(certificateId, cert);
  return { success: true, certificate: cert };
}

