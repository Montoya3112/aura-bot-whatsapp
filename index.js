const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE RUTA TEMPORAL (SOLUCIÓN PLAN B)
// ==========================================
// Esto crea una carpeta fuera de OneDrive para que no haya errores de permisos
const tempPath = path.join(os.tmpdir(), 'aura_league_session');
console.log(`📂 Iniciando sesión en ruta local segura: ${tempPath}`);

// 1. Inicializar Firebase Admin (Asegúrate que el archivo esté en la carpeta)
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// 2. Configuración Blindada del Cliente de WhatsApp
const client = new Client({
    // Forzamos a que guarde la sesión en la carpeta temporal de Windows
    authStrategy: new LocalAuth({ dataPath: tempPath }), 
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    // Evita el error de "Execution context was destroyed" por actualizaciones de Meta
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Evento para mostrar el QR
client.on('qr', (qr) => {
    console.log('📱 ESCANEA ESTE CÓDIGO QR PARA AURA LEAGUE PRO:');
    qrcode.generate(qr, { small: true });
});

// Evento cuando el bot ya está listo
client.on('ready', () => {
    console.log('✅ BOT CONECTADO: Ahora puedes registrar capitanes en la plataforma.');
});

client.initialize();

// ==========================================
// RUTA 1: ENVIAR CÓDIGO DE VERIFICACIÓN
// ==========================================
app.post('/api/enviar-verificacion', async (req, res) => {
    const { numero, codigo } = req.body;
    try {
        const numeroFinal = `521${numero}@c.us`; 
        const mensaje = `[Aura League Pro] 🛡️\n\nTu código de verificación es: *${codigo}*\n\nNo compartas este código. Úsalo para validar tu número de celular.`;
        
        await client.sendMessage(numeroFinal, mensaje);
        res.status(200).json({ exito: true, mensaje: 'WhatsApp enviado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// RUTA 2: ENVIAR TOKEN FINAL
// ==========================================
app.post('/api/enviar-token-final', async (req, res) => {
    const { numero, nombre, token } = req.body;
    try {
        const numeroFinal = `521${numero}@c.us`;
        const mensaje = `¡Bienvenido ${nombre}! 🏆\n\nTu registro en *Aura League Pro* ha sido exitoso.\n\nTu Token Maestro de Capitán es: *${token}*\n\nGuárdalo bien, lo ocuparás para entrar al panel.`;

        await client.sendMessage(numeroFinal, mensaje);
        res.status(200).json({ exito: true, mensaje: 'Token enviado' });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Microservicio corriendo en http://localhost:${PORT}`);
});