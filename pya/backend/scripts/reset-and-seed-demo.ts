import dotenv from 'dotenv';
import { firestore } from '../src/config/firebase';

dotenv.config();

async function clearCollection(name: string) {
  const snap = await firestore.collection(name).get();
  if (snap.empty) return;
  const batchSize = 400;
  let batch = firestore.batch();
  let ops = 0;
  for (let idx = 0; idx < snap.docs.length; idx++) {
    const doc = snap.docs[idx];
    batch.delete(doc.ref);
    ops++;
    if (ops === batchSize || idx === snap.docs.length - 1) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  }
}

function nowOffset(hours: number) {
  return new Date(Date.now() - hours * 3600 * 1000);
}

async function seed() {
  console.log('⚠️ Limpiando colecciones principales...');
  for (const c of ['usuarios', 'estudiantes', 'tramites', 'documentos', 'notificaciones', 'aseguradoras']) {
    await clearCollection(c);
  }

  console.log('📥 Sembrando datos demo...');

  // Usuarios reales según Auth
  const usuarios = [
    { id: 'USER-ADMIN-BUSTA', data: { uid: 'VpRZEMnZZhWNnBHelZysTNCaqq62', correo: 'bustamanteroberto49@gmail.com', nombre: 'Roberto Bustamante', rol: 'ADMIN', activo: true, createdAt: nowOffset(120) } },
    { id: 'USER-GESTOR-ANTH', data: { uid: 'UAGpe4hb4gXKsVEK97fn3MFQKK53', correo: 'anthonyjhordy72@gmail.com', nombre: 'Anthony Jhordy', rol: 'GESTOR', activo: true, createdAt: nowOffset(118) } },
    { id: 'USER-CLI-DANI', data: { uid: 'UBnqvhd5pshBhPfya5WQxYIYnjk1', correo: 'daniela01@gmail.com', nombre: 'Daniela Ramírez', rol: 'CLIENTE', activo: true, createdAt: nowOffset(100) } },
    { id: 'USER-CLI-PAUL', data: { uid: '0vxcB7WCDwVR2EB4pC5RYognxWb2', correo: 'paulfosi23@gmail.com', nombre: 'Paul Espinosa', rol: 'CLIENTE', activo: true, createdAt: nowOffset(99) } },
    // Extras demo para volumen
    { id: 'USER-CLI-EX1', data: { uid: 'CLIENTE-DEMO-EX1', correo: 'lucia@demo.com', nombre: 'Lucia Vega', rol: 'CLIENTE', activo: true, createdAt: nowOffset(98) } },
    { id: 'USER-CLI-EX2', data: { uid: 'CLIENTE-DEMO-EX2', correo: 'marco@demo.com', nombre: 'Marco Rios', rol: 'CLIENTE', activo: true, createdAt: nowOffset(97) } },
  ];

  const estudiantes = [
    { id: 'EST-DANI', data: { uidUsuario: 'UBnqvhd5pshBhPfya5WQxYIYnjk1', cedula: '1102233445', nombreCompleto: 'Daniela Ramírez', periodoAcademico: '2025-2026', estadoAcademico: 'activo', estadoCobertura: 'vigente' } },
    { id: 'EST-PAUL', data: { uidUsuario: '0vxcB7WCDwVR2EB4pC5RYognxWb2', cedula: '1101234567', nombreCompleto: 'Paul Espinosa', periodoAcademico: '2025-2026', estadoAcademico: 'activo', estadoCobertura: 'vigente' } },
    { id: 'EST-LUCIA', data: { uidUsuario: 'CLIENTE-DEMO-EX1', cedula: '1100000001', nombreCompleto: 'Lucia Vega', periodoAcademico: '2025-2026', estadoAcademico: 'activo', estadoCobertura: 'vigente' } },
    { id: 'EST-MARCO', data: { uidUsuario: 'CLIENTE-DEMO-EX2', cedula: '1100000002', nombreCompleto: 'Marco Rios', periodoAcademico: '2025-2026', estadoAcademico: 'activo', estadoCobertura: 'vigente' } },
  ];

  const estados = ['registrado', 'en_validacion', 'aprobado', 'rechazado', 'con_observaciones'];
  const tipos = ['SEGURO_VIDA', 'ACCIDENTE', 'REEMBOLSO_MEDICO', 'ENFERMEDAD'];
  const copagos = ['personal', 'grupo_especial', 'licencia_sin_sueldo', 'estudiante'];

  const tramites: { id: string; data: any }[] = [];
  const estudiantesReal = [estudiantes[0], estudiantes[1]]; // Daniela y Paul
  const estudiantesExtra = [estudiantes[2], estudiantes[3]];

  const buildTramite = (id: string, est: any, estado: string, tipo: string, copagoCat: string, base: number) => {
    const porcentaje = copagoCat === 'personal' ? 0.3 : copagoCat === 'grupo_especial' ? 0.65 : copagoCat === 'licencia_sin_sueldo' ? 1 : 0;
    return {
      id,
      data: {
        idTramite: id,
        codigoUnico: id,
        estadoCaso: estado,
        tipoTramite: tipo,
        motivo: `Caso ${tipo.toLowerCase()} ${id}`,
        descripcion: `Descripcion caso ${id}`,
        fechaRegistro: nowOffset(48 - Number(id.split('-').pop())),
        estudiante: {
          cedula: est.data.cedula,
          nombreCompleto: est.data.nombreCompleto,
          periodoAcademico: est.data.periodoAcademico,
          estadoAcademico: est.data.estadoAcademico,
          estadoCobertura: est.data.estadoCobertura,
          idEstudiante: est.id
        },
        documentos: [],
        copago: {
          categoria: copagoCat,
          porcentaje,
          baseCalculo: base,
          valorEstimado: Number((base * porcentaje).toFixed(2)),
          fuente: 'TDR'
        },
        historial: [
          {
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'REGISTRADO',
            fecha: nowOffset(48),
            actor: est.data.uidUsuario,
            rol: 'CLIENTE',
            nota: 'Registro inicial'
          },
          {
            estadoAnterior: 'REGISTRADO',
            estadoNuevo: estado.toUpperCase(),
            fecha: nowOffset(47),
            actor: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
            rol: 'GESTOR',
            nota: 'Avance automático demo'
          }
        ],
        creadoPor: est.data.uidUsuario,
        actorUltimo: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
        rolUltimo: 'GESTOR'
      }
    };
  };

  // 12 trámites mezclando Daniela y Paul + extras
  const combos = [
    ['TR-DEMO-001', estudiantesReal[0], 'registrado', 'SEGURO_VIDA', 'personal', 520],
    ['TR-DEMO-002', estudiantesReal[1], 'en_validacion', 'ACCIDENTE', 'grupo_especial', 610],
    ['TR-DEMO-003', estudiantesReal[0], 'aprobado', 'REEMBOLSO_MEDICO', 'personal', 700],
    ['TR-DEMO-004', estudiantesReal[1], 'rechazado', 'ENFERMEDAD', 'licencia_sin_sueldo', 450],
    ['TR-DEMO-005', estudiantesReal[0], 'con_observaciones', 'SEGURO_VIDA', 'estudiante', 300],
    ['TR-DEMO-006', estudiantesReal[1], 'registrado', 'ACCIDENTE', 'personal', 550],
    ['TR-DEMO-007', estudiantesExtra[0], 'en_validacion', 'SEGURO_VIDA', 'grupo_especial', 640],
    ['TR-DEMO-008', estudiantesExtra[1], 'aprobado', 'REEMBOLSO_MEDICO', 'personal', 580],
    ['TR-DEMO-009', estudiantesExtra[0], 'rechazado', 'ACCIDENTE', 'licencia_sin_sueldo', 430],
    ['TR-DEMO-010', estudiantesExtra[1], 'con_observaciones', 'ENFERMEDAD', 'estudiante', 360],
    ['TR-DEMO-011', estudiantesReal[0], 'registrado', 'SEGURO_VIDA', 'personal', 510],
    ['TR-DEMO-012', estudiantesReal[1], 'en_validacion', 'ACCIDENTE', 'grupo_especial', 620],
  ];

  combos.forEach(c => tramites.push(buildTramite(c[0] as string, c[1], c[2] as string, c[3] as string, c[4] as string, c[5] as number)));

  const documentos = tramites.slice(0, 8).map((t, idx) => ({
    id: `DOC-DEMO-${idx + 1}`,
    data: {
      idTramite: t.id,
      tipo: idx % 2 === 0 ? 'FACTURA_MEDICA' : 'INFORME_MEDICO',
      nombreArchivo: `doc-${t.id}.pdf`,
      ruta: `tramites/${t.id}/doc-${idx + 1}.pdf`,
      fechaCarga: nowOffset(24 - idx),
      url: '',
      validado: idx % 3 === 0,
      estadoValidacion: idx % 3 === 0 ? 'APROBADO' : 'PENDIENTE'
    }
  }));

  const notificaciones = tramites.slice(0, 10).map((t, idx) => ({
    id: `NOTIF-${idx + 1}`,
    data: {
      tipo: 'EMAIL',
      destinatario: t.data.creadoPor,
      mensaje: `Su trámite ${t.id} ha cambiado a ${t.data.estadoCaso}`,
      tramiteId: t.id,
      fechaEnvio: nowOffset(12 - idx),
      leida: idx % 2 === 0
    }
  }));

  const aseguradoras = [
    { id: 'ASEG-01', data: { nombre: 'Aseguradora Andes', correoContacto: 'contacto@andes.com' } },
    { id: 'ASEG-02', data: { nombre: 'Aseguradora Pacífico', correoContacto: 'contacto@pacifico.com' } }
  ];

  const all = [
    ...usuarios.map(u => ({ ref: firestore.collection('usuarios').doc(u.id), data: u.data })),
    ...estudiantes.map(e => ({ ref: firestore.collection('estudiantes').doc(e.id), data: e.data })),
    ...tramites.map(t => ({ ref: firestore.collection('tramites').doc(t.id), data: t.data })),
    ...documentos.map(d => ({ ref: firestore.collection('documentos').doc(d.id), data: d.data })),
    ...notificaciones.map(n => ({ ref: firestore.collection('notificaciones').doc(n.id), data: n.data })),
    ...aseguradoras.map(a => ({ ref: firestore.collection('aseguradoras').doc(a.id), data: a.data }))
  ];

  const chunkSize = 400;
  for (let i = 0; i < all.length; i += chunkSize) {
    const batch = firestore.batch();
    all.slice(i, i + chunkSize).forEach(item => batch.set(item.ref, item.data));
    await batch.commit();
  }

  console.log(`✅ Seed completado: ${usuarios.length} usuarios, ${estudiantes.length} estudiantes, ${tramites.length} tramites, ${documentos.length} documentos, ${notificaciones.length} notificaciones, ${aseguradoras.length} aseguradoras.`);
}

seed()
  .then(() => {
    console.log('Listo.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en seed:', err);
    process.exit(1);
  });
