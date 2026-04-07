package com.marketplace.provider.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalTime;

@Entity
@Table(name = "provider_availability",
       uniqueConstraints = @UniqueConstraint(columnNames = {"provider_id", "day_of_week"}))
public class ProviderAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek; // 0=Sunday .. 6=Saturday

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean enabled = true;

    protected ProviderAvailability() {
    }

    public ProviderAvailability(ProviderProfile provider, int dayOfWeek,
                                LocalTime startTime, LocalTime endTime, boolean enabled) {
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            throw new IllegalArgumentException("dayOfWeek must be 0-6");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        this.provider = provider;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

    public ProviderProfile getProvider() {
        return provider;
    }

    public int getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
