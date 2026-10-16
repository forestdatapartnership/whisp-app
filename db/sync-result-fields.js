const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
const { Client } = require('pg');

const REPO = 'https://raw.githubusercontent.com/forestdatapartnership/whisp';
// Columns the library computes, or the app adds, rather than reading from lookup_datasets.csv.
const NOT_IN_LOOKUP = /^(Ind_|risk_)|^(whisp_processing_metadata|geo_original)$/;

function libraryVersion() {
    const toml = fs.readFileSync(path.resolve(__dirname, '../api/pyproject.toml'), 'utf8');
    return toml.match(/openforis-whisp==([\w.]+)/)[1];
}

// layers_description.md is not shipped in the Python package, so both files come from the release tag.
async function download(version, file) {
    const res = await fetch(`${REPO}/v${version}/${file}`);
    if (!res.ok) throw new Error(`${file} at v${version}: HTTP ${res.status}`);
    return res.text();
}

function parseLookup(csv) {
    const [header, ...lines] = csv.trim().split(/\r?\n/).map((line) => line.split(','));
    return lines.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ''])));
}

const plain = (html) => (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// Each layer is a row of names, description and source, followed by rows listing its Earth Engine assets.
function parseLayers(md) {
    const layers = new Map();
    let heading = null;
    let names = [];
    for (const [, row] of md.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
        const bold = row.match(/colspan="3"[^>]*>\s*<b>([^<]+)<\/b>/);
        if (bold) {
            heading = bold[1].replace(/:\s*$/, '').trim();
        } else if (cells.length >= 3) {
            names = cells[0].split(/<br\s*\/?>/).map(plain).filter(Boolean);
            for (const name of names) {
                layers.set(name, { heading, comments: plain(cells[1]), source: plain(cells[2]), geeAssets: [] });
            }
        } else if (cells.length === 1) {
            const assets = plain(cells[0]).match(/ee\.\w+\((["'])[^"']*\1\)/g) ?? [];
            for (const name of names) layers.get(name).geeAssets.push(...assets);
        }
    }
    return layers;
}

const theme = (value) => (value && value !== 'NA' ? { dataTheme: value } : {});
const flag = (value) => value === '1';

function fromLookup(row) {
    return {
        order: row.order === '' ? null : Number(row.order),
        iso2Code: row.ISO2_code || null,
        commodityMetadata: {
            pcrop: { ...theme(row.theme), usedForRisk: flag(row.use_for_risk_pcrop) },
            acrop: { ...theme(row.theme), usedForRisk: flag(row.use_for_risk_acrop) },
            timber: { ...theme(row.theme_timber), usedForRisk: flag(row.use_for_risk_timber) },
        },
        analysisMetadata: {
            type: row.col_type,
            excludeFromOutput: flag(row.exclude_from_output),
            isNullable: flag(row.is_nullable),
            isRequired: flag(row.is_required),
            correspondingVariable: row.corresponding_variable || null,
        },
    };
}

const canonical = (value) => JSON.stringify(value ?? null, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
// Earlier seeds lost or added spaces around formatting, so wording is compared without whitespace.
const sameText = (a, b) => plain(a).replace(/\s/g, '') === plain(b).replace(/\s/g, '');
const lit = (value) => (value == null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);
const json = (value) => `${lit(JSON.stringify(value))}::jsonb`;

async function main() {
    const version = libraryVersion();
    const [csv, md] = await Promise.all([
        download(version, 'src/openforis_whisp/parameters/lookup_datasets.csv'),
        download(version, 'layers_description.md'),
    ]);
    const lookup = parseLookup(csv);
    const layers = parseLayers(md);

    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    await client.connect();
    const { rows } = await client.query(
        'SELECT id, "order", iso2_code, category, comments, source, commodity_metadata, analysis_metadata FROM result_fields'
    );
    await client.end();

    const fields = new Map(rows.map((field) => [field.id, field]));
    // Sub-headings such as "Annual crops" are not categories, so only headings already in use are applied.
    const categories = new Set(rows.map((field) => field.category).filter(Boolean));
    const libraryIds = new Set(lookup.map((row) => row.name));

    const removed = rows.map((field) => field.id).filter((id) => !libraryIds.has(id) && !NOT_IN_LOOKUP.test(id)).sort();
    const added = [];
    const inserts = [];
    const updates = [];

    for (const row of lookup) {
        const want = fromLookup(row);
        const layer = layers.get(row.name);
        const category = layer && categories.has(layer.heading) ? layer.heading : null;
        const analysis = { ...want.analysisMetadata, ...(layer && { geeAssets: layer.geeAssets }) };
        const field = fields.get(row.name);

        if (!field) {
            added.push(row.name);
            inserts.push(`(${[
                lit(row.name),
                want.order ?? 'NULL',
                lit(row.col_type === 'string' ? 'char' : 'numeric'),
                lit(row.col_type.startsWith('float') ? 'ha / %' : null),
                lit(want.iso2Code),
                lit(category),
                lit(layer?.comments),
                lit(layer?.source),
                json(want.commodityMetadata),
                json(analysis),
                "'migration'",
            ].join(', ')})`);
            continue;
        }

        const set = [];
        if (want.order != null && Number(field.order) !== want.order) set.push(`"order" = ${want.order}`);
        if ((field.iso2_code || null) !== want.iso2Code) set.push(`iso2_code = ${lit(want.iso2Code)}`);
        if (category && field.category !== category) set.push(`category = ${lit(category)}`);
        if (layer && !sameText(field.comments, layer.comments)) set.push(`comments = ${lit(layer.comments)}`);
        if (layer && !sameText(field.source, layer.source)) set.push(`source = ${lit(layer.source)}`);
        if (canonical(field.commodity_metadata) !== canonical(want.commodityMetadata)) {
            set.push(`commodity_metadata = ${json(want.commodityMetadata)}`);
        }
        const changedKeys = Object.fromEntries(
            Object.entries(analysis).filter(([key, value]) => canonical(field.analysis_metadata?.[key]) !== canonical(value))
        );
        if (Object.keys(changedKeys).length) set.push(`analysis_metadata = analysis_metadata || ${json(changedKeys)}`);
        if (set.length) updates.push(`UPDATE result_fields SET ${set.join(', ')}, updated_by = 'migration' WHERE id = ${lit(row.name)};`);
    }

    if (!removed.length && !inserts.length && !updates.length) {
        console.log(`result_fields already match openforis-whisp ${version}`);
        return;
    }

    const sql = [
        `-- Generated by db/sync-result-fields.js: align result_fields with openforis-whisp ${version}`,
        removed.length && `\n-- Removed from the library\nDELETE FROM result_fields WHERE id IN (${removed.map(lit).join(', ')});`,
        inserts.length && [
            '\n-- New in the library',
            'INSERT INTO result_fields (id, "order", type, unit, iso2_code, category, comments, source, commodity_metadata, analysis_metadata, created_by) VALUES',
            `    ${inserts.join(',\n    ')}`,
            'ON CONFLICT (id) DO NOTHING;',
        ].join('\n'),
        updates.length && `\n-- Changed in the library\n${updates.join('\n')}`,
    ].filter(Boolean).join('\n') + '\n';

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dir = path.resolve(__dirname, 'migrations', `${date}_result_fields_whisp_${version.replace(/\./g, '_')}`);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, '1_sync_result_fields.sql');
    fs.writeFileSync(file, sql);

    console.log(`Wrote ${path.relative(process.cwd(), file)}`);
    console.log(`Removed from the library: ${removed.join(', ') || 'none'}`);
    console.log(`New in the library: ${added.join(', ') || 'none'}`);
    console.log(`Changed: ${updates.length} field(s)`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
