/**
 * @fileoverview Funciones de servidor para la aplicación web de directorio de freelancers.
 * Este archivo contiene las funciones de Google Apps Script que interactúan con la hoja de cálculo
 * y gestionan la lógica de negocio del lado del servidor.
 */

/**
 * Función principal para servir la aplicación web.
 * Crea una plantilla HTML a partir del archivo 'index.html' y la evalúa para ser servida.
 * @returns {HtmlOutput} El contenido HTML de la aplicación web.
 */
function doGet() {
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
      // Error específico si el ID es incorrecto o no hay permisos
      throw new Error("Error al abrir la hoja de cálculo con ID '" + sheetId + "'. Asegúrate de que el ID sea correcto y que el script tenga permisos de acceso. Detalle: " + e.message);
    }

    const sheet = spreadsheet.getSheetByName("Freelancers");

    if (!sheet) {
      throw new Error("No se encontró la hoja llamada 'Freelancers' en la hoja de cálculo. Asegúrate de que el nombre sea exacto (sensible a mayúsculas y minúsculas).");
    }

    Logger.log("Hoja 'Freelancers' encontrada correctamente.");
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) { // Si solo hay encabezados o está vacía
      Logger.log("No hay datos de freelancers (solo encabezados o vacía).");
      return [];
    }

    // Mapea los datos de la hoja a un formato de objeto más legible.
    // Asegúrate de que los índices de columna coincidan con tu hoja de cálculo.
    const freelancers = data.slice(1).map(row => ({
      id: row[0], // Columna A
      foto: row[1], // Columna B
      pais: row[2], // Columna C
      nombre: row[4], // Columna E
      titulo: row[9], // Columna J
      area: row[10], // Columna K
      skills: row[12] ? String(row[12]).split(",").map(s => s.trim()) : [], // Columna M, convierte a string antes de split
      cvUrl: row[15] || "#", // Columna P
      premium: row[16] === "SI", // Columna Q (renombrado a "Destacado" en UI)
      comentarios: row[18], // Columna S (ahora solo lectura en UI pública)
      portafolio: row[19], // Columna T
      blacklisted: row[20] === "SI", // Columna U

      // --- Nuevos campos de contacto y reportes ---
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
      contactPermission: row[27] === "SI", // Columna AF (booleano)
      reports: row[28] ? String(row[28]).split(",").map(s => s.trim()) : [] // Columna AG (ej. "No cumple fechas, Mala comunicación")
    }));

    Logger.log(`Se cargaron ${freelancers.length} freelancers.`);
    return freelancers;
  } catch (e) {
    Logger.log("Error en getFreelancers: " + e.message);
    // Para depuración en el cliente, también puedes lanzar el error
    throw new Error("Error al cargar los freelancers: " + e.message);
  }
}

/**
 * Guarda un comentario para un freelancer específico en la hoja de cálculo.
 * NOTA: Esta función está pensada para ser usada por una aplicación de administración separada.
 * Se mantiene aquí por si se desea reutilizar en un contexto controlado.
 * @param {string} freelancerId - El ID del freelancer.
 * @param {string} comment - El comentario a guardar.
 */
function saveFreelancerComment(freelancerId, comment) {
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
    const commentColumnIndex = 18; // Columna S

    for (let i = 1; i < data.length; i++) { // Empieza en 1 para saltar los encabezados
      if (String(data[i][idColumnIndex]) === String(freelancerId)) {
        sheet.getRange(i + 1, commentColumnIndex + 1).setValue(comment);
        Logger.log(`Comentario guardado para freelancer ID: ${freelancerId}`);
        return true; // Éxito
      }
    }
    Logger.log(`Freelancer con ID ${freelancerId} no encontrado para guardar comentario.`);
    return false; // Freelancer no encontrado
  } catch (e) {
    Logger.log("Error en saveFreelancerComment: " + e.message);
    throw new Error("Error al guardar el comentario: " + e.message);
  }
}

/**
 * Alterna el estado de 'blacklisted' (en lista negra) de un freelancer.
 * NOTA: Esta función está pensada para ser usada por una aplicación de administración separada.
 * Se mantiene aquí por si se desea reutilizar en un contexto controlado.
 * @param {string} freelancerId - El ID del freelancer.
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

    for (let i = 1; i < data.length; i++) { // Empieza en 1 para saltar los encabezados
      if (String(data[i][idColumnIndex]) === String(freelancerId)) {
        const currentStatus = data[i][blacklistedColumnIndex];
        const newStatus = (currentStatus === "SI") ? "NO" : "SI";
        sheet.getRange(i + 1, blacklistedColumnIndex + 1).setValue(newStatus);
        Logger.log(`Estado de lista negra para freelancer ID ${freelancerId} cambiado a: ${newStatus}`);
        return newStatus; // Devuelve el nuevo estado
      }
    }
    Logger.log(`Freelancer con ID ${freelancerId} no encontrado para alternar lista negra.`);
    return null;
  } catch (e) {
    Logger.log("Error en toggleBlacklist: " + e.message);
    throw new Error("Error al alternar el estado de lista negra: " + e.message);
  }
}
