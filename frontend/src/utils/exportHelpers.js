import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export JSON / array of objects to Excel .xlsx
export const exportToExcel = (data, filename = 'syscorp-export', sheetName = 'Data') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto fit column widths
    const maxProps = Object.keys(data[0] || {});
    worksheet['!cols'] = maxProps.map(key => ({
      wch: Math.max(key.length + 4, 14)
    }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    throw error;
  }
};

// Export to CSV
export const exportToCSV = (data, filename = 'syscorp-export') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw error;
  }
};

// Export to styled PDF
export const exportToPDF = ({
  title = 'SysCorp SEO Intelligence Report',
  subtitle = 'Enterprise Rank Tracking & Audit Overview',
  website = 'techsphere.io',
  headers = [],
  data = [],
  filename = 'syscorp-report',
  themeColor = [79, 70, 229] // Indigo primary
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Header Branding Bar
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('SysCorp Enterprise SEO Report', 40, 32);

    // Meta Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(`Domain: ${website}  |  Generated: ${new Date().toLocaleDateString('en-US')}`, doc.internal.pageSize.width - 240, 32);

    // Document Subheading
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(title, 40, 80);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text(subtitle, 40, 96);

    // Table
    autoTable(doc, {
      startY: 110,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: {
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        rowPageBreak: 'auto'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 40, right: 40, bottom: 40 }
    });

    // Footer with Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SysCorp SEO Analytics • Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    }

    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
};
