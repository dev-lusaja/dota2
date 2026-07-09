/**
 * Módulo para gestionar el progreso de lectura de los cómics.
 * Usa localStorage para persistir los datos de forma local (client-side).
 */

const STORAGE_KEY = 'dota2_read_progress';

class ReadProgress {
  /**
   * Obtiene todo el progreso almacenado.
   * @returns {Object}
   */
  static getAllProgress() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error reading progress from localStorage:", e);
      return {};
    }
  }

  /**
   * Obtiene el progreso de un cómic específico.
   * @param {string} comicId 
   * @returns {{page: number, completed: boolean} | null}
   */
  static getProgress(comicId) {
    const allProgress = this.getAllProgress();
    return allProgress[comicId] || null;
  }

  /**
   * Guarda el progreso de lectura de un cómic.
   * @param {string} comicId - ID del cómic.
   * @param {number} page - Página actual (número real, no el índice).
   * @param {number} maxPage - Número máximo de páginas del cómic.
   */
  static saveProgress(comicId, page, maxPage) {
    const allProgress = this.getAllProgress();
    const isCompleted = page === maxPage;
    
    // Si ya estaba completado antes, lo mantenemos como completado 
    // a menos que el usuario vuelva a leer y queramos que cambie el estado,
    // pero usualmente una vez completado se queda así (o se puede resetear).
    // Por diseño, si llega a maxPage, completed=true. Si no, pero ya estaba completado, 
    // mantenemos completed=true para que no pierda la medalla al releer partes.
    const previousProgress = allProgress[comicId];
    const completed = isCompleted || (previousProgress && previousProgress.completed);

    allProgress[comicId] = {
      page: page,
      completed: completed
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    } catch (e) {
      console.error("Error saving progress to localStorage:", e);
    }
  }

  /**
   * Marca manualmente un cómic como completado.
   * @param {string} comicId 
   * @param {number} maxPage 
   */
  static markCompleted(comicId, maxPage) {
    this.saveProgress(comicId, maxPage, maxPage);
  }
}
