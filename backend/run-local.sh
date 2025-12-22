#!/bin/bash
# Script to run Spring Boot with local profile and Cognito configuration

# Set Cognito environment variables from application-local.properties
export COGNITO_USER_POOL_ID=us-east-1_elXFf7E5b
export COGNITO_CLIENT_ID=2a2n2jikcjjv2emen6ds104j0f
export COGNITO_REGION=us-east-1

# Run Spring Boot with local profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=local


