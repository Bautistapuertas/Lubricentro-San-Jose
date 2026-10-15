import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  console.log("Sembrando datos iniciales en PostgreSQL...");

  // 1. Usuarios
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

  const clienteJuan = await prisma.usuario.upsert({
    where: { email: "juan@test.com" },
    update: {},
    create: {
      nombre: "Juan Pérez",
      email: "juan@test.com",
      passwordHash: bcrypt.hashSync("cliente123", saltRounds),
      rol: "CLIENTE",
    },
  });

  // 2. Servicios
  const serviciosData = [
    { nombre: "Cambio de aceite", categoria: "Mantenimiento", precio: 28000, duracion: 60, publico: 1 },
    { nombre: "Lavado completo", categoria: "Lavado", precio: 4500, duracion: 45, publico: 1 },
    { nombre: "Alineación y balanceo", categoria: "Neumáticos", precio: 15000, duracion: 40, publico: 1 },
    { nombre: "Revisión general", categoria: "Diagnóstico", precio: 12000, duracion: 50, publico: 1 },
    { nombre: "Lavado premium", categoria: "Lavado", precio: 8500, duracion: 90, publico: 1 },
    { nombre: "Tratamiento de pulido", categoria: "Estética", precio: 18000, duracion: 120, publico: 0 },
  ];

  for (const s of serviciosData) {
    const existe = await prisma.servicio.findFirst({ where: { nombre: s.nombre } });
    if (!existe) {
      await prisma.servicio.create({ data: s });
    }
  }

  // 3. Clientes y Vehículos
  const clientesData = [
    {
      nombre: "Lucía Fernández",
      email: "lucia@test.com",
      telefono: "011 1111-2222",
      dni: "38111222",
      vehiculos: [{ patente: "AE 456 RT", marca: "Toyota", modelo: "Etios", km: 45000 }],
    },
    {
      nombre: "Diego Martínez",
      email: "diego@test.com",
      telefono: "011 2222-3333",
      dni: "35444555",
      vehiculos: [{ patente: "AC 980 KL", marca: "Ford", modelo: "Ranger", km: 82000 }],
    },
    {
      nombre: "Juan Pérez",
      email: "juan@test.com",
      telefono: "011 9999-8888",
      dni: "32999888",
      vehiculos: [{ patente: "AB 123 CD", marca: "Volkswagen", modelo: "Gol Trend", km: 58000 }],
    },
    {
      nombre: "Mariana López",
      email: "mariana@test.com",
      telefono: "011 3333-4444",
      dni: "40123456",
      vehiculos: [{ patente: "AF 221 NM", marca: "Chevrolet", modelo: "Onix", km: 23000 }],
    },
    {
      nombre: "Carlos Giménez",
      email: "carlos@test.com",
      telefono: "011 4444-5555",
      dni: "29789123",
      vehiculos: [{ patente: "AD 782 PQ", marca: "Renault", modelo: "Sandero", km: 67000 }],
    },
  ];

  for (const c of clientesData) {
    let cli = await prisma.cliente.findUnique({ where: { email: c.email } });
    if (!cli) {
      cli = await prisma.cliente.create({
        data: {
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          dni: c.dni,
        },
      });
    }

    for (const v of c.vehiculos) {
      const norm = v.patente.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const existeV = await prisma.vehiculo.findUnique({ where: { patenteNorm: norm } });
      if (!existeV) {
        await prisma.vehiculo.create({
          data: {
            clienteId: cli.id,
            patente: v.patente,
            patenteNorm: norm,
            marca: v.marca,
            modelo: v.modelo,
            km: v.km,
            ultimoKm: v.km - 5000,
            ultimoService: "2026-05-10",
          },
        });
      }
    }
  }

  // 4. Turnos iniciales
  const turnosCount = await prisma.turno.count();
  if (turnosCount === 0) {
    const srvAceite = await prisma.servicio.findFirst({ where: { nombre: "Cambio de aceite" } });
    const srvLavado = await prisma.servicio.findFirst({ where: { nombre: "Lavado premium" } });
    const srvRev = await prisma.servicio.findFirst({ where: { nombre: "Revisión general" } });

    const turnosSeed = [
      { cliente: "Lucía Fernández", vehiculo: "Toyota Etios · AE 456 RT", servicio: "Cambio de aceite", fecha: "2026-10-20", hora: "08:00 AM", estado: "Confirmado", importe: 28000, nota: "" },
      { cliente: "Diego Martínez", vehiculo: "Ford Ranger · AC 980 KL", servicio: "Lavado premium", fecha: "2026-10-20", hora: "09:30 AM", estado: "En taller", importe: 8500, nota: "" },
      { cliente: "Juan Pérez", vehiculo: "Volkswagen Gol Trend · AB 123 CD", servicio: "Revisión general", fecha: "2026-10-20", hora: "11:00 AM", estado: "Confirmado", importe: 12000, nota: "Revisar frenos", usuarioId: clienteJuan.id },
      { cliente: "Mariana López", vehiculo: "Chevrolet Onix · AF 221 NM", servicio: "Alineación y balanceo", fecha: "2026-10-20", hora: "01:30 PM", estado: "Pendiente", importe: 15000, nota: "" },
      { cliente: "Carlos Giménez", vehiculo: "Renault Sandero · AD 782 PQ", servicio: "Cambio de filtros", fecha: "2026-10-20", hora: "03:00 PM", estado: "Pendiente", importe: 9000, nota: "" },
    ];

    for (const t of turnosSeed) {
      await prisma.turno.create({
        data: {
          clienteNombre: t.cliente,
          vehiculoDesc: t.vehiculo,
          servicioDesc: t.servicio,
          fecha: t.fecha,
          hora: t.hora,
          estado: t.estado,
          importe: t.importe,
          nota: t.nota,
          usuarioId: t.usuarioId || null,
        },
      });
    }
  }

  // 5. Historial inicial
  const histCount = await prisma.historial.count();
  if (histCount === 0) {
    const historialSeed = [
      { fecha: "18 SEP 2026", titulo: "Cambio de aceite y filtros", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Aceite 5W-40 · Filtro de aceite · Control de 12 puntos", estado: "Completado", importe: 42800, comprobante: "#GSJ-02481", usuarioId: clienteJuan.id },
      { fecha: "02 JUL 2026", titulo: "Lavado premium", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Lavado exterior · Aspirado · Encerado rápido", estado: "Completado", importe: 12500, comprobante: "#GSJ-02197", usuarioId: clienteJuan.id },
      { fecha: "14 MAR 2026", titulo: "Alineación y balanceo", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Alineación computarizada · Balanceo 4 ruedas", estado: "Completado", importe: 21000, comprobante: "#GSJ-01744", usuarioId: clienteJuan.id },
    ];

    for (const h of historialSeed) {
      await prisma.historial.create({ data: h });
    }
  }

  // 6. Lavados iniciales (requisito del TP)
  const lavadoCount = await prisma.lavado.count();
  if (lavadoCount === 0) {
    await prisma.lavado.create({
      data: {
        patente: "AB 123 CD",
        modelo: "Gol Trend",
        tipoLavado: "premium",
        empleadoId: admin.id,
      },
    });
  }

  console.log("Seed completado exitosamente con usuarios, servicios, clientes, vehículos, turnos e historial.");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
