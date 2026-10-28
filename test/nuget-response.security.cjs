const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const { IncomingMessage } = require('node:http');
const https = require('node:https');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { test } = require('node:test');
const zlib = require('node:zlib');
const toolkitPath = require.resolve('@microsoft/security-devops-actions-toolkit/msdo-nuget-client');
const toolkitRequire = createRequire(toolkitPath);
const core = toolkitRequire('@actions/core');
const AdmZip = toolkitRequire('adm-zip');
const nuget = require(toolkitPath);
const usesProxyAgents = true;

function createFeed(t, configuration = {}) {
    const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'msdo-action-nuget-'));
    t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));
    t.mock.method(core, 'debug', () => {});
    const proxyKeys = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'NO_PROXY', 'no_proxy'];
    const previousProxy = Object.fromEntries(proxyKeys.map(key => [key, process.env[key]]));
    for (const key of proxyKeys) {
        delete process.env[key];
    }
    Object.assign(process.env, configuration.proxy || {});
    t.after(() => {
        for (const key of proxyKeys) {
            if (previousProxy[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = previousProxy[key];
            }
        }
    });

    const archive = new AdmZip();
    archive.addFile('guardian.txt', Buffer.from('benign package fixture'));
    const requests = [];
    const responses = [];
    const decoder = t.mock.method(zlib, 'createBrotliDecompress', () => new PassThrough());
    const previousLatest = process.env.MSDO_FIXTUREPACKAGE_LATESTVERSION;
    delete process.env.MSDO_FIXTUREPACKAGE_LATESTVERSION;
    t.after(() => {
        if (previousLatest === undefined) {
            delete process.env.MSDO_FIXTUREPACKAGE_LATESTVERSION;
        } else {
            process.env.MSDO_FIXTUREPACKAGE_LATESTVERSION = previousLatest;
        }
    });
    t.mock.method(core, 'exportVariable', (name, value) => {
        process.env[name] = value;
    });

    t.mock.method(https, 'request', (url, options, callback) => {
        requests.push({ url, auth: options.auth, agent: options.agent, headers: { ...options.headers } });
        const isPackage = url.endsWith('.nupkg');
        const isRegistration = url.includes('/registration/');
        const encoding = isPackage ? undefined
            : isRegistration && configuration.registrationEncoding !== undefined
                ? configuration.registrationEncoding : configuration.encoding;
        const response = new IncomingMessage(new PassThrough());
        response.statusCode = isPackage ? 200 : configuration.statusCode || 200;
        response.headers = encoding === undefined ? {} : { 'content-encoding': encoding };
        responses.push(response);
        const document = isRegistration
            ? { items: [{ items: [{ catalogEntry: { listed: true, version: '1.0.0' } }] }] }
            : {
                resources: [
                    { '@id': 'https://nuget.test/registration/', '@type': 'RegistrationsBaseUrl/3.6.0' },
                    { '@id': 'https://nuget.test/flat/', '@type': 'PackageBaseAddress/3.0.0' }
                ]
            };
        let body = isPackage ? archive.toBuffer() : Buffer.from(JSON.stringify(document));
        if (!isPackage) {
            if (encoding && encoding.toLowerCase() === 'gzip') {
                body = configuration.invalidCompression ? Buffer.from('not gzip') : zlib.gzipSync(body);
            } else if (encoding === 'deflate') {
                body = configuration.rawDeflate ? zlib.deflateRawSync(body, { level: 0 }) : zlib.deflateSync(body);
            }
        }

        const request = new EventEmitter();
        request.end = () => {
            queueMicrotask(() => {
                callback(response);
                setImmediate(() => {
                    if (configuration.responseError && !isPackage) {
                        response.destroy(new Error('fixture response failure'));
                    } else if (!response.destroyed) {
                        response.complete = true;
                        response.push(body);
                        response.push(null);
                    }
                });
            });
        };
        return request;
    });

    return {
        outputDirectory, requests, responses, decoder,
        install: version => nuget.install(
            'https://nuget.test/index.json', 'Fixture.Package', version || '1.0.0', outputDirectory, 'fixture-only'
        )
    };
}

for (const encoding of [undefined, 'identity', 'gzip', 'GZIP', 'deflate']) {
    test(`installs with ${encoding || 'unencoded'} metadata`, { timeout: 3000 }, async t => {
        const feed = createFeed(t, { encoding });
        const result = await feed.install();
        assert.equal(result.success, true);
        assert.equal(result.resolvedVersion, '1.0.0');
        assert.equal(fs.readFileSync(path.join(result.packageFolder, 'guardian.txt'), 'utf8'), 'benign package fixture');
        assert.equal(feed.decoder.mock.callCount(), 0);
    });
}

