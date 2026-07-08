package com.wemojema.apps.admin.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record SesAccountStatus(
        boolean productionAccessEnabled,
        String enforcementStatus,
        double max24HourSend,
        double maxSendRate,
        double sentLast24Hours) {
}
