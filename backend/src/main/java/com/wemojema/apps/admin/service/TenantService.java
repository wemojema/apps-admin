package com.wemojema.apps.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wemojema.apps.admin.model.Tenant;
import io.micronaut.context.annotation.Value;
import jakarta.inject.Singleton;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Reads tenants from the wemojema-auth-tenants table (same account) and enqueues mutations on the
 * wemojema-auth-admin SQS queue — the sanctioned UPSERT_TENANT / DELETE_TENANT path processed by
 * the auth admin Lambda.
 */
@Singleton
public class TenantService {

    private final DynamoDbClient dynamoDb;
    private final SqsClient sqs;
    private final String table;
    private final String queueUrl;
    private final ObjectMapper json = new ObjectMapper();

    public TenantService(DynamoDbClient dynamoDb,
                         SqsClient sqs,
                         @Value("${aws.tenants-table}") String table,
                         @Value("${aws.admin-queue-url}") String queueUrl) {
        this.dynamoDb = dynamoDb;
        this.sqs = sqs;
        this.table = table;
        this.queueUrl = queueUrl;
    }

    public List<Tenant> list() {
        return dynamoDb.scan(b -> b.tableName(table)).items().stream()
                .map(TenantService::toTenant)
                .toList();
    }

    public Optional<Tenant> get(String tenantId) {
        Map<String, AttributeValue> item = dynamoDb.getItem(b -> b.tableName(table)
                .key(Map.of("tenantId", AttributeValue.fromS(tenantId)))).item();
        return (item == null || item.isEmpty()) ? Optional.empty() : Optional.of(toTenant(item));
    }

    public void upsert(Tenant t) {
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("action", "UPSERT_TENANT");
        msg.put("tenantId", t.tenantId());
        msg.put("appName", t.appName());
        msg.put("frontendUrl", t.frontendUrl());
        msg.put("senderEmail", t.senderEmail());
        msg.put("senderName", t.senderName());
        msg.put("clientId", t.clientId());
        msg.put("clientRedirectUri", t.clientRedirectUri());
        send(msg);
    }

    public void delete(String tenantId) {
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("action", "DELETE_TENANT");
        msg.put("tenantId", tenantId);
        send(msg);
    }

    private void send(Map<String, Object> msg) {
        try {
            String body = json.writeValueAsString(msg);
            sqs.sendMessage(b -> b.queueUrl(queueUrl).messageBody(body));
        } catch (Exception e) {
            throw new RuntimeException("Failed to enqueue admin message", e);
        }
    }

    private static Tenant toTenant(Map<String, AttributeValue> item) {
        return new Tenant(
                s(item, "tenantId"),
                s(item, "appName"),
                s(item, "frontendUrl"),
                s(item, "senderEmail"),
                s(item, "senderName"),
                s(item, "clientId"),
                s(item, "clientRedirectUri"));
    }

    private static String s(Map<String, AttributeValue> item, String key) {
        AttributeValue v = item.get(key);
        return v == null ? null : v.s();
    }
}
