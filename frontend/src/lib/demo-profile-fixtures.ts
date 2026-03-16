export interface DemoCustomerProfileFixture {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  city: string;
  memberSince: string;
  totalBookings: number;
  addresses: Array<{
    id: string;
    label: string;
    value: string;
    isDefault: boolean;
  }>;
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'paypal';
    lastFour?: string;
    brand?: string;
  }>;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsAlerts: boolean;
  };
}

export const DEMO_CUSTOMER_PROFILE_FIXTURE: DemoCustomerProfileFixture = {
  id: "demo-customer-1",
  fullName: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phoneNumber: "+27 83 123 4567",
  avatarUrl: "https://picsum.photos/seed/sarah-johnson-avatar/200/200",
  city: "Sandton, Johannesburg",
  memberSince: "January 2023",
  totalBookings: 24,
  addresses: [
    {
      id: "addr-1",
      label: "Home",
      value: "123 Main Street, Sandton, Johannesburg, 2196",
      isDefault: true,
    },
    {
      id: "addr-2", 
      label: "Work",
      value: "456 Business Ave, Rosebank, Johannesburg, 2196",
      isDefault: false,
    },
  ],
  paymentMethods: [
    {
      id: "pm-1",
      type: "card",
      lastFour: "4242",
      brand: "Visa",
    },
    {
      id: "pm-2",
      type: "paypal",
    },
  ],
  preferences: {
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
  },
};
