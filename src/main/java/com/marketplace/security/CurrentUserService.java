package com.marketplace.security;

import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public UserAccount requireUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
            || !authentication.isAuthenticated()
            || authentication instanceof AnonymousAuthenticationToken
            || !(authentication.getPrincipal() instanceof UserAccount user)) {
            throw new IllegalArgumentException("Authenticated user is required");
        }
        return user;
    }

    public boolean hasAnyRole(Role... roles) {
        UserAccount user = requireUser();
        for (Role role : roles) {
            if (user.getRole() == role) {
                return true;
            }
        }
        return false;
    }
}
