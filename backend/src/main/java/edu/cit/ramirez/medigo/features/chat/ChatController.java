package edu.cit.ramirez.medigo.features.chat;

import edu.cit.ramirez.medigo.features.chat.dto.ChatContactDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatMessageDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatSendRequest;
import edu.cit.ramirez.medigo.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/contacts")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<ChatContactDto>> contacts(
            Principal principal,
            @RequestParam(value = "q", required = false) String query) {
        return ApiResponse.ok(chatService.getContacts(principal.getName(), query));
    }

    @GetMapping("/conversations/{otherUserId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<ChatMessageDto>> conversation(
            Principal principal,
            @PathVariable Long otherUserId) {
        return ApiResponse.ok(chatService.getConversation(principal.getName(), otherUserId));
    }

    @GetMapping("/unread/latest")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Instant> latestIncoming(Principal principal) {
        return ApiResponse.ok(chatService.getLatestUnreadTimestamp(principal.getName()));
    }

    @GetMapping("/unread/count")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Long> unreadCount(Principal principal) {
        return ApiResponse.ok(chatService.getUnreadCount(principal.getName()));
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatMessageDto> send(
            Principal principal,
            @Valid @RequestBody ChatSendRequest body) {
        return ApiResponse.ok(chatService.sendMessage(principal.getName(), body));
    }
}
