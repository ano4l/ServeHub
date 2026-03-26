import { HOME_ADDRESS_FIXTURES, HOME_BOOKING_FIXTURES, HOME_SERVICE_FIXTURES } from "./app-home-fixtures";
import { DEMO_CUSTOMER_PROFILE_FIXTURE } from "./demo-profile-fixtures";
import type { BookingStatus } from "./constants";
import type { BookingFilterParams, BookingListItem, ChatMessageItem, CreateBookingPayload } from "./api";

export interface DemoBookingEventItem {
  id: string;
  eventType: string;
  detail: string;
  occurredAt: string;
}

export interface DemoCreateBookingPayload extends CreateBookingPayload {
  demoProviderId?: string;
  demoProviderName?: string;
  demoProviderAvatar?: string;
  demoProviderPhone?: string;
  demoProviderEmail?: string;
  demoServiceName?: string;
  demoServiceCategory?: string;
  demoImageUrl?: string;
  demoPrice?: number;
  demoProviderRating?: number;
  demoProviderReviewCount?: number;
  demoEstimatedDuration?: string;
}

interface DemoParticipant {
  id: string;
  name: string;
  avatar?: string;
}

interface DemoBookingState {
  bookings: BookingListItem[];
  events: Record<string, DemoBookingEventItem[]>;
  messages: Record<string, ChatMessageItem[]>;
  counters: {
    booking: number;
    event: number;
    message: number;
  };
}

interface DemoStatusUpdate {
  status: BookingStatus;
  detail: string;
  cancelledReason?: string;
  message?: {
    sender: DemoParticipant;
    content: string;
  };
}

const STORAGE_KEY = "servehub-demo-booking-state";
const CHANGE_EVENT = "servehub:demo-booking-state";

