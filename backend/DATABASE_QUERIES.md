# Useful PostgreSQL Queries for Urbane App

## Basic User Queries

### 1. List All Registered Users
```sql
SELECT 
    user_id,
    email,
    cognito_sub,
    created_at
FROM users
ORDER BY user_id;
```

### 2. List Users with Their Profile Information
```sql
SELECT 
    u.user_id,
    u.email,
    p.first_name,
    p.last_name,
    p.age,
    p.photo,
    p.bio,
    l.city,
    l.state,
    l.country
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN locations l ON p.location_id = l.location_id
ORDER BY u.user_id;
```

### 3. List All Interests
```sql
SELECT 
    interest_id,
    name
FROM interests
ORDER BY name;
```

## User Interests Queries

### 4. List Users with Their Interests (One Row Per User-Interest Pair)
```sql
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    i.interest_id,
    i.name AS interest_name
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN user_interests ui ON u.user_id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.interest_id
ORDER BY u.user_id, i.name;
```

### 5. List Users with All Their Interests (Aggregated - One Row Per User)
```sql
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    p.age,
    STRING_AGG(i.name, ', ' ORDER BY i.name) AS interests
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN user_interests ui ON u.user_id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.interest_id
GROUP BY u.user_id, u.email, p.first_name, p.last_name, p.age
ORDER BY u.user_id;
```

### 6. Count Interests Per User
```sql
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    COUNT(ui.interest_id) AS interest_count
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN user_interests ui ON u.user_id = ui.user_id
GROUP BY u.user_id, u.email, p.first_name, p.last_name
ORDER BY interest_count DESC, u.user_id;
```

### 7. Find Users with a Specific Interest
```sql
-- Replace 'Hiking' with the interest you want to search for
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    i.name AS interest
FROM users u
JOIN user_interests ui ON u.user_id = ui.user_id
JOIN interests i ON ui.interest_id = i.interest_id
JOIN profiles p ON u.user_id = p.user_id
WHERE i.name = 'Hiking'
ORDER BY u.user_id;
```

### 8. Find Users with Multiple Specific Interests
```sql
-- Find users who have BOTH 'Hiking' AND 'Photography'
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    STRING_AGG(i.name, ', ' ORDER BY i.name) AS matching_interests
FROM users u
JOIN user_interests ui ON u.user_id = ui.user_id
JOIN interests i ON ui.interest_id = i.interest_id
JOIN profiles p ON u.user_id = p.user_id
WHERE i.name IN ('Hiking', 'Photography')
GROUP BY u.user_id, u.email, p.first_name, p.last_name
HAVING COUNT(DISTINCT i.interest_id) = 2  -- Both interests
ORDER BY u.user_id;
```

## Comprehensive User Profile Query

### 9. Complete User Profile with All Details
```sql
SELECT 
    u.user_id,
    u.email,
    p.first_name,
    p.last_name,
    p.age,
    p.photo,
    p.bio,
    l.city,
    l.state,
    l.country,
    STRING_AGG(i.name, ', ' ORDER BY i.name) AS interests,
    COUNT(DISTINCT ui.interest_id) AS interest_count
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN locations l ON p.location_id = l.location_id
LEFT JOIN user_interests ui ON u.user_id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.interest_id
GROUP BY u.user_id, u.email, p.first_name, p.last_name, p.age, p.photo, p.bio, l.city, l.state, l.country
ORDER BY u.user_id;
```

## Friend Connections Queries

### 10. List All Friend Connections
```sql
SELECT 
    fc.connection_id,
    fc.status,
    requester.user_id AS requester_id,
    requester.email AS requester_email,
    requester_profile.first_name || ' ' || requester_profile.last_name AS requester_name,
    receiver.user_id AS receiver_id,
    receiver.email AS receiver_email,
    receiver_profile.first_name || ' ' || receiver_profile.last_name AS receiver_name
FROM friend_connections fc
JOIN users requester ON fc.requester_id = requester.user_id
JOIN users receiver ON fc.receiver_id = receiver.user_id
LEFT JOIN profiles requester_profile ON requester.user_id = requester_profile.user_id
LEFT JOIN profiles receiver_profile ON receiver.user_id = receiver_profile.user_id
ORDER BY fc.connection_id;
```

