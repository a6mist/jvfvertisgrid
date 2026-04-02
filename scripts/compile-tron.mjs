import fs from 'fs';
import path from 'path';
import solc from 'solc';

const projectRoot = process.cwd();
const sources = {
  'iefotoken.sol': path.join(projectRoot, 'iefotoken.sol'),
  'iefoidocontract.sol': path.join(projectRoot, 'iefoidocontract.sol'),
};

const resolveImport = (importPath) => {
  const candidates = [
    path.join(projectRoot, importPath),
    path.join(projectRoot, 'node_modules', importPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { contents: fs.readFileSync(candidate, 'utf8') };
    }
  }

  return { error: `Import not found: ${importPath}` };
};

export const compileContracts = () => {
  const input = {
    language: 'Solidity',
    sources: Object.fromEntries(
      Object.entries(sources).map(([name, fullPath]) => [name, { content: fs.readFileSync(fullPath, 'utf8') }]),
    ),
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));

  const errors = (output.errors || []).filter((entry) => entry.severity === 'error');
  if (errors.length > 0) {
    console.error('\nSolidity compilation failed:\n');
    for (const entry of errors) {
      console.error(entry.formattedMessage || entry.message);
    }
    process.exit(1);
  }

  const artifactsDir = path.join(projectRoot, 'artifacts', 'tron');
  fs.mkdirSync(artifactsDir, { recursive: true });

  const contracts = [
    ['iefotoken.sol', 'IEFO'],
    ['iefoidocontract.sol', 'IEFO_IDO'],
  ];

  const compiled = {};

  for (const [fileName, contractName] of contracts) {
    const artifact = output.contracts?.[fileName]?.[contractName];
    if (!artifact?.abi || !artifact?.evm?.bytecode?.object) {
      throw new Error(`Missing compiled output for ${fileName}:${contractName}`);
    }

    const normalized = {
      contractName,
      sourceName: fileName,
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`,
    };

    const outPath = path.join(artifactsDir, `${contractName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2));
    compiled[contractName] = normalized;
  }

  console.log('Compiled contracts written to artifacts/tron');
  return compiled;
};

if (process.argv[1] && process.argv[1].endsWith('compile-tron.mjs')) {
  compileContracts();
}
