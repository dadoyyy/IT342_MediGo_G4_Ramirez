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
            helper.setSubject("MediGo Profile Update: Application Status");

            String content = String.format(
                "<html><body style='font-family: sans-serif; line-height: 1.6; color: #333;'>" +
                "<h3 style='color: #D90429;'>Notice regarding your MediGo Profile</h3>" +
                "<p>Hello, Dr. %s</p>" +
                "<p>Thank you for your interest in joining MediGo. After reviewing your professional application and credentials, we are unable to approve your profile at this time.</p>" +
                "<div style='background: #f8f9fa; padding: 16px; border-left: 4px solid #D90429; margin: 20px 0;'>" +
                "<strong>Reason for decision:</strong><br/>%s" +
                "</div>" +
                "<p>You may log back into your account and re-submit your profile once the issues above have been addressed. If you have any questions regarding this decision, please contact our administrative support team.</p>" +
                "<p>Thank you for your patience.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Administrative Team</p>" +
                "</body></html>",
                name, reason != null ? reason : "Documents were unclear or did not meet our verification standards."
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Rejection email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send rejection email to {}", to, e);
        }
    }

    @Async
    public void sendSpecializationApprovalEmail(String to, String name, String newSpecialization) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("MediGo: Specialization Change Request Approved");

            String content = String.format(
                "<html><body>" +
                "<h3>Hello, Dr. %s</h3>" +
                "<p>Your request to update your medical specialization has been <strong>approved</strong>.</p>" +
                "<p>Your profile now reflects your new specialization: <strong>%s</strong></p>" +
                "<p>Thank you for keeping your profile up to date.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Team</p>" +
                "</body></html>",
                name, newSpecialization
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Specialization approval email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send specialization approval email to {}", to, e);
        }
    }

    @Async
    public void sendSpecializationRejectionEmail(String to, String name, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("MediGo: Specialization Change Request Update");

            String content = String.format(
                "<html><body style='font-family: sans-serif; line-height: 1.6; color: #333;'>" +
                "<h3 style='color: #D90429;'>Notice regarding Specialization Update</h3>" +
                "<p>Hello, Dr. %s</p>" +
                "<p>We have reviewed your request to change your medical specialization on the MediGo platform.</p>" +
                "<p>Unfortunately, we are unable to approve this specific change at this time.</p>" +
                "<div style='background: #f8f9fa; padding: 16px; border-left: 4px solid #D90429; margin: 20px 0;'>" +
                "<strong>Reason for decision:</strong><br/>%s" +
                "</div>" +
                "<p>If you believe this is an error or would like to provide additional documentation, please reach out to our administrative support team.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Administrative Team</p>" +
                "</body></html>",
                name, reason != null ? reason : "Insufficient documentation or verification provided."
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Specialization rejection email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send specialization rejection email to {}", to, e);
        }
    }

    @Async
    public void sendDoctorDeletionEmail(String to, String name, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("MediGo Account Status: Account Deleted");

            String content = String.format(
                "<html><body style='font-family: sans-serif; line-height: 1.6; color: #333;'>" +
                "<h3 style='color: #D90429;'>Notice of Account Deletion</h3>" +
                "<p>Hello, Dr. %s</p>" +
                "<p>We are writing to inform you that your MediGo professional account has been deleted by an administrator.</p>" +
                "<div style='background: #f8f9fa; padding: 16px; border-left: 4px solid #D90429; margin: 20px 0;'>" +
                "<strong>Reason for deletion:</strong><br/>%s" +
                "</div>" +
                "<p>All your profile data, documents, and active schedules have been removed from our system. If this was unexpected, please contact our administrative support team immediately.</p>" +
                "<p>Thank you for your time with MediGo.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Administrative Team</p>" +
                "</body></html>",
                name, reason != null ? reason : "Administrative cleanup / Violation of terms."
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Deletion email sent to doctor: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send deletion email to {}", to, e);
        }
    }

    @Async
    public void sendPatientDeletionEmail(String to, String name, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("MediGo Account Status: Account Deleted");

            String content = String.format(
                "<html><body style='font-family: sans-serif; line-height: 1.6; color: #333;'>" +
                "<h3 style='color: #D90429;'>Notice of Account Deletion</h3>" +
                "<p>Hello, %s</p>" +
                "<p>We are writing to inform you that your MediGo patient account has been deleted by an administrator.</p>" +
                "<div style='background: #f8f9fa; padding: 16px; border-left: 4px solid #D90429; margin: 20px 0;'>" +
                "<strong>Reason for deletion:</strong><br/>%s" +
                "</div>" +
                "<p>All your appointment history and personal health data have been removed from our system. If this was unexpected, please contact our support team.</p>" +
                "<p>Thank you for being part of MediGo.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>The MediGo Administrative Team</p>" +
                "</body></html>",
                name, reason != null ? reason : "Administrative cleanup / Inactivity."
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("Deletion email sent to patient: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send deletion email to {}", to, e);
        }
    }
}