### 11. List Accepted Friends for a Specific User
```sql
-- Replace 1 with the user_id you want to check
SELECT 
    CASE 
        WHEN fc.requester_id = 1 THEN receiver.user_id
        ELSE requester.user_id
    END AS friend_id,
    CASE 
        WHEN fc.requester_id = 1 THEN receiver.email
        ELSE requester.email
    END AS friend_email,
    CASE 
        WHEN fc.requester_id = 1 THEN receiver_profile.first_name || ' ' || receiver_profile.last_name
        ELSE requester_profile.first_name || ' ' || requester_profile.last_name
    END AS friend_name
FROM friend_connections fc
JOIN users requester ON fc.requester_id = requester.user_id
JOIN users receiver ON fc.receiver_id = receiver.user_id
LEFT JOIN profiles requester_profile ON requester.user_id = requester_profile.user_id
LEFT JOIN profiles receiver_profile ON receiver.user_id = receiver_profile.user_id
WHERE fc.status = 'ACCEPTED'
  AND (fc.requester_id = 1 OR fc.receiver_id = 1)
ORDER BY friend_name;
```

## Quick Stats

### 12. Database Statistics
```sql
-- Total users
SELECT COUNT(*) AS total_users FROM users;

-- Users with profiles
SELECT COUNT(*) AS users_with_profiles 
FROM users u
JOIN profiles p ON u.user_id = p.user_id;

-- Total interests
SELECT COUNT(*) AS total_interests FROM interests;

-- Most popular interests
SELECT 
    i.name,
    COUNT(ui.user_id) AS user_count
FROM interests i
LEFT JOIN user_interests ui ON i.interest_id = ui.interest_id
GROUP BY i.interest_id, i.name
ORDER BY user_count DESC, i.name;

-- Users with most interests
SELECT 
    u.user_id,
    u.email,
    p.first_name || ' ' || p.last_name AS full_name,
    COUNT(ui.interest_id) AS interest_count
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id
LEFT JOIN user_interests ui ON u.user_id = ui.user_id
GROUP BY u.user_id, u.email, p.first_name, p.last_name
ORDER BY interest_count DESC
LIMIT 10;
```

## Update Queries

### 13. Update User Age by User ID
```sql
-- Update age for user_id = 1
UPDATE profiles 
SET age = 21 
WHERE user_id = 1;
```

### 14. Update User Age by Email
```sql
-- Update age for a specific email
UPDATE profiles 
SET age = 21 
WHERE user_id = (SELECT user_id FROM users WHERE email = 'hasibop123@gmail.com');
```

### 15. Update Multiple Profile Fields
```sql
-- Update age, bio, and other fields for a user
UPDATE profiles 
SET 
    age = 21,
    bio = 'Updated bio text',
    first_name = 'NewFirstName',
    last_name = 'NewLastName'
WHERE user_id = 1;
```

### 16. Update User Location
```sql
-- First, find or create a location, then update profile
-- Create location if it doesn't exist
INSERT INTO locations (city, state, country)
VALUES ('New York', 'NY', 'United States')
ON CONFLICT DO NOTHING
RETURNING location_id;

-- Then update profile with location_id
UPDATE profiles 
SET location_id = (SELECT location_id FROM locations WHERE city = 'New York' AND state = 'NY' LIMIT 1)
WHERE user_id = 1;
```

### 17. Add Interest to User
```sql
-- Add an interest to a user (replace interest_id and user_id)
INSERT INTO user_interests (user_id, interest_id)
VALUES (1, 5)  -- user_id = 1, interest_id = 5
ON CONFLICT DO NOTHING;
```

### 18. Remove Interest from User
```sql
-- Remove an interest from a user
DELETE FROM user_interests 
WHERE user_id = 1 AND interest_id = 5;
```

### 19. Replace All Interests for a User
```sql
-- First, delete all existing interests
DELETE FROM user_interests WHERE user_id = 1;

-- Then add new interests
INSERT INTO user_interests (user_id, interest_id) VALUES
    (1, 1),  -- Replace with actual interest_ids
    (1, 3),
    (1, 5);
```

## Quick Access Commands

### Connect to PostgreSQL
```bash
psql -d urbane -U hasibshaif
```

### Or if you need to specify host/port
```bash
psql -h localhost -p 5432 -d urbane -U hasibshaif
```

### Run a query from command line
```bash
psql -d urbane -U hasibshaif -c "SELECT user_id, email FROM users;"
```

### Update from command line (single command)
```bash
# Update age for user_id = 1
psql -d urbane -U hasibshaif -c "UPDATE profiles SET age = 21 WHERE user_id = 1;"

# Update age by email
psql -d urbane -U hasibshaif -c "UPDATE profiles SET age = 21 WHERE user_id = (SELECT user_id FROM users WHERE email = 'hasibop123@gmail.com');"
```

