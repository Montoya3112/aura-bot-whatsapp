const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');

// Configuración de la carpeta de sesión
const rutaTemporal = path.join(os.tmpdir(), 'sesion_aura_pro');
console.log(`📂 Carpeta de sesión: ${rutaTemporal}`);

// 1. Inicializar Firebase
const llavesFirebase = require("./serviceAccount.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(llavesFirebase)
    });
}

const app = express();
app.use(cors());
app.use(express.json());

// 2. Configuración del Bot (Optimizada para la nube)
const bot = new Client({
    authStrategy: new LocalAuth({ dataPath: rutaTemporal }), 
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Mostrar el código QR
bot.on('qr', (qr) => {
    console.log('📱 [AURA LEAGUE PRO] ESCANEA ESTE QR AHORA:');
    qrcode.generate(qr, { small: false });
});

// Confirmación de conexión
bot.on('ready', () => {
    console.log('✅ BOT VINCULADO Y LISTO PARA ENVIAR MENSAJES');
});

bot.initialize().catch(err => console.error("❌ Error al iniciar bot:", err));

// --- RUTA: ENVIAR CÓDIGO ---
app.post('/api/enviar-verificacion', async (req, res) => {
    const { numero, codigo } = req.body;
    try {
        const idChat = `521${numero.toString().replace(/\D/g, '')}@c.us`; 
        const texto = `[Aura League Pro] 🛡️\n\nTu código es: *${codigo}*`;
        await bot.sendMessage(idChat, texto);
        res.status(200).json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// --- RUTA: ENVIAR TOKEN ---
app.post('/api/enviar-token-final', async (req, res) => {
    const { numero, nombre, token } = req.body;
    try {
        const idChat = `521${numero.toString().replace(/\D/g, '')}@c.us`;
        const texto = `¡Hola ${nombre}! 🏆\n\nRegistro exitoso en Aura League Pro.\n\nTu Token es: *${token}*`;
        await bot.sendMessage(idChat, texto);
        res.status(200).json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
    console.log(`🚀 Servidor operativo en el puerto ${PUERTO}`);
});