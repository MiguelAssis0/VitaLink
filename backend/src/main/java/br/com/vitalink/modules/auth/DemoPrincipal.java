package br.com.vitalink.modules.auth;

import br.com.vitalink.shared.domain.Role;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public record DemoPrincipal(AppUser user) implements UserDetails {
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + user.role.name())); }
    @Override public String getPassword() { return user.passwordHash; }
    @Override public String getUsername() { return user.email; }
    @Override public boolean isEnabled() { return user.disabledAt == null; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
