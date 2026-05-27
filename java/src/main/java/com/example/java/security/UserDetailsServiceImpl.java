package com.example.java.security;

import com.example.java.entity.User;
import com.example.java.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;

/**
 * Spring Security用户详情服务实现
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.findByEmail(username);

        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        return buildUserDetails(user);
    }

    /**
     * 根据用户类型动态构建权限列表
     *
     * 权限层级：
     *   管理员(user_type=3 或 is_admin=true) → ROLE_ADMIN, ROLE_USER
     *   企业用户(user_type=2)               → ROLE_ENTERPRISE, ROLE_USER
     *   个人用户(user_type=1)               → ROLE_USER
     */
    private Collection<? extends GrantedAuthority> buildAuthorities(User user) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        if (user.hasAdminRole()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else if (user.getUserType() != null && user.getUserType() == 2) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ENTERPRISE"));
        }

        return authorities;
    }

    /**
     * 根据用户ID加载用户
     */
    public UserDetails loadUserById(String userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在");
        }

        return buildUserDetails(user);
    }

    private org.springframework.security.core.userdetails.User buildUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                true,  // enabled
                true,  // accountNonExpired
                true,  // credentialsNonExpired
                true,  // accountNonLocked
                buildAuthorities(user)
        );
    }
}
