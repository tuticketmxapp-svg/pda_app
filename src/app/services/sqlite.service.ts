import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private readonly dbName = 'checkin_db';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  // Inicializa la base de datos completa (crea tablas si faltan)
  async initializeDatabase() {
    await this.initDB();
    await this.ensureTablesExist(); // Crea tabla scanned_tickets si no existe
  }
  /**
 * Inicializa base de datos para un evento específico
 * Se usa desde selectEntrada() cuando el usuario elige un evento.
 */
  async initEventDB(eventId: string): Promise<void> {
    await this.initDB(); // abre conexión si no existe

    if (!this.db) {
      console.error(' No se pudo abrir la base de datos');
      return;
    }

    // Crea la tabla de tickets del evento si no existe
    await this.db.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      code TEXT PRIMARY KEY,
      view INTEGER,
      ticket_status INTEGER,
      event_id TEXT,
      ticket_id TEXT,
      acceso TEXT,
      numeroOrden TEXT,
      evento_id TEXT,
      username TEXT,
      fecha_lectura TEXT,
      created_at TEXT,
      updated_at TEXT,
      sent INTEGER,
      codeNumericQR TEXT,
      checkin INTEGER,
      codigoCompra TEXT
    );
  `);

    // Índices
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_codeNumericQR ON tickets (codeNumericQR);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_ticket_id ON tickets (ticket_id);`);

    // Garantiza que exista la tabla scanned_tickets (solo una vez)
    await this.ensureTablesExist();

    console.log(`Base de datos lista para evento: ${eventId}`);
  }


  //  Abre la conexión principal (solo una vez)
  async initDB() {
    if (this.isInitialized && this.db) {
      console.log('Base de datos ya inicializada');
      return this.db;
    }

    try {
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (isConn) {
        console.log('🔄 Reutilizando conexión existente');
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        console.log('🆕 Creando nueva conexión SQLite');
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }

      await this.db.open();

      // Crear tabla principal (tickets)
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS tickets (
          code TEXT PRIMARY KEY,
          view INTEGER,
          ticket_status INTEGER,
          event_id TEXT,
          ticket_id TEXT,
          acceso TEXT,
          numeroOrden TEXT,
          evento_id TEXT,
          username TEXT,
          fecha_lectura TEXT,
          created_at TEXT,
          updated_at TEXT,
          sent INTEGER,
          codeNumericQR TEXT,
          checkin INTEGER,
          codigoCompra TEXT
        );
      `);

      this.isInitialized = true;
      console.log(' Base de datos inicializada correctamente');
      return this.db;
    } catch (err) {
      console.error(' Error al inicializar la base de datos:', err);
      this.db = null;
      this.isInitialized = false;
      return null;
    }
  }

// Verifica o crea tabla de escaneos
async ensureTablesExist() {
  if (!this.db) {
    console.warn('⚠️ Base de datos aún no inicializada, inicializando...');
    await this.initDB();
  }

  // 🧹 Eliminar la tabla anterior si existía
  console.log('🗑️ Eliminando tabla scanned_tickets anterior (si existe)...');
  await this.db!.run(`DROP TABLE IF EXISTS scanned_tickets;`);

  // 🆕 Crear la tabla nuevamente con la columna codigoCompra incluida
  console.log('🆕 Creando tabla scanned_tickets con nueva estructura...');
  await this.db!.run(`
    CREATE TABLE IF NOT EXISTS scanned_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT,
      codeNumericQR TEXT,
      acceso TEXT,
      numeroOrden INTEGER,
      evento_id TEXT,
      username TEXT,
      fecha_lectura TEXT,
      created_at TEXT,
      updated_at TEXT,
      sent INTEGER DEFAULT 0,
      offline INTEGER DEFAULT 0,
      online INTEGER DEFAULT 0,
      codigoCompra TEXT,
      UNIQUE(ticket_id)
    );
  `);

  console.log('✅ Tabla scanned_tickets recreada correctamente con codigoCompra');
}

  // Inserta un ticket normal
  async addTicket(ticket: any) {
    if (!this.db) {
      console.error(' La base de datos no está inicializada');
      return;
    }

    try {
      await this.db.run(
        `INSERT OR REPLACE INTO tickets (
        code, view, ticket_status, event_id, ticket_id, acceso,
        numeroOrden, evento_id, username, fecha_lectura, created_at,
        updated_at, sent, codeNumericQR, checkin, codigoCompra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          ticket.code,
          ticket.view ? 1 : 0,
          ticket.ticket_status,
          ticket.event_id,
          ticket.ticket_id,
          ticket.acceso,
          ticket.numeroOrden,
          ticket.evento_id,
          ticket.nombre,
          ticket.fecha_lectura,
          ticket.created_at,
          ticket.updated_at,
          ticket.sent,
          ticket.codeNumericQR,
          ticket.checkin,
          ticket.codigoCompra || null // 👈 Nuevo campo
        ]
      );

      console.log(' Ticket insertado correctamente:', ticket?.codigoCompra || '(sin id)');
    } catch (err) {
      console.error(' Error insertando ticket:', err);
    }
  }


  async getDatabase() {
    if (!this.db) throw new Error(' La base de datos no está inicializada');
    return this.db;
  }

  async getTicketsByEvent(event_id: string): Promise<{ values: any[] }> {
    try {
      const db = await this.getDatabase();
      const result = await db.query(`SELECT * FROM tickets WHERE event_id = ?;`, [event_id]);
      return { values: result.values ?? [] };
    } catch (error) {
      console.error(' Error obteniendo tickets por evento:', error);
      return { values: [] };
    }
  }

  //  Guarda ticket escaneado con control offline/online
  async addScannedTicket(ticket: any, isOnline: boolean): Promise<void> {
    try {
      const db = await this.getDatabase();
      const now = new Date().toISOString();

      await db.run(
        `INSERT OR REPLACE INTO scanned_tickets (
    ticket_id, codeNumericQR, acceso, numeroOrden, evento_id,
    username, fecha_lectura, created_at, updated_at, sent,
    offline, online, codigoCompra
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          ticket.ticket_id,
          ticket.codeNumericQR,
          ticket.acceso,
          ticket.numeroOrden,
          ticket.evento_id || ticket.event_id,
          ticket.username || '',
          now,
          now,
          now,
          0,
          isOnline ? 0 : 1,
          isOnline ? 1 : 0,
          ticket.codigoCompra || null
        ]
      );



      console.log(' Ticket escaneado guardado en scanned_tickets:', ticket.ticket_id);
    } catch (err) {
      console.error(' Error insertando ticket escaneado:', err);
    }
  }

  async isTicketScanned(ticket_id: string): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const result = await db.query(`SELECT COUNT(*) as count FROM scanned_tickets WHERE ticket_id = ?;`, [ticket_id]);
      const count = result.values?.[0]?.count || 0;
      return count > 0;
    } catch (err) {
      console.error(' Error verificando ticket escaneado:', err);
      return false;
    }
  }
  /**
   *Sincroniza todos los escaneos offline con el servidor
   * Llama este método cuando la app recupere conexión.
   */
  async syncOfflineScans(uploadFn: (scans: any[]) => Promise<boolean>): Promise<void> {
    try {
      const db = await this.getDatabase();

      //  Obtener todos los escaneos pendientes (offline)
      const result = await db.query(`
      SELECT * FROM scanned_tickets WHERE offline = 1 AND sent = 0;
    `);

      const scans = result.values ?? [];

      if (scans.length === 0) {
        console.log(' No hay escaneos offline pendientes por sincronizar');
        return;
      }

      console.log(`📤 Sincronizando ${scans.length} escaneos offline...`);

      //  Enviar al servidor (tu función la maneja)
      const success = await uploadFn(scans);

      if (!success) {
        console.warn('⚠️ La sincronización falló, reintentará más tarde');
        return;
      }

      //Marcar como enviados
      const ids = scans.map(s => s.ticket_id);
      const placeholders = ids.map(() => '?').join(',');

      await db.run(
        `UPDATE scanned_tickets 
       SET sent = 1, offline = 0, online = 1 
       WHERE ticket_id IN (${placeholders});`,
        ids
      );

      console.log(` Escaneos sincronizados correctamente (${scans.length})`);
    } catch (err) {
      console.error(' Error durante la sincronización offline:', err);
    }
  }

    async syncScans(uploadFn: (scans: any[]) => Promise<boolean>): Promise<void> {
    try {
      const db = await this.getDatabase();

      //  Obtener todos los escaneos pendientes (offline)
      const result = await db.query(`
      SELECT * FROM scanned_tickets WHERE sent = 0;
    `);

      const scans = result.values ?? [];

      if (scans.length === 0) {
        console.log(' No hay escaneos offline pendientes por sincronizar');
        return;
      }

      console.log(`📤 Sincronizando ${scans.length} escaneos offline...`);

      //  Enviar al servidor (tu función la maneja)
      const success = await uploadFn(scans);

      if (!success) {
        console.warn('⚠️ La sincronización falló, reintentará más tarde');
        return;
      }

      //Marcar como enviados
      const ids = scans.map(s => s.ticket_id);
      const placeholders = ids.map(() => '?').join(',');

      await db.run(
        `UPDATE scanned_tickets 
       SET sent = 1, offline = 0, online = 1 
       WHERE ticket_id IN (${placeholders});`,
        ids
      );

      console.log(` Escaneos sincronizados correctamente (${scans.length})`);
    } catch (err) {
      console.error(' Error durante la sincronización offline:', err);
    }
  }

  async closeDB() {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
      this.isInitialized = false;
      console.log('🔒 Base de datos cerrada');
    }
  }
  async countTickets(): Promise<number> {
  try {
    const db = await this.getDatabase();
    const result = await db.query(`SELECT COUNT(*) as total FROM tickets;`);
    return result.values?.[0]?.total ?? 0;
  } catch (err) {
    console.error('❌ Error contando tickets:', err);
    return 0;
  }
}
async clearTickets(): Promise<void> {
  const db = await this.getDatabase();
  await db.execute(`DELETE FROM tickets;`);
  console.log('🗑️ Todos los tickets locales fueron eliminados');
}
async getAllTicketIds(): Promise<string[]> {
  const db = await this.getDatabase();
  const query = `SELECT ticket_id FROM tickets;`;
  const result = await db.query(query);
  return result.values?.map((row: any) => row.ticket_id) ?? [];
}


}
