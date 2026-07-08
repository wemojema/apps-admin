plugins {
    id("java")
    id("io.micronaut.application") version "4.4.4"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

version = "1.0.0"
group = "com.wemojema.apps.admin"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    annotationProcessor("io.micronaut:micronaut-http-validation")
    annotationProcessor("io.micronaut.security:micronaut-security-annotations")
    annotationProcessor("io.micronaut.serde:micronaut-serde-processor")

    implementation("io.micronaut:micronaut-http-server-netty")
    implementation("io.micronaut.aws:micronaut-function-aws-api-proxy")
    implementation("io.micronaut.serde:micronaut-serde-jackson")
    implementation("com.wemojema:wemojema-auth-sdk:0.0.1-SNAPSHOT")

    implementation(platform("software.amazon.awssdk:bom:2.25.27"))
    implementation("software.amazon.awssdk:dynamodb")
    implementation("software.amazon.awssdk:sqs")
    implementation("software.amazon.awssdk:sesv2")
    implementation("com.fasterxml.jackson.core:jackson-databind")

    implementation("ch.qos.logback:logback-classic")
    runtimeOnly("com.amazonaws:aws-lambda-java-log4j2:1.6.0")
    runtimeOnly("org.yaml:snakeyaml")

    testImplementation("io.micronaut.test:micronaut-test-junit5")
    testImplementation("org.junit.jupiter:junit-jupiter-api")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine")
}

micronaut {
    runtime("lambda_provided")
    testRuntime("junit5")
    processing {
        incremental(true)
        annotations("com.wemojema.apps.admin.*")
    }
}

application {
    mainClass.set("com.wemojema.apps.admin.handler.LambdaHandler")
}

tasks.named<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar>("shadowJar") {
    archiveBaseName.set("apps-admin-api")
    archiveClassifier.set("")
    archiveVersion.set("")
}

tasks.named("build") {
    dependsOn("shadowJar")
}
