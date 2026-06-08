const prisma = require('../config/database');

/**
 * Obtener las estadísticas para el Dashboard de forma adaptada según el Rol del usuario.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const rol = req.userRole;
    const medicoId = req.userId;

    if (rol === 'ADMIN') {
      // --- DASHBOARD PARA ADMINISTRADORES ---
      // 1. Carga de consultas totales agrupadas por fecha (flujo de pacientes)
      // Como SQLite no tiene funciones complejas de fecha integradas fácilmente en Prisma de forma multiplataforma,
      // traemos los campos 'fecha' de las consultas creadas en los últimos 30 días y agrupamos en memoria.
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      const consultasRecientes = await prisma.consulta.findMany({
        where: { fecha: { gte: hace30dias } },
        select: { fecha: true }
      });

      const flujoConsultas = {};
      consultasRecientes.forEach(c => {
        const fechaStr = c.fecha.toISOString().split('T')[0];
        flujoConsultas[fechaStr] = (flujoConsultas[fechaStr] || 0) + 1;
      });

      const flujoConsultasChart = Object.keys(flujoConsultas).map(fecha => ({
        fecha,
        cantidad: flujoConsultas[fecha]
      })).sort((a, b) => a.fecha.localeCompare(b.fecha));

      // 2. Carga de trabajo por médico (cantidad de consultas atendidas)
      const medicos = await prisma.usuario.findMany({
        where: { rol: 'MEDICO' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          _count: {
            select: { consultasAtendidas: true }
          }
        }
      });

      const cargaTrabajoMedicos = medicos.map(m => ({
        medico: `${m.nombre} ${m.apellido}`,
        consultas: m._count.consultasAtendidas
      }));

      // 3. Resumen de logs de seguridad del sistema (Auditorías recientes)
      const auditoriasRecientes = await prisma.auditoria.findMany({
        take: 10,
        orderBy: { fecha: 'desc' },
        include: {
          usuario: {
            select: { email: true, rol: true }
          }
        }
      });

      // 4. Conteo de alertas críticas de acceso denegado
      const alertasSeguridad = await prisma.auditoria.count({
        where: {
          accion: {
            in: ['INTENTO_ACCESO_CLINICO_BLOQUEADO', 'ACCESO_PACIENTE_RECHAZADO']
          }
        }
      });

      return res.json({
        rol: 'ADMIN',
        data: {
          flujoConsultas: flujoConsultasChart,
          cargaTrabajoMedicos,
          alertasSeguridad,
          auditoriasRecientes: auditoriasRecientes.map(a => ({
            id: a.id,
            accion: a.accion,
            detalles: a.detalles,
            ipAddress: a.ipAddress,
            fecha: a.fecha,
            usuario: a.usuario ? a.usuario.email : 'Sistema/Anónimo',
            usuarioRol: a.usuario ? a.usuario.rol : 'N/A'
          }))
        }
      });

    } else if (rol === 'MEDICO') {
      // --- DASHBOARD PARA MEDICOS ---
      // Regla de aislamiento: Solo analíticas sobre pacientes a los que este médico tiene acceso
      const accessQuery = {
        OR: [
          { medicoPrincipalId: medicoId },
          { consultas: { some: { medicoId: medicoId } } },
          { consultas: { some: { colaboradores: { some: { medicoId: medicoId } } } } }
        ]
      };

      // 1. Cargar pacientes autorizados para análisis demográfico
      const pacientes = await prisma.paciente.findMany({
        where: accessQuery,
        select: {
          fechaNacimiento: true,
          genero: true
        }
      });

      // Distribución por Género
      const generoStats = { MASCULINO: 0, FEMENINO: 0, OTRO: 0 };
      // Distribución por Edades
      const edadStats = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '66+': 0 };
      const hoy = new Date();

      pacientes.forEach(p => {
        // Conteo Género
        if (p.genero && generoStats[p.genero] !== undefined) {
          generoStats[p.genero]++;
        } else if (p.genero) {
          generoStats['OTRO']++;
        }

        // Conteo Edad
        if (p.fechaNacimiento) {
          const dob = new Date(p.fechaNacimiento);
          let edad = hoy.getFullYear() - dob.getFullYear();
          const m = hoy.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && hoy.getDate() < dob.getDate())) {
            edad--;
          }

          if (edad <= 18) edadStats['0-18']++;
          else if (edad <= 35) edadStats['19-35']++;
          else if (edad <= 50) edadStats['36-50']++;
          else if (edad <= 65) edadStats['51-65']++;
          else edadStats['66+']++;
        }
      });

      const generoChart = Object.keys(generoStats).map(key => ({
        name: key,
        value: generoStats[key]
      }));

      const edadChart = Object.keys(edadStats).map(key => ({
        name: key,
        value: edadStats[key]
      }));

      // 2. Diagnósticos más populares (conteo global agregados de CIE-10)
      // Nota: los diagnósticos populares son estadísticas epidemiológicas agregadas
      const diagnosticosPopular = await prisma.consultaDiagnostico.groupBy({
        by: ['diagnosticoId'],
        _count: {
          consultaId: true
        },
        orderBy: {
          _count: {
            consultaId: 'desc'
          }
        },
        take: 5
      });

      const diagnosticoDetalles = await prisma.diagnostico.findMany({
        where: {
          id: { in: diagnosticosPopular.map(d => d.diagnosticoId) }
        }
      });

      const diagnosticosChart = diagnosticosPopular.map(dp => {
        const diag = diagnosticoDetalles.find(d => d.id === dp.diagnosticoId);
        return {
          codigo: diag ? diag.codigo : 'N/A',
          // Nota: descripción de diagnóstico está cifrada con AES-256-GCM, pero en base a nuestra extensión,
          // al leer con securePrisma ya se entrega descifrada de manera transparente.
          descripcion: diag ? diag.descripcion : 'Desconocido',
          cantidad: dp._count.consultaId
        };
      });

      // 3. Tendencias de consultas del médico (últimos 30 días)
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      const consultasPropias = await prisma.consulta.findMany({
        where: {
          medicoId,
          fecha: { gte: hace30dias }
        },
        select: { fecha: true }
      });

      const flujoPropio = {};
      consultasPropias.forEach(c => {
        const fechaStr = c.fecha.toISOString().split('T')[0];
        flujoPropio[fechaStr] = (flujoPropio[fechaStr] || 0) + 1;
      });

      const tendenciasChart = Object.keys(flujoPropio).map(fecha => ({
        fecha,
        cantidad: flujoPropio[fecha]
      })).sort((a, b) => a.fecha.localeCompare(b.fecha));

      return res.json({
        rol: 'MEDICO',
        data: {
          demografiaGenero: generoChart,
          demografiaEdad: edadChart,
          diagnosticosFrecuentes: diagnosticosChart,
          tendenciasConsultas: tendenciasChart
        }
      });
    }

    res.status(403).json({ error: 'Rol no reconocido.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
