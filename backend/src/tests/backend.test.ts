import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../index.js';
import { FastifyInstance } from 'fastify';

describe('ClearPass Backend API & Risk Engine Test Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  /* -------------------------------------------------------------------------
     Health & Scenarios
     ------------------------------------------------------------------------- */
  it('GET /api/health returns system status and configuration', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.network).toBe('testnet');
    expect(body.issuerIdentity).toContain('ClearPass');
    expect(body.issuerPublicKey).toBeDefined();
    expect(body.riskListVersion).toBeDefined();
  });

  it('GET /api/scenarios returns 3 preconfigured demo scenarios', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/scenarios',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.scenarios.scenario_low_risk).toBeDefined();
    expect(body.scenarios.scenario_flagged).toBeDefined();
    expect(body.scenarios.scenario_inconclusive).toBeDefined();
  });

  /* -------------------------------------------------------------------------
     Scenario 1: Low-Risk Wallet -> APPROVED
     ------------------------------------------------------------------------- */
  it('POST /api/scan evaluates Low-Risk scenario as APPROVED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: 'alice-clean-demo.testnet',
        hopDepth: 2,
        scenarioOverride: 'scenario_low_risk',
        includeAiExplanation: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.assessment.outcome).toBe('APPROVED');
    expect(body.assessment.riskScore).toBeLessThan(25);
    expect(body.assessment.scope.dataCompleteness).toBe('COMPLETE');
    expect(body.assessment.summaryExplanation).toContain('APPROVED');
    expect(body.assessment.aiExplanation).toBeDefined();
  });

  /* -------------------------------------------------------------------------
     Scenario 2: Flagged Wallet -> REJECTED
     ------------------------------------------------------------------------- */
  it('POST /api/scan evaluates Flagged scenario as REJECTED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: 'charlie-compromised-demo.testnet',
        hopDepth: 2,
        scenarioOverride: 'scenario_flagged',
        includeAiExplanation: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.assessment.outcome).toBe('REJECTED');
    expect(body.assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(body.assessment.findings.length).toBeGreaterThan(0);
    expect(body.assessment.summaryExplanation).toContain('REJECTED');
  });

  /* -------------------------------------------------------------------------
     Scenario 3: Insufficient Information -> INCONCLUSIVE
     ------------------------------------------------------------------------- */
  it('POST /api/scan evaluates Insufficient Data scenario as INCONCLUSIVE', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: 'unknown-dormant-demo.testnet',
        hopDepth: 2,
        scenarioOverride: 'scenario_inconclusive',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.assessment.outcome).toBe('INCONCLUSIVE');
    expect(body.assessment.scope.dataCompleteness).toBe('INSUFFICIENT');
    expect(body.assessment.summaryExplanation).toContain('INCONCLUSIVE');
  });

  /* -------------------------------------------------------------------------
     Input Validation
     ------------------------------------------------------------------------- */
  it('POST /api/scan rejects missing walletAddress with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: '',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
  });

  /* -------------------------------------------------------------------------
     Certificates: Issue, Retrieve, Verify, Revoke
     ------------------------------------------------------------------------- */
  let issuedCertId = '';

  it('POST /api/certificates/issue creates a signed certificate', async () => {
    // First generate an assessment
    const scanRes = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: 'alice-clean-demo.testnet',
        scenarioOverride: 'scenario_low_risk',
      },
    });
    const scanData = JSON.parse(scanRes.body);

    const issueRes = await app.inject({
      method: 'POST',
      url: '/api/certificates/issue',
      payload: {
        assessmentResult: scanData.assessment,
      },
    });

    expect(issueRes.statusCode).toBe(200);
    const issueBody = JSON.parse(issueRes.body);
    expect(issueBody.success).toBe(true);
    expect(issueBody.certificate.certificateId).toBeDefined();
    expect(issueBody.certificate.digitalSignature).toBeDefined();
    expect(issueBody.certificate.certHash).toBeDefined();
    expect(issueBody.certificate.outcome).toBe('APPROVED');

    issuedCertId = issueBody.certificate.certificateId;
  });

  it('GET /api/certificates/:id retrieves the created certificate', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/certificates/${issuedCertId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.certificate.certificateId).toBe(issuedCertId);
  });

  it('POST /api/certificates/verify confirms valid unrevoked certificate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/certificates/verify',
      payload: {
        certificateId: issuedCertId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.isValid).toBe(true);
    expect(body.status).toBe('VALID');
  });

  it('POST /api/certificates/revoke revokes an active certificate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/certificates/revoke',
      payload: {
        certificateId: issuedCertId,
        reason: 'Holder reported potential key compromise',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.certificate.revoked).toBe(true);

    // Verify should now return REVOKED
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/certificates/verify',
      payload: {
        certificateId: issuedCertId,
      },
    });
    const verifyBody = JSON.parse(verifyRes.body);
    expect(verifyBody.isValid).toBe(false);
    expect(verifyBody.status).toBe('REVOKED');
  });

  /* -------------------------------------------------------------------------
     Auditor Portal & Selective Disclosure
     ------------------------------------------------------------------------- */
  it('Creates encrypted selective disclosure package and decrypts it with access code', async () => {
    // 1. Issue a new clean certificate
    const scanRes = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {
        walletAddress: 'alice-clean-demo.testnet',
        scenarioOverride: 'scenario_low_risk',
      },
    });
    const certRes = await app.inject({
      method: 'POST',
      url: '/api/certificates/issue',
      payload: {
        assessmentResult: JSON.parse(scanRes.body).assessment,
      },
    });
    const testCertId = JSON.parse(certRes.body).certificate.certificateId;

    // 2. Share with auditor
    const shareRes = await app.inject({
      method: 'POST',
      url: '/api/auditor/share',
      payload: {
        certificateId: testCertId,
        recipientName: 'DeFi Compliance Auditor Corp',
        expiresInDays: 5,
        accessCode: 'AUDIT-PASS-2026',
        permissions: {
          discloseOutcome: true,
          discloseRiskScore: true,
          discloseScopeAndHopDepth: true,
          discloseFindingsSummary: true,
          discloseRawCounterparties: false,
        },
      },
    });

    expect(shareRes.statusCode).toBe(200);
    const shareBody = JSON.parse(shareRes.body);
    expect(shareBody.share.shareId).toBeDefined();
    expect(shareBody.accessCode).toBe('AUDIT-PASS-2026');

    // 3. Inspect with incorrect access code -> 403
    const badInspect = await app.inject({
      method: 'POST',
      url: '/api/auditor/inspect',
      payload: {
        shareId: shareBody.share.shareId,
        accessCode: 'WRONG-PASS',
      },
    });
    expect(badInspect.statusCode).toBe(403);

    // 4. Inspect with correct access code -> 200 and decrypted data
    const goodInspect = await app.inject({
      method: 'POST',
      url: '/api/auditor/inspect',
      payload: {
        shareId: shareBody.share.shareId,
        accessCode: 'AUDIT-PASS-2026',
      },
    });
    expect(goodInspect.statusCode).toBe(200);
    const inspectBody = JSON.parse(goodInspect.body);
    expect(inspectBody.decryptedReport.outcome).toBe('APPROVED');
    expect(inspectBody.decryptedReport.confidentialityNotice).toBeDefined();
  });

  /* -------------------------------------------------------------------------
     Activity & Contract Info
     ------------------------------------------------------------------------- */
  it('GET /api/activity returns populated activity log', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/activity',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.activity.length).toBeGreaterThan(0);
  });

  it('GET /api/contract/info returns NEAR contract methods and wasm path', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/contract/info',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.contractId).toBeDefined();
    expect(body.methods.view).toContain('verify_pass');
    expect(body.methods.change).toContain('issue_pass');
  });
});

