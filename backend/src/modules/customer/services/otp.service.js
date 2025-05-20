import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import axios from 'axios';
import { generateOTP } from '../../../utils/otp.js';
import { setOTP, getOTP } from '../../../utils/redis.js';

// Initialize AWS SES client
const sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Send OTP via SMS using Fast2SMS
const sendSMSOTP = async (mobile, otp) => {
    try {
        console.log('Attempting to send SMS OTP to:', mobile);
        console.log('Environment variables:', {
            FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY ? 'Set' : 'Not set',
            FAST2SMS_SENDER_ID: process.env.FAST2SMS_SENDER_ID,
            NODE_ENV: process.env.NODE_ENV
        });
        
        // Validate mobile number
        if (!mobile || mobile.length !== 10) {
            console.error('Invalid mobile number:', mobile);
            return false;
        }

        // Validate Fast2SMS API key
        if (!process.env.FAST2SMS_API_KEY) {
            console.error('Fast2SMS API key is not configured');
            return false;
        }
        
        const payload = {
            route: 'v3',
            sender_id: process.env.FAST2SMS_SENDER_ID || 'RKTBOX',
            message: `Your RocketryBox verification code is: ${otp}. Valid for 5 minutes.`,
            language: 'english',
            flash: 0,
            numbers: mobile,
        };

        console.log('Fast2SMS Request Payload:', { ...payload, numbers: '***' + mobile.slice(-4) });
        console.log('Fast2SMS Headers:', {
            authorization: process.env.FAST2SMS_API_KEY ? 'Present' : 'Missing',
            'Content-Type': 'application/json'
        });

        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', payload, {
            headers: {
                'authorization': process.env.FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Fast2SMS Response:', response.data);
        
        if (response.data.return === true) {
            console.log('SMS OTP sent successfully');
            return true;
        }

        // Handle specific Fast2SMS error cases
        if (response.data.message) {
            console.error('Fast2SMS Error Message:', response.data.message);
        }
        if (response.data.status === 'error') {
            console.error('Fast2SMS Status Error:', response.data);
        }
        
        return false;
    } catch (error) {
        console.error('SMS OTP Error Details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers ? 'Headers present' : 'No headers'
            }
        });
        return false;
    }
};

// Send OTP via Email using AWS SES
const sendEmailOTP = async (email, otp) => {
    try {
        console.log('Attempting to send Email OTP to:', email);
        const params = {
            Source: process.env.SES_FROM_EMAIL,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: 'Your RocketryBox Verification Code',
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: `
                            <h1>Email Verification</h1>
                            <p>Your verification code is: <strong>${otp}</strong></p>
                            <p>This code is valid for 5 minutes.</p>
                            <p>If you didn't request this code, please ignore this email.</p>
                        `,
                        Charset: 'UTF-8',
                    },
                },
            },
        };

        console.log('SES Configuration:', {
            region: process.env.AWS_REGION,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            fromEmail: process.env.SES_FROM_EMAIL
        });

        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        console.log('Email OTP sent successfully:', result);
        return true;
    } catch (error) {
        console.error('Email OTP Error Details:', {
            message: error.message,
            code: error.code,
            requestId: error.$metadata?.requestId,
            cfId: error.$metadata?.cfId,
            extendedRequestId: error.$metadata?.extendedRequestId,
            attempts: error.$metadata?.attempts,
            totalRetryDelay: error.$metadata?.totalRetryDelay
        });
        return false;
    }
};

// Generate and send mobile OTP
const generateAndSendMobileOTP = async (mobile) => {
    try {
        console.log('Generating mobile OTP for:', mobile);
        const otp = generateOTP();
        console.log('OTP generated:', otp);
        
        const stored = await setOTP(`mobile:${mobile}`, otp);
        console.log('OTP stored in Redis:', stored);
        
        if (!stored) {
            console.error('Failed to store OTP in Redis');
            return false;
        }
        
        return await sendSMSOTP(mobile, otp);
    } catch (error) {
        console.error('Error in generateAndSendMobileOTP:', error);
        return false;
    }
};

// Generate and send email OTP
const generateAndSendEmailOTP = async (email) => {
    try {
        console.log('Generating email OTP for:', email);
        const otp = generateOTP();
        console.log('OTP generated:', otp);
        
        const stored = await setOTP(`email:${email}`, otp);
        console.log('OTP stored in Redis:', stored);
        
        if (!stored) {
            console.error('Failed to store OTP in Redis');
            return false;
        }
        
        return await sendEmailOTP(email, otp);
    } catch (error) {
        console.error('Error in generateAndSendEmailOTP:', error);
        return false;
    }
};

// Verify mobile OTP
const verifyMobileOTP = async (mobile, otp) => {
    const storedOTP = await getOTP(`mobile:${mobile}`);
    if (!storedOTP) return false;
    return storedOTP === otp;
};

// Verify email OTP
const verifyEmailOTP = async (email, otp) => {
    const storedOTP = await getOTP(`email:${email}`);
    if (!storedOTP) return false;
    return storedOTP === otp;
};

export {
    generateAndSendMobileOTP,
    generateAndSendEmailOTP,
    verifyMobileOTP,
    verifyEmailOTP,
}; 