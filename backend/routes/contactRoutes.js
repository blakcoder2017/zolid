const express = require('express');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const nodemailer = require('nodemailer');

const router = express.Router();

/**
 * POST /api/v1/contact
 * 
 * Send contact form email to info@zolid.online
 * 
 * Uses .env variables:
 * - EMAIL_USER: i
 * - EMAIL_PASSWD: SMTP password
 * - OUTGOING_SERVER:
 * - SMTP_PORT: 465 (SSL/TLS port)
 */
router.post('/', catchAsync(async (req, res, next) => {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return next(new AppError("Name, email, subject, and message are required.", 400));
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new AppError("Invalid email address format.", 400));
    }

    try {
        // Validate email configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWD || !process.env.OUTGOING_SERVER) {
            console.error('Email configuration missing. Please check .env file.');
            return next(new AppError("Email service is not configured. Please contact support.", 503));
        }

        // Create transporter using .env configuration
        const transporter = nodemailer.createTransport({
            host: process.env.OUTGOING_SERVER,
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true, // Port 465 requires secure connection (SSL/TLS)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWD,
            },
        });

        // Verify transporter configuration
        await transporter.verify();

        // Prepare email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to info@zolid.online (same as EMAIL_USER)
            replyTo: email, // Set reply-to to the form submitter's email
            subject: `Contact Form: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Submitted on ${new Date().toLocaleString()}</p>
            `,
            text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}

Message:
${message}

---
Submitted on ${new Date().toLocaleString()}
            `.trim()
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        console.log('Contact form email sent successfully:', {
            from: email,
            subject,
            timestamp: new Date().toISOString()
        });
        
        res.status(200).json({
            message: "Thank you for contacting us. We'll get back to you soon.",
            success: true
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return next(new AppError("Failed to send message. Please try again later.", 500));
    }
}));

module.exports = router;
