const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// DATOS DIRECTOS — NO TOCAR
const MONGODB_URI = "mongodb+srv://merelypulig07_db_user:ySE7hnvs4u8RfBzt@cluster0.r4pos1q.mongodb.net/transportes?retryWrites=true&w=majority";
const JWT_SECRET = "proyecto_transporte_kia_joel_secreto_2026";
const GEMINI_API_KEY = "";
const CORS_ORIGIN = "https://merelypulig07-sketch.github.io";
const PORT = 4000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    CORS_ORIGIN,
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5173'
  ]
}));

// ---------- Modelos ----------
const Servicio = mongoose.model('Servicio', new mongoose.Schema({
  nombre: String, descripcion: String, icono: String
}));
const Cotizacion = mongoose.model('Cotizacion', new mongoose.Schema({
  nombre: String, telefono: String, origen: String, destino: String,
  tipoCarga: String, peso: String, fecha: String, mensaje: String,
  atendida: { type: Boolean, default: false },
  fechaCreacion: { type: Date, default: Date.now }
}));
const Admin = mongoose.model('Admin', new mongoose.Schema({
  email: String, password: String
}));

// ---------- Middleware ----------
const requiereAuth = (req, res, next) => {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
};

// ---------- RUTAS PÚBLICAS ----------
app.get('/api/servicios', async (req, res) => {
  try { res.json(await Servicio.find()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cotizaciones', async (req, res) => {
  try {
    const c = await Cotizacion.create(req.body);
    res.status(201).json({ ok: true, mensaje: 'Solicitud recibida', id: c._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: (req.body.email || '').toLowerCase().trim() });
    if (!admin || !bcrypt.compareSync(req.body.password || '', admin.password)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: '4h' });
    res.json({ token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chatbot', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.json({ respuesta: "Hola! Escribe tu origen, destino y tipo de carga para darte una cotización. O escríbenos al WhatsApp 0994588225." });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelo = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const instrucciones = "Eres el asistente de KIA & JOELOGISTICA S.A. Transporte de carga en Ecuador. Servicios: 1)Transporte Terrestre, 2)Carga Completa/Parcial, 3)Seguimiento, 4)Cobertura Nacional. WhatsApp:0994588225. Correo:merelypulig@gmail.com. Responde corto y amable. Pide: ciudad origen, destino, tipo de carga, peso.";
    const resultado = await modelo.generateContent(`${instrucciones}\nPregunta: ${req.body.mensaje}`);
    res.json({ respuesta: resultado.response.text() });
  } catch (e) {
    res.json({ respuesta: "Contáctanos al WhatsApp 0994588225 para ayudarte personalmente." });
  }
});

// ---------- RUTAS DEL ADMIN ----------
app.get('/api/cotizaciones', requiereAuth, async (req, res) => {
  try { res.json(await Cotizacion.find().sort({ fechaCreacion: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cotizaciones/:id', requiereAuth, async (req, res) => {
  try { await Cotizacion.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => res.send('API de KIA & JOELOGISTICA funcionando'));

// ---------- CONEXIÓN Y ARRANQUE ----------
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    inicializarBaseDatos(); // ← LLAMAR A LA FUNCIÓN AQUÍ ✅
  })
  .catch(err => console.log("❌ Error:", err.message));

// Inicializar datos la primera vez que se enciende
const inicializarBaseDatos = async () => {
  try {
    const cuantosServicios = await Servicio.countDocuments();
    if (cuantosServicios === 0) {
      await Servicio.insertMany([
        { nombre: 'Transporte Terrestre', descripcion: 'Flota moderna y equipada para transporte de carga pesada y liviana a nivel nacional.', icono: '🚛' },
        { nombre: 'Carga Completa y Parcial', descripcion: 'Soluciones adaptadas a su volumen. Desde envíos parciales hasta carga completa.', icono: '📦' },
        { nombre: 'Seguridad y Seguimiento', descripcion: 'Monitoreo constante de su carga. Entregas puntuales y garantizadas.', icono: '🛡️' },
        { nombre: 'Cobertura Nacional', descripcion: 'Llegamos a todo el Ecuador. Conexiones eficientes entre todas las regiones.', icono: '📍' }
      ]);
      console.log('✅ 4 servicios creados automáticamente');
    } else {
      console.log('ℹ️ Servicios ya existen:', cuantosServicios);
    }

    const cuantosAdmin = await Admin.countDocuments();
    if (cuantosAdmin === 0) {
      await Admin.create({ 
        email: 'admin@kiajoel.com', 
        password: bcrypt.hashSync('admin123', 10) 
      });
      console.log('✅ Admin creado: admin@kiajoel.com / admin123');
    }
  } catch (err) {
    console.log('ℹ️ Ya inicializado o error menor:', err.message);
  }
};

app.listen(PORT, () => {
  console.log(`✅ API corriendo en puerto ${PORT}`);
});
