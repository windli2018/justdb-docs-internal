---
icon: server
date: 2024-01-01
title: CI/CD Integration
order: 12
category:
  - Guide
  - CI/CD
tag:
  - CI/CD
  - GitLab
  - GitHub Actions
---

# CI/CD Integration

Learn how to integrate JustDB into CI/CD pipelines for automated database migration and deployment.

## GitLab CI Example

### Complete CI/CD Configuration

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy-dev
  - deploy-test
  - deploy-prod

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
  JUSTDB_VERSION: "1.0.0"

# Cache Maven dependencies
cache:
  paths:
    - .m2/repository/

# Validate schema
validate:schema:
  stage: validate
  image: maven:3.8-openjdk-11
  script:
    - mvn validate
    - justdb validate
  artifacts:
    paths:
      - justdb/
    expire_in: 1 hour

# Code quality check
code:quality:
  stage: validate
  image: maven:3.8-openjdk-11
  script:
    - mvn checkstyle:check
    - mvn spotbugs:check
  allow_failure: true

# Unit tests
test:unit:
  stage: test
  image: maven:3.8-openjdk-11
  script:
    - mvn test
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      junit: "**/target/surefire-reports/TEST-*.xml"
    coverage_reports:
      coverage_format: cobertura
      path: target/site/jacoco/jacoco.xml

# Integration tests
test:integration:
  stage: test
  image: maven:3.8-openjdk-11
  services:
    - name: mysql:8.0
      alias: mysql
      variables:
        MYSQL_ROOT_PASSWORD: test_pass
        MYSQL_DATABASE: test_db
  variables:
    SPRING_DATASOURCE_URL: "jdbc:mysql://mysql:3306/test_db"
    SPRING_DATASOURCE_USERNAME: root
    SPRING_DATASOURCE_PASSWORD: test_pass
  script:
    - justdb migrate --dry-run
    - justdb migrate
    - mvn verify -DskipUnitTests
  artifacts:
    reports:
      junit: "**/target/failsafe-reports/TEST-*.xml"

