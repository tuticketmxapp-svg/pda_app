import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Storage } from '@ionic/storage';

@Component({
    selector: 'app-valladolid',
    templateUrl: './valladolid.page.html',
    //styleUrls: ['./valladolid.page.scss'],
    standalone: false
})
export class ValladolidPage {
    code: string = ''; // Almacena el código QR temporalmente
    private storageKey = 'scannedQrCodes';
    qrCodes: { code: string, count: number, name: string }[] = [
     
        { code: '591777014678717', count: 0, name: 'Martes' },
        { code: '283850161830987', count: 0, name: 'Miercoles' },
        { code: '29965534184382', count: 0, name: 'Jueves' },
        { code: '954226595176262', count: 0, name: 'Viernes' },
        { code: '255668472725544', count: 0, name: 'Sabado' },
        { code: '853037973431086', count: 0, name: 'Domingo' },
        { code: '730701886236120', count: 0, name: 'QR8' },
        { code: '281103203149576', count: 0, name: 'QR9' },
        { code: '713894575245345', count: 0, name: 'QR10' },
    ];

    constructor(
        private cdr: ChangeDetectorRef,
        private storage: Storage) { }
    async ngOnInit() {
        await this.storage.create();
        const savedData = await this.storage.get(this.storageKey);
        if (savedData) {
            this.qrCodes = savedData;
        }
    }

    @HostListener('document:keypress', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        const key = event.key;
        if (key === 'Enter') {
            if (this.code !== '') {
                this.processQRCode(this.code); // Procesar el código cuando se presiona Enter
                this.code = ''; // Limpiar el código después de procesarlo
            }
        } else {
            this.code += key; // Acumular las teclas presionadas
        }
    }

    async processQRCode(scannedCode: string) {
        const index = this.qrCodes.findIndex((qr) => qr.code === scannedCode);

        if (index !== -1) {
            this.qrCodes[index].count += 1;
            this.qrCodes = [...this.qrCodes];
            this.cdr.detectChanges();
            await this.updateStorage();
        } else {
            console.log('Código QR no reconocido.');
        }
    }
    async scanQRCode() {
        try {
            const { barcodes } = await BarcodeScanner.scan(); // Escanear el código QR
            if (barcodes && barcodes.length > 0) {
                const scannedCode = barcodes[0].displayValue; // Obtener el valor del QR escaneado
                this.processQRCode(scannedCode); // Procesar el código escaneado
            } else {
                console.log('No se detectaron códigos QR.');
            }
        } catch (error) {
            console.error('Error al escanear QR:', error);
        }
    }
    async updateStorage() {
        await this.storage.set(this.storageKey, this.qrCodes);
        console.log('Datos actualizados en el almacenamiento:', this.qrCodes);
    }
    async clearStorage() {
        await this.storage.remove(this.storageKey);
        this.qrCodes.forEach((qr) => (qr.count = 0)); // Reiniciar los contadores
        console.log('Almacenamiento limpiado y contadores reiniciados.');
    }
}
