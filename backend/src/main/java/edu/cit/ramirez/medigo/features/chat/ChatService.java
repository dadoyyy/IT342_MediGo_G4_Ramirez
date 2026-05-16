package edu.cit.ramirez.medigo.features.chat;

import edu.cit.ramirez.medigo.features.appointment.AppointmentRepository;
import edu.cit.ramirez.medigo.features.appointment.entity.Appointment;
import edu.cit.ramirez.medigo.features.chat.dto.ChatContactDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatMessageDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatSendRequest;
import edu.cit.ramirez.medigo.features.chat.entity.ChatMessage;
import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.BadRequestException;
import edu.cit.ramirez.medigo.shared.exception.ForbiddenActionException;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ChatService {

        private final UserRepository userRepository;
        private final AppointmentRepository appointmentRepository;
        private final ChatMessageRepository chatMessageRepository;

        /**
         * Returns the list of users the current user is allowed to chat with.
         * A conversation is allowed only when a CONFIRMED or COMPLETED appointment
         * exists between the patient and the doctor.
         */
        @Transactional(readOnly = true)
        public List<ChatContactDto> getContacts(String email, String query) {
                User current = findUserByEmail(email);
                String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);

                return userRepository.findAll().stream()
                                .filter(u -> !u.getId().equals(current.getId()))
                                .filter(u -> hasSuccessfulAppointment(current, u))
                                .filter(u -> q.isBlank()
                                                || u.getFullName().toLowerCase(Locale.ROOT).contains(q)
                                                || u.getEmail().toLowerCase(Locale.ROOT).contains(q))
                                .map(this::toContactDto)
                                .toList();
        }

        @Transactional
        public List<ChatMessageDto> getConversation(String email, Long otherUserId) {
                User current = findUserByEmail(email);
                User other = userRepository.findById(otherUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("Chat contact not found."));

                if (!hasSuccessfulAppointment(current, other)) {
                        throw new ForbiddenActionException(
                                        "You can only message users with whom you have a confirmed or completed appointment.");
                }

                chatMessageRepository.markConversationRead(current.getId(), other.getId(), Instant.now());

                return chatMessageRepository.findConversation(current.getId(), other.getId()).stream()
                                .map(this::toMessageDto)
                                .toList();
        }

        @Transactional(readOnly = true)
        public Instant getLatestUnreadTimestamp(String email) {
                User current = findUserByEmail(email);
                return chatMessageRepository.findLatestUnread(current.getId());
        }

        @Transactional(readOnly = true)
        public long getUnreadCount(String email) {
                User current = findUserByEmail(email);
                return chatMessageRepository.countUnread(current.getId());
        }

        @Transactional
        public ChatMessageDto sendMessage(String email, ChatSendRequest request) {
                User sender = findUserByEmail(email);
                User receiver = userRepository.findById(request.getReceiverId())
                                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found."));

                if (!hasSuccessfulAppointment(sender, receiver)) {
                        throw new ForbiddenActionException(
                                        "You can only send messages to users with whom you have a confirmed or completed appointment.");
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

        /**
         * A conversation is permitted when:
         * - One user is a PATIENT and the other is a DOCTOR (or vice-versa), AND
         * - At least one CONFIRMED or COMPLETED appointment exists between them.
         *
         * Admins are not allowed to participate in patient-doctor chats.
         */
        private boolean hasSuccessfulAppointment(User a, User b) {
                String roleA = a.getRole().toUpperCase(Locale.ROOT);
                String roleB = b.getRole().toUpperCase(Locale.ROOT);

                // Only patient ↔ doctor conversations are allowed
                boolean isPatientDoctor = ("PATIENT".equals(roleA) && "DOCTOR".equals(roleB))
                                || ("DOCTOR".equals(roleA) && "PATIENT".equals(roleB));

                if (!isPatientDoctor)
                        return false;

                // Determine which user is the patient and which is the doctor
                Long patientId = "PATIENT".equals(roleA) ? a.getId() : b.getId();
                Long doctorId = "DOCTOR".equals(roleA) ? a.getId() : b.getId();

                return appointmentRepository.existsSuccessfulAppointmentBetween(patientId, doctorId);
        }

        private User findUserByEmail(String email) {
                return userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        }

        private ChatContactDto toContactDto(User user) {
                String fullName = user.getFullName() == null ? "" : user.getFullName().trim();
                int spaceIdx = fullName.indexOf(' ');
                String firstName = spaceIdx > 0 ? fullName.substring(0, spaceIdx) : fullName;
                String lastName = spaceIdx > 0 ? fullName.substring(spaceIdx + 1) : "";

                return ChatContactDto.builder()
                                .userId(user.getId()) // frontend uses userId
                                .id(user.getId())
                                .fullName(fullName)
                                .firstName(firstName)
                                .lastName(lastName)
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
                                .appointmentId(message.getAppointment() == null ? null
                                                : message.getAppointment().getId())
                                .content(message.getContent())
                                .sentAt(message.getSentAt())
                                .build();
        }
}
