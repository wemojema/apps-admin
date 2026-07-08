package com.wemojema.apps.admin.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Tenant(
        String tenantId,
        String appName,
        String frontendUrl,
        String senderEmail,
        String senderName,
        String clientId,
        String clientRedirectUri) {
}
