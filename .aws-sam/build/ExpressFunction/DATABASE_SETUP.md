# Database Setup Guide

## Quick Start

The application uses environment variables for database configuration, making it easy for each developer to use their own PostgreSQL credentials.

## Option 1: Environment Variables (Recommended)

Set these environment variables before running the application:

```bash
export DB_USERNAME=your_postgres_username
export DB_PASSWORD=your_postgres_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=urbane
```

Then run:
```bash
./mvnw spring-boot:run
```

## Option 2: Local Properties File

1. Copy `src/main/resources/application-local.properties.example` to `src/main/resources/application-local.properties`
2. Update the values with your PostgreSQL credentials
3. Spring Boot will automatically load `application-local.properties` when active

To activate the local profile:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

## Option 3: Default Values

If no environment variables are set, the application defaults to:
- Username: `hasibshaif` (your system username)
- Password: (empty)
- Host: `localhost`
- Port: `5432`
- Database: `urbane`

## Creating the Database

If the `urbane` database doesn't exist, create it:

```bash
psql -d postgres -c "CREATE DATABASE urbane;"
```

## Creating a PostgreSQL User (Optional)

If you want to create a dedicated user for this project:

```bash
psql -d postgres -c "CREATE ROLE your_username WITH LOGIN PASSWORD 'your_password' CREATEDB;"
psql -d urbane -c "GRANT ALL PRIVILEGES ON DATABASE urbane TO your_username;"
```

## For Production/Deployment

Set environment variables in your deployment platform (AWS, Heroku, etc.):
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

This way, each environment can have its own database configuration without changing code.

