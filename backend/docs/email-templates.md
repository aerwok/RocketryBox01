# Email Templates for Admin Registration

This document outlines the email templates that should be implemented for the admin registration system.

## Template: admin-invitation

**Template ID**: `admin-invitation`
**Used for**: Team member registration via `/admin/team/register`

### Data Variables:
- `name` - Full name of the team member
- `role` - Admin role (Admin, Manager, Support, Agent)
- `department` - Department name
- `employeeId` - Auto-generated Employee ID
- `tempPassword` - Auto-generated temporary password
- `loginUrl` - Direct URL to admin login page
- `otp` - One-time password for email verification
- `verificationLink` - Link to verify email with OTP
- `adminPortalUrl` - Base URL of admin portal

### Template Content:
```html
Subject: Welcome to Rocketry Box Admin Team - Login Credentials

Dear {{name}},

Welcome to the Rocketry Box Admin Team! Your account has been successfully created.

**Your Login Credentials:**
- Employee ID: {{employeeId}}
- Email: {{email}}
- Temporary Password: {{tempPassword}}
- Role: {{role}}
- Department: {{department}}

**Getting Started:**
1. Visit the admin portal: {{loginUrl}}
2. Log in using your Employee ID and temporary password
3. You will be prompted to change your password on first login
4. Verify your email using this link: {{verificationLink}}
5. Your verification OTP is: {{otp}} (valid for 30 minutes)

**Important Notes:**
- Please change your password immediately after your first login
- Keep your credentials secure and do not share them
- If you have any issues accessing your account, contact your administrator

Welcome to the team!

Best regards,
Rocketry Box Admin Team

---
Admin Portal: {{adminPortalUrl}}
```

## Template: admin-welcome

**Template ID**: `admin-welcome`
**Used for**: Direct admin registration via `/admin/auth/register`

### Data Variables:
- `name` - Full name of the admin
- `role` - Admin role
- `department` - Department name
- `employeeId` - Auto-generated Employee ID
- `email` - Admin email address
- `tempPassword` - The password set during registration
- `loginUrl` - Direct URL to admin login page
- `adminPortalUrl` - Base URL of admin portal

### Template Content:
```html
Subject: Welcome to Rocketry Box Admin - Your Account Details

Dear {{name}},

Your admin account has been successfully created for Rocketry Box.

**Your Account Details:**
- Employee ID: {{employeeId}}
- Email: {{email}}
- Password: {{tempPassword}}
- Role: {{role}}
- Department: {{department}}

**Access Your Account:**
Visit the admin portal: {{loginUrl}}

**Security Reminder:**
- Keep your login credentials secure
- Do not share your password with anyone
- Contact your system administrator if you need any assistance

Welcome to Rocketry Box!

Best regards,
Rocketry Box Team

---
Admin Portal: {{adminPortalUrl}}
```

## Implementation Notes

### Email Service Configuration
The email service should be configured with:
- SMTP settings for sending emails
- Template engine for processing variables
- Error handling for failed email delivery
- Logging for email sending events

### Template Variables Processing
All template variables should be properly escaped to prevent XSS attacks when rendered in HTML emails.

### Error Handling
- Email sending failures should be logged but not prevent account creation
- Users should still be able to access their accounts even if email fails
- Administrators should be notified of email delivery failures

### Testing
- Test templates with various data combinations
- Verify all URLs are correctly formatted
- Check email rendering across different email clients
- Test fallback behavior when email service is unavailable 