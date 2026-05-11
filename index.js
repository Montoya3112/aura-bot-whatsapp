const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode'); // Cambiamos la librería para generar imágenes
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');

const rutaTemporal = path.join(os.tmpdir(), 'sesion_aura_pro');
const app = express();
app.use(cors());
app.use(express.json());

let ultimoQR = ""; // Aquí guardaremos el código para la web

// 1. Firebase
const llavesFirebase = require("./serviceAccount.json");
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(llavesFirebase) });
}

// 2. Bot
const bot = new Client({
    authStrategy: new LocalAuth({ dataPath: rutaTemporal }), 
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Guardamos el QR en una variable en lugar de solo imprimirlo
bot.on('qr', (qr) => {
    ultimoQR = qr; 
    console.log('📱 [AURA LEAGUE] NUEVO QR GENERADO. MIRA LA WEB.');
});

bot.on('ready', () => {
    ultimoQR = "CONECTADO";
    console.log('✅ BOT VINCULADO');
});

bot.initialize();

// ==========================================
// RUTA SECRETA PARA VER EL QR PERFECTO
// ==========================================
app.get('/ver-qr', (req, res) => {
    if (!ultimoQR) return res.send("Esperando el QR... refresca en 10 segundos.");
    if (ultimoQR === "CONECTADO") return res.send("✅ El bot ya está conectado.");

    // Generamos un HTML con el QR perfecto
    qrcode.toDataURL(ultimoQR, (err, url) => {
        res.send(`
            <div style="text-align:center; font-family:Arial;">
                <h1>Escanea para Aura League Pro</h1>
                <img src="${url}" style="width:300px; border:10px solid white;">
                <p>Si no carga, refresca la página.</p>
            </div>
        `);
    });
});

// Rutas de API existentes...
app.post('/api/enviar-verificacion', async (req, res) => { /* Tu código igual */ });
app.post('/api/enviar-token-final', async (req, res) => { /* Tu código igual */ });

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PUERTO}`);
});