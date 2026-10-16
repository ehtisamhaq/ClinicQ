export interface DashboardMetricsSummary {
  totalAppointments: number;
  completed: number;
  checkedIn: number;
  inConsultation: number;
  booked: number;
  noShows: number;
  cancelled: number;
  noShowRate: number;
  cancellationRate: number;
  averageWaitMinutes: number;
  averageConsultMinutes: number;
}

export interface DailyAppointmentPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface DoctorUtilizationPoint {
  doctorId: string;
  name: string;
  specialty: string;
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number;
}

export interface AdminDashboardMetrics {
  period: {
    from: string;
    to: string;
  };
  summary: DashboardMetricsSummary;
  bookingChannels: {
    manual: number;
    assistant: number;
    reception: number;
  };
  assistantMetrics: {
    totalConversations: number;
    successfulBookings: number;
    emergencyRedirects: number;
    successRate: number;
  };
  appointmentsPerDay: DailyAppointmentPoint[];
  doctorUtilization: DoctorUtilizationPoint[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  body: string;
  category: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorScheduleItem {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}
