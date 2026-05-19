// emailjs.init("quz1KvH0RmCdHUExW");

// async function kirimEmailTrainer({ trainerEmail, trainerName, memberName, bookingDate, bookingTime, bookingId }) {

//     await emailjs.send(
//       "YOUR_SERVICE_ID",
//       "YOUR_TEMPLATE_ID",
//       {
//         trainer_email: trainerEmail,
//         trainer_name:  trainerName,
//         member_name:   memberName,
//         booking_date:  bookingDate,
//         booking_time:  bookingTime,
//         booking_id:    bookingId
//       }
//     );

//   }

//   const booking = await createAppointment({...});

//   if (booking.success) {
//     await kirimEmailTrainer({
//       trainerEmail: "max.liner@fitnessstudio.de",
//       trainerName:  "Max Liner",
//       memberName:   "Thomas Müller",
//       bookingDate:  "Montag, 5. Mai 2026",
//       bookingTime:  "11:00 Uhr",
//       bookingId:    booking.id
//     });
//   }
