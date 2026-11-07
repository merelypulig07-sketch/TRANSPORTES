// EJECUTA ESTE ARCHIVO UNA SOLA VEZ para crear el usuario admin y los 4 servicios.
// En la terminal, dentro de la carpeta server:  node seed.js
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://merelypulig07_db_user:ySE7hnvs4u8RfBzt@cluster0.r4poslq.mongodb.net/transportes?retryWrites=true&w=majority";
const JWT_SECRET = "proyecto_transporte_kia_joel_secreto_2026";
const ADMIN_PASSWORD = "admin123";

const Admin = mongoose.model('Admin', new mongoose.Schema({ email: String, password: String }));
const Servicio = mongoose.model('Servicio', new mongoose.Schema({ nombre: String, descripcion: String, icono: String }));

const serviciosIniciales = [
  { nombre: 'Transporte Terrestre', descripcion: 'Flota moderna y equipada para transporte de carga pesada y liviana a nivel nacional.', icono: '🚛' },
  { nombre: 'Carga Completa y Parcial', descripcion: 'Soluciones adaptadas a su volumen. Desde envios parciales hasta carga completa.', icono: '📦' },
  { nombre: 'Seguridad y Seguimiento', descripcion: 'Monitoreo constante de su carga. Entregas puntuales y garantizadas.', icono: '🛡️' },
  { nombre: 'Cobertura Nacional', descripcion: 'Llegamos a todo el Ecuador. Conexiones eficientes entre todas las regiones.', icono: '📍' }
];

mongoose.connect("mongodb+srv://merelypulig07_db_user:ySE7hnvs4u8RfBzt@cluster0.r4poslq.mongodb.net/transportes?retryWrites=true&w=majority")
  console.log('Conectado a MongoDB...');

  // Crear usuario admin
  await Admin.deleteMany({});
  const pass = process.env.ADMIN_PASSWORD || 'admin123';
  await Admin.create({ email: 'admin@kiajoel.com', password: bcrypt.hashSync(pass, 10) });
  console.log('✅ Admin creado -> correo: admin@kiajoel.com  |  contraseña: ' + pass);

  // Crear los 4 servicios si aun no existen
  const cuantos = await Servicio.countDocuments();
  if (cuantos === 0) {
    await Servicio.insertMany(serviciosIniciales);
    console.log('✅ 4 servicios creados en la base de datos');
  } else {
    console.log('ℹ️  Los servicios ya existian, no se modificaron');
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
