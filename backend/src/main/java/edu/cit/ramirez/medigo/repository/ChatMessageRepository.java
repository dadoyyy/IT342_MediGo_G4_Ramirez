package edu.cit.ramirez.medigo.repository;

import edu.cit.ramirez.medigo.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
