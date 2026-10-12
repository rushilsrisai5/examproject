/**
 * CSV Export Utility for ExamFlow
 * Generates and triggers download of CSV files with UTF-8 BOM for Excel compatibility
 */

export function downloadCSV(filename: string, rows: string[][]): void {
  const processCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell);
    // Escape double quotes and enclose in quotes
    return `"${cellStr.replace(/"/g, '""')}"`;
  };

  const csvContent = rows
    .map((row) => row.map(processCell).join(','))
    .join('\r\n');

  // Prepend UTF-8 BOM so Microsoft Excel correctly renders special characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