test('preserves the existing raw-deflate decoding path', { timeout: 3000 }, async t => {
    const feed = createFeed(t, { encoding: 'deflate', rawDeflate: true });
    assert.equal((await feed.install()).success, true);
    assert.equal(feed.decoder.mock.callCount(), 0);
});

for (const encoding of ['br', 'BR', ' br ', 'gzip, br', 'br, gzip', 'zstd', 'gzip, deflate']) {
    test(`rejects unsupported encoding "${encoding}" before decoding`, { timeout: 3000 }, async t => {
        const feed = createFeed(t, { encoding });
        await assert.rejects(feed.install(), /Unsupported NuGet Content-Encoding/);
        assert.equal(feed.decoder.mock.callCount(), 0);
        assert.equal(feed.requests.length, 1);
        assert.equal(feed.responses[0].destroyed, true);
        assert.deepEqual(fs.readdirSync(feed.outputDirectory), []);
    });
}

for (const encoding of ['br', 'gzip, br']) {
    test(`rejects Brotli in registration metadata: ${encoding}`, { timeout: 3000 }, async t => {
        const feed = createFeed(t, { registrationEncoding: encoding });
        await assert.rejects(feed.install('Latest'), /Unsupported NuGet Content-Encoding/);
        assert.equal(feed.requests.length, 2);
        assert.equal(feed.decoder.mock.callCount(), 0);
        assert.deepEqual(fs.readdirSync(feed.outputDirectory), []);
    });
}

test('declines Brotli without changing package transfer or authentication', { timeout: 3000 }, async t => {
    const feed = createFeed(t);
    await feed.install();
    assert.equal(feed.requests[0].headers['Accept-Encoding'], 'gzip, deflate, identity, br;q=0');
    assert.equal(feed.requests[1].headers['Accept-Encoding'], undefined);
    assert.equal(feed.requests[0].auth, ':fixture-only');
    assert.equal(feed.requests[1].auth, ':fixture-only');
});

test('resolves Latest through compressed registration metadata', { timeout: 3000 }, async t => {
    const feed = createFeed(t, { encoding: 'gzip' });
    const result = await feed.install('Latest');
    assert.equal(result.resolvedVersion, '1.0.0');
    assert.equal(feed.requests.length, 3);
    assert.equal(feed.requests[1].headers['Accept-Encoding'], 'gzip, deflate, identity, br;q=0');
    assert.equal(feed.decoder.mock.callCount(), 0);
});

test('preserves cached installations without another request', { timeout: 3000 }, async t => {
    const feed = createFeed(t);
    await feed.install();
    const count = feed.requests.length;
    const cached = await feed.install();
    assert.equal(cached.success, true);
    assert.equal(cached.inCache, true);
    assert.equal(feed.requests.length, count);
});

test('rejects non-success responses before decompression', { timeout: 3000 }, async t => {
    const feed = createFeed(t, { encoding: 'br', statusCode: 503 });
    await assert.rejects(feed.install(), /Status code: 503/);
    assert.equal(feed.decoder.mock.callCount(), 0);
});

test('propagates decompression errors', { timeout: 3000 }, async t => {
    const feed = createFeed(t, { encoding: 'gzip', invalidCompression: true });
    await assert.rejects(feed.install(), /header check|gzip|decompress/i);
});

test('propagates response stream errors', { timeout: 3000 }, async t => {
    const feed = createFeed(t, { responseError: true });
    await assert.rejects(feed.install(), /fixture response failure/);
});

for (const scenario of [
    { name: 'HTTPS_PROXY', proxy: { HTTPS_PROXY: 'http://proxy.test:3128' }, enabled: true },
    { name: 'https_proxy', proxy: { https_proxy: 'http://proxy.test:3128' }, enabled: true },
    { name: 'HTTPS proxy URL', proxy: { HTTPS_PROXY: 'https://proxy.test:3128' }, enabled: true },
    { name: 'matching NO_PROXY', proxy: { HTTPS_PROXY: 'http://proxy.test:3128', NO_PROXY: 'nuget.test' }, enabled: false },
    { name: 'nonmatching NO_PROXY', proxy: { HTTPS_PROXY: 'http://proxy.test:3128', NO_PROXY: 'other.test' }, enabled: true },
    { name: 'HTTP_PROXY only', proxy: { HTTP_PROXY: 'http://proxy.test:3128' }, enabled: false }
]) {
    test(`preserves existing proxy behavior for ${scenario.name}`, { timeout: 3000 }, async t => {
        const feed = createFeed(t, { proxy: scenario.proxy });
        assert.equal((await feed.install()).success, true);
        for (const request of feed.requests) {
            if (usesProxyAgents && scenario.enabled) {
                assert.ok(request.agent);
                assert.equal(request.agent.proxyOptions.host, 'proxy.test');
                assert.equal(request.agent.proxyOptions.port, '3128');
            } else {
                assert.equal(request.agent, undefined);
            }
        }
    });
}
