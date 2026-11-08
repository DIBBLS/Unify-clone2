import { beforeAll, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { admin, createDb, rpc, type Db, type User } from './db';

let db: Db;
let classId: string; // 300L ECE
let hoc: User, joshua: User, joshuaSchool: User, kunle: User, intruder: User, outsider: User, lecturer: User, ada: User;

const LIST = [
  { surname: 'Olotuche', first_name: 'joshua', middle_name: 'oluwaseun', matric: '220801234' },
  { surname: 'ADEBAYO', first_name: 'Kunle', middle_name: 'Tobi', matric: '220801117' },
  { surname: 'BELLO', first_name: 'Amaka', middle_name: '', matric: '220803398' },
];

async function put(user: User, dept = 'ECE', level = 300) {
  await db.as(user);
  return rpc<string>(db, 'join_class', { p_department: dept, p_level: level });
}

beforeAll(async () => {
  db = await createDb();
  hoc = await db.makeUser('femi@gmail.com', 'Femi O.');
  joshua = await db.makeUser('joshua.olotuche@gmail.com', 'Joshua');
  joshuaSchool = await db.makeUser('joshua.olotuche220801234@st.lasu.edu.ng');
  kunle = await db.makeUser('kunle@gmail.com', 'Kunle');
  intruder = await db.makeUser('k.tobi@gmail.com', 'K. Tobi');
  outsider = await db.makeUser('someone@gmail.com', 'Someone');
  lecturer = await db.makeUser('o.adeyemi@gmail.com', 'Dr. O. Adeyemi');
  ada = await db.makeUser('ada@gmail.com', 'Ada');
  classId = await put(hoc);
  await put(joshua); await put(kunle); await put(intruder);
  await put(outsider, 'MEE', 300);
  await put(ada, 'ECE', 400);
}, 60_000);

describe('pass signing', () => {
  it('private.hmac_sha256 matches Node HMAC-SHA256', async () => {
    const rows = await admin<{ h: string }>(db, `select encode(private.hmac_sha256(convert_to('key','UTF8'), convert_to('The quick brown fox jumps over the lazy dog','UTF8')), 'hex') as h`);
    expect(rows[0].h).toBe(createHmac('sha256', 'key').update('The quick brown fox jumps over the lazy dog').digest('hex'));
  });
  it('handles keys longer than the block size', async () => {
    const key = 'k'.repeat(100);
    const rows = await admin<{ h: string }>(db, `select encode(private.hmac_sha256(convert_to($1,'UTF8'), convert_to('msg','UTF8')), 'hex') as h`, [key]);
    expect(rows[0].h).toBe(createHmac('sha256', key).update('msg').digest('hex'));
  });
});

describe('profiles and roles', () => {
  it('creates a profile per auth user and flags school-email helper accounts', async () => {
    const rows = await admin<{ email: string; is_school_identity: boolean }>(db, `select email, is_school_identity from profiles where id in ($1, $2) order by email`, [joshua.id, joshuaSchool.id]);
    expect(rows).toEqual([{ email: 'joshua.olotuche220801234@st.lasu.edu.ng', is_school_identity: true }, { email: 'joshua.olotuche@gmail.com', is_school_identity: false }]);
  });
  it('a user cannot make themselves admin', async () => {
    await db.as(joshua);
    await expect(db.query(`update profiles set role = 'admin' where id = $1`, [joshua.id])).rejects.toThrow(/admin/);
  });
  it('a user can switch to lecturer at sign-up', async () => {
    await db.as(lecturer);
    await db.query(`update profiles set role = 'lecturer' where id = $1`, [lecturer.id]);
    expect((await admin<{ role: string }>(db, 'select role from profiles where id = $1', [lecturer.id]))[0].role).toBe('lecturer');
  });
});

describe('HOC requests', () => {
  it('admin approves a request and the student becomes HOC', async () => {
    await db.as(hoc);
    const req = await rpc<string>(db, 'request_hoc', { p_phone: '0813 000 0000', p_confirmer: 'Level adviser' });
    await expect(rpc(db, 'decide_hoc_request', { p_request: req, p_approve: true })).rejects.toThrow(/Admins only/);
    const boss = await db.makeUser('admin@unify.ng');
    await admin(db, `update profiles set role = 'admin' where id = $1`, [boss.id]);
    await db.as(boss);
    await rpc(db, 'decide_hoc_request', { p_request: req, p_approve: true });
    expect((await admin(db, 'select 1 from class_hocs where class_id = $1 and user_id = $2', [classId, hoc.id])).length).toBe(1);
  });
  it('allows at most 3 HOCs per class', async () => {
    const extra = await Promise.all([1, 2, 3].map((i) => db.makeUser(`hoc${i}@gmail.com`)));
    await admin(db, `insert into class_hocs(class_id, user_id) values ($1, $2), ($1, $3)`, [classId, extra[0].id, extra[1].id]);
    await expect(admin(db, `insert into class_hocs(class_id, user_id) values ($1, $2)`, [classId, extra[2].id])).rejects.toThrow(/at most 3/);
    await admin(db, `delete from class_hocs where user_id in ($1, $2)`, [extra[0].id, extra[1].id]);
  });
});

describe('claiming your name', () => {
  it('reports list_not_up before the HOC uploads', async () => {
    await db.as(joshua);
    const nonce = await rpc<string>(db, 'begin_claim');
    await db.as(joshuaSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'list_not_up', matric: '220801234' });
  });

  it('only an HOC can upload, and names are normalised', async () => {
    await db.as(joshua);
    await expect(rpc(db, 'import_class_list', { p_class: classId, p_rows: JSON.stringify(LIST) })).rejects.toThrow(/Only an HOC/);
    await db.as(hoc);
    expect(await rpc(db, 'import_class_list', { p_class: classId, p_rows: JSON.stringify(LIST) })).toBe(3);
    const row = (await admin<Record<string, string | null>>(db, `select surname, first_name, middle_name from class_list_entries where matric = '220801234'`))[0];
    expect(row).toEqual({ surname: 'OLOTUCHE', first_name: 'Joshua', middle_name: 'Oluwaseun' });
    expect((await admin<{ middle_name: string | null }>(db, `select middle_name from class_list_entries where matric = '220803398'`))[0].middle_name).toBeNull();
  });

  it('the class list is hidden from students and other classes', async () => {
    await db.as(joshua);
    expect((await db.query('select * from class_list_entries')).rows.length).toBe(0);
    await db.as(outsider);
    expect((await db.query('select * from class_list_entries')).rows.length).toBe(0);
    await db.as(hoc);
    expect((await db.query('select * from class_list_entries')).rows.length).toBe(3);
  });

  it('claims with the student email session and a nonce from the main account', async () => {
    await db.as(joshua);
    const nonce = await rpc<string>(db, 'begin_claim');
    await db.as(joshuaSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'claimed', surname: 'OLOTUCHE', matric: '220801234' });
    await db.as(joshua);
    expect(await rpc(db, 'my_claim')).toMatchObject({ matric: '220801234', method: 'student_email' });
  });

  it('a nonce works once', async () => {
    await db.as(joshua);
    const nonce = await rpc<string>(db, 'begin_claim');
    await db.as(joshuaSchool);
    await rpc(db, 'complete_claim', { p_nonce: nonce });
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'expired' });
  });

  it('rejects non-school emails', async () => {
    await db.as(kunle);
    expect(await rpc(db, 'claim_with_own_email')).toMatchObject({ status: 'not_school_email' });
  });

  it('a second account on the same matric becomes a clash in the HOC inbox', async () => {
    const kunleSchool = await db.makeUser('kunle.adebayo220801117@st.lasu.edu.ng');
    await db.as(kunle);
    let nonce = await rpc<string>(db, 'begin_claim');
    await db.as(kunleSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'claimed' });
    // the intruder somehow controls the same school email
    await db.as(intruder);
    nonce = await rpc<string>(db, 'begin_claim');
    await db.as(kunleSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'clash' });
    await db.as(hoc);
    const inbox = (await db.query<{ i: { kind: string; holder: { name: string } } }>(`select public.hoc_inbox($1) as i`, [classId])).rows.map((r) => r.i);
    expect(inbox[0]).toMatchObject({ kind: 'clash', holder: { name: 'Kunle' } });
  });

  it('only HOCs can read the inbox', async () => {
    await db.as(joshua);
    await expect(db.query(`select public.hoc_inbox($1)`, [classId])).rejects.toThrow(/Only HOCs/);
  });

  it('settling a clash with "move" hands the matric to the second account', async () => {
    await db.as(hoc);
    const item = (await db.query<{ id: string }>(`select id from inbox_items where kind = 'clash' and status = 'open'`)).rows[0];
    await rpc(db, 'resolve_inbox', { p_item: item.id, p_decision: 'move' });
    const owner = await admin<{ user_id: string }>(db, `select c.user_id from claims c join class_list_entries e on e.id = c.entry_id where e.matric = '220801117'`);
    expect(owner[0].user_id).toBe(intruder.id);
    await expect(rpc(db, 'resolve_inbox', { p_item: item.id, p_decision: 'keep' })).rejects.toThrow(/already settled/);
    const history = await admin<{ action: string }>(db, `select action from list_events where class_id = $1 order by id`, [classId]);
    expect(history.map((h) => h.action)).toEqual(['uploaded', 'clash']);
  });

  it('not on the list creates an inbox request; after the HOC adds them the claim works', async () => {
    const tomiwa = await db.makeUser('tomiwa@gmail.com');
    const tomiwaSchool = await db.makeUser('tomiwa.oyelaran220811902@st.lasu.edu.ng');
    await put(tomiwa);
    await db.as(tomiwa);
    let nonce = await rpc<string>(db, 'begin_claim');
    await db.as(tomiwaSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'not_on_list', matric: '220811902' });
    await db.as(hoc);
    await rpc(db, 'add_student', { p_class: classId, p_surname: 'Oyelaran', p_first: 'Tomiwa', p_middle: 'Grace', p_matric: '220811902', p_reason: 'Direct entry' });
    await db.as(tomiwa);
    nonce = await rpc<string>(db, 'begin_claim');
    await db.as(tomiwaSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'claimed', surname: 'OYELARAN' });
  });

  it('an HOC can confirm a student by ID card', async () => {
    const amaka = await db.makeUser('amaka@gmail.com');
    await put(amaka);
    await db.as(amaka);
    await rpc(db, 'message_hoc', { p_kind: 'id_check', p_matric: '220803398', p_message: "Can't get into my student email" });
    await db.as(hoc);
    const item = (await db.query<{ id: string }>(`select id from inbox_items where kind = 'id_check' and status = 'open'`)).rows[0];
    await rpc(db, 'resolve_inbox', { p_item: item.id, p_decision: 'confirm' });
    await db.as(amaka);
    expect(await rpc(db, 'my_claim')).toMatchObject({ matric: '220803398', method: 'id_check' });
  });
});

