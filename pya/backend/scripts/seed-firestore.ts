import dotenv from 'dotenv';
import { firestore } from '../src/config/firebase';

dotenv.config();

async function seed() {
  const users = [
    {
      docId: 'USER-2026-1',
      data: {
        uid: 'yznYExxWt8SzhZGlvRnHKLCELfg1',
        correo: 'bustamanteroberto49@gmail.com',
        nombre: 'Admin UTPL',
        rol: 'ADMIN',
        activo: true,
        createdAt: new Date('2026-01-04T12:29:47-05:00')
      }
    },
    {
      docId: 'USER-2026-2',
      data: {
        uid: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
        correo: 'anthonyjhordy72@gmail.com',
        nombre: 'Gestor UTPL',
        rol: 'GESTOR',
        activo: true,
        createdAt: new Date('2026-01-04T12:00:00-05:00')
      }
    },
    {
      docId: 'USER-2026-3',
      data: {
        uid: '0vxcB7WCDwVR2EB4pC5RYognxWb2',
        correo: 'paulfosi23@gmail.com',
        nombre: 'Cliente UTPL',
        rol: 'CLIENTE',
        activo: true,
        createdAt: new Date('2026-01-04T12:00:00-05:00')
      }
    }
  ];

  const estudiantes = [
    {
      docId: 'EST-2026-1',
      data: {
        uidUsuario: '0vxcB7WCDwVR2EB4pC5RYognxWb2',
        cedula: '1101234567',
        nombreCompleto: 'Roberto Bustamante',
        periodoAcademico: '2025-2026',
        estadoAcademico: 'activo',
        estadoCobertura: 'vigente',
        createdAt: new Date('2026-01-04T12:00:00-05:00')
      }
    }
  ];

  const tramites = [
    {
      docId: 'TR-2026-001',
      data: {
        idTramite: 'TR-2026-001',
        codigoUnico: 'TR-2026-001',
        estadoCaso: 'EN_VALIDACION',
        tipoTramite: 'SEGURO_VIDA',
        motivo: 'Fallecimiento',
        descripcion: 'Cobertura por fallecimiento',
        fechaRegistro: new Date('2026-01-06T16:10:00-05:00'),
        idEstudiante: 'EST-2026-1',
        estudiante: {
          cedula: '1101234567',
          nombreCompleto: 'Roberto Bustamante',
          periodoAcademico: '2025-2026',
          estadoAcademico: 'activo',
          estadoCobertura: 'vigente',
          idEstudiante: 'EST-2026-1'
        },
        documentos: ['DOC-2026-1'],
        historial: [
          {
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'REGISTRADO',
            fecha: new Date('2026-01-06T16:05:00-05:00'),
            actor: '0vxcB7WCDwVR2EB4pC5RYognxWb2',
            rol: 'CLIENTE',
            nota: 'Trámite registrado por el cliente'
          },
          {
            estadoAnterior: 'REGISTRADO',
            estadoNuevo: 'EN_VALIDACION',
            fecha: new Date('2026-01-06T16:08:00-05:00'),
            actor: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
            rol: 'GESTOR',
            nota: 'Trámite enviado a validación'
          }
        ],
        creadoPor: '0vxcB7WCDwVR2EB4pC5RYognxWb2',
        montoAprobado: null,
        fechaAprobacion: null,
        idAseguradora: null
      }
    }
  ];

  const documentos = [
    {
      docId: 'DOC-2026-1',
      data: {
        idTramite: 'TR-2026-001',
        tipo: 'ACTA_DEFUNCION',
        nombreArchivo: 'acta.pdf',
        ruta: 'tramites/TR-2026-001/acta.pdf',
        fechaCarga: new Date('2026-01-04T12:00:00-05:00'),
        url: '',
        validado: false
      }
    }
  ];

  const beneficiarios = [
    {
      docId: 'BENF-2026-1',
      data: {
        idTramite: 'TR-2026-001',
        nombreCompleto: 'Maria Pérez',
        parentesco: 'Madre',
        cuentaBancaria: '01023456789'
      }
    }
  ];

  const notificaciones = [
    {
      docId: 'NOTI-2026-1',
      data: {
        destinatario: '0vxcB7WCDwVR2EB4pC5RYognxWb2', // UID del cliente
        tramiteId: 'TR-2026-001',
        tipo: 'sistema',
        mensaje: 'Su trámite TR-2026-001 ha sido registrado exitosamente',
        fechaEnvio: new Date('2026-01-06T16:05:30-05:00'),
        leida: false
      }
    },
    {
      docId: 'NOTI-2026-2',
      data: {
        destinatario: 'UAGpe4hb4gXKsVEK97fn3MFQKK53', // UID del gestor
        tramiteId: 'TR-2026-001',
        tipo: 'sistema',
        mensaje: 'Nuevo trámite TR-2026-001 asignado para validación',
        fechaEnvio: new Date('2026-01-06T16:08:15-05:00'),
        leida: false
      }
    },
    {
      docId: 'NOTI-2026-3',
      data: {
        destinatario: '0vxcB7WCDwVR2EB4pC5RYognxWb2', // UID del cliente
        tramiteId: 'TR-2026-001',
        tipo: 'sistema',
        mensaje: 'Su trámite TR-2026-001 está en proceso de validación',
        fechaEnvio: new Date('2026-01-06T16:08:30-05:00'),
        leida: false
      }
    }
  ];

  const reglas = [
    {
      docId: 'REGL-2026-1',
      data: {
        nombre: 'VigenciaMatricula',
        descripcion: 'El estudiante debe estar matriculado',
        campo: 'estadoAcademico',
        operador: '==',
        valor: 'ACTIVO',
        activo: true,
        prioridad: 1,
        accion: 'BLOQUEAR'
      }
    }
  ];

  const aseguradoras = [
    {
      docId: 'ASEG-2026-1',
      data: {
        nombre: 'Aseguradora XYZ',
        correoContacto: 'contacto@aseg.com'
      }
    }
  ];

  const auditoria = [
    {
      docId: 'AUD-2026-1',
      data: {
        accion: 'REGISTRAR_TRAMITE',
        fechaHora: new Date('2026-01-06T16:05:00-05:00'),
        usuario: '0vxcB7WCDwVR2EB4pC5RYognxWb2',
        idTramite: 'TR-2026-001',
        detalles: 'Trámite creado por cliente'
      }
    }
  ];

  const siniestros = [
    {
      docId: 'SIN-2026-1',
      data: {
        idTramite: 'TR-2026-001',
        status: 'Validado',
        fecha: new Date('2026-01-06T16:12:00-05:00')
      }
    }
  ];

  const collections = [
    { name: 'usuarios', docs: users },
    { name: 'estudiantes', docs: estudiantes },
    { name: 'tramites', docs: tramites },
    { name: 'documentos', docs: documentos },
    { name: 'beneficiarios', docs: beneficiarios },
    { name: 'notificaciones', docs: notificaciones },
    { name: 'reglas_negocio', docs: reglas },
    { name: 'aseguradoras', docs: aseguradoras },
    { name: 'auditoria', docs: auditoria },
    { name: 'siniestros', docs: siniestros }
  ];

  for (const col of collections) {
    for (const doc of col.docs) {
      await firestore.collection(col.name).doc(doc.docId).set(doc.data, { merge: true });
      console.log(`[seed] upserted ${col.name}/${doc.docId}`);
    }
  }

  console.log('Seeding completo.');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error en seed:', err);
    process.exit(1);
  });
