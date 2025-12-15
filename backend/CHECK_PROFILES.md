# How to Check if User Profiles are Saved

## Quick Database Check

Run this command to see all users and their profiles:

```bash
psql -d urbane -c "SELECT u.user_id, u.email, p.first_name, p.last_name, p.age FROM users u LEFT JOIN profiles p ON u.user_id = p.user_id ORDER BY u.user_id DESC LIMIT 10;"
```

## Check User Interests

```bash
psql -d urbane -c "SELECT u.user_id, u.email, i.name as interest FROM users u JOIN user_interests ui ON u.user_id = ui.user_id JOIN interests i ON ui.interest_id = i.interest_id ORDER BY u.user_id;"
```

## Check Events and Creators

```bash
psql -d urbane -c "SELECT e.event_id, e.title, u.email as creator_email, p.first_name as creator_name FROM events e LEFT JOIN users u ON e.creator_id = u.user_id LEFT JOIN profiles p ON u.user_id = p.user_id ORDER BY e.event_id DESC;"
```

## Check Event Attendees

```bash
psql -d urbane -c "SELECT ue.event_id, e.title, u.email, p.first_name, p.last_name FROM user_events ue JOIN events e ON ue.event_id = e.event_id JOIN users u ON ue.user_id = u.user_id LEFT JOIN profiles p ON u.user_id = p.user_id WHERE ue.rsvp_status = true ORDER BY ue.event_id;"
```

## Using the Check Script

Run the provided script:

```bash
cd backend
./check_database.sh
```

This will show:
- All users
- All profiles
- Users with their profiles
- All interests
- User-interest associations

