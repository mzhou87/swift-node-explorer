export function exportToFile(filename: string, content: string, type: 'json' | 'csv') {
    const blob = new Blob([content], {
      type: type === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  