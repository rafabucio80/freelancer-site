/**
 * @fileoverview Funciones de servidor para la aplicación web de directorio de freelancers.
 * Este archivo contiene las funciones de Google Apps Script que interactúan con la hoja de cálculo
 * y gestionan la lógica de negocio del lado del servidor.
 */

/**
 * Función principal para servir la aplicación web.
 * Crea una plantilla HTML a partir del archivo 'index.html' y la evalúa para ser servida.
 * @param {Object} e - Parámetros de la solicitud GET
 * @returns {HtmlOutput} El contenido HTML de la aplicación web.
 */
function doGet(e) {
  // Manejar solicitudes para perfiles públicos
  if (e.parameter && e.parameter.id) {
    const id = e.parameter.id;
    const freelancerData = getPublicFreelancerProfile(id);
    
    if (!freelancerData) {
      return HtmlService.createHtmlOutput(`
        <h1>Perfil no disponible</h1>
        <p>Este perfil es privado o no existe.</p>
        <p>El freelancer debe tener una membresía premium para tener un perfil público.</p>
      `);
    }
    
    const template = HtmlService.createTemplateFromFile('public-profile');
    template.freelancer = freelancerData;
    return template.evaluate()
      .setTitle(`${freelancerData.nombre} | Perfil Freelancer`)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Solicitud normal para la aplicación principal
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Directorio Freelancers');
}

/**
 * Obtiene los datos de los freelancers de la hoja de cálculo.
 * Procesa los datos para que sean más fáciles de usar en el lado del cliente.
 * @returns {Array<Object>} Un array de objetos freelancer, o un array vacío si hay un error o no hay datos.
 */
function getFreelancers() {
  try {
    const sheetId = getSheetId();
    Logger.log("Valor de sheetId obtenido en getFreelancers: " + sheetId);

    if (!sheetId) {
      throw new Error("El ID de la hoja de cálculo no está configurado. Por favor, ejecuta la función setSheetId() en el editor de Apps Script.");
    }

    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(sheetId);
      Logger.log("Hoja de cálculo abierta correctamente con ID: " + sheetId);
    } catch (e) {
      throw new Error("Error al abrir la hoja de cálculo con ID '" + sheetId + "'. Asegúrate de que el ID sea correcto y que el script tenga permisos de acceso. Detalle: " + e.message);
    }

    const sheet = spreadsheet.getSheetByName("Freelancers");

    if (!sheet) {
      throw new Error("No se encontró la hoja llamada 'Freelancers' en la hoja de cálculo. Asegúrate de que el nombre sea exacto (sensible a mayúsculas y minúsculas).");
    }

    Logger.log("Hoja 'Freelancers' encontrada correctamente.");
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      Logger.log("No hay datos de freelancers (solo encabezados o vacía).");
      return [];
    }

    // Mapea los datos de la hoja a un formato de objeto más legible
    const freelancers = data.slice(1).map(row => ({
      id: row[0], // Columna A
      foto: row[1], // Columna B
      pais: row[2], // Columna C
      nombre: row[4], // Columna E
      titulo: row[9], // Columna J
      area: row[10], // Columna K
      skills: row[12] ? String(row[12]).split(",").map(s => s.trim()) : [], // Columna M
      cvUrl: row[15] || "#", // Columna P
      premium: row[16] === "SI", // Columna Q
      comentarios: row[18], // Columna S
      portafolio: row[19], // Columna T
      blacklisted: row[20] === "SI", // Columna U
      github: row[8] || '', // Columna V
      personalPage: row[21] || '', // Columna W
      facebook: row[22] || '', // Columna X
      facebookPage: row[23] || '', // Columna Y
      twitter: row[24] || '', // Columna Z
      linkedin: row[7] || '', // Columna AA
      x: row[25] || '', // Columna AB
      instagram: row[26] || '', // Columna AC
      email: row[6] || '', // Columna AD
      phone: row[5] || '', // Columna AE
      contactPermission: row[27] === "SI", // Columna AF
      reports: row[28] ? String(row[28]).split(",").map(s => s.trim()) : [] // Columna AG
    }));

    Logger.log(`Se cargaron ${freelancers.length} freelancers.`);
    return freelancers;
  } catch (e) {
    Logger.log("Error en getFreelancers: " + e.message);
    throw new Error("Error al cargar los freelancers: " + e.message);
  }
}

/**
 * Obtiene datos públicos de un freelancer (solo si es premium)
 * @param {string} id - ID del freelancer
 * @return {Object|false} Datos públicos o false si no tiene acceso
 */
