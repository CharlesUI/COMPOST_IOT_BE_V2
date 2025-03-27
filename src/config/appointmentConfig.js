const servicePrices = [
  {
    service: "consultation",
    price: 900
  },
  {
    service: "rabies vaccination",
    price: 400
  },
  {
    service: "3-in-1 vaccination",
    price: 600
  },
  {
    service: "5-in-1 vaccination",
    price: 1000
  },
  {
    service: "surgery",
    price: 5000
  },
  {
    service: "laser therapy",
    price: 2200
  },
  {
    service: "diagnostic imaging",
    price: 1000
  },
  {
    service: "cardiology consultation",
    price: 1500
  },
  {
    service: "neutering",
    price: 1500
  },
  {
    service: "spaying",
    price: 4000
  },
  {
    service: "blood test",
    price: 1500
  }
];

const appointmentStatuses = ["pending", "accepted", "rejected", "cancelled"];

module.exports = {
  appointmentStatuses,
  servicePrices
}