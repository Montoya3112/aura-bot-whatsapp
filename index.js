const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE RUTA TEMPORAL (DINÁMICA)
// ==========================================
// Esto asegura que funcione en Windows (local) y Linux (Render)
const tempPath = path.join(os.tmpdir(), 'aura_league_session');
console.log(`📂 Sistema de archivos: Guardando sesión en ${tempPath}`);

// 1. Inicializar Firebase Admin
// Recuerda que en Render este archivo debe estar cargado como "Secret File"
const serviceAccount = require("./serviceAccount.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const app = express();
app.use(cors());
app.use(express.json());

// 2. Configuración Robusta del Cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: tempPath }), 
    puppeteer: {
        headless: true,
        // Al eliminar la ruta fija, permitimos que el Build Script encuentre Chrome solo
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Evento para el QR en consola
client.on('qr', (qr) => {
    console.log('📱 [AURA LEAGUE PRO] ESCANEA ESTE QR PARA ACTIVAR EL BOT:');
    qrcode.generate(qr, { small: true });
});

// Confirmación de conexión
client.on('ready', () => {
    console.log('✅ ESTADO: BOT CONECTADO Y FUNCIONANDO EN LA NUBE');
});

client.initialize().catch(err => {
    console.error("❌ Error al iniciar el cliente de WhatsApp:", err);
});

// ==========================================
// ENDPOINT 1: ENVÍO DE CÓDIGO (VERIFICACIÓN)
// ==========================================
app.post('/api/enviar-verificacion', async (req, res) => {
    const { numero, codigo } = req.body;
    try {
        const numeroLimpio = numero.toString().replace(/\D/g, '');
        const numeroFinal = `521${numeroLimpio}@c.us`; 
        const mensaje = `[Aura League Pro] 🛡️\n\nTu código de verificación es: *${codigo}*\n\nNo compartas este código con nadie.`;
        
        await client.sendMessage(numeroFinal, mensaje);
        res.status(200).json({ exito: true, mensaje: 'Código enviado por WhatsApp' });
    } catch (error) {
        console.error('Error en ruta verificacion:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// ENDPOINT 2: ENVÍO DE TOKEN (REGISTRO FINAL)
// ==========================================
app.post('/api/enviar-token-final', async (req, res) => {
    const { numero, nombre, token } = req.body;
    try {
        const numeroLimpio = numero.toString().replace(/\D/g, '');
        const numeroFinal = `521${numeroLimpio}@c.us`;
        const mensaje = `¡Bienvenido ${nombre}! 🏆\n\nTu registro en *Aura League Pro* ha sido exitoso.\n\nTu Token Maestro es: *${token}*\n\nÚsalo para ingresar a la plataforma.`;

        await client.sendMessage(numeroFinal, mensaje);
        res.status(200).json({ exito: true, mensaje: 'Token enviado con éxito' });
    } catch (error) {
        console.error('Error en ruta token:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Microservicio operativo en el puerto ${PORT}`);
});