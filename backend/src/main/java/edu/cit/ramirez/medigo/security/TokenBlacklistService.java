package edu.cit.ramirez.medigo.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory JWT blacklist.
 * Revoked tokens are stored with their expiry timestamp so the scheduled
 * cleanup can prune entries that are already expired (they cannot be reused
 * regardless of the blacklist at that point).
 */
@Service
@Slf4j
public class TokenBlacklistService {

    // token → expiry time (ms since epoch)
    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    /** Revoke a token until its natural expiry. */
    public void revoke(String token, Date expiry) {
        blacklist.put(token, expiry.getTime());
        log.debug("Token revoked, expires at {}", expiry);
    }

    /** Returns true if the token has been explicitly revoked. */
    public boolean isRevoked(String token) {
        return blacklist.containsKey(token);
    }

    /** Remove entries whose JWT expiry has already passed — runs every 30 minutes. */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void purgeExpired() {
        long now = System.currentTimeMillis();
        int before = blacklist.size();
        blacklist.entrySet().removeIf(e -> e.getValue() <= now);
        int removed = before - blacklist.size();
        if (removed > 0) {
            log.debug("Purged {} expired blacklist entries", removed);
        }
    }
}
