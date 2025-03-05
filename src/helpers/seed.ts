import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const annotationClasses = [
  { id: "1", name: "Unclear" },
  { id: "2", name: "Not an option" },
  { id: "3", name: "Boat Engine" },
  { id: "4", name: "Boat Horn" },
  { id: "5", name: "Car Engine" },
  { id: "6", name: "Car Horn" },
  { id: "7", name: "Children Playing" },
  { id: "8", name: "Church Bell" },
  { id: "9", name: "Conversation" },
  { id: "10", name: "Crying" },
  { id: "11", name: "Dog Bark" },
  { id: "12", name: "Helicopter" },
  { id: "13", name: "Lightning Strike" },
  { id: "14", name: "Rain" },
  { id: "15", name: "Scooter" },
  { id: "16", name: "Seagull Cry" },
  { id: "17", name: "Storm" },
  { id: "18", name: "Tourist Chatter" },
  { id: "19", name: "Wave Crash" },
  { id: "20", name: "Wind" },
  { id: "21", name: "Yelling" },
];

async function seedAnnotationClasses() {
  try {
    for (const annotationClass of annotationClasses) {
      await prisma.annotationClass.upsert({
        where: { id: annotationClass.id },
        update: { name: annotationClass.name },
        create: {
          id: annotationClass.id,
          name: annotationClass.name,
        },
      });
    }
    console.log("Annotation classes seeded successfully");
  } catch (error) {
    console.error("Error seeding annotation classes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAnnotationClasses();
