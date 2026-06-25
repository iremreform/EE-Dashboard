/** User-facing portal copy — keep area names and page titles distinct to avoid repetition. */

export const areas = {
  driver: "Driver",
  admin: "Admin",
} as const;

export const pages = {
  homeTagline: "Energetic Exotics Portal",
  homeTitle: "Choose access",
  signIn: "Sign in",
  passwordHelp: "Password help",
  driverDashboardGreeting: "Hello, John Davis",
  driverDashboardLead: "What would you like to start?",
  adminDashboardGreeting: "Hello, Jordan Blake",
  adminDashboardLead: "Review submissions, manage drivers, and monitor alerts.",
  placeholderBody: "More screens coming soon.",
} as const;

export const homeChoices = {
  driver: {
    description: "Delivery check-in, pickup / return, and submissions.",
  },
  admin: {
    description: "Driver management, submission review, and alerts.",
  },
} as const;

export const driverWorkflows = {
  delivery: {
    title: "Vehicle Delivery",
    description: "Check-in form for handing the vehicle to the guest.",
    actionLabel: "Start Delivery Check-In",
    href: "/driver/delivery",
    placeholder: "Delivery form coming soon.",
  },
  pickup: {
    title: "Pickup / Return",
    description: "Check-out form when the guest returns the vehicle.",
    actionLabel: "Start Pickup Check-Out",
    href: "/driver/pickup",
    placeholder: "Pickup / return form coming soon.",
  },
} as const;

export const driverForms = {
  delivery: {
    tagline: "Delivery Check-In",
    title: "Delivery Form",
    submitLabel: "Submit delivery report",
    sections: {
      guest: {
        title: "Guest / Renter Information",
        fields: [
          ["Guest first name", "First name"],
          ["Guest last name", "Last name"],
          ["Member number", "Member #"],
          ["Reservation number", "Reservation #"],
        ],
      },
      vehicle: {
        title: "Vehicle Details",
        fields: [
          ["Make / model", "Vehicle make & model"],
          ["Color / plate", "Color, license plate"],
          ["VIN or fleet ID", "VIN / fleet ID"],
          ["Mileage / fuel level", "Odometer, fuel %"],
        ],
      },
      media: {
        title: "Vehicle Media Upload",
        uploads: [
          ["Front", "Photo"],
          ["Rear", "Photo"],
          ["Driver side", "Photo"],
          ["Passenger side", "Photo"],
          ["Interior", "Photo"],
          ["Wheels", "Photo"],
          ["Odometer", "Photo"],
          ["Fuel level", "Photo"],
          ["Existing damage", "If any"],
        ],
        videoLabel: "Upload vehicle walkaround video",
      },
      verification: {
        title: "Guest Verification Uploads",
        uploads: ["Driver's license — front", "Driver's license — back"],
      },
      payment: {
        title: "Payment Verified Status",
        label: "Payment verified status",
        placeholder: "Verified / not verified",
      },
      signature: {
        title: "Guest Signature",
        confirmation: "Guest confirms vehicle condition and delivery acceptance.",
      },
      driver: {
        title: "Driver Confirmation",
        confirmation: "I confirm the submitted details, media, and notes are accurate.",
      },
    },
  },
  pickup: {
    tagline: "Pickup / Return Check-Out",
    title: "Pickup Form",
    submitLabel: "Submit pickup report",
    sections: {
      search: {
        title: "Find related reservation",
        label: "Search by reservation, member, guest, or vehicle",
        placeholder: "Search...",
        note: "If a match is found, guest, reservation, and vehicle fields auto-fill below.",
      },
      guest: {
        title: "Guest / Renter Information",
        note: "Auto-filled from reservation match.",
        fields: [
          ["Guest first name", "Alex"],
          ["Guest last name", "Turner"],
          ["Member number", "M-20491"],
          ["Reservation number", "1042"],
        ],
      },
      vehicle: {
        title: "Vehicle Details",
        note: "Auto-filled from reservation match.",
        fields: [
          ["Make / model", "Lamborghini Huracan"],
          ["Color / plate", "Black - ABC 1234"],
          ["VIN or fleet ID", "ZHWUC1ZD8GLA12345"],
          ["Mileage at delivery", "4,210 mi - 85% fuel"],
        ],
      },
      media: {
        title: "Vehicle Return Media Upload",
        uploads: [
          ["Front", "Photo"],
          ["Rear", "Photo"],
          ["Driver side", "Photo"],
          ["Passenger side", "Photo"],
          ["Interior", "Photo"],
          ["Wheels", "Photo"],
          ["Odometer", "Photo"],
          ["Fuel level", "Photo"],
          ["Damage photos", "If any"],
        ],
        videoLabel: "Upload vehicle return walkaround video",
      },
      checklist: {
        title: "Return Condition Checklist",
        fields: [
          ["Fuel level", "Fuel %"],
          ["Mileage", "Odometer reading"],
        ],
        toggles: [
          "Keys returned",
          "Personal items removed",
          "New damage?",
          "Smoking / vaping evidence?",
          "Late return?",
        ],
        notesLabel: "Notes (optional)",
        notesPlaceholder: "Additional notes...",
      },
      signature: {
        title: "Guest Signature",
        confirmation: "Guest confirms vehicle return condition.",
      },
      driver: {
        title: "Driver Confirmation",
        confirmation: "I confirm the submitted details, media, checklist, and notes are accurate.",
      },
    },
  },
} as const;

