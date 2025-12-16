#!/bin/bash
# Script to check database contents

echo "=== Checking Users ==="
psql -d urbane -c "SELECT user_id, email FROM users ORDER BY user_id DESC LIMIT 10;"

echo ""
echo "=== Checking Profiles ==="
psql -d urbane -c "SELECT user_id, first_name, last_name, age, photo FROM profiles ORDER BY user_id DESC LIMIT 10;"

echo ""
echo "=== Checking Users with Profiles ==="
psql -d urbane -c "SELECT u.user_id, u.email, p.first_name, p.last_name, p.age FROM users u LEFT JOIN profiles p ON u.user_id = p.user_id ORDER BY u.user_id DESC LIMIT 10;"

echo ""
echo "=== Checking Interests ==="
psql -d urbane -c "SELECT interest_id, name FROM interests ORDER BY interest_id LIMIT 20;"

echo ""
echo "=== Checking User Interests (join table) ==="
psql -d urbane -c "SELECT ui.user_id, i.name as interest_name FROM user_interests ui JOIN interests i ON ui.interest_id = i.interest_id ORDER BY ui.user_id DESC LIMIT 20;"

