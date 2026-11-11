import {
  AssessmentResult,
  VerificationCertificate,
  SelectiveDisclosurePackage,
  SelectiveDisclosurePermissions,
  ActivityLogEntry,
  DemoScenario,
} from '../types/index.js';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchScenarios(): Promise<Record<string, DemoScenario>> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error(`Failed to load scenarios: HTTP ${res.status}`);
  const data = await res.json();
  return data.scenarios;
}

export async function scanWallet(
  walletAddress: string,
  hopDepth: number = 2,
  scenarioOverride?: string,
  includeAiExplanation: boolean = true
): Promise<AssessmentResult> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      hopDepth,
      scenarioOverride,
      includeAiExplanation,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to scan wallet');
  }
  return data.assessment;
}

export async function issueCertificate(assessmentResult: AssessmentResult): Promise<VerificationCertificate> {
  const res = await fetch(`${API_BASE}/certificates/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentResult }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to issue certificate');
  }
  return data.certificate;
}

export async function fetchCertificates(): Promise<VerificationCertificate[]> {
  const res = await fetch(`${API_BASE}/certificates`);
  if (!res.ok) throw new Error('Failed to fetch certificates');
  const data = await res.json();
  return data.certificates || [];
}

export async function fetchCertificateById(certificateId: string): Promise<VerificationCertificate> {
  const res = await fetch(`${API_BASE}/certificates/${certificateId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Certificate not found');
  }
  return data.certificate;
}

export async function verifyCertificateOnServer(certificateId: string): Promise<{
  isValid: boolean;
  status: string;
  certificate?: VerificationCertificate;
  reason?: string;
}> {
  const res = await fetch(`${API_BASE}/certificates/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificateId }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Verification request failed');
  }
  return data;
}

export async function revokeCertificateOnServer(
  certificateId: string,
  reason: string
): Promise<VerificationCertificate> {
  const res = await fetch(`${API_BASE}/certificates/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificateId, reason }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to revoke certificate');
  }
  return data.certificate;
}

export async function createAuditorShare(
  certificateId: string,
  recipientName: string,
  expiresInDays: number,
  permissions: SelectiveDisclosurePermissions,
  accessCode?: string
): Promise<{ share: SelectiveDisclosurePackage; accessCode: string }> {
  const res = await fetch(`${API_BASE}/auditor/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      certificateId,
      recipientName,
      expiresInDays,
      permissions,
      accessCode,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate auditor share');
  }
  return { share: data.share, accessCode: data.accessCode };
}

export async function fetchAuditorShares(): Promise<SelectiveDisclosurePackage[]> {
  const res = await fetch(`${API_BASE}/auditor/shares`);
  if (!res.ok) throw new Error('Failed to load auditor shares');
  const data = await res.json();
  return data.shares || [];
}

export async function inspectAuditorShare(
  shareId: string,
  accessCode: string
): Promise<{ share: SelectiveDisclosurePackage; decryptedReport: Record<string, any> }> {
  const res = await fetch(`${API_BASE}/auditor/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareId, accessCode }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to inspect auditor share');
  }
  return { share: data.share, decryptedReport: data.decryptedReport };
}

export async function revokeAuditorShare(shareId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auditor/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareId }),
  });
  const data = await res.json();
  return !!data.success;
}

export async function fetchActivity(): Promise<ActivityLogEntry[]> {
  const res = await fetch(`${API_BASE}/activity`);
  if (!res.ok) throw new Error('Failed to load activity');
  const data = await res.json();
  return data.activity || [];
}

export async function fetchContractInfo(): Promise<any> {
  const res = await fetch(`${API_BASE}/contract/info`);
  if (!res.ok) throw new Error('Failed to load contract info');
  return res.json();
}

