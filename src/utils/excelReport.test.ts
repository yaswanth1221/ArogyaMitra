import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { generateDemoHouseholds } from '../data/demoHouseholds';
import { planVisits } from '../core/priority';
import { DEFAULT_WEIGHTS } from '../config/appConfig';
import type { ChatMessage, VisitNote } from '../types';
import { createExcelReport, createHouseholdsExcelReport, createPlannerExcelReport } from './excelReport';

describe('createExcelReport', () => {
  it('creates a standalone visit planner workbook in prioritized plan order', () => {
    const today = '2026-10-30';
    const visits = planVisits(generateDemoHouseholds(today, 5), today, DEFAULT_WEIGHTS);
    const files = unzipSync(createPlannerExcelReport(visits));
    const workbook = strFromU8(files['xl/workbook.xml']);
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);

    expect(workbook).toContain('name="Visit Planner"');
    expect(workbook).not.toContain('name="Summary"');
    expect(sheet).toContain('Plan order');
    expect(sheet).toContain('Group name');
    expect(sheet).toContain('Score breakdown');
    expect(sheet).toContain('Upcoming visits');
    expect(sheet).toContain(visits[0].household.id);
    expect(sheet).toContain('Synthetic demo');
  });

  it('creates a valid empty visit planner sheet when there are no pending visits', () => {
    const files = unzipSync(createPlannerExcelReport([]));
    expect(strFromU8(files['xl/workbook.xml'])).toContain('name="Visit Planner"');
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toContain('Plan order');
  });

  it('creates a standalone households workbook containing the selected records', () => {
    const households = generateDemoHouseholds('2026-10-30', 3);
    const files = unzipSync(createHouseholdsExcelReport(households.slice(0, 2)));
    const workbook = strFromU8(files['xl/workbook.xml']);
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);

    expect(workbook).toContain('name="Households"');
    expect(workbook).not.toContain('name="Summary"');
    expect(sheet).toContain('Household ID');
    expect(sheet).toContain(households[0].id);
    expect(sheet).toContain(households[1].id);
    expect(sheet).not.toContain(households[2].id);
  });

  it('creates a complete Excel workbook with local records and app reference data', () => {
    const today = '2026-10-30';
    const households = generateDemoHouseholds(today, 3);
    const notes: VisitNote[] = [{
      id: 'note-1',
      householdId: households[0].id,
      text: '=HYPERLINK("https://example.test","Follow-up") & confirm <details>',
      createdAt: `${today}T10:00:00.000Z`,
    }];
    const chat: ChatMessage[] = [
      { id: 'chat-1', role: 'user', text: 'How do I prepare ORS?', createdAt: `${today}T09:00:00.000Z` },
      {
        id: 'chat-2',
        role: 'assistant',
        text: 'Use clean water and follow the packet.',
        createdAt: `${today}T09:00:01.000Z`,
        result: {
          category: 'ANSWER',
          message: 'Use clean water and follow the packet.',
          details: ['Use clean drinking water.'],
          sources: [{ document: 'Demo pack', section: 'ORS', reviewStatus: 'Demo' }],
          matchedRules: [],
          dangerCheckMs: 0.1,
          totalMs: 0.2,
        },
      },
    ];
    const files = unzipSync(createExcelReport(households, planVisits(households, today, DEFAULT_WEIGHTS), notes, today, chat, DEFAULT_WEIGHTS));
    const workbook = strFromU8(files['xl/workbook.xml']);
    const summary = strFromU8(files['xl/worksheets/sheet1.xml']);
    const householdsSheet = strFromU8(files['xl/worksheets/sheet2.xml']);
    const notesSheet = strFromU8(files['xl/worksheets/sheet5.xml']);
    const completedSheet = strFromU8(files['xl/worksheets/sheet4.xml']);
    const chatSheet = strFromU8(files['xl/worksheets/sheet6.xml']);
    const protocolsSheet = strFromU8(files['xl/worksheets/sheet8.xml']);
    const safetySheet = strFromU8(files['xl/worksheets/sheet9.xml']);

    expect(workbook).toContain('name="Summary"');
    expect(workbook).toContain('name="Households"');
    expect(workbook).toContain('name="Pending visits"');
    expect(workbook).toContain('name="Completed visits"');
    expect(workbook).toContain('name="Visit notes"');
    expect(workbook).toContain('name="Chat history"');
    expect(workbook).toContain('name="Priority settings"');
    expect(workbook).toContain('name="Protocol library"');
    expect(workbook).toContain('name="Safety cases"');
    expect(summary).toContain('ArogyaMitra Daily Report');
    expect(summary).toContain('2026-10-30');
    expect(householdsSheet).toContain('Household ID');
    expect(householdsSheet).toContain('Synthetic demo');
    expect(notesSheet).toContain('=HYPERLINK(&quot;https://example.test&quot;,&quot;Follow-up&quot;) &amp; confirm &lt;details&gt;');
    expect(notesSheet).not.toContain('<f>');
    expect(completedSheet).toContain('Household ID');
    expect(chatSheet).toContain('How do I prepare ORS?');
    expect(chatSheet).toContain('Demo pack');
    expect(protocolsSheet).toContain('DEMO - not reviewed against official guidelines');
    expect(safetySheet).toContain('Expected category');
  });

  it('creates valid workbook structure when there are no households, visits, or notes', () => {
    const files = unzipSync(createExcelReport([], [], [], '2026-10-30'));
    expect(files['xl/worksheets/sheet1.xml']).toBeDefined();
    expect(strFromU8(files['xl/worksheets/sheet2.xml'])).toContain('Household ID');
    expect(strFromU8(files['xl/worksheets/sheet3.xml'])).toContain('Plan order');
    expect(strFromU8(files['xl/worksheets/sheet5.xml'])).toContain('Created at');
    expect(strFromU8(files['xl/worksheets/sheet6.xml'])).toContain('Related question');
    expect(strFromU8(files['xl/worksheets/sheet9.xml'])).toContain('Expected category');
  });
});
