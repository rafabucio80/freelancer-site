// ================================
// ARCHIVO PRINCIPAL - Codigo.gs
// ================================

/**
 * Función principal que maneja las peticiones GET
 * @return {HtmlOutput} Página HTML del directorio
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Directorio Freelancers Pro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Incluye archivos HTML/CSS/JS en el template principal
 * @param {string} filename - Nombre del archivo a incluir
 * @return {string} Contenido del archivo
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene la ID de la hoja de cálculo (configurable)
 * @return {string} ID de la hoja de cálculo
 */
function getSheetId() {
  // TODO: Reemplazar con tu ID real de Google Sheets
  return "TU_SHEET_ID_AQUI";
}

/**
 * Obtiene todos los freelancers de la base de datos
 * @return {Array} Array de objetos freelancer
 */
function getFreelancers() {
  try {
    const sheet = SpreadsheetApp.openById(getSheetId()).getSheetByName("Freelancers");
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return []; // Si solo hay encabezados
    
    return data.slice(1).map((row, index) => ({
      id: row[0] || `freelancer_${index + 1}`,
      nombre: row[4] || 'Sin nombre',
      foto: row[1] || '', // Se manejará imagen por defecto en frontend
      pais: row[2] || 'No especificado',
      titulo: row[9] || 'Freelancer',
      skills: row[12] ? row[12].split(",").map(s => s.trim()) : [],
      premium: row[16] === "SI",
      cvUrl: row[15] || "#",
      blacklisted: row[20] === "SI",
      area: row[10] || 'General',
      comentarios: row[18] || '',
      portafolio: row[19] || '',
      email: row[5] || '',
      telefono: row[6] || '',
      whatsapp: row[7] || '',
      telegram: row[8] || '',
      experiencia: row[11] || '',
      tarifa: row[13] || '',
      disponibilidad: row[14] || '',
      motivoBlacklist: row[21] || '',
      fechaRegistro: row[22] || new Date(),
      calificacion: row[23] || 0
    }));
  } catch (e) {
    console.error("Error en getFreelancers:", e);
    return [];
  }
}

/**
 * Obtiene países únicos para el filtro
 * @return {Array} Array de países únicos
 */
function getUniqueCountries() {
  try {
    const freelancers = getFreelancers();
    const countries = [...new Set(freelancers.map(f => f.pais).filter(p => p && p !== 'No especificado'))];
    return countries.sort();
  } catch (e) {
    console.error("Error obteniendo países:", e);
    return [];
  }
}

/**
 * Obtiene skills únicos para el filtro
 * @return {Array} Array de skills únicos
 */
function getUniqueSkills() {
  try {
    const freelancers = getFreelancers();
    const allSkills = freelancers.flatMap(f => f.skills);
    const uniqueSkills = [...new Set(allSkills.filter(s => s && s.trim() !== ''))];
    return uniqueSkills.sort();
  } catch (e) {
    console.error("Error obteniendo skills:", e);
    return [];
  }
}

/**
 * Guarda un reporte en la hoja de reportes
 * @param {Object} reportData - Datos del reporte
 * @return {Object} Resultado de la operación
 */
function saveReport(reportData) {
  try {
    const sheet = SpreadsheetApp.openById(getSheetId()).getSheetByName("Reportes");
    
    // Si no existe la hoja de reportes, la crea
    if (!sheet) {
      const newSheet = SpreadsheetApp.openById(getSheetId()).insertSheet("Reportes");
      newSheet.getRange(1, 1, 1, 8).setValues([
        ["ID", "Freelancer ID", "Reportado Por", "Motivo", "Descripción", "Fecha", "Estado", "Email Reportante"]
      ]);
    }
    
    const reportSheet = SpreadsheetApp.openById(getSheetId()).getSheetByName("Reportes");
    const newRow = [
      Utilities.getUuid(),
      reportData.freelancerId,
      reportData.reportedBy,
      reportData.reason,
      reportData.description,
      new Date(),
      "Pendiente",
      reportData.email
    ];
    
    reportSheet.appendRow(newRow);
    
    return {
      success: true,
      message: "Reporte enviado correctamente. Será revisado por nuestro equipo."
    };
  } catch (e) {
    console.error("Error guardando reporte:", e);
    return {
      success: false,
      message: "Error al enviar el reporte. Intenta nuevamente."
    };
  }
}

/**
 * Verifica si un usuario está registrado (simulado por ahora)
 * @param {string} email - Email del usuario
 * @return {boolean} True si está registrado
 */
function isUserRegistered(email) {
  // TODO: Implementar lógica real de verificación de usuarios registrados
  // Por ahora, simulamos que cualquier email válido está registrado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Obtiene estadísticas del directorio
 * @return {Object} Estadísticas generales
 */
function getDirectoryStats() {
  try {
    const freelancers = getFreelancers();
    return {
      total: freelancers.length,
      premium: freelancers.filter(f => f.premium).length,
      blacklisted: freelancers.filter(f => f.blacklisted).length,
      countries: getUniqueCountries().length,
      skills: getUniqueSkills().length
    };
  } catch (e) {
    console.error("Error obteniendo estadísticas:", e);
    return {
      total: 0,
      premium: 0,
      blacklisted: 0,
      countries: 0,
      skills: 0
    };
  }
}
