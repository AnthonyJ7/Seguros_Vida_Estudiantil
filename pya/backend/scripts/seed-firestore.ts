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
    },
    {
      docId: 'USER-2026-4',
      data: {
        uid: 'DEMOCLIENTE00123456789000001',
        correo: 'daniela@demo.com',
        nombre: 'Daniela Ramírez',
        rol: 'CLIENTE',
        activo: true,
        createdAt: new Date('2026-01-07T09:00:00-05:00')
      }
    },
    {
      docId: 'USER-2026-5',
      data: {
        uid: 'DEMOCLIENTE00123456789000002',
        correo: 'carlos@demo.com',
        nombre: 'Carlos Pérez',
        rol: 'CLIENTE',
        activo: true,
        createdAt: new Date('2026-01-07T09:10:00-05:00')
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
    },
    {
      docId: 'EST-2026-2',
      data: {
        uidUsuario: 'DEMOCLIENTE00123456789000001',
        cedula: '1102233445',
        nombreCompleto: 'Daniela Ramírez',
        periodoAcademico: '2025-2026',
        estadoAcademico: 'activo',
        estadoCobertura: 'vigente',
        createdAt: new Date('2026-01-07T09:05:00-05:00')
      }
    },
    {
      docId: 'EST-2026-3',
      data: {
        uidUsuario: 'DEMOCLIENTE00123456789000002',
        cedula: '1103344556',
        nombreCompleto: 'Carlos Pérez',
        periodoAcademico: '2025-2026',
        estadoAcademico: 'activo',
        estadoCobertura: 'vigente',
        createdAt: new Date('2026-01-07T09:12:00-05:00')
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
        documentos: ['DOC-2026-1', 'DOC-2026-5'],
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
    },
    {
      docId: 'TR-2026-002',
      data: {
        idTramite: 'TR-2026-002',
        codigoUnico: 'TR-2026-002',
        estadoCaso: 'EN_VALIDACION',
        tipoTramite: 'REEMBOLSO_MEDICO',
        motivo: 'Reembolso de gastos médicos',
        descripcion: 'Reembolso por atención de emergencia',
        fechaRegistro: new Date('2026-01-07T09:20:00-05:00'),
        idEstudiante: 'EST-2026-2',
        estudiante: {
          cedula: '1102233445',
          nombreCompleto: 'Daniela Ramírez',
          periodoAcademico: '2025-2026',
          estadoAcademico: 'activo',
          estadoCobertura: 'vigente',
          idEstudiante: 'EST-2026-2'
        },
        documentos: ['DOC-2026-2', 'DOC-2026-3'],
        historial: [
          {
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'REGISTRADO',
            fecha: new Date('2026-01-07T09:15:00-05:00'),
            actor: 'DEMOCLIENTE00123456789000001',
            rol: 'CLIENTE',
            nota: 'Trámite registrado por la cliente'
          },
          {
            estadoAnterior: 'REGISTRADO',
            estadoNuevo: 'EN_VALIDACION',
            fecha: new Date('2026-01-07T09:18:00-05:00'),
            actor: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
            rol: 'GESTOR',
            nota: 'Trámite asignado a validación'
          }
        ],
        creadoPor: 'DEMOCLIENTE00123456789000001',
        montoAprobado: null,
        fechaAprobacion: null,
        idAseguradora: null
      }
    },
    {
      docId: 'TR-2026-003',
      data: {
        idTramite: 'TR-2026-003',
        codigoUnico: 'TR-2026-003',
        estadoCaso: 'EN_VALIDACION',
        tipoTramite: 'SEGURO_VIDA',
        motivo: 'Accidente',
        descripcion: 'Evaluación de accidente leve',
        fechaRegistro: new Date('2026-01-07T09:30:00-05:00'),
        idEstudiante: 'EST-2026-3',
        estudiante: {
          cedula: '1103344556',
          nombreCompleto: 'Carlos Pérez',
          periodoAcademico: '2025-2026',
          estadoAcademico: 'activo',
          estadoCobertura: 'vigente',
          idEstudiante: 'EST-2026-3'
        },
        documentos: ['DOC-2026-4', 'DOC-2026-6'],
        historial: [
          {
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'REGISTRADO',
            fecha: new Date('2026-01-07T09:25:00-05:00'),
            actor: 'DEMOCLIENTE00123456789000002',
            rol: 'CLIENTE',
            nota: 'Trámite creado por el cliente'
          },
          {
            estadoAnterior: 'REGISTRADO',
            estadoNuevo: 'EN_VALIDACION',
            fecha: new Date('2026-01-07T09:28:00-05:00'),
            actor: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
            rol: 'GESTOR',
            nota: 'Gestor toma el caso para revisión'
          }
        ],
        creadoPor: 'DEMOCLIENTE00123456789000002',
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
        validado: true,
        estadoValidacion: 'APROBADO'
      }
    },
    {
      docId: 'DOC-2026-2',
      data: {
        idTramite: 'TR-2026-002',
        tipo: 'FACTURA_MEDICA',
        nombreArchivo: 'factura-emergencia.pdf',
        ruta: 'tramites/TR-2026-002/factura.pdf',
        fechaCarga: new Date('2026-01-07T09:16:00-05:00'),
        url: '',
        validado: false,
        estadoValidacion: 'EN_REVISION'
      }
    },
    {
      docId: 'DOC-2026-3',
      data: {
        idTramite: 'TR-2026-002',
        tipo: 'CERT_MEDICO',
        nombreArchivo: 'certificado.pdf',
        ruta: 'tramites/TR-2026-002/certificado.pdf',
        fechaCarga: new Date('2026-01-07T09:17:00-05:00'),
        url: '',
        validado: false,
        estadoValidacion: 'PENDIENTE'
      }
    },
    {
      docId: 'DOC-2026-4',
      data: {
        idTramite: 'TR-2026-003',
        tipo: 'REPORTE_ACCIDENTE',
        nombreArchivo: 'reporte-accidente.pdf',
        ruta: 'tramites/TR-2026-003/reporte.pdf',
        fechaCarga: new Date('2026-01-07T09:26:00-05:00'),
        url: '',
        validado: false,
        estadoValidacion: 'PENDIENTE'
      }
    },
    {
      docId: 'DOC-2026-5',
      data: {
        idTramite: 'TR-2026-001',
        tipo: 'CERT_MEDICO',
        nombreArchivo: 'certificado-medico.pdf',
        ruta: 'tramites/TR-2026-001/certificado-medico.pdf',
        fechaCarga: new Date('2026-01-07T10:10:00-05:00'),
        url: '',
        validado: false,
        estadoValidacion: 'PENDIENTE'
      }
    },
    {
      docId: 'DOC-2026-6',
      data: {
        idTramite: 'TR-2026-003',
        tipo: 'COMPROBANTE_DOMICILIO',
        nombreArchivo: 'comprobante-domicilio.pdf',
        ruta: 'tramites/TR-2026-003/comprobante.pdf',
        fechaCarga: new Date('2026-01-07T10:20:00-05:00'),
        url: '',
        validado: false,
        estadoValidacion: 'PENDIENTE'
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
    },
    {
      docId: 'BENF-2026-2',
      data: {
        idTramite: 'TR-2026-002',
        nombreCompleto: 'Luis Ramírez',
        parentesco: 'Padre',
        cuentaBancaria: '01234567890'
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
    },
    {
      docId: 'NOTI-2026-4',
      data: {
        destinatario: 'DEMOCLIENTE00123456789000001',
        tramiteId: 'TR-2026-002',
        tipo: 'sistema',
        mensaje: 'Su trámite TR-2026-002 está en validación',
        fechaEnvio: new Date('2026-01-07T09:19:00-05:00'),
        leida: false
      }
    },
    {
      docId: 'NOTI-2026-5',
      data: {
        destinatario: 'DEMOCLIENTE00123456789000002',
        tramiteId: 'TR-2026-003',
        tipo: 'sistema',
        mensaje: 'Su trámite TR-2026-003 está en validación',
        fechaEnvio: new Date('2026-01-07T09:29:00-05:00'),
        leida: false
      }
    },
    {
      docId: 'NOTI-2026-6',
      data: {
        destinatario: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
        tramiteId: 'TR-2026-002',
        tipo: 'sistema',
        mensaje: 'Nuevo trámite TR-2026-002 para validar',
        fechaEnvio: new Date('2026-01-07T09:18:30-05:00'),
        leida: false
      }
    },
    {
      docId: 'NOTI-2026-7',
      data: {
        destinatario: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
        tramiteId: 'TR-2026-003',
        tipo: 'sistema',
        mensaje: 'Nuevo trámite TR-2026-003 para validar',
        fechaEnvio: new Date('2026-01-07T09:28:30-05:00'),
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
    },
    {
      docId: 'AUD-2026-2',
      data: {
        accion: 'REGISTRAR_TRAMITE',
        fechaHora: new Date('2026-01-07T09:15:00-05:00'),
        usuario: 'DEMOCLIENTE00123456789000001',
        idTramite: 'TR-2026-002',
        detalles: 'Trámite creado por cliente'
      }
    },
    {
      docId: 'AUD-2026-3',
      data: {
        accion: 'REGISTRAR_TRAMITE',
        fechaHora: new Date('2026-01-07T09:25:00-05:00'),
        usuario: 'DEMOCLIENTE00123456789000002',
        idTramite: 'TR-2026-003',
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
