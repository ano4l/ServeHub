create table if not exists payments (
    id bigserial primary key,
    booking_id bigint not null references bookings(id),
    status varchar(24) not null,
    gross_amount numeric(12,2) not null,
    commission_amount numeric(12,2) not null,
    provider_net_amount numeric(12,2) not null,
    reference varchar(80) not null unique,
    updated_at timestamptz not null
);
