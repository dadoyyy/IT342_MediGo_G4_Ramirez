package edu.cit.ramirez.medigo.patterns.observer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer that reacts to authentication-domain events.
 */
@Component
@Slf4j
public class AuthEventListener {

    @EventListener
    public void onAuthEvent(AuthEvent event) {
        log.info("Auth event: type={}, email={}, role={}", event.type(), event.email(), event.role());
    }
}
