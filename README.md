# guardian-github

This action runs [Microsoft Guardian](https://aka.ms/msguardian) for security analysis by:

* Installing the Guardian CLI
* Installing the latest Microsoft security policy
* Installing the latest Microsoft and 3rd party security tools
* Automatic or user-provided configuration of security tools
* Execution of a full suite of security tools
* Normalized processing of results into the SARIF format
* Build breaks and more

# Usage

See [action.yml](action.yml)

Basic:
```
steps:
- uses: actions/checkout@master
- uses: actions/setup-dotnet@v1
  with:
    dotnet-version: '2.2.1' # Guardian CLI version
- uses: Microsoft/guardian-github@master
```

# Contributing

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).