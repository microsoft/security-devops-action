const minimumNodeVersions: Record<number, readonly [number, number]> = {
    22: [23, 4],
    24: [22, 1],
    26: [12, 1]
};

export function assertPatchedNodeRuntime(version: string): void {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

    if (match) {
        const [major, minor, patch] = match.slice(1).map(Number);
        const minimum = minimumNodeVersions[major];

        if (minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]))) {
            return;
        }
    }

    throw new Error(
        `CVE-2026-111497: Node.js ${version} is not a verified patched release. ` +
        'Use Node.js 22.23.4+, 24.22.1+, or 26.12.1+ within those supported release lines. ' +
        'Update the runner-managed action interpreter through the hosted provider or self-hosted runner operator; ' +
        'actions/setup-node and PATH changes do not update this executable.'
    );
}
