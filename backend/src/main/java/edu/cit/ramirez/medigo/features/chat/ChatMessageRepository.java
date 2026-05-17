package edu.cit.ramirez.medigo.features.chat;

import edu.cit.ramirez.medigo.features.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            SELECT m
            FROM ChatMessage m
            JOIN FETCH m.sender s
            JOIN FETCH m.receiver r
            LEFT JOIN FETCH m.appointment a
            WHERE (s.id = :userA AND r.id = :userB)
               OR (s.id = :userB AND r.id = :userA)
            ORDER BY m.sentAt ASC
            """)
    List<ChatMessage> findConversation(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("""
            SELECT MAX(m.sentAt)
            FROM ChatMessage m
            WHERE m.receiver.id = :receiverId
              AND m.readAt IS NULL
            """)
    Instant findLatestUnread(@Param("receiverId") Long receiverId);

    @Query("""
            SELECT COUNT(m)
            FROM ChatMessage m
            WHERE m.receiver.id = :receiverId
              AND m.readAt IS NULL
            """)
    long countUnread(@Param("receiverId") Long receiverId);

    @Modifying
    @Query("""
            UPDATE ChatMessage m
            SET m.readAt = :readAt
            WHERE m.receiver.id = :receiverId
              AND m.sender.id = :senderId
              AND m.readAt IS NULL
            """)
    int markConversationRead(
            @Param("receiverId") Long receiverId,
            @Param("senderId") Long senderId,
            @Param("readAt") Instant readAt
    );

    @Query("""
            SELECT m
            FROM ChatMessage m
            WHERE (m.sender.id = :userA AND m.receiver.id = :userB)
               OR (m.sender.id = :userB AND m.receiver.id = :userA)
            ORDER BY m.sentAt DESC
            """)
    List<ChatMessage> findLatestMessagesBetween(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("""
            SELECT COUNT(m)
            FROM ChatMessage m
            WHERE m.sender.id = :senderId
              AND m.receiver.id = :receiverId
              AND m.readAt IS NULL
            """)
    long countUnreadFromSender(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}
