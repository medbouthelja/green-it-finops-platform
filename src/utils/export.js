import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title, data, columns) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.autoTable({
    startY: 30,
    head: [columns.map(col => col.label)],
    body: data.map(row => columns.map(col => row[col.key])),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });
  
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (title, data, columns) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col.label] = row[col.key];
      });
      return obj;
    })
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}.xlsx`);
};

