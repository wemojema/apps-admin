package com.wemojema.apps.admin.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record TenantStatus(
        String tenantId,
        String senderDomain,
        String dkimStatus,
        boolean verifiedForSending) {
}
