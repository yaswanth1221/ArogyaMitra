import { strToU8, zipSync } from 'fflate';
import { DEFAULT_WEIGHTS } from '../config/appConfig';
import { SAFETY_CASES } from '../core/safetyCases';
import { PROTOCOL_SECTIONS } from '../data/protocols';
import type { ChatMessage, Household, Priority, PriorityWeights, VisitNote } from '../types';
import { BUCKET_LABELS, type PlannedVisit } from '../core/priority';

type CellValue = string | number;

interface Worksheet {
  name: string;
  rows: CellValue[][];
}

function columnName(index: number): string {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function xmlText(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && (
        codePoint === 0x9 ||
        codePoint === 0xa ||
        codePoint === 0xd ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      );
    })
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function worksheetXml(rows: CellValue[][]): string {
  const maxColumns = Math.max(1, ...rows.map((row) => row.length));
  const maxRows = Math.max(rows.length, 1);
  const cols = Array.from({ length: maxColumns }, (_, index) => {
    const width = Math.min(42, Math.max(12, ...rows.map((row) => String(row[index] ?? '').length + 2)));
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join('');
  const data = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = `${columnName(colIndex)}${rowIndex + 1}`;
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `<c r="${ref}"${rowIndex === 0 ? ' s="1"' : ''}><v>${value}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"${rowIndex === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlText(String(value))}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const lastCell = `${columnName(maxColumns - 1)}${maxRows}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${data}</sheetData>
  <autoFilter ref="A1:${lastCell}"/>
</worksheet>`;
}

function workbookFiles(sheets: Worksheet[]): Record<string, Uint8Array> {
  const sheetEntries = sheets.map((sheet, index) =>
    `<sheet name="${xmlText(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join('');
  const sheetRelationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join('');
  const sheetOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join('');
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetEntries}</sheets>
</workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRelationships}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    'xl/styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF195C4D"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
  };

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(worksheetXml(sheet.rows));
  });
  return files;
}

function priorityLabel(priority: Priority): string {
  return priority;
}

function householdRows(households: Household[]): CellValue[][] {
  return [
    ['Household ID', 'Village', 'Member category', 'Visit type', 'Due date', 'Priority', 'Status', 'Completed date', 'Record type'],
    ...[...households].sort((a, b) => a.id.localeCompare(b.id)).map((household) => [
      household.id,
      household.village,
      household.memberCategory,
      household.visitType,
      household.dueDate,
      priorityLabel(household.priority),
      household.status,
      household.completedAt ?? '',
      household.isDemo ? 'Synthetic demo' : 'User-entered',
    ]),
  ];
}

