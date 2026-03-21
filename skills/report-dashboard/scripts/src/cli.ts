import path from 'node:path';
import {extractDashboardData, discoverSampleLedgers, findRepoRoot} from './extract';
import {renderDashboardHtml} from './render';
import type {DashboardProfile, DashboardVariant} from './types';

const packageRoot = path.resolve(import.meta.dir, '..');

interface CliOptions {
  ledgerPath?: string;
  outputDir?: string;
  sampleSet?: 'all';
  profile?: DashboardProfile;
  variant?: DashboardVariant;
}

const options = parseArgs(Bun.argv.slice(2));
const repoRoot = await findRepoRoot(process.cwd());

if (options.sampleSet === 'all') {
  const ledgers = await discoverSampleLedgers(repoRoot);
  const outputRoot = resolveSampleOutputRoot(options.outputDir, repoRoot);
  for (const ledgerPath of ledgers) {
    const slug = path.basename(path.dirname(ledgerPath));
    const outputDir = path.join(outputRoot, slug);
    await generateDashboard({
      ledgerPath,
      outputDir,
      profile: options.profile,
      variant: options.variant,
    });
  }
  process.exit(0);
}

await generateDashboard({
  ledgerPath: options.ledgerPath,
  outputDir: resolveOutputDir(options.outputDir, repoRoot),
  profile: options.profile,
  variant: options.variant,
});

async function generateDashboard({
  ledgerPath,
  outputDir,
  profile,
  variant,
}: {
  ledgerPath?: string;
  outputDir: string;
  profile?: DashboardProfile;
  variant?: DashboardVariant;
}) {
  const data = await extractDashboardData({
    ledgerPath,
    cwd: process.cwd(),
    forcedProfile: profile,
  });
  const finalOutputDir = ledgerPath ? path.resolve(outputDir) : outputDir;
  const resolvedVariant = variant ?? 'full';
  await Bun.$`mkdir -p ${finalOutputDir}`;
  await buildCss(finalOutputDir);
  if (resolvedVariant === 'full') {
    await Bun.write(path.join(finalOutputDir, 'dashboard-data.json'), JSON.stringify(data, null, 2));
  } else {
    await Bun.$`rm -f ${path.join(finalOutputDir, 'dashboard-data.json')}`;
  }
  await Bun.write(path.join(finalOutputDir, 'index.html'), renderDashboardHtml(data, {variant: resolvedVariant}));

  const relativeOutput = path.relative(process.cwd(), finalOutputDir) || '.';
  console.log(`${data.meta.title} [${resolvedVariant}]: ${relativeOutput}`);
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
        options.profile = parseProfile(args[++index]);
        break;
      case '--variant':
        options.variant = parseVariant(args[++index]);
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

function resolveSampleOutputRoot(outputDir: string | undefined, repoRoot: string): string {
  if (outputDir) {
    return path.resolve(process.cwd(), outputDir);
  }
  return path.join(repoRoot, 'reports', 'dashboard-showcase');
}

function printHelp() {
  console.log(`cfo-dashboard

Usage:
  bun run generate -- --ledger ../../../examples/canadian-company/main.beancount
  bun run generate -- --sample-set all
  bun run generate -- --sample-set all --output ../../../docs/static/demo/report-dashboard

Options:
  --ledger <path>       Explicit ledger entrypoint.
  --output <dir>        Output directory, or output root when used with --sample-set all.
  --profile <type>      Force profile: business or household.
  --variant <type>      Render variant: full or social.
  --sample-set all      Generate dashboards for every repo example ledger.
`);
}

function parseProfile(value: string | undefined): DashboardProfile {
  if (value === 'business' || value === 'household') {
    return value;
  }
  console.error(`Invalid --profile value: ${value ?? '(missing)'}. Expected "business" or "household".`);
  process.exit(1);
}

function parseVariant(value: string | undefined): DashboardVariant {
  if (value === undefined || value === 'full' || value === 'social') {
    return value ?? 'full';
  }
  console.error(`Invalid --variant value: ${value}. Expected "full" or "social".`);
  process.exit(1);
}
