package edu.cit.ramirez.medigo.controller;

import edu.cit.ramirez.medigo.dto.ChatContactDto;
import edu.cit.ramirez.medigo.dto.ChatMessageDto;
import edu.cit.ramirez.medigo.dto.ChatSendRequest;
import edu.cit.ramirez.medigo.response.ApiResponse;
import edu.cit.ramirez.medigo.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatMessageDto> send(
            Principal principal,
            @Valid @RequestBody ChatSendRequest body) {
        return ApiResponse.ok(chatService.sendMessage(principal.getName(), body));
    }
}
