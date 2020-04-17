# guardian-github

This action runs the [Microsoft Guardian CLI](https://aka.ms/msguardian) for security analysis by:

* Installing the Guardian CLI
* Installing the latest Microsoft security policy
* Installing the latest Microsoft and 3rd party security tools
* Automatic or user-provided configuration of security tools
* Execution of a full suite of security tools
* Normalized processing of results into the SARIF format
* Build breaks and more

# Usage

See [action.yml](action.yml)

## Basic

Run Guardian with the default policy and recommended tools that are applicable.

```yaml
steps:
- uses: actions/checkout@master
- uses: actions/setup-dotnet@v1
  with:
    dotnet-version: '3.1.2'
- name: Run Guardian
  uses: Microsoft/guardian-github@master
- name: Upload results to Security tab
  uses: Anthophila/codeql-action/codeql/upload-sarif@master
  with:
    sarif_file: $(GuardianExportedFilePath)
```

## Upload Results to the Security tab

To upload results to the Security tab of your repo, run the `Anthophila/codeql-action/codeql/upload-sarif` action immediately after running Guardian. Guardian sets the environment variable `GuardianExportedFilePath` to the path of a single SARIF file that can be uploaded to this API.

```yaml
- name: Upload results to Security tab
  uses: Anthophila/codeql-action/codeql/upload-sarif@master
  with:
    sarif_file: $(GuardianExportedFilePath)
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributing

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).