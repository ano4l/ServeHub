"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Calendar, MapPin, Phone, Mail, ArrowLeft, Home, MessageCircle } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingConfirmation {
  bookingId: string;
  service: {
    provider: string;
    service: string;
    category: string;
    price: string;
  };
  scheduling: {
    date: string;
    time: string;
    urgency: string;
  };
  location: {
    address: string;
    type: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  status: "pending" | "confirmed" | "in_progress" | "completed";
  estimatedDuration: string;
  providerRating: number;
  providerReviews: number;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading booking confirmation data
    const loadBookingConfirmation = async () => {
      // In a real app, this would fetch from an API using the booking ID from URL params
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBooking: BookingConfirmation = {
        bookingId: "BK-2024-0316-001",
        service: {
          provider: "Mpho Flow Fix",
          service: "Emergency plumbing",
          category: "Plumbing",
          price: "From R420",
        },
        scheduling: {
          date: "2024-03-18",
          time: "14:00",
          urgency: "urgent",
        },
        location: {
          address: "123 Main Street, Sandton, Johannesburg, 2196",
          type: "home",
        },
        contact: {
          name: "Sarah Johnson",
          phone: "+27 83 123 4567",
          email: "sarah.johnson@email.com",
        },
        status: "confirmed",
        estimatedDuration: "2-3 hours",
        providerRating: 4.9,
        providerReviews: 248,
      };
      
      setBooking(mockBooking);
      setLoading(false);
    };

    loadBookingConfirmation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
        <AppTabs />
        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-4 sm:px-6">
          <div className="mt-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="mt-4 text-white/70">Confirming your booking...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
        <AppTabs />
        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-4 sm:px-6">
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-semibold mb-4">Booking Not Found</h1>
            <p className="text-white/70 mb-6">We couldn't find your booking confirmation.</p>
            <Button onClick={() => router.push("/book")} className="bg-cyan-500 hover:bg-cyan-600">
              Book a Service
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-400/20 text-green-100 border-green-400/30";
      case "pending":
        return "bg-yellow-400/20 text-yellow-100 border-yellow-400/30";
      case "in_progress":
        return "bg-blue-400/20 text-blue-100 border-blue-400/30";
      case "completed":
        return "bg-gray-400/20 text-gray-100 border-gray-400/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-4 sm:px-6">
        {/* Success Header */}
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Booking Confirmed!</h1>
          <p className="mt-2 text-white/70">Your service has been booked successfully</p>
          <div className="mt-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
        </div>

        {/* Booking Details */}
        <div className="mt-8 space-y-4">
          {/* Booking ID */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Booking Reference</p>
                  <p className="font-mono font-semibold">{booking.bookingId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(booking.bookingId)}
                  className="text-white/70 hover:text-white"
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Service Details</h3>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{booking.service.service}</p>
                    <p className="text-sm text-white/70">{booking.service.provider}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="info" className="text-xs">{booking.service.category}</Badge>
                      <span className="text-xs text-white/50">⭐ {booking.providerRating} ({booking.providerReviews} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-cyan-100">{booking.service.price}</p>
                    <p className="text-xs text-white/50">Est. {booking.estimatedDuration}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Schedule</h3>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium">{new Date(booking.scheduling.date).toLocaleDateString("en-ZA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</p>
                  <p className="text-sm text-white/70">{booking.scheduling.time} • {booking.scheduling.urgency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Location</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-cyan-400 mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{booking.location.type}</p>
                  <p className="text-sm text-white/70">{booking.location.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm">{booking.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm">{booking.contact.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Provider
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/bookings")}
              className="border-white/35 text-white hover:bg-white/10"
            >
              View All Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="border-white/35 text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Important Information */}
        <div className="mt-6 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
          <h4 className="font-medium text-yellow-100 mb-2">Important Information</h4>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• The provider will contact you to confirm the exact timing</li>
            <li>• Please ensure someone is available at the service location</li>
            <li>• Payment will be processed after service completion</li>
            <li>• You can cancel or reschedule up to 24 hours before the appointment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
