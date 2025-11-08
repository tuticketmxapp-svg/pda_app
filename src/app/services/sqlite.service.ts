import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface Ticket {
  code: string;
  view: boolean;
  ticket_status: number;
  [key: string]: any;
  event_id: any;
  ticket_id: string;
  acceso: string;
  numeroOrden: any;
  evento_id: string;
  username: any;
  fecha_lectura: string;
  created_at: string;
  updated_at: string;
  sent: number;
  codeNumericQR: string;
  checkin: number;
}

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private db!: SQLiteDBConnection;

  constructor() {}

  async initDB(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();

      if (platform === 'web') {
        const jeepEl = document.querySelector('jeep-sqlite');
        if (!jeepEl) {
          console.error('❌ jeep-sqlite no encontrado en el DOM');
          return;
        }

        await CapacitorSQLite.initWebStore();

        await CapacitorSQLite.createConnection({
          database: 'mydb',
          version: 1,
          encrypted: false,
          mode: 'no-encryption',
          readonly: false,
        });

        this.db = await CapacitorSQLite.open({ database: 'mydb' }) as unknown as SQLiteDBConnection;

      } else {
        this.db = await CapacitorSQLite.createConnection({
          database: 'mydb',
          version: 1,
          encrypted: false,
          mode: 'no-encryption',
          readonly: false,
        }) as unknown as SQLiteDBConnection;

        await this.db.open();
      }

      console.log('✅ Base de datos abierta correctamente');

      // Crear tabla tickets
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
          checkin INTEGER
        );
      `);

      console.log('✅ Tabla tickets creada correctamente');

    } catch (err) {
      console.error('❌ Error al inicializar la base de datos:', err);
    }
  }

  getDB(): SQLiteDBConnection {
    return this.db;
  }

  // Funciones CRUD para tickets

async addTicket(ticket: Ticket) {
  if (!this.db) {
    console.error('❌ La base de datos no está inicializada');
    return;
  }

  // Crear tabla si no existe
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
      checkin INTEGER
    );
  `);

  // Insertar ticket
  await this.db.run(`
    INSERT OR REPLACE INTO tickets (
      code, view, ticket_status, event_id, ticket_id, acceso,
      numeroOrden, evento_id, username, fecha_lectura, created_at,
      updated_at, sent, codeNumericQR, checkin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    ticket.code,
    ticket.view ? 1 : 0,
    ticket.ticket_status,
    ticket.event_id,
    ticket.ticket_id,
    ticket.acceso,
    ticket.numeroOrden,
    ticket.evento_id,
    ticket.username,
    ticket.fecha_lectura,
    ticket.created_at,
    ticket.updated_at,
    ticket.sent,
    ticket.codeNumericQR,
    ticket.checkin
  ]);
}



  async getTickets(): Promise<Ticket[]> {
    const res = await this.db.query(`SELECT * FROM tickets`);
    return res.values as Ticket[];
  }

  async getTicketByCode(code: string): Promise<Ticket | null> {
    const res = await this.db.query(`SELECT * FROM tickets WHERE code = ?`, [code]);
    return res.values?.[0] as Ticket || null;
  }

  async deleteTicket(code: string) {
    await this.db.run(`DELETE FROM tickets WHERE code = ?`, [code]);
  }

  async clearTickets() {
    await this.db.run(`DELETE FROM tickets`);
  }
}
