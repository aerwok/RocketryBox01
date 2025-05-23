import { sendEmail } from './src/utils/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test email sending functionality for admin registration
 */
const testAdminInvitationEmail = async () => {
  try {
    console.log('Testing admin invitation email...\n');
    
    const testData = {
      name: 'John Doe',
      role: 'Manager',
      department: 'Finance',
      employeeId: 'FIN24001',
      tempPassword: 'TempPass123!',
      loginUrl: `${process.env.ADMIN_FRONTEND_URL}/admin/login`,
      otp: '123456',
      verificationLink: `${process.env.ADMIN_FRONTEND_URL}/admin/verify?email=john.doe@example.com&otp=123456`,
      adminPortalUrl: process.env.ADMIN_FRONTEND_URL || 'https://admin.rocketrybox.com'
    };
    
    console.log('Email data to be sent:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Test invitation email (for team member registration)
    const invitationResult = await sendEmail({
      to: 'john.doe@example.com', // Replace with a test email
      subject: 'Welcome to Rocketry Box Admin Team - Login Credentials',
      template: 'admin-invitation',
      data: testData
    });
    
    console.log('\n✅ Admin invitation email test completed');
    console.log('Result:', invitationResult);
    
    // Test welcome email (for direct admin registration)
    const welcomeData = {
      name: 'Jane Smith',
      role: 'Admin',
      department: 'IT',
      employeeId: 'IT24001',
      email: 'jane.smith@example.com',
      tempPassword: 'DirectPass123!',
      loginUrl: `${process.env.ADMIN_FRONTEND_URL}/admin/login`,
      adminPortalUrl: process.env.ADMIN_FRONTEND_URL || 'https://admin.rocketrybox.com'
    };
    
    const welcomeResult = await sendEmail({
      to: 'jane.smith@example.com', // Replace with a test email
      subject: 'Welcome to Rocketry Box Admin - Your Account Details',
      template: 'admin-welcome',
      data: welcomeData
    });
    
    console.log('\n✅ Admin welcome email test completed');
    console.log('Result:', welcomeResult);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

/**
 * Test SMS sending functionality
 */
const testSMSIntegration = async () => {
  try {
    console.log('\n📱 Testing SMS integration...');
    
    // This would test SMS functionality if implemented
    console.log('SMS test placeholder - implement when SMS service is configured');
    
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting email integration tests...\n');
  
  console.log('Environment variables:');
  console.log('- ADMIN_FRONTEND_URL:', process.env.ADMIN_FRONTEND_URL || 'Not set');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
  console.log('- EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
  console.log('');
  
  await testAdminInvitationEmail();
  await testSMSIntegration();
  
  console.log('\n🎉 Email integration tests completed!');
  console.log('\n📧 Important Notes:');
  console.log('1. Replace test email addresses with real ones for actual testing');
  console.log('2. Ensure email service is properly configured in environment variables');
  console.log('3. Verify email templates exist in your email service provider');
  console.log('4. Check spam folders if emails are not received');
  console.log('5. Monitor email service logs for delivery status');
};

// Execute tests
runTests().catch(console.error); 