function getPublicFreelancerProfile(id) {
  try {
    const sheetId = getSheetId();
    if (!sheetId) {
      throw new Error("El ID de la hoja de cálculo no está configurado.");
    }

    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Freelancers");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Encontrar fila por ID (columna A)
    const row = data.find(row => row[0].toString() === id.toString());
    if (!row) return false;
    
    // Verificar si es premium (columna Q)
    const premiumColumn = 16;
    if (row[premiumColumn] !== "SI") {
      return false;
    }
    
    // Filtrar solo datos públicos
    const publicData = {
      id: row[0],
      nombre: row[4],
      foto: row[1] || 'https://placehold.co/600x400?text=Sin+Foto',
      titulo: row[9],
      pais: row[2],
      skills: row[12] ? String(row[12]).split(",").map(s => s.trim()) : [],
      portafolio: row[19],
      descripcion: row[10], // Usando el área como descripción
      premium: true
    };
    
    return publicData;
  } catch (e) {
    Logger.log("Error en getPublicFreelancerProfile: " + e.message);
    return false;
  }
}

/**
 * Genera URL pública para compartir (solo para premium)
 * @param {string} freelancerId - ID del freelancer
 * @return {Object} Objeto con {success: bool, url: string, message?: string}
 */
function generatePublicUrl(freelancerId) {
  try {
    const freelancerData = getPublicFreelancerProfile(freelancerId);
    if (!freelancerData) {
      return {
        success: false,
        message: "Solo freelancers premium pueden compartir su perfil"
      };
    }
    
    const scriptUrl = ScriptApp.getService().getUrl();
    return {
      success: true,
      url: `${scriptUrl}?id=${freelancerId}`
    };
  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
}

/**
 * Guarda un comentario para un freelancer específico en la hoja de cálculo.
 * @param {string} freelancerId - El ID del freelancer.
 * @param {string} comment - El comentario a guardar.
 * @return {boolean} True si se guardó correctamente
 */
function saveFreelancerComment(freelancerId, comment) {
  try {
    if (!freelancerId || !comment || comment.length > 500) {
      throw new Error("Datos inválidos");
    }
    
    const cleanComment = comment.replace(/[\\'"\`;]/g, '');
    const sheetId = getSheetId();
    if (!sheetId) {
      throw new Error("El ID de la hoja de cálculo no está configurado.");
    }
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Freelancers");
    if (!sheet) {
      throw new Error("No se encontró la hoja 'Freelancers'.");
    }

    const data = sheet.getDataRange().getValues();
    const idColumnIndex = 0; // Columna A
    const commentColumnIndex = 18; // Columna S

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColumnIndex]) === String(freelancerId)) {
        sheet.getRange(i + 1, commentColumnIndex + 1).setValue(cleanComment);
        Logger.log(`Comentario guardado para freelancer ID: ${freelancerId}`);
        return true;
      }
    }
    
    Logger.log(`Freelancer con ID ${freelancerId} no encontrado para guardar comentario.`);
    return false;
  } catch (e) {
    Logger.log("Error en saveFreelancerComment: " + e.message);
    throw new Error("Error al guardar el comentario: " + e.message);
  }
}

/**
 * Alterna el estado de 'blacklisted' (en lista negra) de un freelancer.
 * @param {string} freelancerId - El ID del freelancer.
 * @return {string|null} Nuevo estado ("SI"/"NO") o null si no se encontró
 */
function toggleBlacklist(freelancerId) {
  try {
    const sheetId = getSheetId();
    if (!sheetId) {
      throw new Error("El ID de la hoja de cálculo no está configurado.");
    }
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Freelancers");
    if (!sheet) {
      throw new Error("No se encontró la hoja 'Freelancers'.");
    }

    const data = sheet.getDataRange().getValues();
    const idColumnIndex = 0; // Columna A
    const blacklistedColumnIndex = 20; // Columna U

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColumnIndex]) === String(freelancerId)) {
        const currentStatus = data[i][blacklistedColumnIndex];
        const newStatus = (currentStatus === "SI") ? "NO" : "SI";
        sheet.getRange(i + 1, blacklistedColumnIndex + 1).setValue(newStatus);
        Logger.log(`Estado de lista negra para freelancer ID ${freelancerId} cambiado a: ${newStatus}`);
        return newStatus;
      }
    }
    
    Logger.log(`Freelancer con ID ${freelancerId} no encontrado para alternar lista negra.`);
    return null;
  } catch (e) {
    Logger.log("Error en toggleBlacklist: " + e.message);
    throw new Error("Error al alternar el estado de lista negra: " + e.message);
  }
}

/**
 * Valida que un ID de hoja de cálculo sea válido.
 * @param {string} id - ID a validar
 * @return {boolean} True si es válido
 */
function isValidSpreadsheetId(id) {
  return /^[a-zA-Z0-9-_]+$/.test(id);
}
