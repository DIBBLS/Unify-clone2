import { describe, expect, it } from 'vitest';
import { trimToTable, checkRows, guessMapping, linesFromPdfItems, parsePasted, rowsFromMatrix, saveable, splitFullName } from './classList';
import { isSchoolEmail, matricFromEmail } from './matric';

describe('reading a spreadsheet', () => {
  it('maps headed columns and ignores the ones we do not need', () => {
    const m = [['S/N', 'SURNAME', 'FIRST NAME', 'OTHER NAMES', 'MATRIC NO', 'PHONE'], ['1', 'olotuche', 'JOSHUA', 'oluwaseun', '220801234', '0813']];
    const g = guessMapping(m);
    expect(g.header).toBe(true);
    expect(g.mapping).toEqual(['ignore', 'surname', 'first_name', 'middle_name', 'matric', 'ignore']);
    expect(rowsFromMatrix(m, g.mapping, g.header)).toEqual([{ surname: 'OLOTUCHE', first_name: 'Joshua', middle_name: 'Oluwaseun', matric: '220801234' }]);
  });

  it('handles a single "Name" column with the surname first', () => {
    const m = [['No', 'Name of student', 'Reg. No'], ['1', 'ADEBAYO Kunle Tobi', '220801117'], ['2', 'BELLO, Amaka', '220803398']];
    const g = guessMapping(m);
    expect(g.mapping).toEqual(['ignore', 'full_name', 'matric']);
    expect(rowsFromMatrix(m, g.mapping, g.header)).toEqual([
      { surname: 'ADEBAYO', first_name: 'Kunle', middle_name: 'Tobi', matric: '220801117' },
      { surname: 'BELLO', first_name: 'Amaka', middle_name: '', matric: '220803398' },
    ]);
  });

  it('works without a heading row by looking at the values', () => {
    const m = [['1', 'ADEBAYO Kunle', 220801117], ['2', 'BELLO Amaka Chioma', 220803398]];
    const g = guessMapping(m);
    expect(g.header).toBe(false);
    expect(g.mapping).toEqual(['ignore', 'full_name', 'matric']);
    expect(rowsFromMatrix(m, g.mapping, g.header)).toHaveLength(2);
  });

  it('skips blank and total rows', () => {
    const m = [['Surname', 'First name', 'Matric'], ['', '', ''], ['BELLO', 'Amaka', '220803398'], ['', 'Total: 1', '']];
    const g = guessMapping(m);
    const rows = rowsFromMatrix(m, g.mapping, g.header);
    expect(rows.map((r) => r.surname)).toEqual(['BELLO', '']);
  });
});

describe('pasted text', () => {
  it('finds the matric anywhere on the line and skips serial numbers and headings', () => {
    const text = `S/N  NAME  MATRIC\n1. ADEBAYO Kunle Tobi 220801117\n2) 220803398 BELLO Amaka\n\nOLOTUCHE\tJoshua\tOluwaseun\t220801234\n`;
    expect(parsePasted(text)).toEqual([
      { surname: 'ADEBAYO', first_name: 'Kunle', middle_name: 'Tobi', matric: '220801117' },
      { surname: 'BELLO', first_name: 'Amaka', middle_name: '', matric: '220803398' },
      { surname: 'OLOTUCHE', first_name: 'Joshua', middle_name: 'Oluwaseun', matric: '220801234' },
    ]);
  });
  it('keeps a row without a matric so the HOC can fix it', () => {
    expect(parsePasted('AKINWALE Fathia')).toEqual([{ surname: 'AKINWALE', first_name: 'Fathia', middle_name: '', matric: '' }]);
  });
  it('accepts matric numbers written with spaces', () => {
    expect(parsePasted('ADEBAYO Kunle 2208 01117')[0].matric).toBe('220801117');
  });
});

describe('checking rows', () => {
  const rows = [
    { surname: 'ADEBAYO', first_name: 'Kunle', middle_name: '', matric: '220801117' },
    { surname: 'ADEKUNLE', first_name: 'Daniel', middle_name: '', matric: '22080145' },
    { surname: '', first_name: 'Fathia', middle_name: '', matric: '220801063' },
    { surname: 'ADEBAYO', first_name: 'Kunle', middle_name: '', matric: '220801117' },
    { surname: 'BELLO', first_name: 'Amaka', middle_name: '', matric: '220803398' },
  ];
  it('flags short matrics, missing names and duplicates', () => {
    const c = checkRows(rows);
    expect(c.map((x) => x.issues)).toEqual([[], ['matric_length'], ['no_surname'], ['duplicate'], []]);
  });
  it('only saves complete rows, once each', () => {
    expect(saveable(checkRows(rows)).map((r) => r.matric)).toEqual(['220801117', '22080145', '220803398']);
  });
});

describe('names', () => {
  it('splits comma and space forms', () => {
    expect(splitFullName('OLOTUCHE, Joshua Oluwaseun')).toEqual({ surname: 'OLOTUCHE', first_name: 'Joshua', middle_name: 'Oluwaseun' });
    expect(splitFullName('  OLOTUCHE   Joshua ')).toEqual({ surname: 'OLOTUCHE', first_name: 'Joshua', middle_name: '' });
  });
});

describe('PDF lines', () => {
  it('groups text items by row, top to bottom, left to right', () => {
    const items = [{ str: '220801117', x: 300, y: 700 }, { str: 'ADEBAYO Kunle', x: 50, y: 701 }, { str: 'BELLO Amaka', x: 50, y: 680 }, { str: '220803398', x: 300, y: 680 }];
    expect(linesFromPdfItems(items)).toEqual(['ADEBAYO Kunle 220801117', 'BELLO Amaka 220803398']);
  });
});

describe('student email', () => {
  it('recognises LASU student emails and reads the matric', () => {
    expect(isSchoolEmail('joshua.olotuche220801234@st.lasu.edu.ng')).toBe(true);
    expect(isSchoolEmail('JOSHUA.OLOTUCHE220801234@ST.LASU.EDU.NG')).toBe(true);
    expect(isSchoolEmail('joshua@gmail.com')).toBe(false);
    expect(isSchoolEmail('joshua@lasu.edu.ng')).toBe(false);
    expect(matricFromEmail('joshua.olotuche220801234@st.lasu.edu.ng')).toBe('220801234');
    expect(matricFromEmail('joshua.olotuche@st.lasu.edu.ng')).toBeNull();
  });
});

describe('trimToTable', () => {
  it('drops the university title rows above the heading row', () => {
    const m = [['LAGOS STATE UNIVERSITY'], ['300 LEVEL CLASS LIST 2026/2027'], [], ['S/N', 'MATRIC NO', 'NAME'], [1, '220801001', 'ABIODUN Mariam'], [2, '220801117', 'ADEBAYO Kunle']];
    const t = trimToTable(m);
    expect(t[0]).toEqual(['S/N', 'MATRIC NO', 'NAME']);
    expect(t).toHaveLength(3);
    const g = guessMapping(t);
    expect(g.header).toBe(true);
    expect(rowsFromMatrix(t, g.mapping, g.header)).toHaveLength(2);
  });
  it('keeps a list with no heading row as it is', () => {
    const m = [['220801001', 'ABIODUN Mariam'], ['220801117', 'ADEBAYO Kunle']];
    expect(trimToTable(m)).toEqual(m);
  });
  it('does not treat a one-cell title as the heading', () => {
    const m = [['300L ECE'], ['220801001', 'ABIODUN Mariam']];
    expect(trimToTable(m)).toEqual([['220801001', 'ABIODUN Mariam']]);
  });
});
