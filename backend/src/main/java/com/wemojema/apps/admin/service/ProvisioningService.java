package com.wemojema.apps.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wemojema.apps.admin.model.Tenant;
import io.micronaut.context.annotation.Value;
import jakarta.inject.Singleton;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Enqueues tenant DNS + email provisioning on the cross-account org-control provisioning queue.
 * org-control's provisioner Lambda consumes the messages and runs CREATE_AUTH_CNAME /
 * PROVISION_TENANT_EMAIL (only it has the Route53 / assumed-admin access). Failures retry to a DLQ.
 */
@Singleton
public class ProvisioningService {

    private final SqsClient sqs;
    private final String queueUrl;
    private final String authAccountId;
    private final String authCfDomain;
    private final ObjectMapper json = new ObjectMapper();

    public ProvisioningService(SqsClient sqs,
                               @Value("${wemojema.provisioning.queue-url}") String queueUrl,
                               @Value("${wemojema.provisioning.auth-account-id}") String authAccountId,
                               @Value("${wemojema.provisioning.auth-cf-domain}") String authCfDomain) {
        this.sqs = sqs;
        this.queueUrl = queueUrl;
        this.authAccountId = authAccountId;
        this.authCfDomain = authCfDomain;
    }

    /** Enqueue CREATE_AUTH_CNAME (auth subdomain) + PROVISION_TENANT_EMAIL (sender domain) for a tenant. */
    public void provision(Tenant tenant) {
        Map<String, Object> cname = new LinkedHashMap<>();
        cname.put("operation", "CREATE_AUTH_CNAME");
        cname.put("tenantId", authLabel(tenant.tenantId()));
        cname.put("cfDomain", authCfDomain);
        send(cname);

        String senderDomain = domainOf(tenant.senderEmail());
        if (senderDomain != null && !senderDomain.isBlank()) {
            Map<String, Object> email = new LinkedHashMap<>();
            email.put("operation", "PROVISION_TENANT_EMAIL");
            email.put("authAccountId", authAccountId);
            email.put("rootDomain", senderDomain);
            send(email);
        }
    }

    private void send(Map<String, Object> msg) {
        String body;
        try {
            body = json.writeValueAsString(msg);
        } catch (Exception e) {
            throw new RuntimeException("Failed to enqueue provisioning message", e);
        }
        sqs.sendMessage(b -> b.queueUrl(queueUrl).messageBody(body));
    }

    /** "foo.auth.wemojema.com" -> "foo" (the CNAME label CREATE_AUTH_CNAME expects). */
    static String authLabel(String tenantId) {
        int i = tenantId.indexOf(".auth.");
        return i > 0 ? tenantId.substring(0, i) : tenantId;
    }

    static String domainOf(String email) {
        if (email == null) {
            return null;
        }
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at + 1) : email;
    }
}
