# Admin Panel Access Guide

## 🔐 Admin Login URL
**Direct Link:** `/admin-login`

Access your admin panel at: `https://your-domain.com/admin-login`

---

## 📋 Quick Setup Steps

### Step 1: Create Your Admin Account
1. Go to `/admin-login`
2. Login with your email and password
3. Initially, you'll see "Access denied" - this is normal!

### Step 2: Grant Admin Access

#### Option A: First Admin Setup (If no admins exist)
Run this SQL in your Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
  id,
  'super_admin'::app_role,
  id
FROM auth.users
WHERE email = 'your-email@example.com';
```

#### Option B: Get Your User ID First
If you don't know your user ID, run this first:

```sql
-- Find your user ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

Then use your user ID:

```sql
-- Replace 'YOUR-USER-ID-HERE' with the actual UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'super_admin');
```

### Step 3: Access the Admin Panel
1. Go back to `/admin-login`
2. Login with your credentials
3. You'll be automatically redirected to `/admin`

---

## 👥 Admin Role Types

### 🔴 Super Admin (Highest Level)
- **Full system control**
- Can manage other admins
- Access to all features
- Can view/edit/delete everything

**Grant Super Admin:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'super_admin');
```

### 🟡 Admin (Standard)
- Manage orders and payments
- View dashboard statistics
- Confirm/cancel orders
- Approve/reject payment requests
- View activity logs

**Grant Admin:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'admin');
```

### 🟢 Sub Admin (Limited)
- View-only access to orders
- View dashboard statistics
- Cannot approve/reject
- Limited permissions

**Grant Sub Admin:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'sub_admin');
```

---

## 📊 Admin Panel Features

### 1. **Overview Tab**
- Total Users & New Users (last month)
- Total Credits Added/Spent/Remaining
- Payment Requests (Pending/Confirmed/Rejected)
- Order Statistics (Total/Pending/Confirmed/Canceled)
- Total Revenue
- Refresh button for real-time updates

### 2. **Orders Tab**
- View all product orders from all users
- Filter by:
  - Status (Pending, Confirmed, Canceled)
  - Category (FreeFire, TikTok, Netflix, etc.)
  - Date Range
- Actions:
  - View order details
  - Confirm orders (deducts credits)
  - Cancel orders with reason
- Real-time updates

### 3. **Payment Requests Tab**
- Pending payment requests with screenshots
- User remarks and details
- Approve requests (adds credits to user)
- Reject requests with admin remarks
- View payment history
- Real-time updates

### 4. **Activity Log Tab**
- Complete audit trail of all actions
- Filter by activity type
- See who did what and when
- Track admin actions
- Real-time activity feed

---

## 🔒 Security Features

### Row Level Security (RLS)
- All admin tables have RLS enabled
- Only authenticated admins can access data
- Regular users cannot see admin data

### Role-Based Access Control
- Permissions are checked server-side
- Cannot be bypassed from client
- Secure database functions

### Activity Logging
- Every admin action is logged
- Tracks IP address and user agent
- Complete audit trail

---

## 🛠️ Managing Admins

### View All Admins
```sql
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC;
```

### Add New Admin
```sql
-- Get user ID first
SELECT id, email FROM auth.users WHERE email = 'newadmin@example.com';

-- Then grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'admin');
```

### Remove Admin Access
```sql
DELETE FROM user_roles 
WHERE user_id = 'user-id-here' 
AND role = 'admin';
```

### Change Admin Role
```sql
-- Change from admin to super_admin
UPDATE user_roles 
SET role = 'super_admin' 
WHERE user_id = 'user-id-here';
```

---

## 🚨 Troubleshooting

### "Access Denied" Error
**Cause:** Your account doesn't have admin role in the database.

**Solution:**
1. Check if your user_id is in the `user_roles` table
2. Run the setup SQL from Step 2 above
3. Make sure you're logged in with the correct account

```sql
-- Check your admin status
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
```

### Can't See Admin Panel After Login
**Cause:** Not redirecting properly or cached session.

**Solution:**
1. Logout completely
2. Clear browser cache
3. Go to `/admin-login` directly
4. Login again

### Orders Not Appearing
**Cause:** RLS policies or no orders exist.

**Solution:**
```sql
-- Check if orders exist
SELECT COUNT(*) FROM product_orders;

-- Check if you can see them (run while logged in as admin)
SELECT * FROM product_orders LIMIT 5;
```

### Dashboard Stats Not Loading
**Cause:** Materialized view needs refresh.

**Solution:**
```sql
-- Refresh the dashboard statistics
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
```

---

## 📞 Support

### Useful Supabase Queries

**Check User Authentication:**
```sql
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

**View Recent Orders:**
```sql
SELECT 
  order_number,
  product_name,
  user_email,
  status,
  price,
  created_at
FROM product_orders
ORDER BY created_at DESC
LIMIT 20;
```

**View Payment Request Stats:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(credits) as total_credits
FROM payment_requests
GROUP BY status;
```

---

## 🎯 Quick Reference

| Action | URL | Required Role |
|--------|-----|---------------|
| Admin Login | `/admin-login` | Any user (checks role after) |
| Admin Dashboard | `/admin` | admin, super_admin, sub_admin |
| User Dashboard | `/dashboard` | Any authenticated user |
| Regular Login | `/login` | Any user |

---

## ⚠️ Important Notes

1. **Never share admin credentials**
2. **Always use secure passwords**
3. **Grant admin access carefully**
4. **Monitor the activity log regularly**
5. **Keep only necessary admin accounts active**
6. **Review permissions periodically**

---

## 📈 Best Practices

✅ Create separate admin accounts (don't use personal)
✅ Use strong, unique passwords
✅ Regularly review activity logs
✅ Remove admin access when no longer needed
✅ Use sub_admin role for limited access
✅ Keep admin credentials secure
✅ Monitor suspicious activities

❌ Don't share admin accounts
❌ Don't grant admin to untrusted users
❌ Don't ignore security warnings
❌ Don't use weak passwords
