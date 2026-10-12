// Inert owner setup records only. No authority, journal, timer, provider call or standing consent.
export const migration22 = `
CREATE TABLE investment_setup_previews(preview_id TEXT PRIMARY KEY,digest TEXT NOT NULL,input TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE investment_setup_receipts(receipt_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE investment_private_runs(run_id TEXT PRIMARY KEY REFERENCES investment_runs,preview_id TEXT NOT NULL REFERENCES investment_setup_previews,configuration_hash TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE investment_finite_reservations(execution_id TEXT PRIMARY KEY REFERENCES executions,binding TEXT NOT NULL);
CREATE TABLE investment_finite_controls(receipt_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TRIGGER investment_finite_control_immutable BEFORE UPDATE ON investment_finite_controls BEGIN SELECT RAISE(ABORT,'Finite owner receipt immutable'); END;
CREATE TRIGGER investment_finite_control_retained BEFORE DELETE ON investment_finite_controls BEGIN SELECT RAISE(ABORT,'Finite owner receipt retained'); END;
CREATE TRIGGER investment_setup_preview_immutable BEFORE UPDATE ON investment_setup_previews BEGIN SELECT RAISE(ABORT,'Setup preview immutable'); END;
CREATE TRIGGER investment_setup_preview_retained BEFORE DELETE ON investment_setup_previews BEGIN SELECT RAISE(ABORT,'Setup preview retained'); END;
CREATE TRIGGER investment_setup_receipt_immutable BEFORE UPDATE ON investment_setup_receipts BEGIN SELECT RAISE(ABORT,'Setup receipt immutable'); END;
CREATE TRIGGER investment_setup_receipt_retained BEFORE DELETE ON investment_setup_receipts BEGIN SELECT RAISE(ABORT,'Setup receipt retained'); END;
CREATE TRIGGER investment_private_run_immutable BEFORE UPDATE ON investment_private_runs BEGIN SELECT RAISE(ABORT,'Private run immutable'); END;
CREATE TRIGGER investment_private_run_retained BEFORE DELETE ON investment_private_runs BEGIN SELECT RAISE(ABORT,'Private run retained'); END;
CREATE TRIGGER investment_finite_reservation_immutable BEFORE UPDATE ON investment_finite_reservations BEGIN SELECT RAISE(ABORT,'Finite reservation immutable'); END;
CREATE TRIGGER investment_finite_reservation_retained BEFORE DELETE ON investment_finite_reservations BEGIN SELECT RAISE(ABORT,'Finite reservation retained'); END;
`;
