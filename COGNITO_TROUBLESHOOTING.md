# Cognito Login Troubleshooting

## Error: "2 validation errors detected" or 401 Unauthorized

This error typically means your Cognito App Client doesn't have `USER_PASSWORD_AUTH` enabled.

### Solution 1: Enable USER_PASSWORD_AUTH in AWS Console

1. Go to AWS Console → Cognito → User Pools
2. Find your user pool (ID: `us-east-1_elXFf7E5b`)
3. Click on "App integration" tab
4. Scroll down to "App clients and analytics"
5. Click on your app client (ID: `2a2n2jikcjjv2emen6ds104j0f`)
6. Click "Edit" button
7. Under "Authentication flows configuration", make sure these are checked:
   - ✅ ALLOW_USER_PASSWORD_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
   - ✅ ALLOW_USER_SRP_AUTH (optional)
8. Click "Save changes"

### Solution 2: Verify App Client Configuration via AWS CLI

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_elXFf7E5b \
  --client-id 2a2n2jikcjjv2emen6ds104j0f
```

Check the `ExplicitAuthFlows` array - it should include `ALLOW_USER_PASSWORD_AUTH`.

### Solution 3: Update App Client via AWS CLI

If USER_PASSWORD_AUTH is not enabled, you can enable it:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_elXFf7E5b \
  --client-id 2a2n2jikcjjv2emen6ds104j0f \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH
```

### Solution 4: Verify User Exists and is Confirmed

Make sure the user exists and email is verified:

```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_elXFf7E5b \
  --username hasibop123@gmail.com
```

Check that:
- User status is `CONFIRMED`
- Email is verified

### Solution 5: Check Backend Logs

Check your Spring Boot application logs for more detailed error messages. The improved error handling should now provide more specific information about what's wrong.

### Common Issues:

1. **App Client doesn't have USER_PASSWORD_AUTH enabled** - Most common issue
2. **User not confirmed** - User needs to verify email first
3. **Incorrect password** - Double-check the password
4. **Wrong client ID or user pool ID** - Verify configuration matches AWS

### Testing After Fix

After enabling USER_PASSWORD_AUTH, try logging in again. The error should be resolved.


