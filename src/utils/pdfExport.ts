import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFTaskItem {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  status: string;
  createdAt: string;
  completedAt: string;
}

export interface PDFExportOptions {
  portalName?: string;
  reportTitle?: string;
  filterCriteriaText?: string;
}

/**
 * Clean & professional PDF exporter matching user requirements:
 * - Business/portal name: "Daily Task Report"
 * - Report generation date and time
 * - Filter criteria used
 * - Table: # | Task Title | Description | Assigned To | Priority | Status | Created Date | Completed Date
 * - Summary section at bottom: Total tasks, Completed count, Pending/In-Progress count
 * - Filename: Task-Report_YYYY-MM-DD.pdf
 */
export const generateTasksPDF = (
  tasks: PDFTaskItem[],
  options: PDFExportOptions = {}
): void => {
  const {
    portalName = 'TeamTrack Business Portal',
    reportTitle = 'Daily Task Report',
    filterCriteriaText = 'All Records',
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape', // Landscape accommodates all 8 columns comfortably
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const generatedDateTime = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  }).format(now);

  // 1. Header Banner (Indigo Accent #4f46e5)
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 297, 24, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, 14, 12);

  // Portal Name Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(224, 231, 255);
  doc.text(`${portalName}  •  Team Daily Operations Audit`, 14, 19);

  // 2. Report Meta & Applied Filters block
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Generated Date & Time: ${generatedDateTime}`, 14, 31);
  doc.text(`Applied Filter Criteria: ${filterCriteriaText}`, 14, 36);
  doc.text(`Total Tasks Exported: ${tasks.length}`, 220, 31);

  // Compute stats for summary section
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status.toLowerCase() === 'completed').length;
  const pendingOrInProgress = tasks.filter((t) => {
    const s = t.status.toLowerCase();
    return s === 'pending' || s === 'in-progress';
  }).length;
  const otherOrDeleted = totalTasks - (completedTasks + pendingOrInProgress);

  // 3. Format rows for AutoTable
  // Columns: # | Task Title | Description | Assigned To | Priority | Status | Created Date | Completed Date
  const tableRows = tasks.map((t, idx) => [
    idx + 1,
    t.title,
    t.description || '—',
    t.assignedTo,
    t.priority.toUpperCase(),
    t.status.toUpperCase(),
    t.createdAt,
    t.completedAt || '—',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [
      [
        '#',
        'Task Title',
        'Description',
        'Assigned To',
        'Priority',
        'Status',
        'Created Date',
        'Completed Date',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 72 },
      3: { cellWidth: 32 },
      4: { cellWidth: 22 },
      5: { cellWidth: 26, fontStyle: 'bold' },
      6: { cellWidth: 28 },
      7: { cellWidth: 28 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Color-code the Status column
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === 'COMPLETED') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-600
        } else if (text === 'IN-PROGRESS') {
          data.cell.styles.textColor = [37, 99, 235]; // blue-600
        } else if (text === 'DELETED') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        } else {
          data.cell.styles.textColor = [100, 116, 139]; // slate-500
        }
      }
    },
  });

  // 4. Summary Section at bottom of the last page
  let finalY = (doc as any).lastAutoTable?.finalY || 150;
  if (finalY > 175) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 8;
  }

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, finalY, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Summary Section:', 18, finalY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Tasks: ${totalTasks}     |     Completed: ${completedTasks}     |     Pending / In-Progress: ${pendingOrInProgress}${
      otherOrDeleted > 0 ? `     |     Archived/Deleted: ${otherOrDeleted}` : ''
    }`,
    55,
    finalY + 8.5
  );

  // 5. Page numbering footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Daily Task Report  •  Confidential Team Document  •  Page ${i} of ${totalPages}`,
      148.5,
      202,
      { align: 'center' }
    );
  }

  // 6. Filename format: Task-Report_YYYY-MM-DD.pdf
  const dateFormattedFilename = now.toISOString().split('T')[0];
  doc.save(`Task-Report_${dateFormattedFilename}.pdf`);
};
