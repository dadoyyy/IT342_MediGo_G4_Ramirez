package edu.cit.ramirez.medigo.service;

import edu.cit.ramirez.medigo.dto.ChatContactDto;
import edu.cit.ramirez.medigo.dto.ChatMessageDto;
import edu.cit.ramirez.medigo.dto.ChatSendRequest;
import edu.cit.ramirez.medigo.entity.Appointment;
import edu.cit.ramirez.medigo.entity.ChatMessage;
import edu.cit.ramirez.medigo.entity.User;
import edu.cit.ramirez.medigo.exception.BadRequestException;
import edu.cit.ramirez.medigo.exception.ForbiddenActionException;
import edu.cit.ramirez.medigo.exception.ResourceNotFoundException;
import edu.cit.ramirez.medigo.repository.AppointmentRepository;
import edu.cit.ramirez.medigo.repository.ChatMessageRepository;
import edu.cit.ramirez.medigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<ChatContactDto> getContacts(String email, String query) {
        User current = findUserByEmail(email);
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);

        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(current.getId()))
                .filter(u -> isAllowedConversation(current, u))
                .filter(u -> q.isBlank()
                        || u.getFullName().toLowerCase(Locale.ROOT).contains(q)
                        || u.getEmail().toLowerCase(Locale.ROOT).contains(q))
                .map(this::toContactDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getConversation(String email, Long otherUserId) {
        User current = findUserByEmail(email);
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat contact not found."));

        if (!isAllowedConversation(current, other)) {
            throw new ForbiddenActionException("You are not allowed to chat with this user role.");
        }

        return chatMessageRepository.findConversation(current.getId(), other.getId()).stream()
                .map(this::toMessageDto)
                .toList();
    }

    @Transactional
    public ChatMessageDto sendMessage(String email, ChatSendRequest request) {
        User sender = findUserByEmail(email);
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found."));

        if (!isAllowedConversation(sender, receiver)) {
            throw new ForbiddenActionException("You are not allowed to send messages to this role.");
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

            boolean participantsMatch = (appointment.getPatient().getId().equals(sender.getId())
                    && appointment.getDoctor().getId().equals(receiver.getId()))
                    || (appointment.getPatient().getId().equals(receiver.getId())
                    && appointment.getDoctor().getId().equals(sender.getId()));

            if (!participantsMatch) {
                throw new BadRequestException("Appointment does not belong to this conversation.");
            }
        }

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setAppointment(appointment);
        message.setContent(request.getContent().trim());

        ChatMessage saved = chatMessageRepository.save(message);
        return toMessageDto(saved);
    }

    private boolean isAllowedConversation(User sender, User receiver) {
        String senderRole = sender.getRole().toUpperCase(Locale.ROOT);
        String receiverRole = receiver.getRole().toUpperCase(Locale.ROOT);

        if ("PATIENT".equals(senderRole)) {
            return "DOCTOR".equals(receiverRole);
        }

        if ("DOCTOR".equals(senderRole)) {
            return "DOCTOR".equals(receiverRole) || "PATIENT".equals(receiverRole);
        }

        return false;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private ChatContactDto toContactDto(User user) {
        return ChatContactDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private ChatMessageDto toMessageDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getFullName())
                .appointmentId(message.getAppointment() == null ? null : message.getAppointment().getId())
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .build();
    }
}
