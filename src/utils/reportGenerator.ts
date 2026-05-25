import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { PBIProject, Workspace, SemanticModel, Application, PBIUser } from '../types';

interface ReportData {
  projects: PBIProject[];
  workspaces: Workspace[];
  models: SemanticModel[];
  apps: Application[];
  users: PBIUser[];
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Título
  doc.setFontSize(18);
  doc.text('Reporte de Gestión PBI', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Fecha de generación: ${dateStr}`, 14, 30);

  // Tabla de Proyectos
  doc.setFontSize(14);
  doc.text('Proyectos', 14, 45);

  const projectRows = data.projects.map(p => {
    const ws = data.workspaces.find(w => w.id === p.workspaceId)?.name || 'N/A';
    const model = data.models.find(m => m.id === p.semanticModelId)?.name || 'N/A';
    const app = data.apps.find(a => a.id === p.applicationId)?.name || 'N/A';
    return [p.projectName, ws, model, app, p.status, p.updateFrequency];
  });

  (doc as any).autoTable({
    startY: 50,
    head: [['Proyecto', 'Área', 'Modelo', 'App', 'Estado', 'Frecuencia']],
    body: projectRows,
    theme: 'striped',
    headStyles: { fillColor: [242, 200, 17] }, // PBI Yellow
  });

  // Tabla de Usuarios
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.text('Usuarios', 14, finalY + 15);

  const userRows = data.users.map(u => [
    `${u.firstName} ${u.lastName}`,
    u.email,
    u.licenseType,
    u.isActive ? 'Activo' : 'Inactivo'
  ]);

  (doc as any).autoTable({
    startY: finalY + 20,
    head: [['Nombre', 'Email', 'Licencia', 'Estado']],
    body: userRows,
    theme: 'striped',
    headStyles: { fillColor: [43, 108, 176] },
  });

  doc.save(`Reporte_PBI_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateWordReport = async (data: ReportData) => {
  const createCell = (text: string, isHeader: boolean = false) => {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: isHeader })]
      })],
      shading: isHeader ? { fill: "F2C811" } : undefined,
    });
  };

  const projectRows = [
    new TableRow({
      children: [
        createCell("Proyecto", true),
        createCell("Área", true),
        createCell("Modelo", true),
        createCell("App", true),
        createCell("Estado", true),
      ]
    }),
    ...data.projects.map(p => {
      const ws = data.workspaces.find(w => w.id === p.workspaceId)?.name || 'N/A';
      const model = data.models.find(m => m.id === p.semanticModelId)?.name || 'N/A';
      const app = data.apps.find(a => a.id === p.applicationId)?.name || 'N/A';
      return new TableRow({
        children: [
          createCell(p.projectName),
          createCell(ws),
          createCell(model),
          createCell(app),
          createCell(p.status)
        ]
      });
    })
  ];

  const userRows = [
    new TableRow({
      children: [
        createCell("Nombre", true),
        createCell("Email", true),
        createCell("Licencia", true),
      ]
    }),
    ...data.users.map(u => new TableRow({
      children: [
        createCell(`${u.firstName} ${u.lastName}`),
        createCell(u.email),
        createCell(u.licenseType)
      ]
    }))
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Reporte de Gestión PBI",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: `Fecha de generación: ${new Date().toLocaleDateString()}`,
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: "Proyectos",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        }),
        new Table({
          rows: projectRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
          }
        }),
        new Paragraph({
          text: "Usuarios",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Table({
          rows: userRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
          }
        })
      ],
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Reporte_PBI_${new Date().toISOString().slice(0, 10)}.docx`);
};
