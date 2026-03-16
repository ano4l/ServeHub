export interface DemoCustomerProfileFixture {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  city: string;
}

export const DEMO_CUSTOMER_PROFILE_FIXTURE: DemoCustomerProfileFixture = {
  id: "demo-customer-1",
  fullName: "John Doe",
  email: "johndoe@email.com",
  phoneNumber: "+1 (555) 123-4567",
  avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  city: "Sandton",
};
