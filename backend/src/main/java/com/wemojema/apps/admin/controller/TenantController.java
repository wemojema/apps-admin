package com.wemojema.apps.admin.controller;

import com.wemojema.apps.admin.model.Tenant;
import com.wemojema.apps.admin.model.TenantStatus;
import com.wemojema.apps.admin.service.ProvisioningService;
import com.wemojema.apps.admin.service.SesStatusService;
import com.wemojema.apps.admin.service.TenantService;
import com.wemojema.auth.WemojemaSecured;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Put;

import java.util.List;

@WemojemaSecured
@Controller("/api/v1/tenants")
public class TenantController {

    private final TenantService tenants;
    private final SesStatusService ses;
    private final ProvisioningService provisioning;

    public TenantController(TenantService tenants, SesStatusService ses, ProvisioningService provisioning) {
        this.tenants = tenants;
        this.ses = ses;
        this.provisioning = provisioning;
    }

    @Get
    public List<Tenant> list() {
        return tenants.list();
    }

    @Get("/{tenantId}")
    public HttpResponse<Tenant> get(@PathVariable String tenantId) {
        return tenants.get(tenantId).map(HttpResponse::ok).orElseGet(HttpResponse::notFound);
    }

    @Put("/{tenantId}")
    public Tenant upsert(@PathVariable String tenantId, @Body Tenant body) {
        Tenant t = new Tenant(tenantId, body.appName(), body.frontendUrl(),
                body.senderEmail(), body.senderName(), body.clientId(), body.clientRedirectUri());
        tenants.upsert(t);
        return t;
    }

    @Delete("/{tenantId}")
    public HttpResponse<Void> delete(@PathVariable String tenantId) {
        tenants.delete(tenantId);
        return HttpResponse.accepted();
    }

    @Get("/{tenantId}/status")
    public HttpResponse<TenantStatus> status(@PathVariable String tenantId) {
        return tenants.get(tenantId)
                .map(t -> HttpResponse.ok(ses.tenantStatus(tenantId, t.senderEmail())))
                .orElseGet(HttpResponse::notFound);
    }

    /** Enqueue DNS + email provisioning (CREATE_AUTH_CNAME + PROVISION_TENANT_EMAIL) via org-control. */
    @Post("/{tenantId}/provision")
    public HttpResponse<Void> provision(@PathVariable String tenantId) {
        return tenants.get(tenantId)
                .map(t -> {
                    provisioning.provision(t);
                    return HttpResponse.<Void>accepted();
                })
                .orElseGet(HttpResponse::notFound);
    }
}