describe('attendance', () => {
  let sessionId: string; let mee352: string;

  beforeAll(async () => {
    mee352 = (await admin<{ id: string }>(db, `select id from courses where code = 'MEE 352'`))[0].id;
  });

  it('a lecturer must be confirmed by an HOC before opening a scan', async () => {
    await db.as(lecturer);
    await db.query(`insert into course_lecturers(course_id, user_id) values ($1, $2)`, [mee352, lecturer.id]);
    await expect(rpc(db, 'open_attendance', { p_course: mee352, p_class: classId, p_venue: 'ETF Hall' })).rejects.toThrow(/Only the course lecturer/);
    await db.as(hoc);
    await rpc(db, 'confirm_lecturer', { p_course: mee352, p_user: lecturer.id, p_confirm: true });
    await db.as(lecturer);
    sessionId = await rpc<string>(db, 'open_attendance', { p_course: mee352, p_class: classId, p_venue: 'ETF Hall' });
    expect(sessionId).toMatch(/[0-9a-f-]{36}/);
  });

  it('the lecturer can now see the class list', async () => {
    await db.as(lecturer);
    expect((await db.query('select * from class_list_entries')).rows.length).toBeGreaterThan(0);
  });

  it('a claimed student gets a pass; an unclaimed one does not', async () => {
    await db.as(joshua);
    const pass = await rpc<{ status: string; token: string; expires_in: number }>(db, 'pass_token', { p_session: sessionId });
    expect(pass.status).toBe('ok');
    expect(pass.token.split('.')).toHaveLength(4);
    expect(pass.expires_in).toBeGreaterThan(0);
    await db.as(kunle); // lost the clash, no claim any more
    expect(await rpc(db, 'pass_token', { p_session: sessionId })).toMatchObject({ status: 'claim_first' });
  });

  it('only HOCs or the lecturer can scan; a scan marks present once', async () => {
    await db.as(joshua);
    const { token } = await rpc<{ token: string }>(db, 'pass_token', { p_session: sessionId });
    await db.as(kunle);
    expect(await rpc(db, 'record_scan', { p_token: token })).toMatchObject({ status: 'not_allowed' });
    await db.as(hoc);
    expect(await rpc(db, 'record_scan', { p_token: token })).toMatchObject({ status: 'present', matric: '220801234', level: '300L ECE' });
    expect(await rpc(db, 'record_scan', { p_token: token })).toMatchObject({ status: 'already' });
  });

  it('rejects tampered and expired passes', async () => {
    await db.as(intruder);
    const { token } = await rpc<{ token: string }>(db, 'pass_token', { p_session: sessionId });
    const parts = token.split('.');
    await db.as(hoc);
    expect(await rpc(db, 'record_scan', { p_token: [parts[0], joshua.id, parts[2], parts[3]].join('.') })).toMatchObject({ status: 'invalid' });
    expect(await rpc(db, 'record_scan', { p_token: 'garbage' })).toMatchObject({ status: 'invalid' });
    // build a correctly signed token for an old window
    const secret = (await admin<{ s: string }>(db, `select encode(value, 'hex') as s from private.settings where key = 'pass_secret'`))[0].s;
    const old = Math.floor(Date.now() / 30000) - 5;
    const msg = `${parts[0]}.${parts[1]}.${old}`;
    const sig = createHmac('sha256', Buffer.from(secret, 'hex')).update(msg).digest('hex').slice(0, 32);
    await db.as(hoc);
    expect(await rpc(db, 'record_scan', { p_token: `${msg}.${sig}` })).toMatchObject({ status: 'expired' });
  });

  it('an HOC can type a matric number for a student with a dead phone', async () => {
    await db.as(hoc);
    expect(await rpc(db, 'record_typed', { p_session: sessionId, p_matric: '220801117' })).toMatchObject({ status: 'present' });
    expect(await rpc(db, 'record_typed', { p_session: sessionId, p_matric: '999999999' })).toMatchObject({ status: 'not_registered' });
  });

  it('a priority student from another level can attend once approved', async () => {
    const adaSchool = await db.makeUser('ada.okafor210801500@st.lasu.edu.ng');
    const k400 = (await admin<{ id: string }>(db, `select id from classes where department_code = 'ECE' and level = 400`))[0].id;
    const hoc400 = await db.makeUser('hoc400@gmail.com');
    await admin(db, `insert into class_hocs values ($1, $2)`, [k400, hoc400.id]);
    await db.as(hoc400);
    await rpc(db, 'import_class_list', { p_class: k400, p_rows: JSON.stringify([{ surname: 'Okafor', first_name: 'Ada', matric: '210801500' }]) });
    await db.as(ada);
    const nonce = await rpc<string>(db, 'begin_claim');
    await db.as(adaSchool);
    expect(await rpc(db, 'complete_claim', { p_nonce: nonce })).toMatchObject({ status: 'claimed' });
    await db.as(ada);
    expect(await rpc(db, 'pass_token', { p_session: sessionId })).toMatchObject({ status: 'not_registered' });
    expect(await rpc(db, 'request_priority', { p_course: mee352 })).toMatchObject({ status: 'requested' });
    await db.as(hoc);
    const item = (await db.query<{ id: string }>(`select id from inbox_items where kind = 'priority' and status = 'open'`)).rows[0];
    await rpc(db, 'resolve_inbox', { p_item: item.id, p_decision: 'approve' });
    await db.as(ada);
    const sessions = (await db.query<{ s: { course_code: string } }>('select public.my_open_sessions() as s')).rows;
    expect(sessions.map((r) => r.s.course_code)).toContain('MEE 352');
    const { token } = await rpc<{ token: string }>(db, 'pass_token', { p_session: sessionId });
    await db.as(hoc);
    expect(await rpc(db, 'record_scan', { p_token: token })).toMatchObject({ status: 'present', level: '400L ECE' });
  });

  it('the lecturer sees the register; students see only their own record', async () => {
    await db.as(lecturer);
    const sum = await rpc<{ present: number; typed: number; records: unknown[] }>(db, 'session_attendance', { p_session: sessionId });
    expect(sum.present).toBe(3);
    expect(sum.typed).toBe(1);
    await db.as(joshua);
    expect((await db.query('select * from attendance_records')).rows.length).toBe(1);
    await expect(rpc(db, 'session_attendance', { p_session: sessionId })).rejects.toThrow(/Not allowed/);
  });

  it('closing the scan stops new scans', async () => {
    await db.as(lecturer);
    await rpc(db, 'close_attendance', { p_session: sessionId });
    await db.as(joshua);
    expect(await rpc(db, 'pass_token', { p_session: sessionId })).toMatchObject({ status: 'closed' });
  });
});

