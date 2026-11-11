use near_sdk::store::{IterableSet, LookupMap};
use near_sdk::{env, near, AccountId, PanicOnDefault};

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct PassRecord {
    pub certificate_id: String,
    pub subject_account_id: AccountId,
    pub outcome: String,
    pub risk_score: u8,
    pub risk_list_version: String,
    pub issued_at_ns: u64,
    pub expires_at_ns: u64,
    pub cert_hash: String,
    pub issuer_account_id: AccountId,
    pub revoked: bool,
    pub revocation_reason: Option<String>,
}

#[near(serializers = [json])]
pub struct PassVerificationResult {
    pub is_valid: bool,
    pub status: String, // "VALID", "EXPIRED", "REVOKED", "NOT_FOUND"
    pub record: Option<PassRecord>,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub authorized_issuers: IterableSet<AccountId>,
    pub passes: LookupMap<String, PassRecord>,
}

#[near]
impl Contract {
    #[init]
    pub fn new(owner_id: Option<AccountId>) -> Self {
        let owner = owner_id.unwrap_or_else(env::predecessor_account_id);
        let mut issuers = IterableSet::new(b"i");
        // By default, the owner is also an authorized issuer
        issuers.insert(owner.clone());

        Self {
            owner_id: owner,
            authorized_issuers: issuers,
            passes: LookupMap::new(b"p"),
        }
    }

    /* =========================================================================
       ADMIN / ISSUER MANAGEMENT
       ========================================================================= */

    pub fn register_issuer(&mut self, issuer_account_id: AccountId) {
        self.assert_owner();
        if self.authorized_issuers.contains(&issuer_account_id) {
            env::panic_str("Issuer already registered");
        }
        self.authorized_issuers.insert(issuer_account_id);
    }

    pub fn revoke_issuer(&mut self, issuer_account_id: AccountId) {
        self.assert_owner();
        if issuer_account_id == self.owner_id {
            env::panic_str("Cannot revoke contract owner issuer status");
        }
        let removed = self.authorized_issuers.remove(&issuer_account_id);
        if !removed {
            env::panic_str("Issuer not found");
        }
    }

    pub fn get_issuers(&self) -> Vec<AccountId> {
        self.authorized_issuers.iter().cloned().collect()
    }

    pub fn is_issuer(&self, account_id: AccountId) -> bool {
        self.authorized_issuers.contains(&account_id)
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner_id.clone()
    }

    /* =========================================================================
       CERTIFICATE / PASS MANAGEMENT
       ========================================================================= */

    pub fn issue_pass(
        &mut self,
        certificate_id: String,
        subject_account_id: AccountId,
        outcome: String,
        risk_score: u8,
        risk_list_version: String,
        expires_at_ns: u64,
        cert_hash: String,
    ) {
        let caller = env::predecessor_account_id();
        if !self.authorized_issuers.contains(&caller) {
            env::panic_str("Unauthorized: caller is not an authorized issuer");
        }

        if certificate_id.trim().is_empty() {
            env::panic_str("Certificate ID cannot be empty");
        }

        if self.passes.contains_key(&certificate_id) {
            env::panic_str("Duplicate certificate ID: certificate already exists");
        }

        let valid_outcome = outcome == "APPROVED" || outcome == "REJECTED" || outcome == "INCONCLUSIVE";
        if !valid_outcome {
            env::panic_str("Invalid outcome: must be APPROVED, REJECTED, or INCONCLUSIVE");
        }

        if risk_score > 100 {
            env::panic_str("Invalid risk score: must be between 0 and 100");
        }

        let current_time_ns = env::block_timestamp();
        if expires_at_ns <= current_time_ns {
            env::panic_str("Expiration time must be in the future");
        }

        let record = PassRecord {
            certificate_id: certificate_id.clone(),
            subject_account_id,
            outcome,
            risk_score,
            risk_list_version,
            issued_at_ns: current_time_ns,
            expires_at_ns,
            cert_hash,
            issuer_account_id: caller,
            revoked: false,
            revocation_reason: None,
        };

        self.passes.insert(certificate_id, record);
    }

    pub fn revoke_pass(&mut self, certificate_id: String, reason: String) {
        let caller = env::predecessor_account_id();
        let pass = self.passes.get_mut(&certificate_id);
        match pass {
            None => env::panic_str("Certificate not found"),
            Some(record) => {
                let is_owner = caller == self.owner_id;
                let is_issuer = caller == record.issuer_account_id;
                if !is_owner && !is_issuer {
                    env::panic_str("Unauthorized: caller must be contract owner or original issuer");
                }
                if record.revoked {
                    env::panic_str("Certificate is already revoked");
                }
                record.revoked = true;
                record.revocation_reason = Some(reason);
            }
        }
    }

    /* =========================================================================
       VIEW METHODS
       ========================================================================= */

    pub fn get_pass(&self, certificate_id: String) -> Option<PassRecord> {
        self.passes.get(&certificate_id).cloned()
    }

    pub fn verify_pass(&self, certificate_id: String) -> PassVerificationResult {
        match self.passes.get(&certificate_id) {
            None => PassVerificationResult {
                is_valid: false,
                status: "NOT_FOUND".to_string(),
                record: None,
            },
            Some(record) => {
                let current_time_ns = env::block_timestamp();
                if record.revoked {
                    PassVerificationResult {
                        is_valid: false,
                        status: "REVOKED".to_string(),
                        record: Some(record.clone()),
                    }
                } else if record.expires_at_ns <= current_time_ns {
                    PassVerificationResult {
                        is_valid: false,
                        status: "EXPIRED".to_string(),
                        record: Some(record.clone()),
                    }
                } else {
                    PassVerificationResult {
                        is_valid: true,
                        status: "VALID".to_string(),
                        record: Some(record.clone()),
                    }
                }
            }
        }
    }

    /* =========================================================================
       INTERNAL HELPERS
       ========================================================================= */

    fn assert_owner(&self) {
        if env::predecessor_account_id() != self.owner_id {
            env::panic_str("Unauthorized: only contract owner can perform this action");
        }
    }
}
