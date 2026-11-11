import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { loadRiskData, getDemoScenarios } from './risk-engine/flagged-data.js';
import { assessWalletRisk } from './risk-engine/engine.js';
import { generateAiExplanation } from './ai/explainer.js';
import {
  issueCertificate,
  getCertificateById,
  getAllCertificates,
  verifyCertificate,
  revokeCertificate,
} from './certificates/manager.js';
import {
  createSelectiveDisclosureShare,
  inspectSelectiveDisclosureShare,
  revokeSelectiveDisclosureShare,
  getAllShares,
} from './auditor/selective-disclosure.js';
import { logActivity, getActivityLogs } from './services/activity.js';

export function buildServer() {
  const server = Fastify({
    logger: false,
  });

  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Global Error Handler
  server.setErrorHandler((error, request, reply) => {
    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  });

  /* =========================================================================
     HEALTH & SCENARIOS
     ========================================================================= */

  server.get('/api/health', async () => {
    const riskData = loadRiskData();
    return {
      status: 'ok',
      service: 'ClearPass Verification API',
      version: '1.0.0',
      network: config.nearNetwork,
      contractId: config.nearContractId,
      rpcUrl: config.nearRpcUrl,
      issuerIdentity: config.issuerName,
      issuerPublicKey: config.issuerPublicKey,
      riskListVersion: riskData.version,
      aiModel: config.aiApiKey ? 'openai/gpt-4o-mini' : 'deterministic-fallback',
      timestamp: new Date().toISOString(),
    };
  });

  server.get('/api/scenarios', async () => {
    const scenarios = getDemoScenarios();
    return {
      success: true,
      scenarios,
    };
  });

  /* =========================================================================
     RISK SCANNER
     ========================================================================= */

  server.post<{
    Body: {
      walletAddress: string;
      hopDepth?: number;
      scenarioOverride?: string;
      includeAiExplanation?: boolean;
    };
  }>('/api/scan', async (request, reply) => {
    const { walletAddress, hopDepth = 2, scenarioOverride, includeAiExplanation = false } = request.body || {};

    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.trim()) {
      return reply.status(400).send({
        success: false,
        error: 'walletAddress is required and must be a valid account string.',
      });
    }

    const assessment = await assessWalletRisk(walletAddress.trim(), hopDepth, scenarioOverride);

    if (includeAiExplanation) {
      assessment.aiExplanation = await generateAiExplanation(assessment);
    }

    logActivity({
      type: 'SCAN_EXECUTED',
      walletAddress: assessment.walletAddress,
      outcome: assessment.outcome,
      details: `Scanned wallet ${assessment.walletAddress} across ${assessment.scope.maxHopDepth} hops: Outcome ${assessment.outcome} (Risk Score: ${assessment.riskScore}).`,
    });

    return {
      success: true,
      assessment,
    };
  });

  /* =========================================================================
     CERTIFICATES
     ========================================================================= */

  server.post<{
    Body: {
      assessmentResult: any;
    };
  }>('/api/certificates/issue', async (request, reply) => {
    const { assessmentResult } = request.body || {};

    if (!assessmentResult || !assessmentResult.walletAddress || !assessmentResult.outcome) {
      return reply.status(400).send({
        success: false,
        error: 'Valid assessmentResult object is required to issue a verification certificate.',
      });
    }

    const certificate = issueCertificate(assessmentResult);

    logActivity({
      type: 'CERTIFICATE_ISSUED',
      walletAddress: certificate.walletAddress,
      outcome: certificate.outcome,
      certificateId: certificate.certificateId,
      details: `Issued cryptographically signed certificate ${certificate.certificateId} for ${certificate.walletAddress}.`,
    });

    return {
      success: true,
      certificate,
    };
  });

  server.get('/api/certificates', async () => {
    const certificates = getAllCertificates();
    return {
      success: true,
      count: certificates.length,
      certificates,
    };
  });

  server.get<{
    Params: { id: string };
  }>('/api/certificates/:id', async (request, reply) => {
    const { id } = request.params;
    const cert = getCertificateById(id);
    if (!cert) {
      return reply.status(404).send({
        success: false,
        error: `Certificate '${id}' not found.`,
      });
    }
    return {
      success: true,
      certificate: cert,
    };
  });

  server.post<{
    Body: {
      certificateId: string;
    };
  }>('/api/certificates/verify', async (request, reply) => {
    const { certificateId } = request.body || {};
    if (!certificateId) {
      return reply.status(400).send({
        success: false,
        error: 'certificateId is required for verification.',
      });
    }

    const result = verifyCertificate(certificateId);

    logActivity({
      type: 'CERTIFICATE_VERIFIED',
      walletAddress: result.certificate?.walletAddress || 'unknown',
      certificateId,
      details: `Verification query for ${certificateId}: Result ${result.status} (Valid: ${result.isValid}).`,
    });

    return {
      success: true,
      ...result,
    };
  });

  server.post<{
    Body: {
      certificateId: string;
      reason: string;
    };
  }>('/api/certificates/revoke', async (request, reply) => {
    const { certificateId, reason } = request.body || {};
    if (!certificateId) {
      return reply.status(400).send({
        success: false,
        error: 'certificateId is required to revoke a certificate.',
      });
    }

    const result = revokeCertificate(certificateId, reason);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: result.error,
      });
    }

    logActivity({
      type: 'CERTIFICATE_REVOKED',
      walletAddress: result.certificate?.walletAddress || 'unknown',
      certificateId,
      details: `Revoked certificate ${certificateId}. Reason: ${reason || 'Unspecified'}`,
    });

    return {
      success: true,
      certificate: result.certificate,
    };
  });

  /* =========================================================================
     AUDITOR PORTAL / SELECTIVE DISCLOSURE
     ========================================================================= */

  server.post<{
    Body: {
      certificateId: string;
      recipientName: string;
      expiresInDays?: number;
      permissions: any;
      accessCode?: string;
    };
  }>('/api/auditor/share', async (request, reply) => {
    const { certificateId, recipientName, expiresInDays = 7, permissions, accessCode } = request.body || {};

    if (!certificateId || !recipientName) {
      return reply.status(400).send({
        success: false,
        error: 'certificateId and recipientName are required.',
      });
    }

    try {
      const shareResult = createSelectiveDisclosureShare({
        certificateId,
        recipientName,
        expiresInDays,
        permissions: permissions || {
          discloseOutcome: true,
          discloseRiskScore: true,
          discloseScopeAndHopDepth: true,
          discloseFindingsSummary: true,
          discloseRawCounterparties: false,
        },
        accessCode,
      });

      logActivity({
        type: 'AUDITOR_SHARE_CREATED',
        walletAddress: shareResult.share.walletAddress,
        certificateId,
        details: `Created encrypted selective disclosure package for recipient '${recipientName}' (Share ID: ${shareResult.share.shareId}).`,
      });

      return {
        success: true,
        share: shareResult.share,
        accessCode: shareResult.accessCode,
      };
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: err.message,
      });
    }
  });

  server.get('/api/auditor/shares', async () => {
    const shares = getAllShares();
    return {
      success: true,
      count: shares.length,
      shares,
    };
  });

  server.post<{
    Body: {
      shareId: string;
      accessCode: string;
    };
  }>('/api/auditor/inspect', async (request, reply) => {
    const { shareId, accessCode } = request.body || {};
    if (!shareId || !accessCode) {
      return reply.status(400).send({
        success: false,
        error: 'Both shareId and accessCode are required to inspect selective disclosure reports.',
      });
    }

    const result = inspectSelectiveDisclosureShare(shareId, accessCode);
    if (!result.success) {
      return reply.status(403).send({
        success: false,
        error: result.error,
      });
    }

    return {
      success: true,
      share: result.share,
      decryptedReport: result.decryptedData,
    };
  });

  server.post<{
    Body: {
      shareId: string;
    };
  }>('/api/auditor/revoke', async (request, reply) => {
    const { shareId } = request.body || {};
    if (!shareId) {
      return reply.status(400).send({ success: false, error: 'shareId is required' });
    }
    const revoked = revokeSelectiveDisclosureShare(shareId);
    return { success: revoked };
  });

  /* =========================================================================
     ACTIVITY & CONTRACT INFO
     ========================================================================= */

  server.get('/api/activity', async () => {
    const activity = getActivityLogs();
    return {
      success: true,
      activity,
    };
  });

  server.get('/api/contract/info', async () => {
    return {
      success: true,
      contractId: config.nearContractId,
      network: config.nearNetwork,
      wasmPath: 'contracts/target/wasm32-unknown-unknown/release/clearpass_contract.wasm',
      methods: {
        change: ['register_issuer', 'revoke_issuer', 'issue_pass', 'revoke_pass'],
        view: ['verify_pass', 'get_pass', 'get_issuers', 'is_issuer', 'get_owner'],
      },
      deploymentInstructions: 'See DEPLOYMENT.md for step-by-step testnet deployment via near-cli-rs or Web3 wallet.',
    };
  });

  return server;
}

// Start server if executed directly
if (process.argv[1] && process.argv[1].endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const app = buildServer();
  app.listen({ port: config.port, host: config.host }, (err, address) => {
    if (err) {
      console.error('[ClearPass Server] Error starting server:', err);
      process.exit(1);
    }
    console.log(`[ClearPass Server] Listening on ${address}`);
    console.log(`[ClearPass Server] NEAR Network: ${config.nearNetwork}`);
    console.log(`[ClearPass Server] Contract ID: ${config.nearContractId}`);
  });
}