# Build application
build:
  stage: build
  image: maven:3.8-openjdk-11
  script:
    - mvn package -DskipTests
  artifacts:
    paths:
      - target/*.jar
    expire_in: 1 week
  only:
    - main
    - develop

# Deploy to development
deploy:dev:
  stage: deploy-dev
  image: justdb:${JUSTDB_VERSION}
  variables:
    DEV_DB_URL: ${DEV_DB_URL}
    DEV_DB_USER: ${DEV_DB_USER}
    DEV_DB_PASS: ${DEV_DB_PASS}
  script:
    - justdb validate
    - justdb migrate --dry-run
    - justdb migrate
    - justdb verify
  environment:
    name: development
    url: https://dev.example.com
  only:
    - develop

# Deploy to test
deploy:test:
  stage: deploy-test
  image: justdb:${JUSTDB_VERSION}
  variables:
    TEST_DB_URL: ${TEST_DB_URL}
    TEST_DB_USER: ${TEST_DB_USER}
    TEST_DB_PASS: ${TEST_DB_PASS}
  script:
    - justdb validate
    - justdb migrate --dry-run
    - justdb backup -o backup-test.sql
    - justdb migrate
    - justdb verify
  environment:
    name: testing
    url: https://test.example.com
  only:
    - main
  when: manual

# Deploy to production
deploy:prod:
  stage: deploy-prod
  image: justdb:${JUSTDB_VERSION}
  variables:
    PROD_DB_URL: ${PROD_DB_URL}
    PROD_DB_USER: ${PROD_DB_USER}
    PROD_DB_PASS: ${PROD_DB_PASS}
  script:
    # Pre-checks
    - justdb validate
    - justdb diff
    # Dry-run
    - justdb migrate --dry-run
    # Backup
    - justdb backup -o backup-prod-$(date +%Y%m%d_%H%M%S).sql
    # Execute migration
    - justdb migrate
    # Verify
    - justdb verify
    # Notify
    - curl -X POST $SLACK_WEBHOOK -d '{"text":"Production migration completed"}'
  environment:
    name: production
    url: https://example.com
  only:
    - main
  when: manual
```

## GitHub Actions Example

### Complete Workflow

```yaml
# .github/workflows/ci-cd.yml
name: JustDB CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ created ]

env:
  JAVA_VERSION: '11'
  MAVEN_VERSION: '3.8.6'

jobs:
  # Validate schema
  validate:
    name: Validate Schema
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: 'maven'

      - name: Validate Schema
        run: |
          mvn validate
          justdb validate

      - name: Upload schema artifacts
        uses: actions/upload-artifact@v3
        with:
          name: schema
          path: justdb/
          retention-days: 7

  # Unit tests
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: 'maven'

      - name: Run unit tests
        run: mvn test

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: '**/target/surefire-reports/TEST-*.xml'

      - name: Generate coverage report
        run: mvn jacoco:report

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./target/site/jacoco/jacoco.xml

  # Integration tests
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: validate
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: 'maven'

      - name: Wait for MySQL
        run: |
          until mysqladmin ping -h 127.0.0.1 -P 3306 -u root -ptest --silent; do
            echo 'Waiting for MySQL...'
            sleep 2
          done

      - name: Run migration
        env:
          SPRING_DATASOURCE_URL: jdbc:mysql://127.0.0.1:3306/test_db
          SPRING_DATASOURCE_USERNAME: root
          SPRING_DATASOURCE_PASSWORD: test
        run: |
          justdb migrate --dry-run
          justdb migrate

      - name: Run integration tests
        run: mvn verify -DskipUnitTests

      - name: Upload integration test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: '**/target/failsafe-reports/TEST-*.xml'

  # Build application
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration]
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: 'maven'

      - name: Build application
        run: mvn package -DskipTests

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: application
          path: target/*.jar
          retention-days: 7

  # Deploy to development
  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: development
      url: https://dev.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: application

      - name: Deploy to development
        env:
          DEV_DB_URL: ${{ secrets.DEV_DB_URL }}
          DEV_DB_USER: ${{ secrets.DEV_DB_USER }}
          DEV_DB_PASS: ${{ secrets.DEV_DB_PASS }}
        run: |
          justdb validate
          justdb migrate --dry-run
          justdb migrate
          justdb verify

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Development deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Deploy to test
  deploy-test:
    name: Deploy to Testing
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: testing
      url: https://test.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to testing
        env:
          TEST_DB_URL: ${{ secrets.TEST_DB_URL }}
          TEST_DB_USER: ${{ secrets.TEST_DB_USER }}
          TEST_DB_PASS: ${{ secrets.TEST_DB_PASS }}
        run: |
          justdb validate
          justdb migrate --dry-run
          justdb backup -o backup-test.sql
          justdb migrate
          justdb verify

  # Deploy to production
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Pre-deployment checks
        env:
          PROD_DB_URL: ${{ secrets.PROD_DB_URL }}
          PROD_DB_USER: ${{ secrets.PROD_DB_USER }}
          PROD_DB_PASS: ${{ secrets.PROD_DB_PASS }}
        run: |
          justdb validate
          justdb diff

      - name: Create backup
        env:
          PROD_DB_URL: ${{ secrets.PROD_DB_URL }}
          PROD_DB_USER: ${{ secrets.PROD_DB_USER }}
          PROD_DB_PASS: ${{ secrets.PROD_DB_PASS }}
        run: |
          justdb backup -o backup-prod-${{ github.ref_name }}.sql

      - name: Deploy to production
        env:
          PROD_DB_URL: ${{ secrets.PROD_DB_URL }}
          PROD_DB_USER: ${{ secrets.PROD_DB_USER }}
          PROD_DB_PASS: ${{ secrets.PROD_DB_PASS }}
        run: |
          justdb migrate --dry-run
          justdb migrate
          justdb verify

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Jenkins Example

### Jenkinsfile

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        MAVEN_HOME = tool 'Maven 3.8'
        JAVA_HOME = tool 'JDK 11'
        JUSTDB_VERSION = '1.0.0'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                sh '${MAVEN_HOME}/bin/mvn validate'
                sh 'justdb validate'
            }
        }

        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh '${MAVEN_HOME}/bin/mvn test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        docker.image('mysql:8.0').withRun("-e MYSQL_ROOT_PASSWORD=test -e MYSQL_DATABASE=test_db") { c ->
                            sh "justdb migrate"
                            sh '${MAVEN_HOME}/bin/mvn verify -DskipUnitTests'
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh '${MAVEN_HOME}/bin/mvn package -DskipTests'
            }
        }

        stage('Deploy Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    justdb validate
                    justdb migrate --dry-run
                    justdb migrate
                    justdb verify
                '''
            }
        }

        stage('Deploy Prod') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    justdb validate
                    justdb diff
                    justdb backup -o backup-prod-${BUILD_NUMBER}.sql
                    justdb migrate --dry-run
                    justdb migrate
                    justdb verify
                '''
            }
        }
    }

    post {
        always {
            junit '**/target/surefire-reports/TEST-*.xml'
            junit '**/target/failsafe-reports/TEST-*.xml'
        }
        success {
            emailext(
                subject: "Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build completed successfully.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        failure {
            emailext(
                subject: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build failed. Please check the logs.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## Automated Testing

### Test Strategy

```yaml
# .gitlab-ci.yml
test:unit:
  stage: test
  script:
    - mvn test
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      junit: "**/target/surefire-reports/TEST-*.xml"

test:integration:
  stage: test
  services:
    - mysql:8.0
  script:
    - justdb migrate
    - mvn verify -DskipUnitTests
  artifacts:
    reports:
      junit: "**/target/failsafe-reports/TEST-*.xml"

test:e2e:
  stage: test
  script:
    - docker-compose up -d
    - justdb migrate -c config/test.yaml
    - mvn verify -P e2e
    - docker-compose down
```

### Database Testing

```bash
# Use Testcontainers
mvn test -Dtest=*Test -Dspring.profiles.active=testcontainers

# Use in-memory database
mvn test -Dspring.profiles.active=h2

# Use Docker database
mvn test -Dspring.profiles.active=docker-mysql
```

## Automated Deployment

### Blue-Green Deployment

```yaml
deploy:blue-green:
  stage: deploy
  script:
    # Deploy to blue environment
    - justdb migrate -c config/blue.yaml
    - kubectl apply -f k8s/blue-deployment.yaml
    # Verify blue environment
    - ./scripts/health-check.sh https://blue.example.com
    # Switch traffic
    - kubectl apply -f k8s/service-switch.yaml
    # Deploy to green environment
    - justdb migrate -c config/green.yaml
    - kubectl apply -f k8s/green-deployment.yaml
```

### Canary Deployment

```yaml
deploy:canary:
  stage: deploy
  script:
    # 10% traffic to new version
    - kubectl apply -f k8s/canary-10percent.yaml
    - ./scripts/monitor-metrics.sh
    # 50% traffic to new version
    - kubectl apply -f k8s/canary-50percent.yaml
    - ./scripts/monitor-metrics.sh
    # 100% traffic to new version
    - kubectl apply -f k8s/canary-100percent.yaml
```

## Monitoring and Alerting

### Health Check

```yaml
health-check:
  stage: test
  script:
    - justdb health
    - curl -f https://api.example.com/health || exit 1
```

### Performance Monitoring

```yaml
monitor:performance:
  stage: test
  script:
    - ./scripts/benchmark.sh
    - ./scripts/check-metrics.sh
  artifacts:
    reports:
      performance: performance-report.json
```

### Alert Configuration

```yaml
notify:slack:
  stage: .post
  script:
    - |
      if [ $CI_JOB_STATUS == "failed" ]; then
        curl -X POST $SLACK_WEBHOOK \
          -d "{\"text\": \"Migration failed: $CI_PROJECT_NAME ($CI_COMMIT_SHA)\"}"
      fi
```

## Best Practices

### 1. Phased Deployment

```yaml
stages:
  - validate      # Fast feedback
  - test          # Comprehensive testing
  - build         # Build artifacts
  - deploy-dev    # Development (auto)
  - deploy-test   # Test (auto)
  - deploy-prod   # Production (manual)
```

### 2. Environment Isolation

```yaml
variables:
  DEV_DB_URL: $DEV_DB_URL
  TEST_DB_URL: $TEST_DB_URL
  PROD_DB_URL: $PROD_DB_URL
```

### 3. Backup Strategy

```yaml
deploy:prod:
  script:
    - justdb backup -o backup-${CI_PIPELINE_ID}.sql
    - justdb migrate
```

### 4. Rollback Mechanism

```yaml
rollback:prod:
  stage: deploy
  script:
    - justdb rollback ${TARGET_VERSION}
  when: manual
  only:
    - main
```

## Next Steps

<VPCard
  title="Docker Deployment"
  desc="Containerized deployment with Docker"
  link="/en/guide/docker.html"
/>

<VPCard
  title="Team Collaboration"
  desc="Team CI/CD best practices"
  link="/en/guide/team-collaboration.html"
/>

<VPCard
  title="Configuration Reference"
  desc="CI/CD related configuration options"
  link="/en/guide/config-reference.html"
/>