export const submissionComplete = {
  tagline: "Driver Portal",
  title: "Submission Complete",
  message: "Delivery / pickup report has been successfully submitted to Energetic Exotics.",
  meta: "Report saved for admin review - timestamp recorded",
  nextTitle: "What's next?",
  actions: {
    delivery: "Start another delivery",
    pickup: "Start another pickup",
    dashboard: "Return to dashboard",
    portal: "Back to portal",
  },
} as const;

export const adminPortal = {
  label: "Admin Portal",
  alertCount: 1,
  dashboard: {
    title: "Dashboard",
    greeting: "Hello, Jordan Blake",
    lead: "Manage drivers and review submitted reports.",
    notification: {
      title: "New delivery report submitted",
      meta: "John Davis - Res #1042 - Lamborghini Huracan - Today 2:30 PM",
      primaryAction: "View report",
      secondaryAction: "All submissions",
      href: "/admin/submissions/1042",
    },
    choices: {
      drivers: {
        title: "Manage Drivers",
        description: "View, create, reset, and disable driver accounts.",
        actionLabel: "View drivers",
        href: "/admin/drivers",
      },
      submissions: {
        title: "Review Submissions",
        description: "Delivery and pickup reports, filters, detail view, PDF export.",
        actionLabel: "View submissions",
        href: "/admin/submissions",
      },
    },
    recentTitle: "Recent submissions",
    recentSubmissions: [
      {
        title: "Delivery - Res #1042",
        meta: "John Davis - Today 2:30 PM",
        status: "Open",
        href: "/admin/submissions/1042",
      },
      {
        title: "Pickup / Return - Res #1038",
        meta: "Sarah Martinez - Today 11:15 AM",
        status: "Open",
        href: "/admin/submissions/1038",
      },
      {
        title: "Delivery - Res #1035",
        meta: "Mike Roberts - Yesterday 4:45 PM",
        status: "Open",
        href: "/admin/submissions/1035",
      },
    ],
  },
  nav: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Manage drivers", href: "/admin/drivers" },
    { label: "Submissions", href: "/admin/submissions" },
    { label: "Logout", href: "/admin/login", muted: true },
  ],
  drivers: {
    title: "Manage Drivers",
    lead: "View, create, reset, and disable driver accounts.",
    searchLabel: "Search drivers",
    searchPlaceholder: "Search by name or email...",
    createAction: "Create driver",
    accountsTitle: "Driver accounts",
    rows: [
      {
        name: "John Davis",
        status: "Active",
        active: true,
        meta: "john.davis@email.com - Last active today 2:30 PM",
        actions: ["Reset password", "Disable"],
      },
      {
        name: "Sarah Martinez",
        status: "Active",
        active: true,
        meta: "sarah.m@email.com - Last active today 11:15 AM",
        actions: ["Reset password", "Disable"],
      },
      {
        name: "Mike Roberts",
        status: "Active",
        active: true,
        meta: "mike.r@email.com - Last active yesterday 4:45 PM",
        actions: ["Reset password", "Disable"],
      },
      {
        name: "Chris Lee",
        status: "Disabled",
        active: false,
        meta: "chris.lee@email.com - Disabled Mar 12, 2026",
        actions: ["Re-enable"],
      },
    ],
  },
  createDriver: {
    title: "Create Driver",
    backLabel: "Manage drivers",
    sections: {
      account: {
        title: "Driver account",
        fields: [
          ["First name", "First name"],
          ["Last name", "Last name"],
          ["Email", "driver@email.com"],
          ["Phone (optional)", "Phone number"],
        ],
      },
      access: {
        title: "Access",
        roleLabel: "Role",
        roleValue: "Driver",
        passwordLabel: "Temporary password",
        passwordPlaceholder: "Temporary password",
        options: [
          "Require password change on first login",
          "Send login details to driver by email",
        ],
      },
    },
    saveAction: "Save driver",
    cancelAction: "Cancel",
  },
  submissions: {
    title: "View Submissions",
    lead: "Delivery and pickup reports, filters, detail view, and PDF export.",
    filterTitle: "Filter records",
    filters: [
      ["Date range", "Last 7 days"],
      ["Driver", "All drivers"],
      ["Report type", "All types"],
      ["Search", "Guest, reservation, vehicle..."],
    ],
    applyAction: "Apply filters",
    clearAction: "Clear",
    listTitle: "Submissions",
    rows: [
      {
        title: "Delivery - Res #1042",
        meta: "John Davis - Guest: Alex Turner - Today 2:30 PM - Lamborghini Huracan",
        status: "Open",
        href: "/admin/submissions/1042",
      },
      {
        title: "Pickup / Return - Res #1038",
        meta: "Sarah Martinez - Guest: Emma Cole - Today 11:15 AM - Rolls-Royce Cullinan",
        status: "Open",
        href: "/admin/submissions/1038",
      },
      {
        title: "Delivery - Res #1035",
        meta: "Mike Roberts - Guest: James Park - Yesterday 4:45 PM - Ferrari 296 GTB",
        status: "Open",
        href: "/admin/submissions/1035",
      },
    ],
  },
  submissionDetail: {
    title: "Submission Detail",
    backLabel: "Submissions",
    type: "Delivery",
    reservation: "Res #1042",
    downloadAction: "Download PDF",
    summaryTitle: "Report summary",
    summary: [
      ["Driver", "John Davis"],
      ["Submitted", "Jun 10, 2026 - 2:30 PM"],
      ["Guest", "Alex Turner"],
      ["Member / reservation", "M-20491 - Res #1042"],
      ["Vehicle", "Lamborghini Huracan - Black - ABC 1234"],
      ["Mileage / fuel", "4,210 mi - 85% fuel"],
    ],
    mediaTitle: "Uploaded media",
    media: ["Front", "Rear", "Interior", "Odometer"],
    videoLabel: "Walkaround video",
    verificationTitle: "Verification & signature",
    licenses: ["License front", "License back"],
    payment: ["Payment verified status", "Verified"],
    signature: "Guest signature",
    notesTitle: "Notes",
    notes: "No additional notes recorded.",
  },
} as const;

export const passwordHelp = {
  bodyBeforeEmail: "For security, password resets are handled by your administrator. Email",
  email: "support@energeticexotics.com",
  bodyAfterEmail: "or contact your fleet manager directly.",
} as const;

export const notices = {
  driverSignIn: "Authorized drivers only",
  adminSignIn: "Authorized staff only",
} as const;

export const nav = {
  dashboard: "Dashboard",
  home: "Home",
  login: "Login",
  logout: "Logout",
} as const;

export const footer = {
  copyright: "© 2026 Energetic Exotics. All rights reserved.",
  credit: "Portal by",
  creditBrand: "Reform Digital®",
  creditHref: "https://www.reform.digital/",
} as const;
