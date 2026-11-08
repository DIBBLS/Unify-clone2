import type { ComponentType } from 'react';
import { LiveWelcome, LiveSignUp, LiveLogin, LiveReset, LiveDepartment, LiveCourses, LiveGoal, LivePersona, LivePrivacy, LiveTerms } from './Auth';
import { LiveSetUpList, LiveUploadDocument, LiveTemplate, LivePasteList, LiveCheckList, LiveClassList, LiveAddStudent, LiveListHistory } from './ClassList';
import { LiveInbox, LiveSettleClash, LiveIdCheck } from './Inbox';
import { LiveClaim, LiveIsThisYou, LiveOnTheList, LiveListNotUp, LiveNotOnList, LiveAlreadyClaimed, LiveShowIdCard, LivePriorityCourses } from './Claim';
import { LivePass, LiveOpenScan, LiveScanner, LiveRegister, LiveMyAttendance } from './Attendance';
import { LiveHome, LiveMe, LiveSettings, LiveRequestHoc, LiveRequestStatus, LiveCgpa, LiveWeekComplete, LiveRevisionDone } from './People';
import { LiveLecturerSignUp, LiveLecturerCourses, LiveLecturerHome, LiveAdminOverview, LiveAdminHocRequests, LiveAdminClassLists } from './Staff';

/** Screens that use the real account and database when Supabase is connected.
    Every other screen keeps showing its design with sample content. */
export const LIVE_SCREENS: Record<string, ComponentType> = {
  // sign up, log in, onboarding
  S05: LiveWelcome, S06: LiveSignUp, LOGIN: LiveLogin, RESET: LiveReset, S07: LiveDepartment, S08: LiveCourses, S09: LiveGoal, S11: LivePersona,
  PRIVACY: LivePrivacy, TERMS: LiveTerms,
  // home, me, settings, progress
  S14: LiveHome, S19: LiveHome, S20: LiveHome, S58: LiveHome, S45: LiveMe, S46: LiveMe, S48: LiveSettings, S15: LiveCgpa,
  S33: LiveWeekComplete, S36: LiveRevisionDone,
  S50: LiveRequestHoc, S51: LiveRequestStatus,
  // HOC: class list and inbox
  AT01: LiveSetUpList, AT01a: LiveUploadDocument, AT01b: LiveTemplate, AT02: LivePasteList, AT03: LiveCheckList, AT04: LiveClassList,
  AT05: LiveAddStudent, AT06: LiveListHistory, AT15: LiveInbox, AT16: LiveSettleClash, AT17: LiveIdCheck, S62: LiveInbox,
  // student: claim your name
  AT07: LiveClaim, S57: LiveClaim, AT08: LiveIsThisYou, AT09: LiveOnTheList, AT10: LiveListNotUp, AT11: LiveNotOnList,
  AT12: LiveAlreadyClaimed, AT13: LiveShowIdCard, AT14: LivePriorityCourses,
  // attendance
  S59: LivePass, OPENSCAN: LiveOpenScan, S60: LiveOpenScan, S61: LiveScanner, L16: LiveRegister, S63: LiveMyAttendance,
  // lecturers
  L02: LiveLecturerSignUp, L04: LiveLecturerCourses, L07: LiveLecturerHome, L08: LiveLecturerHome,
  // Unify admin
  AD01: LiveAdminOverview, AD02: LiveAdminHocRequests, AD03: LiveAdminClassLists,
};
