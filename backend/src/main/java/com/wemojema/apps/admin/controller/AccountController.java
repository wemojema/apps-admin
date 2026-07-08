package com.wemojema.apps.admin.controller;

import com.wemojema.apps.admin.model.SesAccountStatus;
import com.wemojema.apps.admin.service.SesStatusService;
import com.wemojema.auth.WemojemaSecured;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

@WemojemaSecured
@Controller("/api/v1/account")
public class AccountController {

    private final SesStatusService ses;

    public AccountController(SesStatusService ses) {
        this.ses = ses;
    }

    @Get("/ses")
    public SesAccountStatus ses() {
        return ses.accountStatus();
    }
}
