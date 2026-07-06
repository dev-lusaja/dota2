/**
 * Helper file to load and parse the YAML data.
 * Depends on js-yaml being loaded in the HTML.
 */

class ComicsLoader {
  static async loadComics() {
    try {
      const response = await fetch('data/comics.yml');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const yamlText = await response.text();
      const data = jsyaml.load(yamlText);
      return data.comics;
    } catch (e) {
      console.error("Error loading comics YAML:", e);
      return [];
    }
  }

  static getComicUrl(template, page, padding = 3) {
    const pageStr = String(page).padStart(padding, '0');
    return template.replace('{page}', pageStr);
  }
}