function downloadWorkbook(workbook: Uint8Array, filename: string): void {
  const blobBytes = new Uint8Array(workbook.byteLength);
  blobBytes.set(workbook);
  const blob = new Blob([blobBytes.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createHouseholdsExcelReport(households: Household[]): Uint8Array {
  return zipSync(workbookFiles([{ name: 'Households', rows: householdRows(households) }]), { level: 6 });
}

export function downloadHouseholdsExcel(households: Household[], today: string): void {
  downloadWorkbook(createHouseholdsExcelReport(households), `arogyamitra-households-${today}.xlsx`);
}

export function createPlannerExcelReport(visits: PlannedVisit[]): Uint8Array {
  const rows: CellValue[][] = [
    ['Plan order', 'Group', 'Group name', 'Household ID', 'Village', 'Member category', 'Visit type', 'Due date', 'Priority', 'Days overdue', 'Score', 'Score breakdown', 'Record type'],
    ...visits.map((visit, index) => [
      index + 1,
      visit.bucket,
      BUCKET_LABELS[visit.bucket],
      visit.household.id,
      visit.household.village,
      visit.household.memberCategory,
      visit.household.visitType,
      visit.household.dueDate,
      priorityLabel(visit.household.priority),
      visit.overdueDays,
      visit.score,
      visit.parts.map((part) => `${part.label}: ${part.points}`).join('\n'),
      visit.household.isDemo ? 'Synthetic demo' : 'User-entered',
    ]),
  ];
  return zipSync(workbookFiles([{ name: 'Visit Planner', rows }]), { level: 6 });
}

export function downloadPlannerExcel(visits: PlannedVisit[], today: string): void {
  downloadWorkbook(createPlannerExcelReport(visits), `arogyamitra-visit-planner-${today}.xlsx`);
}

export function createExcelReport(
  households: Household[],
  visits: PlannedVisit[],
  notes: VisitNote[],
  today: string,
  chat: ChatMessage[] = [],
  weights: PriorityWeights = DEFAULT_WEIGHTS,
): Uint8Array {
  const dueToday = visits.filter((visit) => visit.household.dueDate === today).length;
  const overdue = visits.filter((visit) => visit.overdueDays > 0).length;
  const completedToday = households.filter((household) => household.status === 'Completed' && household.completedAt === today).length;
  const highPriority = visits.filter((visit) => visit.household.priority === 'High').length;
  const completedVisits = households.filter((household) => household.status === 'Completed');
  const scheduledToday = dueToday + completedToday;
  const completionPercent = scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 0;
  const householdById = new Map(households.map((household) => [household.id, household]));
  let relatedQuestion = '';
  const sheets: Worksheet[] = [
    {
      name: 'Summary',
      rows: [
        ['ArogyaMitra Daily Report', 'Value'],
        ['Report date', today],
        ['Registered households', households.length],
        ['Pending visits', visits.length],
        ['Visits due today', dueToday],
        ['Overdue visits', overdue],
        ['Completed today', completedToday],
        ['High-priority pending', highPriority],
        ['Completion today (%)', completionPercent],
        ['Completed visits', completedVisits.length],
        ['Visit notes', notes.length],
        ['Assistant chat messages', chat.length],
        ['Protocol sections', PROTOCOL_SECTIONS.length],
        ['Safety test cases', SAFETY_CASES.length],
        ['Data note', 'Includes local records and synthetic demo records.'],
      ],
    },
    {
      name: 'Households',
      rows: householdRows(households),
    },
    {
      name: 'Pending visits',
      rows: [
        ['Plan order', 'Household ID', 'Village', 'Member category', 'Visit type', 'Due date', 'Priority', 'Days overdue', 'Plan group', 'Score'],
        ...visits.map((visit, index) => [
          index + 1,
          visit.household.id,
          visit.household.village,
          visit.household.memberCategory,
          visit.household.visitType,
          visit.household.dueDate,
          priorityLabel(visit.household.priority),
          visit.overdueDays,
          visit.bucket,
          visit.score,
        ]),
      ],
    },
    {
      name: 'Completed visits',
      rows: [
        ['Household ID', 'Village', 'Member category', 'Visit type', 'Due date', 'Priority', 'Completed date', 'Record type'],
        ...completedVisits.map((household) => [
          household.id,
          household.village,
          household.memberCategory,
          household.visitType,
          household.dueDate,
          priorityLabel(household.priority),
          household.completedAt ?? '',
          household.isDemo ? 'Synthetic demo' : 'User-entered',
        ]),
      ],
    },
    {
      name: 'Visit notes',
      rows: [
        ['Created at', 'Household ID', 'Village', 'Member category', 'Note'],
        ...[...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((note) => {
          const household = householdById.get(note.householdId);
          return [note.createdAt, note.householdId, household?.village ?? '', household?.memberCategory ?? '', note.text];
        }),
      ],
    },
    {
      name: 'Chat history',
      rows: [
        ['Created at', 'Role', 'Message', 'Related question', 'Response category', 'Details', 'Sources', 'Matched rules', 'Rule check (ms)', 'Total time (ms)'],
        ...chat.map((message) => {
          if (message.role === 'user') relatedQuestion = message.text;
          const row = [
            message.createdAt,
            message.role,
            message.text,
            message.role === 'assistant' ? relatedQuestion : '',
            message.result?.category ?? '',
            message.result?.details.join('\n') ?? '',
            message.result?.sources.map((source) => `${source.document} → ${source.section} (${source.reviewStatus})`).join('\n') ?? '',
            message.result?.matchedRules.map((rule) => rule.label).join('; ') ?? '',
            message.result?.dangerCheckMs ?? '',
            message.result?.totalMs ?? '',
          ];
          if (message.role === 'assistant') relatedQuestion = '';
          return row;
        }),
      ],
    },
    {
      name: 'Priority settings',
      rows: [
        ['Setting', 'Value'],
        ...Object.entries(weights),
      ],
    },
    {
      name: 'Protocol library',
      rows: [
        ['Section ID', 'Document', 'Section', 'Review status', 'Content', 'Search keywords'],
        ...PROTOCOL_SECTIONS.map((section) => [
          section.id,
          section.document,
          section.title,
          section.reviewStatus,
          section.body.join('\n'),
          section.keywords.map(([keyword, weight]) => `${keyword} (${weight})`).join('; '),
        ]),
      ],
    },
    {
      name: 'Safety cases',
      rows: [
        ['Question (English)', 'Expected category', 'Note'],
        ...SAFETY_CASES.map((testCase) => [
          testCase.displayQuery,
          testCase.expected,
          'Demo regression example; not a measure of real-world detection accuracy.',
        ]),
      ],
    },
  ];

  return zipSync(workbookFiles(sheets), { level: 6 });
}

export function downloadExcelReport(
  households: Household[],
  visits: PlannedVisit[],
  notes: VisitNote[],
  today: string,
  chat: ChatMessage[] = [],
  weights: PriorityWeights = DEFAULT_WEIGHTS,
): void {
  downloadWorkbook(
    createExcelReport(households, visits, notes, today, chat, weights),
    `arogyamitra-report-${today}.xlsx`,
  );
}
