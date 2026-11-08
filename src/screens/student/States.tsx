import type { ReactNode } from 'react';
import { Screen, BottomActions } from '../../components/chrome';
import { Button, Display } from '../../components/ui';
import { BoxBoy, type Pose } from '../../components/brand';
import { useGo } from '../../components/nav';

/* ===================== Empty / error states (S71–S76) =====================
   One layout for all of them: Box Boy, a plain-English headline that says what
   happened, one line on what still works, and at most two actions. */

function StateScreen({ pose, title, body, children, extra }: { pose: Pose; title: string; body: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <Screen actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 80, alignItems: 'flex-start' }}>
        <BoxBoy pose={pose} width={180} />
        <Display size={36}>{title}</Display>
        <span className="t-15 muted">{body}</span>
        {extra}
      </div>
      <BottomActions>{children}</BottomActions>
    </Screen>
  );
}

export function S71SomethingWrong() {
  const go = useGo();
  return (
    <StateScreen pose="peeking" title="THAT DIDN'T LOAD" body="Something went wrong on our side, not yours. Your saved notes still work.">
      <Button>Try again</Button><Button variant="white" onClick={() => go('S52')}>Open saved notes</Button>
    </StateScreen>
  );
}

export function S72WrongCode() {
  return (
    <StateScreen pose="armsCrossed" title="THAT CODE DIDN'T MATCH" body="Check the text we sent to 0803 *** 4567. You have 2 tries left."
      extra={<div className="row" style={{ gap: 10, marginTop: 6 }}>{['4', '8', '1', '9'].map((d, i) => <span key={i} className="display" style={{ width: 56, height: 64, borderRadius: 14, border: '1.5px solid var(--u-red)', background: 'var(--u-bad-tint)', display: 'grid', placeItems: 'center', fontSize: 26 }}>{d}</span>)}</div>}>
      <Button variant="white" disabled>Resend code in 0:42</Button><Button variant="ghost-dark" style={{ color: '#0a0a0a' }}>Use email instead</Button>
    </StateScreen>
  );
}

export function S73NoCourse() {
  return (
    <StateScreen pose="peeking" title={'NO COURSE CALLED "MEE 319"'} body="Check the code on your timetable. If it's new this semester, your HOD can add it.">
      <Button>Search again</Button><Button variant="white">Ask my HOD to add it</Button>
    </StateScreen>
  );
}

export function S74PassRefresh() {
  return (
    <StateScreen pose="phoneOut" title="YOUR PASS NEEDS A QUICK REFRESH" body="Connect to data once today and your pass works offline again. No data right now? Your HOC can type your matric number.">
      <Button>Refresh my pass</Button><Button variant="white">Show my matric number</Button>
    </StateScreen>
  );
}

export function S75QuizSavedOffline() {
  const go = useGo();
  return (
    <StateScreen pose="thumbsUpPhone" title="SAVED. WE'LL SUBMIT IT" body="You lost connection, but every answer is safe on your phone. It sends the moment you're back online, and the timer stopped when you went offline.">
      <Button onClick={() => go('S19')}>Back to Home</Button>
    </StateScreen>
  );
}

export function S76LecturerNoCourses() {
  const go = useGo();
  return (
    <StateScreen pose="sittingPhone" title="YOUR COURSES ARE ALMOST READY" body="We've asked each class's HOC to confirm you. You can already send materials and post to your classes.">
      <Button onClick={() => go('L10')}>Send materials</Button><Button variant="white" onClick={() => go('L07')}>See my courses</Button>
    </StateScreen>
  );
}
