package com.wemojema.apps.admin.config;

import io.micronaut.context.annotation.Factory;
import jakarta.inject.Singleton;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sqs.SqsClient;

@Factory
public class AwsClientFactory {

    @Singleton
    DynamoDbClient dynamoDb() {
        return DynamoDbClient.builder().region(Region.US_EAST_1).build();
    }

    @Singleton
    SqsClient sqs() {
        return SqsClient.builder().region(Region.US_EAST_1).build();
    }

    @Singleton
    SesV2Client ses() {
        return SesV2Client.builder().region(Region.US_EAST_1).build();
    }
}
