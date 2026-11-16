export const demoPortraits = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=720&q=85",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=720&q=85",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=720&q=85",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=720&q=85",
];

export const specialities = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Neurology",
  "General medicine",
  "Orthopedics",
];

export const navByRole = {
  patient: [
    { id: "discover", label: "Find a doctor", icon: "search" },
    { id: "appointments", label: "My appointments", icon: "calendar" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "profile", label: "My profile", icon: "user" },
  ],
  doctor: [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "appointments", label: "Received Appointments", icon: "calendar" },
    { id: "availability", label: "Availability", icon: "clock" },
    { id: "schedule", label: "My Schedule", icon: "calendar" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "profile", label: "My profile", icon: "user" },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "appointments", label: "Appointments", icon: "calendar" },
    { id: "people", label: "People & doctors", icon: "users" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "profile", label: "My profile", icon: "user" },
  ],
};

export const iconByName = {
  search: "Search",
  calendar: "CalendarDays",
  bell: "Bell",
  user: "UserRound",
  grid: "LayoutDashboard",
  clock: "Clock3",
  users: "UsersRound",
};
