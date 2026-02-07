export function flattenRecord(record: any): string {
  return Object.entries(record)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value
          .map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
          .join(", ")}`;
      }
      if (typeof value === "object" && value !== null) {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join(". ");
}

export function toNaturalText(record: any, domain: string): string {
  switch (domain) {
    case "academics":
      const courses =
        record.courses
          ?.map(
            (course: any) =>
              `${course.courseName} (${course.courseCode}) taught by ${course.faculty}. The student has ${course.attendancePercentage}% attendance with internal marks of ${course.internalMarks} and external marks of ${course.externalMarks}, earning a ${course.grade} grade and ${course.resultStatus} status.`,
          )
          .join(" ") || "";

      return `Student ${record.userId} has a CGPA of ${record.cgpa} with ${record.totalCredits} total credits. ${record.graduationEligibility ? "They are eligible for graduation." : "They are not yet eligible for graduation."} ${courses}`;

    case "fees":
      const feeStructure = record.feeStructure?.[0];
      const payments =
        record.payments
          ?.map(
            (payment: any) =>
              `Payment of ${payment.amount} INR was made on ${payment.date} via ${payment.mode} with ${payment.status} status.`,
          )
          .join(" ") || "";

      return `For student ${record.userId}, the semester ${feeStructure?.semester} fee structure includes tuition fee of ${feeStructure?.tuitionFee} INR, hostel fee of ${feeStructure?.hostelFee} INR, mess fee of ${feeStructure?.messFee} INR, and transport fee of ${feeStructure?.transportFee} INR, totaling ${feeStructure?.totalAmount} INR. ${record.dues > 0 ? `There are pending dues of ${record.dues} INR.` : "All fees are paid up."} ${payments}`;

    case "hostel":
      return `Student ${record.userId} ${record.isAllotted ? "has been allotted" : "has not been allotted"} hostel accommodation. ${record.isAllotted ? `They are assigned to ${record.hostelName} in room ${record.roomNumber}.` : `They have applied for ${record.hostelName}.`} The annual hostel fee is ${record.fees} INR with ${record.messPlan} meal plan. ${record.rulesAccepted ? "They have accepted the hostel rules." : "Hostel rules acceptance is pending."}`;

    case "scholarships":
      return `Student ${record.userId} has applied for the ${record.name} scholarship worth ${record.amount} INR. Their application status is ${record.status} and they are ${record.eligibilityStatus} for this scholarship. The application was submitted on ${record.appliedOn}. Required documents include ${record.documents?.join(", ")}.`;

    case "timetable":
      const schedule =
        record.timetable
          ?.map(
            (slot: any) =>
              `On ${slot.day}, ${slot.subject} class is scheduled from ${slot.startTime} to ${slot.endTime} in room ${slot.room} with ${slot.faculty}.`,
          )
          .join(" ") || "";

      return `Weekly schedule for student ${record.userId}: ${schedule}`;

    case "placements":
      const companies =
        record.companiesApplied
          ?.map(
            (company: any) =>
              `Applied to ${company.companyName} for ${company.role} position offering ${company.package} package with ${company.status} status.`,
          )
          .join(" ") || "";

      const offers =
        record.offers
          ?.map(
            (offer: any) =>
              `Received offer from ${offer.company} for ${offer.role} position with ${offer.ctc} CTC, joining date is ${offer.joiningDate}.`,
          )
          .join(" ") || "";

      return `Student ${record.userId} is ${record.eligibility ? "eligible" : "not eligible"} for campus placements and ${record.registered ? "has registered" : "has not registered"} for placement activities. Training programs completed: ${record.trainingPrograms?.join(", ")}. ${companies} ${offers}`;

    case "admission":
      const docs =
        record.documentsSubmitted
          ?.map(
            (doc: any) =>
              `${doc.docType} ${doc.verified ? "verified" : "pending verification"}`,
          )
          .join(", ") || "";

      return `Applicant ${record.userId} with application ID ${record.applicationId} has ${record.admissionStatus} admission status. They scored ${record.entranceScore} in entrance exam with cutoff rank ${record.cutoffRank}. Document status: ${docs}.`;

    case "facilities":
      return `The ${record.facilityName} facility ${record.isActive ? "is currently active" : "is currently inactive"}. Location: ${record.location}. Capacity: ${record.capacity} people. ${record.description} Available amenities: ${record.amenities?.join(", ")}.`;

    case "notifications":
      return `Notification for ${record.userId}: ${record.message} This is a ${record.type} priority ${record.category} notification sent on ${record.sentAt}. ${record.isRead ? "This notification has been read." : "This notification is unread."}`;

    default:
      // Fallback for other domains
      return flattenRecord(record);
  }
}
