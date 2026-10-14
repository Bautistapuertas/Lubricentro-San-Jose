import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@sanjose.com" },
    update: {},
    create: {
      nombre: "Martín San José",
      email: "admin@sanjose.com",
      passwordHash: bcrypt.hashSync("admin123", saltRounds),
      rol: "ADMIN",
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: "juan@test.com" },
    update: {},
    create: {
      nombre: "Juan Pérez",
      email: "juan@test.com",
      passwordHash: bcrypt.hashSync("cliente123", saltRounds),
      rol: "CLIENTE",
    },
  });

  await prisma.servicio.createMany({
    data: [
      { nombre: "Cambio de aceite", categoria: "Mantenimiento", precio: 28000, duracion: 60, publico: 1 },
      { nombre: "Lavado completo", categoria: "Lavado", precio: 4500, duracion: 45, publico: 1 },
      { nombre: "Alineación y balanceo", categoria: "Neumáticos", precio: 15000, duracion: 40, publico: 1 },
      { nombre: "Revisión general", categoria: "Diagnóstico", precio: 12000, duracion: 50, publico: 1 },
      { nombre: "Lavado premium", categoria: "Lavado", precio: 8500, duracion: 90, publico: 1 },
      { nombre: "Tratamiento de pulido", categoria: "Estética", precio: 18000, duracion: 120, publico: 1 },
    ],
  });

  await prisma.cliente.createMany({
    data: [
      { nombre: "Lucía Fernández", email: "lucia@test.com", telefono: "011 1111-2222" },
      { nombre: "Diego Martínez", email: "diego@test.com", telefono: "011 2222-3333" },
      { nombre: "Mariana López", email: "mariana@test.com", telefono: "011 3333-4444" },
      { nombre: "Carlos Giménez", email: "carlos@test.com", telefono: "011 4444-5555" },
      { nombre: "Sofía García", email: "sofia@test.com", telefono: "011 5555-6666" },
    ],
  });

  const servicioAceite = await prisma.servicio.findFirst({ where: { nombre: "Cambio de aceite" } });
  const clienteLucia = await prisma.cliente.findFirst({ where: { nombre: "Lucía Fernández" } });

  if (servicioAceite && clienteLucia) {
    await prisma.turno.create({
      data: {
        fecha: "2026-09-30",
        hora: "08:00",
        cliente: { connect: { id: clienteLucia.id } },
        servicio: { connect: { id: servicioAceite.id } },
        estado: "Confirmado",
        importe: 28000,
        recordatorio: 0,
      },
    });
  }

  console.log({ admin, cliente });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
