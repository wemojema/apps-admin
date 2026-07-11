package com.wemojema.apps.admin.service;

import com.wemojema.apps.admin.model.SesAccountStatus;
import com.wemojema.apps.admin.model.TenantStatus;
import jakarta.inject.Singleton;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.GetAccountResponse;
import software.amazon.awssdk.services.sesv2.model.GetEmailIdentityResponse;
import software.amazon.awssdk.services.sesv2.model.NotFoundException;
import software.amazon.awssdk.services.sesv2.model.SendQuota;

/** Reads SES DKIM/verification status for a tenant's sender domain and the account sandbox status. */
@Singleton
public class SesStatusService {

    private final SesV2Client ses;

    public SesStatusService(SesV2Client ses) {
        this.ses = ses;
    }

    public TenantStatus tenantStatus(String tenantId, String senderEmail) {
        String domain = domainOf(senderEmail);
        if (domain == null) {
            return new TenantStatus(tenantId, null, "UNKNOWN", false);
        }
        try {
            GetEmailIdentityResponse r = ses.getEmailIdentity(b -> b.emailIdentity(domain));
            String dkim = r.dkimAttributes() == null ? "UNKNOWN" : r.dkimAttributes().statusAsString();
            boolean verified = Boolean.TRUE.equals(r.verifiedForSendingStatus());
            return new TenantStatus(tenantId, domain, dkim, verified);
        } catch (NotFoundException e) {
            return new TenantStatus(tenantId, domain, "NOT_STARTED", false);
        } catch (SdkException e) {
            // e.g. ses:GetEmailIdentity denied by the permission boundary — degrade, don't 500.
            return new TenantStatus(tenantId, domain, "UNAVAILABLE", false);
        }
    }

    public SesAccountStatus accountStatus() {
        try {
            GetAccountResponse a = ses.getAccount(b -> {
            });
            SendQuota q = a.sendQuota();
            return new SesAccountStatus(
                    Boolean.TRUE.equals(a.productionAccessEnabled()),
                    a.enforcementStatus(),
                    d(q == null ? null : q.max24HourSend()),
                    d(q == null ? null : q.maxSendRate()),
                    d(q == null ? null : q.sentLast24Hours()));
        } catch (SdkException e) {
            // ses:GetAccount is denied by the ApplicationRolePermissionBoundary — degrade, don't 500.
            return new SesAccountStatus(false, "UNAVAILABLE", 0.0, 0.0, 0.0);
        }
    }

    private static double d(Double value) {
        return value == null ? 0.0 : value;
    }

    private static String domainOf(String email) {
        if (email == null) {
            return null;
        }
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at + 1) : email;
    }
}
