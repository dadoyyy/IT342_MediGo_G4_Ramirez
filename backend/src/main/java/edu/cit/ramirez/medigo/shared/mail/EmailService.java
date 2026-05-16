package edu.cit.ramirez.medigo.shared.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String to, String name, String token, String verificationUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Verify your MediGo Account");

            String content = String.format(
                "<html><body>" +
                "<h3>Welcome to MediGo, %s!</h3>" +
                "<p>Please click the link below to verify your email and activate your account:</p>" +
                "<a href='%s?token=%s' style='display:inline-block;padding:10px 20px;background:#EF233C;color:#fff;text-decoration:none;border-radius:5px;'>Verify Email</a>" +
                "<p>If you didn't register on MediGo, please ignore this email.</p>" +
                "</body></html>",
                name, verificationUrl, token
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to {}", to, e);
        }
    }

    @Async
    public void sendDoctorApprovalEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Congratulations! Your MediGo Professional Profile is Approved");

            String content = String.format(
                "<html><body>" +
                "<h3>Great news, Dr. %s!</h3>" +
                "<p>Your professional credentials have been verified and approved by our medical board.</p>" +
                "<p>Your profile is now live on the MediGo platform, and patients can start booking appointments with you.</p>" +
                "<p>Welcome to our network of healthcare professionals!</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Team</p>" +
                "</body></html>",
                name
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Approval email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send approval email to {}", to, e);
        }
    }

    @Async
    public void sendDoctorRejectionEmail(String to, String name, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Update regarding your MediGo Professional Profile");

            String content = String.format(
                "<html><body>" +
                "<h3>Hello, Dr. %s</h3>" +
                "<p>Thank you for your interest in joining MediGo. After reviewing your application, we were unable to approve your profile at this time.</p>" +
                "<p><strong>Reason for decision:</strong> %s</p>" +
                "<p>You may re-submit your application after addressing the feedback above.</p>" +
                "<p>If you have any questions, please contact our support team.</p>" +
                "</body></html>",
                name, reason != null ? reason : "Documents were unclear or invalid."
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Rejection email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send rejection email to {}", to, e);
        }
    }
}
