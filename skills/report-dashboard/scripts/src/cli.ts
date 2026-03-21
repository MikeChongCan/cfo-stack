import path from 'node:path';
import {extractDashboardData, discoverSampleLedgers, findRepoRoot} from './extract';
import {renderDashboardHtml} from './render';
import type {DashboardProfile} from './types';

const packageRoot = path.resolve(import.meta.dir, '..');

interface CliOptions {
  ledgerPath?: string;
  outputDir?: string;
  sampleSet?: 'all';
  profile?: DashboardProfile;
}

const options = parseArgs(Bun.argv.slice(2));
const repoRoot = await findRepoRoot(process.cwd());

if (options.sampleSet === 'all') {
  const ledgers = await discoverSampleLedgers(repoRoot);
  for (const ledgerPath of ledgers) {
    const slug = path.basename(path.dirname(ledgerPath));
    const outputDir = path.join(repoRoot, 'reports', 'dashboard-showcase', slug);
    await generateDashboard({
      ledgerPath,
      outputDir,
      profile: options.profile,
    });
  }
  process.exit(0);
}

await generateDashboard({
  ledgerPath: options.ledgerPath,
  outputDir: resolveOutputDir(options.outputDir, repoRoot),
  profile: options.profile,
});

async function generateDashboard({
  ledgerPath,
  outputDir,
  profile,
}: {
  ledgerPath?: string;
  outputDir: string;
  profile?: DashboardProfile;
}) {
  const data = await extractDashboardData({
    ledgerPath,
    cwd: process.cwd(),
    forcedProfile: profile,
  });
  const finalOutputDir = ledgerPath ? path.resolve(outputDir) : outputDir;
  await Bun.$`mkdir -p ${finalOutputDir}`;
  await buildCss(finalOutputDir);
  await Bun.write(path.join(finalOutputDir, 'dashboard-data.json'), JSON.stringify(data, null, 2));
  await Bun.write(path.join(finalOutputDir, 'index.html'), renderDashboardHtml(data));

  const relativeOutput = path.relative(process.cwd(), finalOutputDir) || '.';
  console.log(`${data.meta.title}: ${relativeOutput}`);
}

async function buildCss(outputDir: string) {
  const cssInput = path.join(packageRoot, 'src', 'styles.css');
  const cssOutput = path.join(outputDir, 'dashboard.css');
  const proc = Bun.spawn({
    cmd: ['bunx', '@tailwindcss/cli', '-i', cssInput, '-o', cssOutput, '--minify'],
    cwd: packageRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Tailwind build failed with exit code ${exitCode}`);
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case '--ledger':
        options.ledgerPath = args[++index];
        break;
      case '--output':
        options.outputDir = args[++index];
        break;
      case '--profile':
        options.profile = args[++index] as DashboardProfile;
        break;
      case '--sample-set':
        if (args[index + 1] === 'all') {
          options.sampleSet = 'all';
          index += 1;
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('--') && !options.ledgerPath) {
          options.ledgerPath = arg;
        }
        break;
    }
  }
  return options;
}

function resolveOutputDir(outputDir: string | undefined, repoRoot: string): string {
  if (outputDir) {
    return path.resolve(process.cwd(), outputDir);
  }
  return path.join(repoRoot, 'reports', 'dashboards', 'latest');
}

function printHelp() {
  console.log(`cfo-dashboard

Usage:
  bun run generate -- --ledger ../../../examples/canadian-company/main.beancount
  bun run generate -- --sample-set all

Options:
  --ledger <path>       Explicit ledger entrypoint.
  --output <dir>        Output directory for index.html, dashboard.css, and dashboard-data.json.
  --profile <type>      Force profile: business or household.
  --sample-set all      Generate dashboards for every repo example ledger.
`);
}
