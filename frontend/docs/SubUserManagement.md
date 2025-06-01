# Sub-User Management System

## Overview

The sub-user management system allows sellers to manage team members with different roles and permissions within their account. All mock data has been removed and replaced with a dynamic state-based system.

## Features

### ✅ Dynamic Data Management
- No hardcoded sub-user entries
- Empty array initially, populated dynamically
- Real-time state updates
- Data persistence in memory (replace with backend calls in production)

### ✅ Job Roles System
- **Manager**: Full access to most features
- **Support**: Customer service focused permissions
- **Finance**: Billing and financial operations access

### ✅ Role-Based Permission Assignment
- Automatic permission assignment based on selected role
- Customizable permissions after role selection
- Permission presets for each job role

### ✅ Permission-Based UI Controls
- UI elements show/hide based on user permissions
- Action buttons disabled for unauthorized users
- Toast notifications for permission violations

### ✅ Complete CRUD Operations
- Add new sub-users with roles and permissions
- Edit existing user roles and permissions
- Delete sub-users
- Reset passwords
- View user details and status

## Usage

### Adding a New Sub-User

1. Click "Add New User" button (only visible to users with "Manage Users" permission)
2. Fill in required fields:
   - Name*
   - Email*
   - Contact Number*
   - Password*
   - Job Role* (Manager, Support, Finance)
3. Permissions are automatically assigned based on role selection
4. Customize permissions as needed
5. Click "Add User"

### Managing Existing Sub-Users

- **View Permissions**: Click the permissions button to see current permissions
- **Edit Role/Permissions**: Click permissions button and modify as needed
- **Reset Password**: Click "Reset Password" to send reset email
- **Delete User**: Click "Delete" to remove sub-user

### Permission System

#### Job Role Permissions

**Manager:**
- Dashboard access
- Order management (Order, Shipments, Manifest, Received, New Order)
- NDR operations (NDR List, Weight Dispute)
- Support operations (Support, Warehouse, Service, Items & SKU)
- Settings (Stores, Priority, Label)

**Support:**
- Dashboard access
- Order viewing (Order, Shipments)
- NDR operations (NDR List, Weight Dispute)
- Support operations (Support, Warehouse, Service)

**Finance:**
- Dashboard access
- Order viewing
- Billing operations (Fright, Wallet, Invoice, Ledger)
- COD operations (COD Remittance)

#### Permission-Based UI Controls

The `usePermissions` hook provides:
- `hasPermission(permission)`: Check single permission
- `hasAnyPermission(permissions[])`: Check if user has any of the permissions
- `hasAllPermissions(permissions[])`: Check if user has all permissions
- `canAccess(feature)`: Check feature-level access

Example usage:
```typescript
const { hasPermission, canAccess } = usePermissions();

// Check specific permission
if (hasPermission("Manage Users")) {
  // Show admin controls
}

// Check feature access
if (canAccess("billing")) {
  // Show billing module
}
```

## Technical Implementation

### State Management
- Uses React state for sub-user data
- In-memory storage for development
- Ready for backend API integration

### API Layer (`seller-users.ts`)
- Removed all mock data (`MOCK_TEAM_MEMBERS`)
- Added job role support
- Role-based permission presets
- Unique ID generation
- Simulated API delays

### Permission Hook (`usePermissions.ts`)
- Centralized permission management
- Reusable across components
- Feature-level access controls
- Mock permissions (replace with user context)

## Backend Integration

To integrate with a real backend:

1. Replace the in-memory `teamMembersStore` with actual API calls
2. Update the `usePermissions` hook to fetch permissions from user context/token
3. Implement proper authentication and authorization
4. Add validation on the backend for role-based operations

## Security Considerations

- All permission checks are currently client-side only
- Backend validation is required for production
- Implement proper JWT/session-based authentication
- Add role hierarchy and inheritance if needed
- Audit logging for user management operations

## Future Enhancements

- Role hierarchy (e.g., Manager can manage Support users)
- Department-based access controls
- Temporary permission grants
- Activity logging and audit trails
- Email notifications for role changes
- Bulk user operations
- Advanced filtering and search 