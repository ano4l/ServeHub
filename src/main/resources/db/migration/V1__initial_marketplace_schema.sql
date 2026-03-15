create table if not exists users (
    id bigserial primary key,
    full_name varchar(120) not null,
    email varchar(160) not null unique,
    phone_number varchar(40) not null,
    password_hash varchar(120),
    role varchar(20) not null
);

create table if not exists providers (
    id bigserial primary key,
    user_id bigint not null references users(id),
    verification_status varchar(24) not null,
    city varchar(120) not null,
    service_radius_km integer not null,
    bio varchar(255) not null
);

create table if not exists provider_services (
    id bigserial primary key,
    provider_id bigint not null references providers(id),
    category varchar(120) not null,
    service_name varchar(120) not null,
    pricing_type varchar(20) not null,
    price numeric(12,2) not null,
    estimated_duration_minutes integer not null
);

create table if not exists bookings (
    id bigserial primary key,
    customer_id bigint not null references users(id),
    provider_id bigint not null references providers(id),
    service_offering_id bigint not null references provider_services(id),
    status varchar(24) not null,
    scheduled_for timestamptz not null,
    address varchar(255) not null,
    notes varchar(1000),
    quoted_price numeric(12,2) not null
);

create table if not exists booking_events (
    id bigserial primary key,
    booking_id bigint not null references bookings(id),
    event_type varchar(40) not null,
    detail varchar(1000) not null,
    occurred_at timestamptz not null
);

create table if not exists refresh_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id),
    token varchar(255) not null unique,
    expires_at timestamptz not null,
    revoked boolean not null default false
);

insert into users (full_name, email, phone_number, password_hash, role)
values
    ('Demo Customer', 'customer@servehub.dev', '+27110000001', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'CUSTOMER'),
    ('Verified Electrician', 'provider@servehub.dev', '+27110000002', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER')
on conflict (email) do nothing;

insert into providers (user_id, verification_status, city, service_radius_km, bio)
select id, 'VERIFIED', 'Johannesburg', 25, 'Licensed electrician for urgent residential callouts'
from users
where email = 'provider@servehub.dev'
and not exists (
    select 1 from providers p where p.user_id = users.id
);

insert into provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
select p.id, 'Electrical', 'Emergency rewiring', 'FIXED', 450.00, 90
from providers p
join users u on u.id = p.user_id
where u.email = 'provider@servehub.dev'
and not exists (
    select 1 from provider_services s where s.provider_id = p.id and s.service_name = 'Emergency rewiring'
);