const STATUS_PRIORITY: Record<BookingStatus, number> = {
  IN_PROGRESS: 0,
  ACCEPTED: 1,
  REQUESTED: 2,
  REVIEWABLE: 3,
  COMPLETED: 4,
  DECLINED: 5,
  CANCELLED: 6,
  EXPIRED: 7,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePriceLabel(value?: string) {
  if (!value) {
    return undefined;
  }

  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function providerAvatar(index: number) {
  return `https://randomuser.me/api/portraits/men/${(index % 40) + 10}.jpg`;
}

function providerEmail(name: string) {
  return `${slugify(name) || "provider"}@servehub.demo`;
}

function providerPhone(index: number) {
  const middle = String(200 + index).padStart(3, "0");
  const end = String(4000 + index).padStart(4, "0");
  return `+27 82 ${middle} ${end}`;
}

function providerDuration(index: number) {
  return `${1 + (index % 2)}-${2 + (index % 2)} hrs`;
}

function buildCustomer() {
  return {
    id: DEMO_CUSTOMER_PROFILE_FIXTURE.id,
    name: DEMO_CUSTOMER_PROFILE_FIXTURE.fullName,
    avatar: DEMO_CUSTOMER_PROFILE_FIXTURE.avatarUrl,
  };
}

function resolveFixtureFromOfferingId(offeringId: string) {
  const direct = HOME_SERVICE_FIXTURES.find((fixture) => fixture.id === offeringId);
  if (direct) {
    return direct;
  }

  const match = offeringId.match(/demo-offering-(\d+)/);
  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  return HOME_SERVICE_FIXTURES[index] ?? null;
}

function resolveFixtureForDraft(data: DemoCreateBookingPayload) {
  const byOffering = resolveFixtureFromOfferingId(data.offeringId);
  if (byOffering) {
    return byOffering;
  }

  if (data.demoProviderId) {
    const byProvider = HOME_SERVICE_FIXTURES.find((fixture) => fixture.providerId === data.demoProviderId);
    if (byProvider) {
      return byProvider;
    }
  }

  if (data.demoProviderName) {
    const byProviderName = HOME_SERVICE_FIXTURES.find((fixture) => fixture.providerName === data.demoProviderName);
    if (byProviderName) {
      return byProviderName;
    }
  }

  if (data.demoServiceCategory) {
    const byCategory = HOME_SERVICE_FIXTURES.find(
      (fixture) => fixture.category.toLowerCase() === data.demoServiceCategory?.toLowerCase(),
    );
    if (byCategory) {
      return byCategory;
    }
  }

  if (data.demoServiceName) {
    const query = data.demoServiceName.toLowerCase();
    const byName = HOME_SERVICE_FIXTURES.find(
      (fixture) =>
        fixture.title.toLowerCase().includes(query) ||
        query.includes(fixture.title.toLowerCase()),
    );
    if (byName) {
      return byName;
    }
  }

  return null;
}

function sortBookings(bookings: BookingListItem[]) {
  return [...bookings].sort((left, right) => {
    const leftRank = STATUS_PRIORITY[left.status] ?? 99;
    const rightRank = STATUS_PRIORITY[right.status] ?? 99;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime();
  });
}

function buildBookingRecord(
  bookingNumber: number,
  overrides: Partial<BookingListItem> & Pick<BookingListItem, "status" | "service" | "scheduledAt" | "address">,
  index: number,
): BookingListItem {
  const fixture =
    HOME_SERVICE_FIXTURES.find((item) => item.providerName === overrides.provider?.name) ??
    HOME_SERVICE_FIXTURES[index % HOME_SERVICE_FIXTURES.length];

  const customer = overrides.customer ?? buildCustomer();
  const providerName = overrides.provider?.name ?? fixture.providerName;

  return {
    id: String(bookingNumber),
    reference: `BK-${bookingNumber}`,
    status: overrides.status,
    provider: {
      id: overrides.provider?.id ?? fixture.providerId,
      name: providerName,
      avatar: overrides.provider?.avatar ?? providerAvatar(index),
    },
    customer,
    service: overrides.service,
    serviceOfferingId: overrides.serviceOfferingId ?? `demo-offering-${index}`,
    scheduledAt: overrides.scheduledAt,
    address: overrides.address,
    notes: overrides.notes,
    price: overrides.price,
    cancelledReason: overrides.cancelledReason,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    bookingType: "AT_CUSTOMER",
    providerPhone: overrides.providerPhone ?? providerPhone(index),
    providerEmail: overrides.providerEmail ?? providerEmail(providerName),
    serviceCategory: overrides.serviceCategory ?? fixture.category,
    imageUrl: overrides.imageUrl ?? fixture.imageUrl,
    providerRating: overrides.providerRating ?? fixture.rating,
    providerReviewCount: overrides.providerReviewCount ?? fixture.reviews,
    estimatedDuration: overrides.estimatedDuration ?? providerDuration(index),
  };
}

function eventDetailForStatus(status: BookingStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "The provider is on-site and the job is in progress.";
    case "ACCEPTED":
      return "The provider confirmed the appointment window.";
    case "REQUESTED":
      return "Your booking request has been created and is awaiting confirmation.";
    case "COMPLETED":
    case "REVIEWABLE":
      return "The appointment has been completed.";
    case "DECLINED":
      return "The provider declined this booking request.";
    case "CANCELLED":
      return "This booking was cancelled.";
    case "EXPIRED":
      return "This booking expired before it could be confirmed.";
    default:
      return "Booking updated.";
  }
}

function buildSeedBookings() {
  const now = new Date();
  const upcoming = new Date(now);
  upcoming.setHours(9, 0, 0, 0);
  upcoming.setDate(upcoming.getDate() + 1);

  const requested = new Date(now);
  requested.setHours(10, 30, 0, 0);
  requested.setDate(requested.getDate() + 2);

  const completed = new Date(now);
  completed.setHours(15, 0, 0, 0);
  completed.setDate(completed.getDate() - 3);

  return sortBookings([
    buildBookingRecord(
      1201,
      {
        status: "IN_PROGRESS",
        service: HOME_BOOKING_FIXTURES[0]?.service ?? "Burst geyser repair",
        scheduledAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        address: HOME_BOOKING_FIXTURES[0]?.address ?? HOME_ADDRESS_FIXTURES[0].value,
        price: 420,
        createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
        provider: {
          id: HOME_SERVICE_FIXTURES[0].providerId,
          name: HOME_BOOKING_FIXTURES[0]?.provider ?? HOME_SERVICE_FIXTURES[0].providerName,
          avatar: providerAvatar(0),
        },
        serviceOfferingId: "demo-offering-0",
      },
      0,
    ),
    buildBookingRecord(
      1202,
      {
        status: "ACCEPTED",
        service: HOME_BOOKING_FIXTURES[1]?.service ?? "Move-out deep clean",
        scheduledAt: upcoming.toISOString(),
        address: HOME_BOOKING_FIXTURES[1]?.address ?? HOME_ADDRESS_FIXTURES[2].value,
        price: 360,
        createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
        provider: {
          id: HOME_SERVICE_FIXTURES[2].providerId,
          name: HOME_BOOKING_FIXTURES[1]?.provider ?? HOME_SERVICE_FIXTURES[2].providerName,
          avatar: providerAvatar(2),
        },
        serviceOfferingId: "demo-offering-2",
      },
      2,
    ),
    buildBookingRecord(
      1203,
      {
        status: "REQUESTED",
        service: "Generator changeover",
        scheduledAt: requested.toISOString(),
        address: HOME_BOOKING_FIXTURES[2]?.address ?? HOME_ADDRESS_FIXTURES[1].value,
        price: 650,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        provider: {
          id: HOME_SERVICE_FIXTURES[1].providerId,
          name: HOME_SERVICE_FIXTURES[1].providerName,
          avatar: providerAvatar(1),
        },
        serviceOfferingId: "demo-offering-1",
      },
      1,
    ),
    buildBookingRecord(
      1204,
      {
        status: "COMPLETED",
        service: HOME_SERVICE_FIXTURES[3].title,
        scheduledAt: completed.toISOString(),
        address: HOME_ADDRESS_FIXTURES[1].value,
        price: parsePriceLabel(HOME_SERVICE_FIXTURES[3].priceLabel),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        provider: {
          id: HOME_SERVICE_FIXTURES[3].providerId,
          name: HOME_SERVICE_FIXTURES[3].providerName,
          avatar: providerAvatar(3),
        },
        serviceOfferingId: "demo-offering-3",
      },
      3,
    ),
  ]);
}

function pushEvent(
  state: DemoBookingState,
  bookingId: string,
  eventType: string,
  detail: string,
  occurredAt: string,
) {
  state.counters.event += 1;
  const nextEvent: DemoBookingEventItem = {
    id: String(state.counters.event),
    eventType,
    detail,
    occurredAt,
  };

  state.events[bookingId] = [...(state.events[bookingId] ?? []), nextEvent].sort(
    (left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
  );
}

function pushMessage(
  state: DemoBookingState,
  bookingId: string,
  sender: DemoParticipant,
  content: string,
  sentAt: string,
) {
  state.counters.message += 1;
  const nextMessage: ChatMessageItem = {
    id: String(state.counters.message),
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar,
    content,
    sentAt,
    read: true,
  };

  state.messages[bookingId] = [...(state.messages[bookingId] ?? []), nextMessage].sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  );

  return nextMessage;
}

function buildSeedState(): DemoBookingState {
  const bookings = buildSeedBookings();
  const state: DemoBookingState = {
    bookings,
    events: {},
    messages: {},
    counters: {
      booking: Math.max(...bookings.map((booking) => Number(booking.id)), 1200),
      event: 9000,
      message: 7000,
    },
  };

  bookings.forEach((booking, index) => {
    pushEvent(
      state,
      booking.id,
      "REQUESTED",
      "Booking created in demo mode.",
      booking.createdAt,
    );

    if (booking.status !== "REQUESTED") {
      pushEvent(
        state,
        booking.id,
        booking.status,
        eventDetailForStatus(booking.status),
        new Date(new Date(booking.createdAt).getTime() + 30 * 60 * 1000).toISOString(),
      );
    }

    if (booking.status === "COMPLETED") {
      pushEvent(
        state,
        booking.id,
        "COMPLETED",
        "The customer marked this job complete.",
        new Date(new Date(booking.scheduledAt).getTime() + 90 * 60 * 1000).toISOString(),
      );
    }

    pushMessage(
      state,
      booking.id,
      booking.provider,
      booking.status === "REQUESTED"
        ? "Thanks, I have your request. I will confirm the appointment shortly."
        : booking.status === "IN_PROGRESS"
          ? "I am on-site now and will keep you posted here."
          : booking.status === "COMPLETED"
            ? "Thanks again for the booking. Everything is wrapped up."
            : "Your appointment is in the queue and all the details are ready on my side.",
      new Date(new Date(booking.createdAt).getTime() + (index + 1) * 15 * 60 * 1000).toISOString(),
    );
  });

  return state;
}

function loadState() {
  if (!canUseStorage()) {
    return buildSeedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedState();
    saveState(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as DemoBookingState;
    if (!parsed?.bookings || !parsed?.events || !parsed?.messages || !parsed?.counters) {
      throw new Error("Invalid demo booking state");
    }

    return parsed;
  } catch {
    const seeded = buildSeedState();
    saveState(seeded);
    return seeded;
  }
}

function saveState(state: DemoBookingState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function findBookingIndex(bookings: BookingListItem[], bookingId: string) {
  return bookings.findIndex((booking) => booking.id === bookingId);
}

export function getDemoBookings(params?: BookingFilterParams) {
  const state = loadState();
  const status = params?.status?.toUpperCase();
  const filtered =
    status && status !== "ALL"
      ? state.bookings.filter((booking) => booking.status === status)
      : state.bookings;

  return sortBookings(filtered);
}

export function getDemoBooking(bookingId: string) {
  return loadState().bookings.find((booking) => booking.id === bookingId) ?? null;
}

export function createDemoBooking(
  payload: DemoCreateBookingPayload,
  customer?: DemoParticipant,
) {
  const state = loadState();
  const fixture = resolveFixtureForDraft(payload);
  const nextIndex = state.counters.booking + 1;
  const fallbackCategory = payload.demoServiceCategory ?? fixture?.category ?? "Home service";
  const fallbackProviderName =
    payload.demoProviderName ??
    fixture?.providerName ??
    `ServeHub ${fallbackCategory} Crew`;

  state.counters.booking = nextIndex;

  const booking = buildBookingRecord(
    nextIndex,
    {
      status: "REQUESTED",
      service: payload.demoServiceName ?? fixture?.title ?? "Demo booking",
      scheduledAt: payload.scheduledAt,
      address: payload.address?.trim() || HOME_ADDRESS_FIXTURES[0].value,
      notes: payload.notes?.trim() || undefined,
      price: payload.demoPrice ?? parsePriceLabel(fixture?.priceLabel),
      createdAt: new Date().toISOString(),
      provider: {
        id: payload.demoProviderId ?? fixture?.providerId ?? `demo-provider-${slugify(fallbackProviderName)}`,
        name: fallbackProviderName,
        avatar: payload.demoProviderAvatar ?? providerAvatar(nextIndex),
      },
      customer: customer ?? buildCustomer(),
      serviceOfferingId: payload.offeringId,
      providerPhone: payload.demoProviderPhone ?? providerPhone(nextIndex),
      providerEmail: payload.demoProviderEmail ?? providerEmail(fallbackProviderName),
      serviceCategory: fallbackCategory,
      imageUrl: payload.demoImageUrl ?? fixture?.imageUrl,
      providerRating: payload.demoProviderRating ?? fixture?.rating ?? 4.8,
      providerReviewCount: payload.demoProviderReviewCount ?? fixture?.reviews ?? 96,
      estimatedDuration: payload.demoEstimatedDuration ?? providerDuration(nextIndex),
    },
    nextIndex,
  );

  state.bookings = sortBookings([booking, ...state.bookings]);
  state.events[booking.id] = [];
  state.messages[booking.id] = [];

  pushEvent(
    state,
    booking.id,
    "REQUESTED",
    "Booking created in demo mode and saved in this browser.",
    booking.createdAt,
  );

  pushMessage(
    state,
    booking.id,
    booking.provider,
    "Thanks, I received your booking request. I will confirm the appointment here.",
    new Date(new Date(booking.createdAt).getTime() + 5 * 60 * 1000).toISOString(),
  );

  saveState(state);
  return booking;
}

export function updateDemoBookingStatus(bookingId: string, update: DemoStatusUpdate) {
  const state = loadState();
  const index = findBookingIndex(state.bookings, bookingId);
  if (index < 0) {
    return null;
  }

  const existing = state.bookings[index];
  const nextBooking: BookingListItem = {
    ...existing,
    status: update.status,
    cancelledReason: update.cancelledReason ?? existing.cancelledReason,
  };

  state.bookings[index] = nextBooking;
  state.bookings = sortBookings(state.bookings);

  pushEvent(
    state,
    bookingId,
    update.status,
    update.detail,
    new Date().toISOString(),
  );

  if (update.message) {
    pushMessage(
      state,
      bookingId,
      update.message.sender,
      update.message.content,
      new Date().toISOString(),
    );
  }

  saveState(state);
  return nextBooking;
}

export function rescheduleDemoBooking(bookingId: string, scheduledAt: string, detail: string) {
  const state = loadState();
  const index = findBookingIndex(state.bookings, bookingId);
  if (index < 0) {
    return null;
  }

  state.bookings[index] = {
    ...state.bookings[index],
    scheduledAt,
    status: "ACCEPTED",
  };
  state.bookings = sortBookings(state.bookings);

  pushEvent(state, bookingId, "ACCEPTED", detail, new Date().toISOString());
  saveState(state);
  return state.bookings.find((booking) => booking.id === bookingId) ?? null;
}

export function getDemoBookingEvents(bookingId: string) {
  const state = loadState();
  return [...(state.events[bookingId] ?? [])].sort(
    (left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
  );
}

export function getDemoMessages(bookingId: string) {
  const state = loadState();
  return [...(state.messages[bookingId] ?? [])].sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  );
}

export function sendDemoMessage(
  bookingId: string,
  sender: DemoParticipant,
  content: string,
  autoReply?: {
    sender: DemoParticipant;
    content: string;
  },
) {
  const state = loadState();
  const index = findBookingIndex(state.bookings, bookingId);
  if (index < 0) {
    return null;
  }

  const sentAt = new Date().toISOString();
  const message = pushMessage(state, bookingId, sender, content, sentAt);

  if (autoReply) {
    pushMessage(
      state,
      bookingId,
      autoReply.sender,
      autoReply.content,
      new Date(new Date(sentAt).getTime() + 60 * 1000).toISOString(),
    );
  }

  saveState(state);
  return message;
}

export function subscribeToDemoBookingState(callback: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
