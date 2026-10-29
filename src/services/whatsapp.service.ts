import whatsapp from 'whatsapp-web.js';
const { Client, LocalAuth } = whatsapp;
import qrcode from 'qrcode-terminal';

export class WhatsAppService {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session',
      }),
      puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // ई सबसे मेन बा, Docker में RAM फुल ना होखे दी
          '--disable-gpu',
          '--no-zygote',
          '--single-process',        // एकदम कम RAM में क्रोमियम चलावे खातिर
          '--disable-accelerated-2d-canvas'
        ],
      },
    });

    this.client.on('qr', (qr: string) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp Client is ready!');
    });

    this.client.initialize();
  }

  async sendMessage(toNumber: string, message: string): Promise<void> {
    const formattedNumber = toNumber.endsWith('@c.us')
      ? toNumber
      : `${toNumber.replace(/\D/g, '')}@c.us`;

    const chat = await this.client.getChatById(formattedNumber);
    await chat.sendMessage(message);
  }
}

const whatsappService = new WhatsAppService();

export default whatsappService;