describe('progress', () => {
  it('quiz attempts, streaks and CGPA plans are private to each student', async () => {
    await db.as(joshua);
    await db.query(`insert into quiz_attempts(user_id, course_code, week, score, total) values ($1, 'MEE 352', 2, 8, 10)`, [joshua.id]);
    await db.query(`insert into streak_days(user_id, day) values ($1, current_date)`, [joshua.id]);
    await db.query(`insert into cgpa_plans(user_id, cgpa, units_done, units_left, target) values ($1, 4.0, 96, 144, 4.5)`, [joshua.id]);
    await expect(db.query(`insert into quiz_attempts(user_id, course_code, week, score, total) values ($1, 'MEE 352', 2, 10, 10)`, [kunle.id])).rejects.toThrow();
    await db.as(kunle);
    expect((await db.query('select * from quiz_attempts')).rows.length).toBe(0);
    expect((await db.query('select * from cgpa_plans')).rows.length).toBe(0);
  });
});

describe('admin', () => {
  it('overview is admins only and has counts, not names', async () => {
    await db.as(joshua);
    await expect(rpc(db, 'admin_overview')).rejects.toThrow(/Admins only/);
    const boss = (await admin<{ id: string; email: string }>(db, `select id, email from profiles where role = 'admin'`))[0];
    await db.as(boss);
    const o = await rpc<{ claimed: number; lists_uploaded: number; by_class: { class: string; claimed: number }[] }>(db, 'admin_overview');
    expect(o.lists_uploaded).toBe(2);
    expect(o.by_class.find((c) => c.class === '300L ECE')?.claimed).toBe(4); // 3 uploaded + 1 added, all claimed
  });
});

describe('account deletion', () => {
  it('deleting your account removes your profile and claims', async () => {
    const temp = await db.makeUser('temp@gmail.com');
    await db.as(temp);
    await rpc(db, 'delete_my_account');
    expect((await admin(db, 'select 1 from profiles where id = $1', [temp.id])).length).toBe(0);
  });
});
