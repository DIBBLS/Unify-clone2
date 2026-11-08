/* LASU student email: firstname.lastnameMATRIC@st.lasu.edu.ng (no middle name). */
export const SCHOOL_DOMAIN = 'st.lasu.edu.ng';

export function isSchoolEmail(email: string) {
  return new RegExp(`^[^\\s@]+@${SCHOOL_DOMAIN.replace(/\./g, '\\.')}$`, 'i').test(email.trim());
}

/** The matric number is the run of digits at the end of the part before the @. */
export function matricFromEmail(email: string): string | null {
  if (!isSchoolEmail(email)) return null;
  const local = email.trim().split('@')[0];
  const m = local.match(/(\d{6,12})$/);
  return m ? m[1] : null;
}
