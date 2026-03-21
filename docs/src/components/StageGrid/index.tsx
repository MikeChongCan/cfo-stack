import type {CSSProperties} from 'react';

import styles from './styles.module.css';

type Stage = {
  letter: string;
  name: string;
  summary: string;
  question: string;
  skills: string[];
  accent: string;
};

const stages: Stage[] = [
  {
    letter: 'C',
    name: 'Capture',
    summary: 'Pull every raw money artifact into one reviewable queue.',
    question: 'Where is every piece of evidence of money right now?',
    skills: ['/capture', '/statement-export', '/statement-export-private', '/capture-dedupe', '/doc-preprocess', '/bank-import', '/receipt-scan'],
    accent: '#15803d',
  },
  {
    letter: 'L',
    name: 'Log',
    summary: 'Convert evidence into reviewed Beancount entries.',
    question: 'Do I know where every dollar came from and went?',
    skills: ['/log', '/classify', '/validate'],
    accent: '#0f766e',
  },
  {
    letter: 'E',
    name: 'Extract',
    summary: 'Pull patterns, anomalies, and tax signals out of the books.',
    question: 'What are the numbers telling me to do next?',
    skills: ['/extract', '/reconcile', '/tax-plan', '/consult'],
    accent: '#b45309',
  },
  {
    letter: 'A',
    name: 'Automate',
    summary: 'Turn repeated workflows into scripts, pipelines, and checks.',
    question: 'Have I repeated this enough times to automate it?',
    skills: ['/automate', '/monthly-close', '/quarterly-tax'],
    accent: '#9333ea',
  },
  {
    letter: 'R',
    name: 'Report',
    summary: 'Produce decision-ready outputs instead of raw ledger noise.',
    question: 'Can I summarize financial health in one paragraph?',
    skills: ['/report', '/fava', '/advisor'],
    accent: '#2563eb',
  },
];

export default function StageGrid() {
  return (
    <section className={styles.grid} aria-label="CLEAR stages">
      {stages.map(stage => (
        <article
          key={stage.letter}
          className={styles.card}
          style={{'--stage-accent': stage.accent} as CSSProperties}>
          <div className={styles.header}>
            <span className={styles.letter}>{stage.letter}</span>
            <div>
              <h3>{stage.name}</h3>
              <p>{stage.summary}</p>
            </div>
          </div>
          <p className={styles.question}>{stage.question}</p>
          <ul className={styles.skills}>
            {stage.skills.map(skill => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
