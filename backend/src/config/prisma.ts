import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

// Instancia real de Prisma para cuando PostgreSQL está disponible
export const rawPrisma = databaseUrl
  ? new PrismaClient({
      datasources: {
        db: { url: databaseUrl },
      },
    })
  : null;

async function seedPostgresIfEmpty(client: PrismaClient) {
  const count = await client.usuario.count();
  if (count > 0) return;

  console.log("Sembrando datos iniciales automáticamente en PostgreSQL...");
  const saltRounds = 10;

  const admin = await client.usuario.upsert({
    where: { email: "admin@sanjose.com" },
    update: {},
    create: {
      nombre: "Martín San José",
      email: "admin@sanjose.com",
      passwordHash: bcrypt.hashSync("admin123", saltRounds),
      rol: "ADMIN",
    },
  });

  const clienteJuan = await client.usuario.upsert({
    where: { email: "juan@test.com" },
    update: {},
    create: {
      nombre: "Juan Pérez",
      email: "juan@test.com",
      passwordHash: bcrypt.hashSync("cliente123", saltRounds),
      rol: "CLIENTE",
    },
  });

  const serviciosData = [
    { nombre: "Cambio de aceite", categoria: "Mantenimiento", precio: 28000, duracion: 60, publico: 1 },
    { nombre: "Lavado completo", categoria: "Lavado", precio: 4500, duracion: 45, publico: 1 },
    { nombre: "Alineación y balanceo", categoria: "Neumáticos", precio: 15000, duracion: 40, publico: 1 },
    { nombre: "Revisión general", categoria: "Diagnóstico", precio: 12000, duracion: 50, publico: 1 },
    { nombre: "Lavado premium", categoria: "Lavado", precio: 8500, duracion: 90, publico: 1 },
    { nombre: "Tratamiento de pulido", categoria: "Estética", precio: 18000, duracion: 120, publico: 0 },
  ];

  for (const s of serviciosData) {
    const existe = await client.servicio.findFirst({ where: { nombre: s.nombre } });
    if (!existe) {
      await client.servicio.create({ data: s });
    }
  }

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
    let cli = await client.cliente.findUnique({ where: { email: c.email } });
    if (!cli) {
      cli = await client.cliente.create({
        data: { nombre: c.nombre, email: c.email, telefono: c.telefono, dni: c.dni },
      });
    }
    for (const v of c.vehiculos) {
      const norm = v.patente.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const existeV = await client.vehiculo.findUnique({ where: { patenteNorm: norm } });
      if (!existeV) {
        await client.vehiculo.create({
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

  const turnosCount = await client.turno.count();
  if (turnosCount === 0) {
    const turnosSeed = [
      { cliente: "Lucía Fernández", vehiculo: "Toyota Etios · AE 456 RT", servicio: "Cambio de aceite", fecha: "2026-10-20", hora: "08:00 AM", estado: "Confirmado", importe: 28000, nota: "" },
      { cliente: "Diego Martínez", vehiculo: "Ford Ranger · AC 980 KL", servicio: "Lavado premium", fecha: "2026-10-20", hora: "09:30 AM", estado: "En taller", importe: 8500, nota: "" },
      { cliente: "Juan Pérez", vehiculo: "Volkswagen Gol Trend · AB 123 CD", servicio: "Revisión general", fecha: "2026-10-20", hora: "11:00 AM", estado: "Confirmado", importe: 12000, nota: "Revisar frenos", usuarioId: clienteJuan.id },
      { cliente: "Mariana López", vehiculo: "Chevrolet Onix · AF 221 NM", servicio: "Alineación y balanceo", fecha: "2026-10-20", hora: "01:30 PM", estado: "Pendiente", importe: 15000, nota: "" },
      { cliente: "Carlos Giménez", vehiculo: "Renault Sandero · AD 782 PQ", servicio: "Cambio de filtros", fecha: "2026-10-20", hora: "03:00 PM", estado: "Pendiente", importe: 9000, nota: "" },
    ];
    for (const t of turnosSeed) {
      await client.turno.create({
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

  const histCount = await client.historial.count();
  if (histCount === 0) {
    const historialSeed = [
      { fecha: "18 SEP 2026", titulo: "Cambio de aceite y filtros", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Aceite 5W-40 · Filtro de aceite · Control de 12 puntos", estado: "Completado", importe: 42800, comprobante: "#GSJ-02481", usuarioId: clienteJuan.id },
      { fecha: "02 JUL 2026", titulo: "Lavado premium", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Lavado exterior · Aspirado · Encerado rápido", estado: "Completado", importe: 12500, comprobante: "#GSJ-02197", usuarioId: clienteJuan.id },
      { fecha: "14 MAR 2026", titulo: "Alineación y balanceo", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Alineación computarizada · Balanceo 4 ruedas", estado: "Completado", importe: 21000, comprobante: "#GSJ-01744", usuarioId: clienteJuan.id },
    ];
    for (const h of historialSeed) {
      await client.historial.create({ data: h });
    }
  }

  const lavadoCount = await client.lavado.count();
  if (lavadoCount === 0) {
    await client.lavado.create({
      data: {
        patente: "AB 123 CD",
        modelo: "Gol Trend",
        tipoLavado: "premium",
        empleadoId: admin.id,
      },
    });
  }
}

// ============================================================================
// Almacén en memoria compatible con Prisma (Fallback automático cuando no hay
// DATABASE_URL configurada en la nube o la base no está accesible)
// ============================================================================
function createSeededMemoryStore() {
  const now = new Date();
  const saltRounds = 10;

  const usuarios: any[] = [
    {
      id: 1,
      nombre: "Martín San José",
      email: "admin@sanjose.com",
      passwordHash: bcrypt.hashSync("admin123", saltRounds),
      rol: "ADMIN",
      activo: true,
      createdAt: now,
    },
    {
      id: 2,
      nombre: "Juan Pérez",
      email: "juan@test.com",
      passwordHash: bcrypt.hashSync("cliente123", saltRounds),
      rol: "CLIENTE",
      activo: true,
      createdAt: now,
    },
  ];

  const servicios: any[] = [
    { id: 1, nombre: "Cambio de aceite", categoria: "Mantenimiento", precio: 28000, duracion: 60, publico: 1, createdAt: now },
    { id: 2, nombre: "Lavado completo", categoria: "Lavado", precio: 4500, duracion: 45, publico: 1, createdAt: now },
    { id: 3, nombre: "Alineación y balanceo", categoria: "Neumáticos", precio: 15000, duracion: 40, publico: 1, createdAt: now },
    { id: 4, nombre: "Revisión general", categoria: "Diagnóstico", precio: 12000, duracion: 50, publico: 1, createdAt: now },
    { id: 5, nombre: "Lavado premium", categoria: "Lavado", precio: 8500, duracion: 90, publico: 1, createdAt: now },
    { id: 6, nombre: "Tratamiento de pulido", categoria: "Estética", precio: 18000, duracion: 120, publico: 0, createdAt: now },
  ];

  const clientes: any[] = [
    { id: 1, nombre: "Lucía Fernández", email: "lucia@test.com", telefono: "011 1111-2222", dni: "38111222", createdAt: now },
    { id: 2, nombre: "Diego Martínez", email: "diego@test.com", telefono: "011 2222-3333", dni: "35444555", createdAt: now },
    { id: 3, nombre: "Juan Pérez", email: "juan@test.com", telefono: "011 9999-8888", dni: "32999888", createdAt: now },
    { id: 4, nombre: "Mariana López", email: "mariana@test.com", telefono: "011 3333-4444", dni: "40123456", createdAt: now },
    { id: 5, nombre: "Carlos Giménez", email: "carlos@test.com", telefono: "011 4444-5555", dni: "29789123", createdAt: now },
  ];

  const vehiculos: any[] = [
    { id: 1, clienteId: 1, patente: "AE 456 RT", patenteNorm: "AE456RT", marca: "Toyota", modelo: "Etios", km: 45000, ultimoKm: 40000, ultimoService: "2026-05-10", createdAt: now },
    { id: 2, clienteId: 2, patente: "AC 980 KL", patenteNorm: "AC980KL", marca: "Ford", modelo: "Ranger", km: 82000, ultimoKm: 77000, ultimoService: "2026-05-10", createdAt: now },
    { id: 3, clienteId: 3, patente: "AB 123 CD", patenteNorm: "AB123CD", marca: "Volkswagen", modelo: "Gol Trend", km: 58000, ultimoKm: 53000, ultimoService: "2026-05-10", createdAt: now },
    { id: 4, clienteId: 4, patente: "AF 221 NM", patenteNorm: "AF221NM", marca: "Chevrolet", modelo: "Onix", km: 23000, ultimoKm: 18000, ultimoService: "2026-05-10", createdAt: now },
    { id: 5, clienteId: 5, patente: "AD 782 PQ", patenteNorm: "AD782PQ", marca: "Renault", modelo: "Sandero", km: 67000, ultimoKm: 62000, ultimoService: "2026-05-10", createdAt: now },
  ];

  const turnos: any[] = [
    { id: 1, clienteNombre: "Lucía Fernández", vehiculoDesc: "Toyota Etios · AE 456 RT", servicioDesc: "Cambio de aceite", fecha: "2026-10-20", hora: "08:00 AM", clienteId: 1, vehiculoId: 1, servicioId: 1, usuarioId: null, estado: "Confirmado", importe: 28000, nota: "", recordatorio: 0, createdAt: now },
    { id: 2, clienteNombre: "Diego Martínez", vehiculoDesc: "Ford Ranger · AC 980 KL", servicioDesc: "Lavado premium", fecha: "2026-10-20", hora: "09:30 AM", clienteId: 2, vehiculoId: 2, servicioId: 5, usuarioId: null, estado: "En taller", importe: 8500, nota: "", recordatorio: 0, createdAt: now },
    { id: 3, clienteNombre: "Juan Pérez", vehiculoDesc: "Volkswagen Gol Trend · AB 123 CD", servicioDesc: "Revisión general", fecha: "2026-10-20", hora: "11:00 AM", clienteId: 3, vehiculoId: 3, servicioId: 4, usuarioId: 2, estado: "Confirmado", importe: 12000, nota: "Revisar frenos", recordatorio: 0, createdAt: now },
    { id: 4, clienteNombre: "Mariana López", vehiculoDesc: "Chevrolet Onix · AF 221 NM", servicioDesc: "Alineación y balanceo", fecha: "2026-10-20", hora: "01:30 PM", clienteId: 4, vehiculoId: 4, servicioId: 3, usuarioId: null, estado: "Pendiente", importe: 15000, nota: "", recordatorio: 0, createdAt: now },
    { id: 5, clienteNombre: "Carlos Giménez", vehiculoDesc: "Renault Sandero · AD 782 PQ", servicioDesc: "Cambio de filtros", fecha: "2026-10-20", hora: "03:00 PM", clienteId: 5, vehiculoId: 5, servicioId: 1, usuarioId: null, estado: "Pendiente", importe: 9000, nota: "", recordatorio: 0, createdAt: now },
  ];

  const historial: any[] = [
    { id: 1, fecha: "18 SEP 2026", titulo: "Cambio de aceite y filtros", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Aceite 5W-40 · Filtro de aceite · Control de 12 puntos", estado: "Completado", importe: 42800, comprobante: "#GSJ-02481", usuarioId: 2, createdAt: now },
    { id: 2, fecha: "02 JUL 2026", titulo: "Lavado premium", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Lavado exterior · Aspirado · Encerado rápido", estado: "Completado", importe: 12500, comprobante: "#GSJ-02197", usuarioId: 2, createdAt: now },
    { id: 3, fecha: "14 MAR 2026", titulo: "Alineación y balanceo", vehiculo: "Volkswagen Gol Trend 1.6 · AB 123 CD", detalle: "Alineación computarizada · Balanceo 4 ruedas", estado: "Completado", importe: 21000, comprobante: "#GSJ-01744", usuarioId: 2, createdAt: now },
  ];

  const lavados: any[] = [
    { id: 1, fecha: now, patente: "AB 123 CD", modelo: "Gol Trend", tipoLavado: "premium", empleadoId: 1, createdAt: now },
  ];

  const mails: any[] = [];
  const notificaciones: any[] = [];
  const sesiones: any[] = [];
  const restablecimientos: any[] = [];

  const tables: Record<string, any[]> = {
    usuario: usuarios,
    cliente: clientes,
    vehiculo: vehiculos,
    servicio: servicios,
    turno: turnos,
    historial,
    lavado: lavados,
    mail: mails,
    notificacion: notificaciones,
    sesion: sesiones,
    restablecimiento: restablecimientos,
  };

  const counters: Record<string, number> = {
    usuario: 3,
    cliente: 6,
    vehiculo: 6,
    servicio: 7,
    turno: 6,
    historial: 4,
    lavado: 2,
    mail: 1,
    notificacion: 1,
  };

  function enrichRelations(model: string, row: any): any {
    if (!row) return row;
    const copy = { ...row };
    if (model === "cliente") {
      copy.vehiculos = tables.vehiculo.filter((v) => v.clienteId === row.id);
      copy.turnos = tables.turno.filter(
        (t) =>
          t.clienteId === row.id ||
          (t.clienteNombre && row.nombre && t.clienteNombre.toLowerCase() === row.nombre.toLowerCase())
      );
    } else if (model === "vehiculo") {
      copy.cliente = tables.cliente.find((c) => c.id === row.clienteId) || null;
      copy.turnos = tables.turno.filter(
        (t) => t.vehiculoId === row.id || (t.vehiculoDesc && row.patente && t.vehiculoDesc.includes(row.patente))
      );
    } else if (model === "turno") {
      copy.cliente =
        tables.cliente.find((c) => c.id === row.clienteId) ||
        (row.clienteNombre
          ? tables.cliente.find((c) => c.nombre.toLowerCase() === row.clienteNombre.toLowerCase())
          : null) ||
        null;
      copy.vehiculo = tables.vehiculo.find((v) => v.id === row.vehiculoId) || null;
      copy.servicio = tables.servicio.find((s) => s.id === row.servicioId) || null;
    } else if (model === "lavado") {
      const emp = tables.usuario.find((u) => u.id === row.empleadoId) || null;
      copy.empleado = emp ? { id: emp.id, nombre: emp.nombre, email: emp.email } : null;
    } else if (model === "historial") {
      copy.usuario = tables.usuario.find((u) => u.id === row.usuarioId) || null;
    }
    return copy;
  }

  function matchesWhere(model: string, row: any, where: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    const enriched = enrichRelations(model, row);

    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue;
      if (key === "OR" && Array.isArray(cond)) {
        if (!cond.some((sub) => matchesWhere(model, row, sub))) return false;
        continue;
      }
      if (key === "AND" && Array.isArray(cond)) {
        if (!cond.every((sub) => matchesWhere(model, row, sub))) return false;
        continue;
      }

      const val = enriched[key];
      if (cond !== null && typeof cond === "object" && !(cond instanceof Date) && typeof cond !== "bigint") {
        const cObj = cond as Record<string, any>;
        if ("in" in cObj && Array.isArray(cObj.in)) {
          if (!cObj.in.includes(val)) return false;
        } else if ("not" in cObj) {
          if (val === cObj.not) return false;
        } else if ("contains" in cObj) {
          const strVal = String(val ?? "");
          const needle = String(cObj.contains ?? "");
          if (cObj.mode === "insensitive") {
            if (!strVal.toLowerCase().includes(needle.toLowerCase())) return false;
          } else if (!strVal.includes(needle)) {
            return false;
          }
        } else {
          if (!val || !matchesWhere(key, val, cObj)) return false;
        }
      } else {
        if (val !== cond) return false;
      }
    }
    return true;
  }

  function applyOrderAndSelect(model: string, rows: any[], args: any = {}) {
    let result = rows.map((r) => enrichRelations(model, r));

    if (args.orderBy) {
      const entries = Object.entries(args.orderBy);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        result.sort((a, b) => {
          const va = a[field];
          const vb = b[field];
          if (va < vb) return dir === "desc" ? 1 : -1;
          if (va > vb) return dir === "desc" ? -1 : 1;
          return 0;
        });
      }
    }

    if (typeof args.take === "number") {
      result = result.slice(0, args.take);
    }

    if (args.include?.vehiculos?.orderBy) {
      const [f, d] = Object.entries(args.include.vehiculos.orderBy)[0];
      result = result.map((r) => ({
        ...r,
        vehiculos: [...(r.vehiculos || [])].sort((a, b) =>
          d === "desc" ? (b[f] ?? 0) - (a[f] ?? 0) : (a[f] ?? 0) - (b[f] ?? 0)
        ),
      }));
    }

    if (args.select) {
      result = result.map((r) => {
        const picked: Record<string, any> = {};
        for (const k of Object.keys(args.select)) {
          if (args.select[k]) picked[k] = r[k];
        }
        return picked;
      });
    }

    return result;
  }

  function makeDelegate(model: string) {
    const table = tables[model];
    return {
      async findMany(args: any = {}) {
        const filtered = table.filter((r) => matchesWhere(model, r, args.where));
        return applyOrderAndSelect(model, filtered, args);
      },
      async findUnique(args: any = {}) {
        const found = table.find((r) => matchesWhere(model, r, args.where)) || null;
        if (!found) return null;
        return applyOrderAndSelect(model, [found], args)[0];
      },
      async findFirst(args: any = {}) {
        const found = table.find((r) => matchesWhere(model, r, args.where)) || null;
        if (!found) return null;
        return applyOrderAndSelect(model, [found], args)[0];
      },
      async count(args: any = {}) {
        return table.filter((r) => matchesWhere(model, r, args.where)).length;
      },
      async create(args: any = {}) {
        const data = { ...(args.data || {}) };
        if (model !== "sesion" && model !== "restablecimiento" && data.id === undefined) {
          data.id = counters[model]++;
        }
        if (data.createdAt === undefined) data.createdAt = new Date();
        if (model === "usuario") {
          if (data.rol === undefined) data.rol = "CLIENTE";
          if (data.activo === undefined) data.activo = true;
        }
        if (model === "vehiculo" && data.km === undefined) data.km = 0;
        if (model === "turno") {
          if (data.estado === undefined) data.estado = "Pendiente";
          if (data.importe === undefined) data.importe = 0;
          if (data.nota === undefined) data.nota = "";
          if (data.recordatorio === undefined) data.recordatorio = 0;
        }
        if (model === "servicio" && data.publico === undefined) data.publico = 1;
        if (model === "lavado" && data.fecha === undefined) data.fecha = new Date();
        if (model === "mail" && data.estado === undefined) data.estado = "simulado";
        if (model === "notificacion" && data.leida === undefined) data.leida = 0;

        table.push(data);
        return applyOrderAndSelect(model, [data], args)[0];
      },
      async update(args: any = {}) {
        const idx = table.findIndex((r) => matchesWhere(model, r, args.where));
        if (idx === -1) return null;
        table[idx] = { ...table[idx], ...(args.data || {}) };
        return applyOrderAndSelect(model, [table[idx]], args)[0];
      },
      async updateMany(args: any = {}) {
        let count = 0;
        for (let i = 0; i < table.length; i++) {
          if (matchesWhere(model, table[i], args.where)) {
            table[i] = { ...table[i], ...(args.data || {}) };
            count++;
          }
        }
        return { count };
      },
      async upsert(args: any = {}) {
        const idx = table.findIndex((r) => matchesWhere(model, r, args.where));
        if (idx !== -1) {
          table[idx] = { ...table[idx], ...(args.update || {}) };
          return applyOrderAndSelect(model, [table[idx]], args)[0];
        }
        return this.create({ data: args.create, select: args.select, include: args.include });
      },
      async delete(args: any = {}) {
        const idx = table.findIndex((r) => matchesWhere(model, r, args.where));
        if (idx === -1) return null;
        const [removed] = table.splice(idx, 1);
        return removed;
      },
      async deleteMany(args: any = {}) {
        let count = 0;
        for (let i = table.length - 1; i >= 0; i--) {
          if (matchesWhere(model, table[i], args.where)) {
            table.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
    };
  }

  return {
    usuario: makeDelegate("usuario"),
    cliente: makeDelegate("cliente"),
    vehiculo: makeDelegate("vehiculo"),
    servicio: makeDelegate("servicio"),
    turno: makeDelegate("turno"),
    historial: makeDelegate("historial"),
    lavado: makeDelegate("lavado"),
    mail: makeDelegate("mail"),
    notificacion: makeDelegate("notificacion"),
    sesion: makeDelegate("sesion"),
    restablecimiento: makeDelegate("restablecimiento"),
    $disconnect: async () => {},
  };
}

const memoryPrisma = createSeededMemoryStore();
let useMemoryFallback = !rawPrisma;
let pgSeedChecked = false;

function createResilientDelegate(modelName: keyof typeof memoryPrisma) {
  const memDelegate = memoryPrisma[modelName] as any;
  const rawDelegate = rawPrisma ? (rawPrisma as any)[modelName] : null;

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        return async (...args: any[]) => {
          if (!useMemoryFallback && rawDelegate && typeof rawDelegate[prop] === "function") {
            try {
              if (!pgSeedChecked && rawPrisma) {
                pgSeedChecked = true;
                await seedPostgresIfEmpty(rawPrisma);
              }
              return await rawDelegate[prop](...args);
            } catch (err: any) {
              const code = err?.code || "";
              const msg = err?.message || "";
              if (
                code.startsWith("P10") ||
                code === "P2021" ||
                msg.includes("Can't reach database server") ||
                msg.includes("ECONNREFUSED") ||
                msg.includes("Invalid `prisma.") ||
                msg.includes("does not exist in the current database")
              ) {
                console.warn(
                  `⚠️ PostgreSQL no disponible (${code || "sin conexión"}). Usando almacén Prisma en memoria pre-sembrado.`
                );
                useMemoryFallback = true;
                return await memDelegate[prop](...args);
              }
              throw err;
            }
          }
          return await memDelegate[prop](...args);
        };
      },
    }
  );
}

export const prisma = {
  usuario: createResilientDelegate("usuario"),
  cliente: createResilientDelegate("cliente"),
  vehiculo: createResilientDelegate("vehiculo"),
  servicio: createResilientDelegate("servicio"),
  turno: createResilientDelegate("turno"),
  historial: createResilientDelegate("historial"),
  lavado: createResilientDelegate("lavado"),
  mail: createResilientDelegate("mail"),
  notificacion: createResilientDelegate("notificacion"),
  sesion: createResilientDelegate("sesion"),
  restablecimiento: createResilientDelegate("restablecimiento"),
  $disconnect: async () => {
    if (rawPrisma) await rawPrisma.$disconnect();
  },
} as unknown as PrismaClient;
