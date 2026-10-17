import argon2 from "argon2";
import prisma from "../src/lib/prisma";
import {
  Role,
  SlotStatus,
  AppointmentStatus,
  UrgencyLevel,
  BookingChannel,
} from "../src/generated/prisma/client";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create or ensure Demo Clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: "clinic-dhaka-central" },
    update: {},
    create: {
      id: "clinic-dhaka-central",
      name: "Dhaka Central Clinic",
      timezone: "Asia/Dhaka",
    },
  });
  console.log(`✅ Clinic ready: ${clinic.name} (${clinic.id})`);

  // Shared password hash for demo accounts
  const defaultPassword = "Password123!";
  const passwordHash = await argon2.hash(defaultPassword);

  // 2. Seed Users & Profiles
  // 2.1 Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "admin@clinicq.local",
      passwordHash,
      role: Role.ADMIN,
      clinicId: clinic.id,
      preferredLanguage: "en",
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2.2 Receptionist
  const receptionist = await prisma.user.upsert({
    where: { email: "reception@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "reception@clinicq.local",
      passwordHash,
      role: Role.RECEPTIONIST,
      clinicId: clinic.id,
      preferredLanguage: "bn",
    },
  });
  console.log(`✅ Receptionist user seeded: ${receptionist.email}`);

  // 2.3 Doctor 1 — Dr. Rahim (Cardiologist)
  const drRahimUser = await prisma.user.upsert({
    where: { email: "dr.rahim@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "dr.rahim@clinicq.local",
      passwordHash,
      role: Role.DOCTOR,
      clinicId: clinic.id,
      preferredLanguage: "en",
    },
  });
  const drRahimProfile = await prisma.doctorProfile.upsert({
    where: { userId: drRahimUser.id },
    update: {
      specialty: "Cardiology",
      bio: "Senior Consultant Cardiologist with 15+ years of experience in hypertension, coronary artery disease, and preventative cardiac care.",
      gender: "male",
      languages: ["en", "bn"],
      consultationFee: 1200,
      avgConsultMinutes: 15,
    },
    create: {
      userId: drRahimUser.id,
      specialty: "Cardiology",
      bio: "Senior Consultant Cardiologist with 15+ years of experience in hypertension, coronary artery disease, and preventative cardiac care.",
      gender: "male",
      languages: ["en", "bn"],
      consultationFee: 1200,
      avgConsultMinutes: 15,
    },
  });

  // 2.4 Doctor 2 — Dr. Fatima (Pediatrician)
  const drFatimaUser = await prisma.user.upsert({
    where: { email: "dr.fatima@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "dr.fatima@clinicq.local",
      passwordHash,
      role: Role.DOCTOR,
      clinicId: clinic.id,
      preferredLanguage: "bn",
    },
  });
  const drFatimaProfile = await prisma.doctorProfile.upsert({
    where: { userId: drFatimaUser.id },
    update: {
      specialty: "Pediatrics",
      bio: "Specialist Pediatrician dedicated to neonatal care, routine immunizations, child nutrition, and developmental health.",
      gender: "female",
      languages: ["en", "bn"],
      consultationFee: 1000,
      avgConsultMinutes: 15,
    },
    create: {
      userId: drFatimaUser.id,
      specialty: "Pediatrics",
      bio: "Specialist Pediatrician dedicated to neonatal care, routine immunizations, child nutrition, and developmental health.",
      gender: "female",
      languages: ["en", "bn"],
      consultationFee: 1000,
      avgConsultMinutes: 15,
    },
  });

  // 2.5 Doctor 3 — Dr. Karim (General Medicine)
  const drKarimUser = await prisma.user.upsert({
    where: { email: "dr.karim@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "dr.karim@clinicq.local",
      passwordHash,
      role: Role.DOCTOR,
      clinicId: clinic.id,
      preferredLanguage: "en",
    },
  });
  const drKarimProfile = await prisma.doctorProfile.upsert({
    where: { userId: drKarimUser.id },
    update: {
      specialty: "General Medicine",
      bio: "Experienced General Physician treating acute fevers, respiratory infections, gastrointestinal disorders, and routine wellness checks.",
      gender: "male",
      languages: ["en", "bn", "hi"],
      consultationFee: 800,
      avgConsultMinutes: 10,
    },
    create: {
      userId: drKarimUser.id,
      specialty: "General Medicine",
      bio: "Experienced General Physician treating acute fevers, respiratory infections, gastrointestinal disorders, and routine wellness checks.",
      gender: "male",
      languages: ["en", "bn", "hi"],
      consultationFee: 800,
      avgConsultMinutes: 10,
    },
  });
  console.log("✅ Doctors seeded: Dr. Rahim, Dr. Fatima, Dr. Karim");

  // 2.6 Patients
  const patientTanvirUser = await prisma.user.upsert({
    where: { email: "patient.tanvir@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "patient.tanvir@clinicq.local",
      passwordHash,
      role: Role.PATIENT,
      clinicId: clinic.id,
      preferredLanguage: "bn",
    },
  });
  const patientTanvirProfile = await prisma.patientProfile.upsert({
    where: { userId: patientTanvirUser.id },
    update: {
      phone: "+8801711000001",
      dateOfBirth: new Date("1992-05-15"),
    },
    create: {
      userId: patientTanvirUser.id,
      phone: "+8801711000001",
      dateOfBirth: new Date("1992-05-15"),
    },
  });

  const patientNusratUser = await prisma.user.upsert({
    where: { email: "patient.nusrat@clinicq.local" },
    update: { passwordHash },
    create: {
      email: "patient.nusrat@clinicq.local",
      passwordHash,
      role: Role.PATIENT,
      clinicId: clinic.id,
      preferredLanguage: "en",
    },
  });
  const patientNusratProfile = await prisma.patientProfile.upsert({
    where: { userId: patientNusratUser.id },
    update: {
      phone: "+8801811000002",
      dateOfBirth: new Date("1996-08-20"),
    },
    create: {
      userId: patientNusratUser.id,
      phone: "+8801811000002",
      dateOfBirth: new Date("1996-08-20"),
    },
  });
  console.log("✅ Patients seeded: Tanvir, Nusrat");

  // 3. Weekly Schedules for all 3 Doctors (Sunday=0 to Saturday=6)
  const doctors = [drRahimProfile, drFatimaProfile, drKarimProfile];
  for (const doc of doctors) {
    for (let weekday = 0; weekday <= 6; weekday++) {
      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_weekday: {
            doctorId: doc.id,
            weekday,
          },
        },
        update: {
          startTime: "09:00",
          endTime: "13:00",
          slotMinutes: doc.avgConsultMinutes,
        },
        create: {
          doctorId: doc.id,
          weekday,
          startTime: "09:00",
          endTime: "13:00",
          slotMinutes: doc.avgConsultMinutes,
        },
      });
    }
  }
  console.log("✅ Weekly schedules (7 days, 09:00-13:00) seeded for all doctors");

  // 4. Generate Slots for Today + Next 6 Days
  const now = new Date();
  let totalSlots = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const slotDate = new Date(now);
    slotDate.setDate(now.getDate() + dayOffset);

    for (const doc of doctors) {
      // Create 8 slots between 09:00 and 11:00
      for (let i = 0; i < 8; i++) {
        const startsAt = new Date(slotDate);
        startsAt.setHours(9, i * doc.avgConsultMinutes, 0, 0);
        const endsAt = new Date(startsAt.getTime() + doc.avgConsultMinutes * 60 * 1000);

        await prisma.slot.upsert({
          where: {
            doctorId_startsAt: {
              doctorId: doc.id,
              startsAt,
            },
          },
          update: {},
          create: {
            doctorId: doc.id,
            startsAt,
            endsAt,
            status: SlotStatus.AVAILABLE,
          },
        });
        totalSlots++;
      }
    }
  }
  console.log(`✅ Seeded ${totalSlots} appointment slots across 7 days`);

  // 5. Seed Demo Appointments for Dr. Karim (for immediate live queue demo)
  const todayMorningSlot1 = await prisma.slot.findFirst({
    where: {
      doctorId: drKarimProfile.id,
      status: SlotStatus.AVAILABLE,
    },
    orderBy: { startsAt: "asc" },
  });

  if (todayMorningSlot1) {
    await prisma.slot.update({
      where: { id: todayMorningSlot1.id },
      data: { status: SlotStatus.BOOKED },
    });

    await prisma.appointment.upsert({
      where: { slotId: todayMorningSlot1.id },
      update: {},
      create: {
        slotId: todayMorningSlot1.id,
        patientId: patientTanvirProfile.id,
        status: AppointmentStatus.CHECKED_IN,
        reason: "Mild fever and sore throat for 2 days",
        assistantSummary: "Patient reports low-grade fever with throat discomfort. Recommended general physician checkup.",
        urgency: UrgencyLevel.ROUTINE,
        bookedVia: BookingChannel.ASSISTANT,
        idempotencyKey: `seed-booking-${todayMorningSlot1.id}`,
        checkedInAt: new Date(),
      },
    });
  }

  const todayMorningSlot2 = await prisma.slot.findFirst({
    where: {
      doctorId: drKarimProfile.id,
      status: SlotStatus.AVAILABLE,
    },
    orderBy: { startsAt: "asc" },
  });

  if (todayMorningSlot2) {
    await prisma.slot.update({
      where: { id: todayMorningSlot2.id },
      data: { status: SlotStatus.BOOKED },
    });

    await prisma.appointment.upsert({
      where: { slotId: todayMorningSlot2.id },
      update: {},
      create: {
        slotId: todayMorningSlot2.id,
        patientId: patientNusratProfile.id,
        status: AppointmentStatus.BOOKED,
        reason: "Annual health checkup and routine blood pressure screening",
        assistantSummary: "Routine wellness visit. No acute distress reported.",
        urgency: UrgencyLevel.ROUTINE,
        bookedVia: BookingChannel.MANUAL,
        idempotencyKey: `seed-booking-${todayMorningSlot2.id}`,
      },
    });
  }
  console.log("✅ Demo queue appointments seeded for Dr. Karim");

  // 6. Clinic Knowledge Base Documents (for RAG / Assistant)
  const knowledgeData = [
    {
      title: "Clinic Timings & Working Hours",
      category: "timings",
      body: "Dhaka Central Clinic operates Sunday through Thursday from 8:00 AM to 8:00 PM. Consultation slots run from 9:00 AM to 1:00 PM and 4:00 PM to 8:00 PM. Emergency medical assistance is accessible 24/7 at our emergency wing.",
    },
    {
      title: "Consultation Fees & Payment Methods",
      category: "fees",
      body: "Our consultation fees are transparent: General Medicine is 800 BDT, Pediatrics is 1,000 BDT, and Cardiology is 1,200 BDT. Follow-up consultations within 7 days receive a 50% discount. We accept Cash, bKash, Nagad, Visa, Mastercard, and American Express.",
    },
    {
      title: "Cardiology Services & Diagnostics",
      category: "services",
      body: "Dhaka Central Clinic offers complete non-invasive cardiac diagnostics including 12-lead ECG, 2D Color Doppler Echocardiography, 24-hour Holter monitoring, Ambulatory Blood Pressure Monitoring (ABPM), and Treadmill Stress Tests (TMT).",
    },
    {
      title: "Pediatrics & Child Immunization",
      category: "services",
      body: "Our Pediatrics wing provides comprehensive child wellness assessments, neonatal care, growth milestone tracking, and all government EPI vaccinations as well as optional international pediatric vaccines (Pneumococcal, Rotavirus, Varicella, MMR, and Flu vaccines).",
    },
    {
      title: "Appointment Cancellation and Rescheduling Policy",
      category: "policies",
      body: "Patients can cancel or reschedule appointments without any fee up to 2 hours prior to the scheduled slot time. For cancellations within 2 hours or no-shows, our reception team may contact you to release or reassign the slot to patients on the waitlist.",
    },
  ];

  for (const doc of knowledgeData) {
    const createdDoc = await prisma.knowledgeDoc.create({
      data: {
        clinicId: clinic.id,
        title: doc.title,
        category: doc.category,
        body: doc.body,
      },
    });

    // Seed plain text chunk (vector embeddings will be computed via knowledge module embedding service)
    await prisma.knowledgeChunk.create({
      data: {
        docId: createdDoc.id,
        content: `${doc.title}\n\n${doc.body}`,
      },
    });
  }
  console.log("✅ Clinic knowledge documents and chunks seeded");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("──────────────────────────────────────────────────────────");
  console.log("Demo Credentials:");
  console.log("  Admin:        admin@clinicq.local        / Password123!");
  console.log("  Receptionist: reception@clinicq.local    / Password123!");
  console.log("  Dr. Rahim:    dr.rahim@clinicq.local     / Password123! (Cardiology)");
  console.log("  Dr. Fatima:   dr.fatima@clinicq.local    / Password123! (Pediatrics)");
  console.log("  Dr. Karim:    dr.karim@clinicq.local     / Password123! (General Medicine)");
  console.log("  Patient 1:    patient.tanvir@clinicq.local / Password123!");
  console.log("  Patient 2:    patient.nusrat@clinicq.local / Password123!");
  console.log("──────────────────────────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
