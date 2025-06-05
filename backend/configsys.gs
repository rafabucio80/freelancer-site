function setSheetId() {
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", "1g2qyAjW9NLlaBFMj7YtnTn600ssLQlXkKH1tXsV--Y4"); 
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
