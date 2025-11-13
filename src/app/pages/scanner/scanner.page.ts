import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController,
  Platform,
  ToastController
} from '@ionic/angular';
import * as moment from 'moment';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Network } from '@capacitor/network';

import { EventoService } from 'src/app/services/evento.service';
import { SqliteService } from 'src/app/services/sqlite.service';
import { ModalScannerPage } from './modal/modal.page';

interface Ticket {
  [key: string]: any;
  ticket_id: string;
  codeNumericQR: string;
  ticket_status?: number;
  acceso?: string;
  checkin?: number;
  numeroOrden?: any;
  event_id?: any;
  evento_id?: any;
}

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  standalone: false,
})
export class ScannerPage implements OnInit {
  // UI / state
  title = '';
  acceso = '';
  event_id = '';
  totalTickets = 0;
  isSupported = false;
  last_update = '';
  list: string = 'local';
  // Local data
  entered: any[] = [];         // escaneos locales (pendientes)
  lecturaOnline: any[] = [];   // escaneos online (traídos del servidor)
  user: any = null;

  // pequeño buffer para detectar teclas físicas
  codeBuffer = '';
  LIMIT1 = 50; // para lista 'local'
  LIMIT2 = 50; // para lista 'online'
  LIMIT3 = 50; // para lista 'historial'
  escaneados: any[] = [];
  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private loadingCtrl: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController,
    private ref: ChangeDetectorRef,
    private eventoService: EventoService,
    private sqliteService: SqliteService,
    private platform: Platform
  ) { }

  /* ---------------------------
     lifecycle
     --------------------------- */
  async ngOnInit() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      this.user = JSON.parse(userData);
      console.log('Usuario cargado:', this.user);
    }
    this.isSupported = !!BarcodeScanner.startScan;
    console.log('BarcodeScanner disponible:', this.isSupported);

    // escuchar cambios de red para sincronizar offline scans
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncOfflineTickets();
      }
    });

    // Si al abrir ya hay red, intentar sincronizar
    const status = await Network.getStatus();
    if (status.connected) {
      await this.syncOfflineTickets();
    }

    // Params — cuando se navega desde home con event_id
    this.route.params.subscribe(async params => {
      this.event_id = params['event_id'];
      // inicializar DB para el evento (crea tablas / indices si es necesario)
      try {
        if (this.event_id) {
          await this.sqliteService.initEventDB?.(this.event_id); // initEventDB es recomendado
          await this.setTotalTickets();
          await this.getEnteder(); // cargar entered desde storage si lo usas
        }
      } catch (err) {
        console.error('Error inicializando DB o cargando contadores:', err);
      }
    });

    // pequeño detect changes loop (evita que la UI se quede congelada con updates)
    setInterval(() => this.ref.detectChanges(), 500);
    const savedSegment = localStorage.getItem('scannerSegment');
    if (savedSegment) {
      this.list = savedSegment;
    }
    await this.loadScannedTickets();
  }


  async loadScannedTickets() {
    try {
      const db = await this.sqliteService.getDatabase();
      const result = await db.query(`SELECT * FROM scanned_tickets ORDER BY id DESC;`);
      this.escaneados = result.values ?? [];
      console.log(`🟢 Escaneados cargados: ${this.escaneados.length}`);
    } catch (err) {
      console.error('❌ Error cargando escaneados:', err);
      this.escaneados = [];
    }
  }
  /* ---------------------------
     teclado físico (buffer)
     --------------------------- */
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log('entre a escaneo')
    const key = event.key;
    if (key === 'Enter') {
      const code = this.codeBuffer.trim();
      this.codeBuffer = '';
      if (code) {
        this.findTicket(code);
      }
    } else {
      this.codeBuffer += key;
      // limitar buffer a tamaño razonable
      if (this.codeBuffer.length > 200) this.codeBuffer = this.codeBuffer.slice(-200);
    }
  }
  segmentChanged(event: any) {
    const newValue = event.detail?.value || this.list;
    this.list = newValue;
    // Guardar el nuevo valor en localStorage
    localStorage.setItem('scannerSegment', newValue);
  }

  /* ---------------------------
     Scanner (UI + plugin-safe)
     --------------------------- */
  async cameraScan(): Promise<void> {
    if (!this.isSupported) {
      await this.presentErrorAlert('Scanner no soportado', 'El plugin de scanner no está disponible en este entorno.');
      return;
    }

    try {
      // intentar pedir permisos (algunos dispositivos/plugins no implementan este método)
      try {
        // forzar permiso si es necesario
        // algunos dispositivos implementan checkPermission, otros no -> try/catch
        // @ts-ignore
        await BarcodeScanner.checkPermission?.({ force: true });
      } catch (permErr) {
        console.warn('checkPermission no disponible o falló:', permErr);
      }

      // hideBackground puede no estar implementado en Android plugin -> try/catch
      try {
        await BarcodeScanner.hideBackground?.();
        document.body.classList.add('scanner-active');
      } catch (hideErr) {
        console.warn('hideBackground no implementado o falló:', hideErr);
      }

      // iniciar escaneo
      const result = await BarcodeScanner.startScan();

      // finalizar escaneo visual (mostrar fondo de nuevo)
      try {
        await BarcodeScanner.showBackground?.();
        document.body.classList.remove('scanner-active');
      } catch (showErr) {
        console.warn('showBackground no implementado o falló:', showErr);
      }

      if (result && result.hasContent) {
        const scanned = result.content;
        console.log('Código escaneado:', scanned);
        await this.findTicket(scanned);
      } else {
        console.log('No se detectó ningún código');
        // opcional: mostrar toast
      }
    } catch (err) {
      console.error('❌ Error en cameraScan:', err);
      await this.presentErrorAlert('Scan error', 'Ocurrió un error al escanear. Intenta de nuevo.');
      // Asegurar que UI vuelva a estado normal
      try { document.body.classList.remove('scanner-active'); } catch { }
      try { await BarcodeScanner.showBackground?.(); } catch { }
    }
  }

  /* ---------------------------
     Find Ticket -> busca en sqlite y maneja lógica
     --------------------------- */
  async findTicket(ticket: any) {
    console.log('entre a findTicket despues de escaeo', ticket);
    let codeTick = '';
    let idEvento = '';

    // normalizar
    const isNumeric = /^\d+$/.test(String(ticket));
    if (isNumeric) {
      codeTick = String(ticket);
    } else {
      const tt = String(ticket).toLowerCase();
      const parts = tt.split('-');
      codeTick = parts.length !== 2 ? tt : parts[1];
      idEvento = parts.length !== 2 ? '' : parts[0];
    }

    const isOnline = (await Network.getStatus()).connected;
    console.log('scaneando ticket:', codeTick, 'Online?', isOnline);

    // decidir estrategia de búsqueda según cantidad registros
    let response: any[] = [];
    try {
      const totalTickets = await this.sqliteService.countTickets?.() ?? 0;
      console.log('Total tickets en SQLite:', totalTickets);
      if (totalTickets > 8000) {
        console.log('Modo optimizado: buscar por codigoCompra / qr / ticket_id');
        response = await this.findOccurrencesByCompra(codeTick);
      } else {
        response = isNumeric
          ? await this.findOccurrences(codeTick)
          : await this.findOccurrencesAlfa(codeTick);
      }
    } catch (err) {
      console.error('Error al decidir estrategia de búsqueda:', err);
      this.presentToast('danger', 'Error interno', 'No fue posible realizar la búsqueda');
      return;
    }

    if (!response || response.length === 0) {
      this.presentToast('danger', 'Ticket no encontrado', 'No válido o necesita actualizar');
      return;
    }

    const itemFindTicket: Ticket = response[0];

    // verificar duplicado en tabla scanned_tickets
    try {
      const alreadyScanned = await this.sqliteService.isTicketScanned(itemFindTicket.ticket_id);
      if (alreadyScanned) {
        this.presentToast('danger', 'Ticket duplicado', 'Ya fue escaneado anteriormente');
        return;
      }
    } catch (err) {
      console.error('Error verificando si ticket ya fue escaneado:', err);
      // seguir adelante (mejor un falso positivo que bloquear)
    }

    // validar reglas de acceso
    const ok = this.check(itemFindTicket);
    if (!ok) return;

    // guardar escaneo (offline/online)
    try {
      await this.sqliteService.addScannedTicket(itemFindTicket, isOnline);
    } catch (err) {
      console.error('Error guardando escaneo en scanned_tickets:', err);
    }

    // decrementar creditos locales y registrar (upload o local)
    itemFindTicket.checkin = (itemFindTicket.checkin ?? 1) - 1;
    this.setEnteder(itemFindTicket);
    console.log('Evalores de tickets escaeados', JSON.stringify(itemFindTicket, null, 2));

    await this.presentToastSuccess(itemFindTicket);
    await this.sqliteService.addScannedTicket(itemFindTicket, isOnline);
    await this.loadScannedTickets();
  }
  async presentToastSuccess(ticket: any) {
    // Crear contenedor del toast
    const toastEl = document.createElement('div');
    toastEl.classList.add('custom-toast-success');

    toastEl.innerHTML = `
    <div class="toast-content">
      <h2>✅ ACCESO PERMITIDO</h2>
      <p>Permitir entrada al evento</p>
      <div class="toast-info">
        <strong>Evento:</strong> ${ticket.event_id || 'N/D'} <br>
        <strong>Usuario:</strong> ${ticket.nombre || 'N/D'}
      </div>
    </div>
  `;

    document.body.appendChild(toastEl);

    // Mostrar con animación
    setTimeout(() => toastEl.classList.add('show'), 50);

    // Ocultar automáticamente
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 500);
    }, 4000);
  }


  /* ---------------------------
     DB lookup helpers
     --------------------------- */
  async findOccurrences(ticketId: string): Promise<any[]> {
    try {
      const db = await this.sqliteService.getDatabase();
      const result = await db.query(`SELECT * FROM tickets WHERE codeNumericQR = ?;`, [ticketId]);
      return result.values ?? [];
    } catch (err) {
      console.error('Error buscando ticket numérico:', err);
      return [];
    }
  }

  async findOccurrencesAlfa(ticketId: string): Promise<any[]> {
    try {
      const db = await this.sqliteService.getDatabase();
      const result = await db.query(`SELECT * FROM tickets WHERE LOWER(ticket_id) = ?;`, [ticketId.toLowerCase()]);
      return result.values ?? [];
    } catch (err) {
      console.error('Error buscando ticket alfanumérico:', err);
      return [];
    }
  }

  // búsqueda optimizada cuando hay > 70k registros
  async findOccurrencesByCompra(codigoCompra: string): Promise<any[]> {
    console.log('codigoCompra', codigoCompra);
    try {
      const db = await this.sqliteService.getDatabase();
      const query = `
      SELECT * FROM tickets
      WHERE codigoCompra = ?;
    `;
      const result = await db.query(query, [codigoCompra]);

      console.log('🎟️ Resultados por codigoCompra:', result.values?.length || 0);
      return result.values ?? [];
    } catch (err) {
      console.error('❌ Error buscando por codigoCompra:', err);
      return [];
    }
  }


  /* ---------------------------
     setEnteder / upload / entered management
     --------------------------- */
  async getEnteder() {
    // mantengo compatibilidad con storage si aún lo usas
    try {
      const stored = await (this.sqliteService as any).getEnteredFromStorage?.() ?? null;
      if (Array.isArray(stored)) this.entered = stored;
    } catch (err) {
      console.warn('No se pudo cargar entered desde storage (opcional):', err);
      this.entered = [];
    }
  }

  setEnteder(item: Ticket) {
    const dt = moment().format('YYYY-MM-DD HH:mm:ss');
    const data = {
      ticket_id: item.ticket_id,
      acceso: item.acceso,
      numeroOrden: item.numeroOrden,
      evento_id: this.event_id,
      username: this.user?.username ?? 'sin_usuario',
      fecha_lectura: dt,
      created_at: dt,
      updated_at: dt,
      sent: 1,
      code: item['code'] || '',
      view: item['view'] ?? false,
      ticket_status: 1,
      event_id: this.event_id,
      codeNumericQR: item.codeNumericQR || '0',
      checkin: 0
    };

    // intento subir en tiempo real; si falla, lo guardo local/entered
    this.eventoService.checkin(data).subscribe({
      next: async () => {
        this.entered.unshift(data);
        try { await (this.sqliteService as any).saveEnteredToStorage?.(this.entered); } catch { }
      },
      error: async () => {
        const registro = { ...data, sent: 0 };
        this.entered.unshift(registro);
        try { await (this.sqliteService as any).saveEnteredToStorage?.(this.entered); } catch { }
      }
    });
  }

  // Subir pendientes (usa tu servicio/sqliteService)
  async syncOfflineTickets() {

    // si tu SqliteService tiene syncOfflineScans(callback) úsalo (más eficiente)
    try {
      if (typeof this.sqliteService.syncOfflineScans === 'function') {
        await this.sqliteService.syncOfflineScans(async (scans) => {
          console.log('Enviando a sync-scans:', JSON.stringify(scans, null, 2));
          try {
            await this.eventoService.uploadScannedTickets(scans).toPromise();
            console.log('Escaneos enviados al servidor (via sqliteService)');
            return true;
          } catch (err) {
            console.error('Error subiendo scanned ticket:', JSON.stringify(err, null, 2));
            return false;
          }
        });
        return;
      }

      // fallback: leer tabla scanned_tickets y subir
      const db = await this.sqliteService.getDatabase();
      const res = await db.query(`SELECT * FROM scanned_tickets WHERE sent = 0;`);
      const toUpload = res.values ?? [];
      for (const t of toUpload) {
        try {
          await this.eventoService.checkin(t).toPromise();
          await db.run(`UPDATE scanned_tickets SET sent = 1 WHERE ticket_id = ?;`, [t.ticket_id]);
        } catch (err) {
          console.error('Error subiendo scanned ticket:', err);
        }
      }
    } catch (err) {
      console.error('Error en syncOfflineTickets:', err);
    }
  }

  /* ---------------------------
     util / helpers UI
     --------------------------- */
  async presentToast(color = 'medium', header = '', message = '', item: any = null) {
    const buttons: any[] = [{ icon: 'close-outline', role: 'cancel', handler: () => { } }];
    if (item?.ticket_id) {
      buttons.push({ side: 'start', text: 'Ver', icon: 'eye', handler: () => this.modalScanner(item) });
    }
    const t = await this.toastController.create({ color, header, message, duration: 2500, buttons });
    await t.present();
  }

  async presentErrorAlert(title = 'Error', message = '') {
    const a = await this.alertController.create({ header: title, message, buttons: ['OK'] });
    await a.present();
  }

  async modalScanner(item: any) {
    const modal = await this.modalController.create({
      component: ModalScannerPage,
      componentProps: { item, entered: this.entered, online: this.lecturaOnline || [] }
    });
    await modal.present();
  }

  /* ---------------------------
     counters
     --------------------------- */
  async setTotalTickets(): Promise<void> {
    try {
      const result = await this.sqliteService.getTicketsByEvent(this.event_id);
      const tickets = result.values || [];
      const totalTickets = tickets.filter((t: any) => t.ticket_status === 1).length;
      this.totalTickets = totalTickets;
      console.log('🎟️ Total de tickets activos:', totalTickets);
    } catch (err) {
      console.error('Error calculando totalTickets:', err);
    }
  }

  /**
 * Verifica si el ticket cumple las condiciones de acceso
 * Retorna true si puede entrar, false si debe bloquearse.
 */
  check(ticket: Ticket): boolean {
    // ejemplo de validaciones — ajusta según tu lógica real
    if (!ticket) {
      this.presentToast('danger', 'Error', 'Ticket no válido');
      return false;
    }

    // si el ticket ya fue marcado como checkin completo
    if (ticket.checkin === 0) {
      this.presentToast('danger', 'Ticket ya usado', 'Este boleto ya fue validado.');
      return false;
    }

    // si el acceso del ticket no coincide con el acceso configurado
    if (this.acceso && ticket.acceso && ticket.acceso !== this.acceso) {
      this.presentToast('danger', 'Acceso incorrecto', `El ticket pertenece a ${ticket.acceso}`);
      return false;
    }

    // si el ticket está marcado como cancelado o inválido
    if (ticket.ticket_status === 0) {
      this.presentToast('danger', 'Ticket inactivo', 'Este boleto está cancelado o bloqueado.');
      return false;
    }

    // si pasa todas las validaciones
    return true;
  }
  async viewTicket(ticket_id: string) {

    let idEvento = '';
    let codeTick = '';

    const tt = ticket_id.toLowerCase();
    const parts = tt.split('-');

    if (parts.length === 2) {
      [idEvento, codeTick] = parts;
    } else {
      codeTick = ticket_id;
    }

    const response = this.findOccurrences(codeTick);

    if (!response || (await response).length === 0) {
      this.presentToast('danger', 'Ticket no encontrado', 'No válido para éste evento o actualice los últimos tickets');
      return;
    }

    // Para evitar abrir muchos modales simultáneamente, esperamos uno a la vez
    for (const item of await response) {
      item.view = true;
      await this.modalScanner(item);
    }
  }
  async goBack() {
    const db = await this.sqliteService.getDatabase();
    await db.run('DELETE FROM tickets;');
    this.navCtrl.back();
  }
  async actionSheet() {
    const buttons = [
      {
        text: "Subir escaneos pendientes",
        handler: async () => {
          await this.syncOfflineTickets();
        }
      },
      {
        text: "Descargar todo de nuevo",
        handler: async () => {
          await this.firstDownload();
        }
      },
      {
        text: "Actualizar (nuevas ventas)",
        handler: async () => {
          await this.syncTickets();
        }
      },
      {
        text: "Cancelar",
        role: "cancel"
      }
    ];

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una opción',
      buttons
    });
    await actionSheet.present();
  }

  async firstDownload(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Descargando todos los tickets...',
    });

    await loading.present();

    try {
      // 1. Eliminar los tickets locales
      await this.sqliteService.clearTickets();

      // 2. Descargar todos los tickets del evento
      const tickets = await this.eventoService.getTicekts(this.event_id, '').toPromise();

      // 3. Guardar en SQLite
      for (const t of tickets) {
        t.event_id = this.event_id;
        await this.sqliteService.addTicket(t);
      }

      console.log('✅ Todos los tickets descargados y guardados');
      this.presentToast('success', 'Descarga completa', `${tickets.length} tickets almacenados`);

    } catch (err) {
      console.error('Error en firstDownload:', err);
      this.presentToast('danger', 'Error', 'No se pudieron descargar los tickets');
    } finally {
      await loading.dismiss();
    }
  }

  async syncTickets() {
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Buscando nuevos tickets...',
    });

    await loading.present();

    try {
      // Obtener todos los ticket_id locales
      const localIds = await this.sqliteService.getAllTicketIds();

      // Solicitar al backend solo los que no existan
      const newTickets = await this.eventoService.getTicekts(this.event_id, localIds).toPromise();

      if (newTickets && newTickets.length > 0) {
        for (const t of newTickets) {
          t.event_id = this.event_id;
          await this.sqliteService.addTicket(t);
        }

        console.log('🆕 Nuevos tickets añadidos:', newTickets.length);
        this.presentToast('success', 'Actualización', `${newTickets.length} nuevos tickets añadidos`);
      } else {
        this.presentToast('medium', 'Sin cambios', 'No hay nuevos tickets');
      }
    } catch (error) {
      console.error('Error al sincronizar tickets:', error);
      this.presentToast('danger', 'Error', 'No se pudo sincronizar con el servidor');
    } finally {
      await loading.dismiss();
    }
  }

  async saveTicketsToSQLite(tickets: any[]) {
    const db = await this.sqliteService.getDatabase();

    // Limpia la tabla antes de volver a insertar
    await db.run('DELETE FROM tickets;');

    const insertQuery = `
    INSERT INTO tickets (ticket_id, codigoCompra, evento_id, checkin, ...)
    VALUES (?, ?, ?, ?, ...);
  `;

    for (const t of tickets) {
      await db.run(insertQuery, [t.ticket_id, t.codigoCompra, t.evento_id, t.checkin /* ... */]);
    }

    console.log(`Se insertaron ${tickets.length} tickets`);
  }

}
