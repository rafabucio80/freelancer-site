function setSheetId() {
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", "TU_SHEET_ID"); 
  Logger.log("SHEET_ID configurado correctamente.");
}
/**
 * Obtiene el ID de la hoja de cálculo desde las propiedades del script.
 * @returns {string|null} El ID de la hoja de cálculo o null si no está configurado.
 */
function getSheetId() {
  const sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) {
    Logger.log("ADVERTENCIA: SHEET_ID no está configurado en las propiedades del script. Ejecuta setSheetId() primero.");
  }
  return sheetId;
}
