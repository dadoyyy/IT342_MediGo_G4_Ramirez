CREATE TABLE IF NOT EXISTS doctor_specialization_change_requests (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    current_specialization VARCHAR(500) NOT NULL,
    requested_specialization VARCHAR(500) NOT NULL,
    reason VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMP NULL,
    CONSTRAINT fk_doc_spec_change_doctor
        FOREIGN KEY (doctor_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_spec_change_status
    ON doctor_specialization_change_requests(status);

CREATE INDEX IF NOT EXISTS idx_doc_spec_change_doctor
    ON doctor_specialization_change_requests(doctor_id);
